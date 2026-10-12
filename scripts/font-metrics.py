"""打印字体的竖向度量和平均字宽，用来算 src/css/fonts.css 里回退字体的 size-adjust 等覆盖值。

    uvx --from fonttools --with brotli python scripts/font-metrics.py node_modules/@fontsource/archivo/files/archivo-latin-400-normal.woff2 /System/Library/Fonts/Supplemental/Arial.ttf

size-adjust = 目标字体 avg / 回退字体 avg；ascent-override = 目标 asc / size-adjust，descent 同理。
"""
import sys
from fontTools.ttLib import TTFont
def m(path, idx=0):
    f=TTFont(path, fontNumber=idx) if path.endswith('.ttc') else TTFont(path)
    upm=f['head'].unitsPerEm; hh=f['hhea']; os2=f['OS/2']
    use_typo = bool(os2.fsSelection & (1<<7))
    asc,desc,gap = (os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap) if use_typo else (hh.ascent, hh.descent, hh.lineGap)
    return dict(name=path.split('/')[-1], upm=upm, asc=asc/upm, desc=abs(desc)/upm, gap=gap/upm, avg=os2.xAvgCharWidth/upm, typo=use_typo)
for p in sys.argv[1:]:
    idx=0
    if '#' in p: p,idx=p.split('#'); idx=int(idx)
    print(m(p,idx))
