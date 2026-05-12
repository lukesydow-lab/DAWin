#!/usr/bin/env python3
"""
Project DAWin — Org Chart Generator
Signal Architecture design philosophy
"""

from PIL import Image, ImageDraw, ImageFont
import os

# ── Design tokens ──────────────────────────────────────────────────────────────
BG        = (10,  10,  15)
SURFACE   = (17,  17,  24)
ELEVATED  = (26,  26,  36)
ACCENT    = (107, 92,  231)
DANGER    = (233, 69,  96)
SUCCESS   = (29,  158, 117)
TEXT_PRI  = (240, 240, 245)
TEXT_SEC  = (136, 136, 153)
BORDER    = (30,  30,  40)
WARN      = (245, 166, 35)

W, H = 1400, 900
NODE_W, NODE_H = 210, 90

FONTS_DIR = (
    "/Users/lukesydow/Library/Application Support/Claude/local-agent-mode-sessions"
    "/skills-plugin/c624e679-c2d4-4ee2-865e-4c235570b11f"
    "/cf2ba560-51c4-4c9b-a9b4-11f7c3a59a01/skills/canvas-design/canvas-fonts"
)

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS_DIR, name), size)

# ── Fonts ──────────────────────────────────────────────────────────────────────
F_TITLE      = font("GeistMono-Bold.ttf",    17)
F_SUBTITLE   = font("GeistMono-Regular.ttf", 11)
F_ROLE_BOLD  = font("InstrumentSans-Bold.ttf", 12)
F_OWNER      = font("InstrumentSans-Regular.ttf", 10)
F_RESP_IT    = font("InstrumentSans-Italic.ttf", 9)
F_AVATAR     = font("InstrumentSans-Bold.ttf", 13)
F_BADGE      = font("GeistMono-Regular.ttf", 9)
F_LEGEND_LBL = font("InstrumentSans-Regular.ttf", 10)
F_WATERMARK  = font("GeistMono-Regular.ttf", 9)
F_LABEL_SM   = font("GeistMono-Regular.ttf", 8)

# ── Role data ──────────────────────────────────────────────────────────────────
ROLES = [
    {
        "role": "Product Manager",
        "owner": "Luke",
        "color": ACCENT,
        "initial": "L",
        "resp": "Plans features · delegates · synthesizes",
        "cx": 700, "cy": 150,
    },
    {
        "role": "Designer",
        "owner": "Anna",
        "color": SUCCESS,
        "initial": "A",
        "resp": "Layout · tokens · interaction patterns",
        "cx": 270, "cy": 370,
    },
    {
        "role": "Tech Lead",
        "owner": "Miguel",
        "color": DANGER,
        "initial": "M",
        "resp": "Architecture · code review · risk flags",
        "cx": 700, "cy": 370,
    },
    {
        "role": "UAT",
        "owner": "Priya",
        "color": WARN,
        "initial": "P",
        "resp": "Test scenarios · acceptance · DAW",
        "cx": 1130, "cy": 370,
    },
    {
        "role": "Frontend Engineer",
        "owner": "Luke",
        "color": ACCENT,
        "initial": "L",
        "resp": "React · TypeScript · Tailwind v4",
        "cx": 565, "cy": 610,
    },
    {
        "role": "Backend Engineer",
        "owner": "Anna",
        "color": SUCCESS,
        "initial": "A",
        "resp": "API contracts · WebSocket · data models",
        "cx": 835, "cy": 610,
    },
]

CONNECTIONS = [
    (0, 1), (0, 2), (0, 3),
    (2, 4), (2, 5),
]


def node_rect(cx, cy):
    x0 = cx - NODE_W // 2
    y0 = cy - NODE_H // 2
    return x0, y0, x0 + NODE_W, y0 + NODE_H


def draw_avatar(draw, cx, cy, radius, color, initial):
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=color)
    bbox = F_AVATAR.getbbox(initial)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw // 2 - bbox[0], cy - th // 2 - bbox[1]),
              initial, font=F_AVATAR, fill=TEXT_PRI)


