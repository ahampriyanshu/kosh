import os
import subprocess
import urllib.request
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen

FONT_PATH = "/tmp/Newsreader-Bold.ttf"
FONT_URL = "https://fonts.gstatic.com/s/newsreader/v26/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF438wn4jADA.ttf"

def ensure_font():
    if not os.path.exists(FONT_PATH):
        print(f"Downloading Newsreader-Bold.ttf from {FONT_URL}...")
        urllib.request.urlretrieve(FONT_URL, FONT_PATH)
        print("Downloaded font successfully.")

def get_svg_paths(viewbox_dim=1000, target_h=680):
    font = TTFont(FONT_PATH)
    rec_pen = RecordingPen()
    font.getGlyphSet()['K'].draw(rec_pen)

    # Glyph metrics from Newsreader Bold:
    # xMin: 73, yMin: 0, xMax: 1616, yMax: 1352
    xMin, yMin, xMax, yMax = 73, 0, 1616, 1352
    gw = xMax - xMin  # 1543
    gh = yMax - yMin  # 1352

    scale = target_h / gh
    scaled_w = gw * scale
    off_x = (viewbox_dim - scaled_w) / 2
    off_y = (viewbox_dim - target_h) / 2

    def to_svg(x, y):
        sx = off_x + (x - xMin) * scale
        sy = off_y + (yMax - y) * scale
        return f"{sx:.2f} {sy:.2f}"

    svg_parts = []
    for cmd, args in rec_pen.value:
        if cmd == 'moveTo':
            svg_parts.append(f"M {to_svg(args[0][0], args[0][1])}")
        elif cmd == 'lineTo':
            svg_parts.append(f"L {to_svg(args[0][0], args[0][1])}")
        elif cmd == 'closePath':
            svg_parts.append("Z")

    k_path = " ".join(svg_parts)

    # Single horizontal INR strike crossbar through upper diagonal arm:
    # Font units: arm centered at y=946, x=938.
    # Thickness = 57 units (identical to top serif thickness).
    # Width = 360 units (balanced crossbar).
    y_mid = 946
    bar_h = 57
    bar_w = 360
    x_mid = 938

    x0, x1 = x_mid - bar_w / 2, x_mid + bar_w / 2
    y0, y1 = y_mid - bar_h / 2, y_mid + bar_h / 2

    p1 = to_svg(x0, y1)  # top-left
    p2 = to_svg(x1, y1)  # top-right
    p3 = to_svg(x1, y0)  # bottom-right
    p4 = to_svg(x0, y0)  # bottom-left

    strike_path = f"M {p1} L {p2} L {p3} L {p4} Z"
    return k_path, strike_path

def main():
    ensure_font()
    os.makedirs("public", exist_ok=True)

    # 1. Generate public/favicon.svg (96x96 viewport, dark/light adaptive)
    k_path_96, strike_path_96 = get_svg_paths(viewbox_dim=96, target_h=66)
    svg_favicon_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" role="img" aria-labelledby="kosh-logo-title">
  <title id="kosh-logo-title">Kosh</title>
  <style>
    .kosh-mark {{ fill: #111827; }}
    @media (prefers-color-scheme: dark) {{
      .kosh-mark {{ fill: #f9fafb; }}
    }}
  </style>
  <path class="kosh-mark" fill-rule="evenodd" clip-rule="evenodd" d="{k_path_96}" />
  <path class="kosh-mark" fill-rule="evenodd" clip-rule="evenodd" d="{strike_path_96}" />
</svg>
'''
    with open("public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(svg_favicon_content)
    print("Saved public/favicon.svg")

    # 2. Generate Master SVG with solid white background for raster assets (1000x1000)
    k_path_1000, strike_path_1000 = get_svg_paths(viewbox_dim=1000, target_h=680)
    master_svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1000 1000">
  <rect width="1000" height="1000" fill="#ffffff" />
  <path d="{k_path_1000}" fill="#111827" />
  <path d="{strike_path_1000}" fill="#111827" />
</svg>
'''
    master_svg_path = "/tmp/kosh_master_brand.svg"
    with open(master_svg_path, "w", encoding="utf-8") as f:
        f.write(master_svg_content)

    # 3. High-resolution rasterization using macOS Quartz vector engine via qlmanage
    master_png_raw = "/tmp/kosh_master_brand.svg.png"
    master_png_path = "/tmp/kosh_master_brand_2048.png"
    subprocess.run(
        ["qlmanage", "-t", "-s", "2048", "-o", "/tmp", master_svg_path],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if os.path.exists(master_png_raw):
        os.rename(master_png_raw, master_png_path)

    master_im = Image.open(master_png_path).convert("RGB")
    print(f"Rendered Quartz master image: {master_im.size}")

    # 4. Generate all required raster assets
    # 4a. public/logo.png (1024x1024)
    logo_1024 = master_im.resize((1024, 1024), Image.Resampling.LANCZOS)
    logo_1024.save("public/logo.png", "PNG", optimize=True)
    print("Saved public/logo.png (1024x1024)")

    # 4b. public/apple-touch-icon.png (180x180)
    apple_180 = master_im.resize((180, 180), Image.Resampling.LANCZOS)
    apple_180.save("public/apple-touch-icon.png", "PNG", optimize=True)
    print("Saved public/apple-touch-icon.png (180x180)")

    # 4c. public/web-app-manifest-512x512.png
    manifest_512 = master_im.resize((512, 512), Image.Resampling.LANCZOS)
    manifest_512.save("public/web-app-manifest-512x512.png", "PNG", optimize=True)
    print("Saved public/web-app-manifest-512x512.png (512x512)")

    # 4d. public/web-app-manifest-192x192.png
    manifest_192 = master_im.resize((192, 192), Image.Resampling.LANCZOS)
    manifest_192.save("public/web-app-manifest-192x192.png", "PNG", optimize=True)
    print("Saved public/web-app-manifest-192x192.png (192x192)")

    # 4e. public/favicon-96x96.png (96x96)
    fav_96 = master_im.resize((96, 96), Image.Resampling.LANCZOS)
    fav_96.save("public/favicon-96x96.png", "PNG", optimize=True)
    print("Saved public/favicon-96x96.png (96x96)")

    # 4f. public/favicon.ico (multi-resolution 16x16, 32x32, 48x48)
    master_im.save(
        "public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("Saved public/favicon.ico (16x16, 32x32, 48x48)")

if __name__ == "__main__":
    main()
