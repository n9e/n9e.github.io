import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './home.module.css';

/**
 * Hero 背景：几团品牌紫在右上方缓慢漂移、互相融合的网格渐变。
 *
 * 只用原生 WebGL1，不引第三方库：shaders 这类 WebGPU 库单个组件打包就有 700KB gzip，
 * 而这里只需要一个片元着色器。拿不到 WebGL 时什么都不画，.hero::before 的静态光晕原样保留；
 * 画布就绪后才给它挂 ready 类，同时把静态光晕淡出，两者不会叠在一起。
 */

const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

// 三个色团沿各自的利萨如曲线慢慢移动，先做一次域扭曲让边缘不那么圆；
// 权重归一化后得到颜色，权重之和得到不透明度。末尾加 1/255 级的噪点，避免低透明度渐变出现色阶。
const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uStrength;

float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }

float blob(vec2 p, vec2 c, float r) {
  vec2 d = p - c;
  return exp(-dot(d, d) / (r * r));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime;

  p += 0.06 * vec2(sin(p.y * 3.1 + t * 0.31), cos(p.x * 2.7 - t * 0.27));
  p += 0.03 * vec2(sin(p.y * 7.3 - t * 0.19), cos(p.x * 6.1 + t * 0.23));

  vec2 c1 = vec2(aspect * (0.78 + 0.08 * sin(t * 0.21)), 0.92 + 0.08 * cos(t * 0.17));
  vec2 c2 = vec2(aspect * (0.50 + 0.10 * cos(t * 0.15)), 0.18 + 0.12 * sin(t * 0.19 + 1.3));
  vec2 c3 = vec2(aspect * (0.97 + 0.04 * sin(t * 0.13 + 2.1)), 0.45 + 0.18 * cos(t * 0.23));

  float w1 = blob(p, c1, 0.48);
  float w2 = blob(p, c2, 0.34);
  float w3 = blob(p, c3, 0.36);
  float w = w1 + w2 + w3;

  vec3 col = (uC1 * w1 + uC2 * w2 + uC3 * w3) / max(w, 1e-4);
  float a = clamp(w, 0.0, 1.0) * uStrength;
  a += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
  a = clamp(a, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}
`;

// 色团很柔，按半分辨率渲染肉眼看不出差别，填充开销降到四分之一
const RENDER_SCALE = 0.5;
const FRAME_MS = 1000 / 30;
// 时间流速倍率：1 是着色器里写的原始速度，调快慢只改这里
const SPEED = 2;

type Rgb = [number, number, number];

function cssColor(name: string): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = raw.replace('#', '');
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0.42, 0.33, 0.69];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readPalette() {
  const dark = document.documentElement.dataset.theme === 'dark';
  return {
    c1: cssColor('--n9e-violet'),
    c2: cssColor('--n9e-electric'),
    c3: cssColor(dark ? '--n9e-violet' : '--n9e-violet-deep'),
    strength: dark ? 0.42 : 0.3,
  };
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function HeroShader(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!gl) return undefined;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return undefined;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uC1 = gl.getUniformLocation(program, 'uC1');
    const uC2 = gl.getUniformLocation(program, 'uC2');
    const uC3 = gl.getUniformLocation(program, 'uC3');
    const uStrength = gl.getUniformLocation(program, 'uStrength');

    function applyPalette() {
      const { c1, c2, c3, strength } = readPalette();
      gl!.uniform3fv(uC1, c1);
      gl!.uniform3fv(uC2, c2);
      gl!.uniform3fv(uC3, c3);
      gl!.uniform1f(uStrength, strength);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas!.clientWidth * dpr * RENDER_SCALE));
      const h = Math.max(1, Math.round(canvas!.clientHeight * dpr * RENDER_SCALE));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        gl!.viewport(0, 0, w, h);
        gl!.uniform2f(uRes, w, h);
      }
    }

    // 起点随机一点，每次打开页面色团位置不同；静止模式下也不至于总是同一张图
    const offset = Math.random() * 60;
    const start = performance.now();
    function draw(now: number) {
      gl!.uniform1f(uTime, offset + ((now - start) / 1000) * SPEED);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    let raf = 0;
    let last = 0;

    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now);
    }

    function sync() {
      cancelAnimationFrame(raf);
      raf = 0;
      if (motion.matches || !visible) {
        draw(performance.now());
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    applyPalette();
    resize();
    draw(performance.now());
    setReady(true);
    sync();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    resizeObserver.observe(canvas);

    // 滚出视口就停帧，回来再续上
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(canvas);

    // 切换明暗主题时 Docusaurus 改的是 <html data-theme>，颜色跟着重新取一次
    const themeObserver = new MutationObserver(() => {
      applyPalette();
      draw(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    motion.addEventListener('change', sync);

    // 移动端切后台、显存吃紧时上下文可能被回收，画布会变空白：停帧并撤掉 ready，让静态光晕回来
    function onContextLost() {
      cancelAnimationFrame(raf);
      raf = 0;
      setReady(false);
    }
    canvas.addEventListener('webglcontextlost', onContextLost);

    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener('change', sync);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={clsx(styles.heroShader, ready && styles.heroShaderReady)}
      aria-hidden="true"
    />
  );
}
