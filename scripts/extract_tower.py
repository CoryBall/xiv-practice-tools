#!/usr/bin/env python3
"""Extract knockback tower from screenshot, removing tethers and yellow arena lines."""
import numpy as np
from PIL import Image, ImageFilter
import math, os

SRC = os.path.normpath(os.path.join(os.path.dirname(__file__), "../public/hazards/image.png"))
OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "../public/hazards/knockback_tower.png"))

img = Image.open(SRC).convert("RGBA")
arr = np.array(img, dtype=np.uint8)
H, W = arr.shape[:2]

r = arr[:,:,0].astype(float)
g = arr[:,:,1].astype(float)
b = arr[:,:,2].astype(float)

# ── Sample pixel values at known tether / yellow-line locations ───────────────
# Top-right tower center approx (989, 189). Tether pixels sample from visible diagonals.
for label, (py, px) in [
    ("tether_a", (220, 950)),
    ("tether_b", (230, 960)),
    ("tether_c", (200, 1010)),
    ("yellow_L", (150, 462)),
    ("yellow_R", (150, 820)),   # guessed right-side line
]:
    if 0 <= py < H and 0 <= px < W:
        pix = arr[py, px]
        print(f"{label} ({px},{py}): R={pix[0]} G={pix[1]} B={pix[2]}")
