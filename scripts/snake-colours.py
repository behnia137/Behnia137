"""Recolours Platane/snk's contribution snake in BENIBIX's look, in place.
   python3 scripts/snake-colours.py dist/github-snake.svg"""
import re, sys

p = sys.argv[1]
s = open(p, encoding='utf8').read()
x, y, w, h = re.search(r'viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"', s).groups()
rainbow = ['#ff6b3d', '#ffc72c', '#8fd14f', '#2f7cf6', '#a855f7', '#ff6b3d']
stops = ''.join(f'<stop offset="{i / (len(rainbow) - 1):.2f}" stop-color="{c}"/>' for i, c in enumerate(rainbow))
x1, x2 = float(x), float(x) + float(w)
defs = (f'<defs><linearGradient id="rb" gradientUnits="userSpaceOnUse" x1="{x1}" y1="0" x2="{x2}" y2="0">{stops}</linearGradient></defs>'
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="#07070a"/>'
        f'<rect x="{float(x) + .5}" y="{float(y) + .5}" width="{float(w) - 1}" height="{float(h) - 1}" rx="15.5" fill="none" stroke="#ffffff" stroke-opacity=".09"/>')
s = re.sub(r'(<svg[^>]*>)', lambda m: m.group(1) + defs, s, count=1)
s = re.sub(r':root\{[^}]*\}', ':root{--cb:#ffffff0d;--cs:url(#rb);--ce:#15151d;--c0:#15151d;'
           '--c1:#2f7cf6;--c2:#8fd14f;--c3:#ffc72c;--c4:#ff6b3d}', s, count=1)
open(p, 'w', encoding='utf8').write(s)
print('recoloured', p)
