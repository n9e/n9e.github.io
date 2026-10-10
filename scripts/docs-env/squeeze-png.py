#!/usr/bin/env python3
"""把文档截图量化到 256 色再存。

    python3 scripts/docs-env/squeeze-png.py static/img/docs

产品界面是大片纯色 + 少量文字，256 色调色板肉眼看不出差别，体积能省一半以上。
截图是 deviceScaleFactor=2 出的，保留 2x 是为了在高分屏上不糊，
省体积只能从色深上省，不能从分辨率上省。

只用 Pillow，不依赖 pngquant 之类的系统包。已经是调色板模式的文件会跳过。
"""
import sys
import pathlib
from PIL import Image


def squeeze(path: pathlib.Path) -> tuple[int, int]:
    before = path.stat().st_size
    im = Image.open(path)
    if im.mode == "P":  # 已经压过了
        return before, before
    im.convert("RGB").quantize(colors=256, method=Image.MEDIANCUT).save(
        path, "PNG", optimize=True
    )
    return before, path.stat().st_size


def main() -> int:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "static/img/docs")
    files = sorted(root.rglob("*.png"))
    if not files:
        print(f"{root} 下没有 png")
        return 0
    total_before = total_after = 0
    skipped = 0
    for f in files:
        b, a = squeeze(f)
        total_before += b
        total_after += a
        if b == a:
            skipped += 1
    saved = 100 - (total_after * 100 / total_before) if total_before else 0
    print(
        f"{len(files)} 张（跳过 {skipped} 张已压缩的）："
        f"{total_before / 1048576:.1f} MB → {total_after / 1048576:.1f} MB，省 {saved:.0f}%"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
