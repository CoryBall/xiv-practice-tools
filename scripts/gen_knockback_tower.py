#!/usr/bin/env python3
"""Generate knockback tower sprite for XIV Practice Tools."""
from PIL import Image, ImageDraw, ImageFilter
import math, os

SIZE = 420
CX, CY = SIZE // 2, SIZE // 2
R = 140  # main circle radius


def add_glow_ring(base, cx, cy, radius, color, glow_r=32, blur=10):
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    r, g, b = color
    for i in range(glow_r, 0, -1):
        alpha = int(220 * ((glow_r - i) / glow_r) ** 0.55)
        rr = radius + i
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(r, g, b, alpha), width=3)
    return Image.alpha_composite(base, layer.filter(ImageFilter.GaussianBlur(radius=blur)))


def draw_chevron(draw, cx, cy, angle_rad, dist, w, h, color):
    """Single > chevron centred at dist from (cx,cy), pointing outward."""
    notch = h * 0.36

    pts_local = [
        (-w / 2, -h / 2),
        ( w / 2,       0),   # tip
        (-w / 2,  h / 2),
        (-w / 2 + notch, 0),  # inner notch
    ]

    ca, sa = math.cos(angle_rad), math.sin(angle_rad)

    def rot(px, py):
        return (px * ca - py * sa, px * sa + py * ca)

    ox = cx + dist * ca
    oy = cy + dist * sa

    pts = [(ox + rx, oy + ry) for px, py in pts_local for rx, ry in [rot(px, py)]]
    draw.polygon(pts, fill=color)


def draw_tower_aoe(draw, cx, cy, r):
    """Flat tower AoE circle: semi-transparent blue fill, white outline, gold vertical line."""
    # Semi-transparent blue fill
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(60, 130, 220, 140))
    # White outline
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 240), width=3)
    # Gold vertical line (slightly thick, centered)
    line_w = 3
    draw.rectangle([cx - line_w // 2, cy - r + 4, cx + line_w // 2, cy + r - 4],
                   fill=(255, 210, 60, 230))


# ── Build image ───────────────────────────────────────────────────────────────
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# 1. Dark circle background
draw.ellipse([CX - R, CY - R, CX + R, CY + R], fill=(18, 13, 26, 215))

# 2. Orange glow ring
img = add_glow_ring(img, CX, CY, R, (255, 135, 25))
draw = ImageDraw.Draw(img)

# 3. Sharp orange ring
for w, alpha in [(14, 140), (9, 190), (6, 230), (3, 255)]:
    draw.ellipse([CX - R, CY - R, CX + R, CY + R],
                 outline=(255, 158, 35, alpha), width=w)

# 4. Diamonds — INSIDE the ring, just inward of the edge
n_diamonds = 20
ds = 8   # diamond half-size
diamond_r = R - 20  # sits inside the orange border
for i in range(n_diamonds):
    angle = 2 * math.pi * i / n_diamonds - math.pi / 2
    dx = int(CX + diamond_r * math.cos(angle))
    dy = int(CY + diamond_r * math.sin(angle))
    # Subtle glow
    draw.polygon([(dx, dy - ds - 2), (dx + ds + 2, dy), (dx, dy + ds + 2), (dx - ds - 2, dy)],
                 fill=(255, 200, 80, 70))
    draw.polygon([(dx, dy - ds), (dx + ds, dy), (dx, dy + ds), (dx - ds, dy)],
                 fill=(255, 240, 170, 230))

# 5. Chevron arrows — 3 per direction, all 8 compass points
ORANGE = (255, 148, 28, 255)

# Cardinal: bigger chevrons, farther out
card_w, card_h = 20, 34
card_base = R + 18
card_spacing = card_w * 1.2

# Diagonal: same chevrons, a bit smaller to fit the corner geometry
diag_w, diag_h = 17, 29
diag_base = R + 18
diag_spacing = diag_w * 1.2

for deg in [0, 90, 180, 270]:
    rad = math.radians(deg)
    for i in range(3):
        draw_chevron(draw, CX, CY, rad, card_base + i * card_spacing,
                     card_w, card_h, ORANGE)

for deg in [45, 135, 225, 315]:
    rad = math.radians(deg)
    for i in range(3):
        draw_chevron(draw, CX, CY, rad, diag_base + i * diag_spacing,
                     diag_w, diag_h, ORANGE)

# 6. Two tower AoE circles — top and bottom inside the dark circle
aoe_r = 32
aoe_offset = int(R * 0.50)
draw_tower_aoe(draw, CX, CY - aoe_offset, aoe_r)
draw_tower_aoe(draw, CX, CY + aoe_offset, aoe_r)

# ── Save ──────────────────────────────────────────────────────────────────────
out = os.path.normpath(os.path.join(os.path.dirname(__file__), "../public/hazards/knockback_tower.png"))
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out)
print(f"Saved: {out}  ({SIZE}x{SIZE}px)")