def draw_node(draw, role_data):
    cx, cy = role_data["cx"], role_data["cy"]
    color  = role_data["color"]
    x0, y0, x1, y1 = node_rect(cx, cy)
    r = 12
    bw = 2   # border width

    # 1. Base surface rounded rect
    draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=SURFACE)

    # 2. Left accent bar — draw as a solid vertical strip (6px wide)
    #    sitting just inside the left border, spanning inner height
    BAR_W = 6
    bar_inner_x0 = x0 + bw
    bar_inner_y0 = y0 + r
    bar_inner_x1 = bar_inner_x0 + BAR_W
    bar_inner_y1 = y1 - r
    # Full accent rectangle
    draw.rectangle([bar_inner_x0, bar_inner_y0, bar_inner_x1, bar_inner_y1], fill=color)
    # Round caps at top/bottom
    cap_r = BAR_W // 2
    draw.ellipse([bar_inner_x0, bar_inner_y0 - cap_r,
                  bar_inner_x1, bar_inner_y0 + cap_r], fill=color)
    draw.ellipse([bar_inner_x0, bar_inner_y1 - cap_r,
                  bar_inner_x1, bar_inner_y1 + cap_r], fill=color)

    # 3. Border on top of everything
    draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=None,
                            outline=BORDER, width=bw)

    # 4. Avatar
    AVATAR_R = 16
    avatar_cx = x0 + BAR_W + bw + 14 + AVATAR_R
    avatar_cy = y0 + 30
    draw_avatar(draw, avatar_cx, avatar_cy, AVATAR_R, color, role_data["initial"])

    # 5. Role title + owner
    text_x = avatar_cx + AVATAR_R + 10
    draw.text((text_x, y0 + 13), role_data["role"], font=F_ROLE_BOLD, fill=TEXT_PRI)
    draw.text((text_x, y0 + 30), role_data["owner"],  font=F_OWNER,     fill=TEXT_SEC)

    # 6. Responsibility (bottom, italic, truncated if needed)
    resp = role_data["resp"]
    max_w = NODE_W - BAR_W - bw - 14 - 10
    while True:
        bb = F_RESP_IT.getbbox(resp)
        if (bb[2] - bb[0]) <= max_w:
            break
        resp = resp[:-2]
    draw.text((x0 + BAR_W + bw + 14, y1 - 20), resp, font=F_RESP_IT, fill=TEXT_SEC)


def draw_connection(draw, parent_data, child_data):
    """
    Elbow: parent-bottom straight down to mid_y, horizontal to child x,
    then straight down to child-top.
    """
    px = parent_data["cx"]
    _, _, _, py = node_rect(parent_data["cx"], parent_data["cy"])

    cx = child_data["cx"]
    _, cy, _, _ = node_rect(child_data["cx"], child_data["cy"])

    mid_y = (py + cy) // 2
    draw.line([(px, py),    (px, mid_y)],  fill=BORDER, width=2)
    draw.line([(px, mid_y), (cx, mid_y)],  fill=BORDER, width=2)
    draw.line([(cx, mid_y), (cx, cy)],     fill=BORDER, width=2)


def draw_legend(draw):
    """AUDIO / MIDI track type legend, bottom-right."""
    base_x = 1180
    base_y = 776
    bw, bh = 148, 40
    gap = 12
    lbl_r = 7

    for i, (pat, label) in enumerate([("H", "Audio Track"), ("V", "MIDI Track")]):
        bx0 = base_x
        by0 = base_y + i * (bh + gap)
        bx1 = bx0 + bw
        by1 = by0 + bh

        draw.rounded_rectangle([bx0, by0, bx1, by1], radius=lbl_r, fill=ELEVATED)

        # Stripe pattern (clipped by drawing within badge bounds only)
        stripe_color = (*ACCENT, 50)
        if pat == "H":
            for ly in range(by0 + 4, by1, 4):
                draw.line([(bx0 + 4, ly), (bx1 - 4, ly)], fill=stripe_color, width=1)
        else:
            for lx in range(bx0 + 4, bx1, 4):
                draw.line([(lx, by0 + 4), (lx, by1 - 4)], fill=stripe_color, width=1)

        # Left accent bar
        draw.rounded_rectangle([bx0, by0, bx0 + 3, by1], radius=2, fill=ACCENT)

        # Border
        draw.rounded_rectangle([bx0, by0, bx1, by1], radius=lbl_r,
                                fill=None, outline=BORDER, width=1)

        # Label
        lbl_y = by0 + (bh - 12) // 2
        draw.text((bx0 + 12, lbl_y), label, font=F_LEGEND_LBL, fill=TEXT_SEC)


def draw_decorative_waveform(draw):
    """Subtle waveform / oscilloscope trace at the bottom of the canvas."""
    import math
    y_center = 800
    x_start  = 60
    x_end    = 900
    amplitude = 8
    freq      = 0.03
    points = []
    for x in range(x_start, x_end, 2):
        y = y_center + int(amplitude * math.sin(freq * x))
        points.append((x, y))
    if len(points) > 1:
        for j in range(len(points) - 1):
            draw.line([points[j], points[j+1]], fill=(*ACCENT, 35), width=1)

    # Small label
    draw.text((x_start, y_center + 16), "~ signal path", font=F_LABEL_SM,
              fill=(*TEXT_SEC, 60))


