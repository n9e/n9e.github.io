"""Render SVG blog covers with consistent fonts, including on macOS.

uv run --no-project --with fonttools --with uharfbuzz python \
  scripts/blog-covers/render-svg.py --font-dir /path/to/fonts

Requires rsvg-convert, sips and cwebp. Fonts remain outside the repository.
"""

import argparse
from io import BytesIO
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory
from xml.etree import ElementTree as ET

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


NS = "{http://www.w3.org/2000/svg}"
ET.register_namespace("", NS[1:-1])
ROOT = Path(__file__).resolve().parents[2]
COVERS = ("grafana-alerting-vs-alertmanager", "sql-query-alerting-mysql")


def load_fonts(directory):
    fonts = {}
    for key, name, weight in (
        ("hand", "Caveat", 600),
        ("body", "Inter", 400),
        ("mono", "JetBrainsMono", 400),
    ):
        font = TTFont(directory / f"{name}.ttf")
        axes = {"wght": weight}
        if any(axis.axisTag == "opsz" for axis in font["fvar"].axes):
            axes["opsz"] = 14
        font = instantiateVariableFont(font, axes, inplace=False)
        raw = BytesIO()
        font.save(raw)
        face = hb.Face(raw.getvalue())
        shaped_font = hb.Font(face)
        shaped_font.scale = (face.upem, face.upem)
        fonts[key] = (font, shaped_font, face.upem)
    return fonts


def outline_text(source, destination, fonts):
    tree = ET.parse(source)
    for parent in tree.getroot().iter():
        for node in list(parent):
            if node.tag != NS + "text":
                continue
            classes = node.get("class", "").split()
            key = "hand" if "hand" in classes else "mono" if "mono" in classes else "body"
            font, shaped_font, upem = fonts[key]
            text = "".join(node.itertext())
            scale = float(node.get("font-size", "16")) / upem
            buffer = hb.Buffer()
            buffer.add_str(text)
            buffer.guess_segment_properties()
            hb.shape(shaped_font, buffer)
            advance = sum(position.x_advance for position in buffer.glyph_positions)
            x, y = float(node.get("x", "0")), float(node.get("y", "0"))
            if node.get("text-anchor") == "middle":
                x -= advance * scale / 2
            group = ET.Element(NS + "g", {
                "class": node.get("class", ""),
                "aria-label": text,
                "transform": f"translate({x:g},{y:g}) scale({scale:g},{-scale:g})",
            })
            glyphs, order = font.getGlyphSet(), font.getGlyphOrder()
            dx = dy = 0
            for info, position in zip(buffer.glyph_infos, buffer.glyph_positions):
                pen = SVGPathPen(glyphs)
                glyphs[order[info.codepoint]].draw(pen)
                ET.SubElement(group, NS + "path", {
                    "d": pen.getCommands(),
                    "transform": f"translate({dx + position.x_offset},{dy + position.y_offset})",
                })
                dx += position.x_advance
                dy += position.y_advance
            parent.insert(list(parent).index(node), group)
            parent.remove(node)
    tree.write(destination, encoding="utf-8", xml_declaration=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font-dir", type=Path, required=True)
    args = parser.parse_args()
    fonts = load_fonts(args.font_dir)
    with TemporaryDirectory(prefix="n9e-blog-covers-") as scratch:
        temporary = Path(scratch)
        for name in COVERS:
            svg = temporary / f"{name}.svg"
            outline_text(ROOT / "scripts/blog-covers" / f"{name}.svg", svg, fonts)
            png, large = temporary / f"{name}.png", temporary / f"{name}-2x.png"
            output = ROOT / "static/img/blog"
            subprocess.run(["rsvg-convert", "-w", "1200", "-h", "630", str(svg), "-o", str(png)], check=True)
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "86", str(png), "--out", str(output / f"{name}.jpg")], check=True, stdout=subprocess.DEVNULL)
            subprocess.run(["rsvg-convert", "-w", "2400", "-h", "1260", str(svg), "-o", str(large)], check=True)
            subprocess.run(["cwebp", "-quiet", "-q", "80", str(large), "-o", str(output / f"{name}.webp")], check=True)
            print(f"Rendered {name}", flush=True)


if __name__ == "__main__":
    main()
