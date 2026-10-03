import cv2
import numpy as np
from PIL import Image

MASTER_IMAGE_PATH = "/Users/priyanshu/.gemini/antigravity-cli/brain/33af4644-e204-40a6-a0e8-12a94c135218/kosh_monogram_logo_1791002547050.jpg"

def main():
    # 1. Load image
    bgr = cv2.imread(MASTER_IMAGE_PATH)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    
    # 2. Extract Monogram region (rows 180 to 590, cols 320 to 705)
    r1, r2, c1, c2 = 180, 590, 320, 705
    mono_rgb = rgb[r1:r2, c1:c2]
    mono_bgr = bgr[r1:r2, c1:c2]
    mono_hsv = hsv[r1:r2, c1:c2]
    
    # 3. Create transparent PNG for the Monogram
    # Detect background (near white: R > 240, G > 240, B > 240)
    gray = cv2.cvtColor(mono_bgr, cv2.COLOR_BGR2GRAY)
    
    # Smooth alpha mask
    alpha = np.zeros(gray.shape, dtype=np.uint8)
    alpha[gray < 240] = 255
    # Refine alpha with slight antialiasing
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    
    mono_rgba = cv2.cvtColor(mono_bgr, cv2.COLOR_BGR2BGRA)
    mono_rgba[:, :, 3] = alpha
    
    # Trim to exact bounding box of non-zero alpha
    y_indices, x_indices = np.where(alpha > 20)
    ymin, ymax = y_indices.min(), y_indices.max()
    xmin, xmax = x_indices.min(), x_indices.max()
    
    trimmed_mono = mono_rgba[ymin:ymax+1, xmin:xmax+1]
    th, tw = trimmed_mono.shape[:2]
    print(f"Trimmed monogram: {tw}x{th}")
    
    # 4. Generate Square Icon with balanced padding
    # Let target size be square with ~15% padding
    dim = max(tw, th)
    target_dim = int(dim * 1.35)
    square_icon = np.zeros((target_dim, target_dim, 4), dtype=np.uint8)
    
    off_y = (target_dim - th) // 2
    off_x = (target_dim - tw) // 2
    square_icon[off_y:off_y+th, off_x:off_x+tw] = trimmed_mono
    
    pil_icon = Image.fromarray(cv2.cvtColor(square_icon, cv2.COLOR_BGRA2RGBA))
    
    # Save apple-touch-icon.png (180x180)
    # Apple touch icon looks best on a clean white background with subtle rounded bleed
    apple_canvas = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
    resized_apple = pil_icon.resize((150, 150), Image.Resampling.LANCZOS)
    apple_canvas.paste(resized_apple, (15, 15), resized_apple)
    apple_canvas.save("public/apple-touch-icon.png", "PNG")
    print("Saved public/apple-touch-icon.png")
    
    # Save favicon-96x96.png
    fav96_canvas = Image.new("RGBA", (96, 96), (255, 255, 255, 0))
    resized_96 = pil_icon.resize((84, 84), Image.Resampling.LANCZOS)
    fav96_canvas.paste(resized_96, (6, 6), resized_96)
    fav96_canvas.save("public/favicon-96x96.png", "PNG")
    print("Saved public/favicon-96x96.png")
    
    # Save favicon.ico (multi-res 16, 32, 48)
    ico_canvas = Image.new("RGBA", (48, 48), (255, 255, 255, 0))
    resized_48 = pil_icon.resize((42, 42), Image.Resampling.LANCZOS)
    ico_canvas.paste(resized_48, (3, 3), resized_48)
    ico_canvas.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Saved public/favicon.ico")
    
    # 5. Full Logo (1024x1024 / 512x512) for OpenGraph & Socials
    # The full logo includes the monogram, KOSH, and subtitle
    full_gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    full_alpha = np.zeros(full_gray.shape, dtype=np.uint8)
    full_alpha[full_gray < 245] = 255
    full_alpha = cv2.GaussianBlur(full_alpha, (3, 3), 0)
    
    full_rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2BGRA)
    full_rgba[:, :, 3] = full_alpha
    
    fy_indices, fx_indices = np.where(full_alpha > 20)
    fymin, fymax = fy_indices.min(), fy_indices.max()
    fxmin, fxmax = fx_indices.min(), fx_indices.max()
    
    trimmed_full = full_rgba[fymin:fymax+1, fxmin:fxmax+1]
    fth, ftw = trimmed_full.shape[:2]
    
    fdim = max(ftw, fth)
    ftarget_dim = int(fdim * 1.25)
    square_logo = np.full((ftarget_dim, ftarget_dim, 4), 255, dtype=np.uint8)
    # Make background solid pure white
    square_logo[:, :, :3] = 255
    square_logo[:, :, 3] = 255
    
    foff_y = (ftarget_dim - fth) // 2
    foff_x = (ftarget_dim - ftw) // 2
    
    # Alpha blend onto white canvas
    alpha_s = trimmed_full[:, :, 3] / 255.0
    alpha_l = 1.0 - alpha_s
    for c in range(3):
        square_logo[foff_y:foff_y+fth, foff_x:foff_x+ftw, c] = (
            alpha_s * trimmed_full[:, :, c] + alpha_l * 255
        )
        
    pil_logo = Image.fromarray(cv2.cvtColor(square_logo, cv2.COLOR_BGRA2RGBA))
    resized_logo = pil_logo.resize((1024, 1024), Image.Resampling.LANCZOS)
    resized_logo.save("public/logo.png", "PNG")
    print("Saved public/logo.png (1024x1024)")
    
    # 6. Generate Vector SVG for public/favicon.svg
    # We trace contours for the black parts and the gold bar
    # Gold bar in mono_rgb: yellowish hue (R > 140, G > 120, B < 110)
    is_gold = (mono_rgb[:, :, 0] > 140) & (mono_rgb[:, :, 1] > 110) & (mono_rgb[:, :, 2] < 120) & (alpha > 50)
    is_black = (alpha > 50) & (~is_gold)
    
    # Let's write an ultra-clean, vectorized SVG
    # Convert mask to contours with approximation
    gold_mask = is_gold.astype(np.uint8) * 255
    black_mask = is_black.astype(np.uint8) * 255
    
    # Clean morphological smoothing
    kernel = np.ones((2, 2), np.uint8)
    black_mask = cv2.morphologyEx(black_mask, cv2.MORPH_CLOSE, kernel)
    gold_mask = cv2.morphologyEx(gold_mask, cv2.MORPH_CLOSE, kernel)
    
    contours_black, hierarchy_black = cv2.findContours(black_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
    contours_gold, hierarchy_gold = cv2.findContours(gold_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
    
    # Translate to 96x96 viewport
    scale = 80.0 / target_dim
    shift_x = (96 - (target_dim * scale)) / 2
    shift_y = (96 - (target_dim * scale)) / 2
    
    def contour_to_svg_d(contours, hierarchy):
        if not contours:
            return ""
        d_parts = []
        for i, cnt in enumerate(contours):
            if cv2.contourArea(cnt) < 15:
                continue
            # approximate polygon
            epsilon = 0.003 * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            
            pts = approx[:, 0, :]
            # Map pts from mono coords to 96x96 viewport
            # mono coords -> square_icon coords: x + (off_x - xmin), y + (off_y - ymin)
            mapped_pts = []
            for px, py in pts:
                sx = px - xmin + off_x
                sy = py - ymin + off_y
                vx = sx * scale + shift_x
                vy = sy * scale + shift_y
                mapped_pts.append(f"{vx:.2f} {vy:.2f}")
                
            if mapped_pts:
                d_parts.append(f"M {mapped_pts[0]} " + " ".join([f"L {p}" for p in mapped_pts[1:]]) + " Z")
        return " ".join(d_parts)
    
    d_black = contour_to_svg_d(contours_black, hierarchy_black)
    d_gold = contour_to_svg_d(contours_gold, hierarchy_gold)
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" role="img" aria-labelledby="kosh-logo-title">
  <title id="kosh-logo-title">Kosh</title>
  <style>
    .kosh-stem {{ fill: #111827; }}
    .kosh-accent {{ fill: #b8860b; }}
    @media (prefers-color-scheme: dark) {{
      .kosh-stem {{ fill: #f3f4f6; }}
      .kosh-accent {{ fill: #d4af37; }}
    }}
  </style>
  <path class="kosh-stem" fill-rule="evenodd" clip-rule="evenodd" d="{d_black}" />
  <path class="kosh-accent" fill-rule="evenodd" clip-rule="evenodd" d="{d_gold}" />
</svg>
'''
    with open("public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("Saved public/favicon.svg")

if __name__ == "__main__":
    main()