def main():
    img  = Image.new("RGBA", (W, H), (*BG, 255))
    draw = ImageDraw.Draw(img, "RGBA")

    # ── Background dot grid ────────────────────────────────────────────────
    for gx in range(40, W, 40):
        for gy in range(40, H, 40):
            draw.ellipse([gx - 1, gy - 1, gx + 1, gy + 1], fill=(*BORDER, 55))

    # ── Faint vertical channel separators (DAW mixer aesthetic) ───────────
    for vx in [350, 700, 1050]:
        draw.line([(vx, 96), (vx, H - 40)], fill=(*BORDER, 45), width=1)

    # ── Title block ────────────────────────────────────────────────────────
    title = "P R O J E C T   D A W I N"
    tb    = F_TITLE.getbbox(title)
    draw.text((W // 2 - (tb[2] - tb[0]) // 2, 30), title,
              font=F_TITLE, fill=ACCENT)

    sub = "Agent Team Structure"
    sb  = F_SUBTITLE.getbbox(sub)
    draw.text((W // 2 - (sb[2] - sb[0]) // 2, 56), sub,
              font=F_SUBTITLE, fill=TEXT_SEC)

    draw.line([(W // 2 - 200, 78), (W // 2 + 200, 78)], fill=BORDER, width=1)

    # ── Connection lines (drawn first, under nodes) ────────────────────────
    # Group 1: PM → Designer, TechLead, UAT  (shared horizontal bus at mid_y)
    pm = ROLES[0]
    _, _, _, pm_bot = node_rect(pm["cx"], pm["cy"])
    tier1_children = [ROLES[1], ROLES[2], ROLES[3]]
    tier1_tops = [node_rect(r["cx"], r["cy"])[1] for r in tier1_children]
    bus_y1 = (pm_bot + min(tier1_tops)) // 2
    # Vertical stem down from PM
    draw.line([(pm["cx"], pm_bot), (pm["cx"], bus_y1)], fill=BORDER, width=2)
    # Horizontal bus spanning all children
    left_x  = min(r["cx"] for r in tier1_children)
    right_x = max(r["cx"] for r in tier1_children)
    draw.line([(left_x, bus_y1), (right_x, bus_y1)], fill=BORDER, width=2)
    # Vertical drops to each child
    for child in tier1_children:
        _, ctop, _, _ = node_rect(child["cx"], child["cy"])
        draw.line([(child["cx"], bus_y1), (child["cx"], ctop)], fill=BORDER, width=2)

    # Group 2: TechLead → FE, BE  (shared horizontal bus)
    tl = ROLES[2]
    _, _, _, tl_bot = node_rect(tl["cx"], tl["cy"])
    tier2_children = [ROLES[4], ROLES[5]]
    tier2_tops = [node_rect(r["cx"], r["cy"])[1] for r in tier2_children]
    bus_y2 = (tl_bot + min(tier2_tops)) // 2
    draw.line([(tl["cx"], tl_bot), (tl["cx"], bus_y2)], fill=BORDER, width=2)
    left2  = min(r["cx"] for r in tier2_children)
    right2 = max(r["cx"] for r in tier2_children)
    draw.line([(left2, bus_y2), (right2, bus_y2)], fill=BORDER, width=2)
    for child in tier2_children:
        _, ctop, _, _ = node_rect(child["cx"], child["cy"])
        draw.line([(child["cx"], bus_y2), (child["cx"], ctop)], fill=BORDER, width=2)

    # ── Nodes ─────────────────────────────────────────────────────────────
    for role in ROLES:
        draw_node(draw, role)

    # ── Thin horizontal rule above footer ─────────────────────────────────
    draw.line([(60, 730), (W - 60, 730)], fill=BORDER, width=1)

    # ── Team stat chips (bottom strip) ────────────────────────────────────
    stats = [
        ("6", "team members"),
        ("3", "discipline areas"),
        ("2", "engineering tracks"),
        ("1", "PM · synthesizes all"),
    ]
    sx = 80
    for val, lbl in stats:
        draw.text((sx, 748), val, font=F_ROLE_BOLD, fill=ACCENT)
        vb = F_ROLE_BOLD.getbbox(val)
        vw = vb[2] - vb[0]
        draw.text((sx + vw + 6, 750), lbl, font=F_LEGEND_LBL, fill=TEXT_SEC)
        lb = F_LEGEND_LBL.getbbox(lbl)
        sx += vw + 6 + (lb[2] - lb[0]) + 48

    # ── Decorative waveform trace ──────────────────────────────────────────
    draw_decorative_waveform(draw)

    # ── Legend ────────────────────────────────────────────────────────────
    draw_legend(draw)

    # ── Watermark ─────────────────────────────────────────────────────────
    draw.text((40, H - 22), "v0.1 · Signal Architecture · 2026",
              font=F_WATERMARK, fill=(*TEXT_SEC, 70))

    # ── Save ──────────────────────────────────────────────────────────────
    out = "/Users/lukesydow/daw-design/org-chart.png"
    img.convert("RGB").save(out, "PNG", dpi=(144, 144))
    print(f"Saved → {out}")


if __name__ == "__main__":
    main()
