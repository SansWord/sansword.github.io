"""Build han.png, ko.png and fu.png from the photos in pics/.

Each photo is placed on a W x H canvas using the parameters in align.json:
the photo's centre goes to (x, y), scaled by `scale` and rotated by `rotate`
degrees (clockwise). Tune the parameters by eye in tune.html, paste its
output into align.json, then rerun this script. cut1 and cut2 are the strip
boundaries used by the CSS in index.html.

Usage: python3 align.py   (needs Pillow and numpy)
"""
import json
import math
import numpy as np
from PIL import Image

W, H = 216, 260      # output canvas, must match tune.html and index.html
SS = 4               # supersampling factor
PAD = 60             # source edge pixels repeated outwards, so no empty corners

# align.json key -> output file used by index.html
OUTPUT = {"han": "han.png", "ko": "ko.png", "huang": "fu.png"}


def align(src, scale, rotate, x, y):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = Image.fromarray(np.pad(np.asarray(im), ((PAD, PAD), (PAD, PAD), (0, 0)), mode="edge"))
    r = math.radians(rotate)
    cos, sin = math.cos(r) / (scale * SS), math.sin(r) / (scale * SS)
    # canvas (px, py) -> source: R(-r) * ((px, py) / SS - (x, y)) / scale + centre
    coeffs = (cos, sin, w / 2 + PAD - (cos * x + sin * y) * SS,
              -sin, cos, h / 2 + PAD - (-sin * x + cos * y) * SS)
    big = im.transform((W * SS, H * SS), Image.AFFINE, coeffs, Image.BICUBIC)
    return big.resize((W, H), Image.LANCZOS)


if __name__ == "__main__":
    with open("align.json", encoding="utf-8") as f:
        params = json.load(f)
    for name, p in params["photos"].items():
        align(p["src"], p["scale"], p["rotate"], p["x"], p["y"]).save(OUTPUT[name])
        print(f"{OUTPUT[name]} <- {p['src']}")
    print(f"cut lines for index.html: {params['cut1']}px, {params['cut2']}px")
