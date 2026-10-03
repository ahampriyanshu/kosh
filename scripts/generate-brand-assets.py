"""Regenerate Kosh's PNG and ICO assets from public/favicon.svg."""

import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SVG_PATH = PUBLIC / "favicon.svg"


def main() -> None:
    if not SVG_PATH.exists():
        raise SystemExit(f"Missing source logo: {SVG_PATH}")

    # Use the project's installed sharp renderer so every raster keeps the
    # vector mark's shape, color, background, and softened corners exactly.
    render_script = r"""
const sharp = require('sharp');
const fs = require('fs');
const source = fs.readFileSync(process.argv[1]);
const out = process.argv[2];
const sizes = {
  'logo.png': 1024,
  'favicon-96x96.png': 96,
  'apple-touch-icon.png': 180,
  'web-app-manifest-192x192.png': 192,
  'web-app-manifest-512x512.png': 512,
};
(async () => {
  for (const [name, size] of Object.entries(sizes)) {
    await sharp(source, { density: 1024 })
      .resize(size, size)
      .png()
      .toFile(`${out}/${name}`);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
"""
    subprocess.run(
        ["node", "-e", render_script, str(SVG_PATH), str(PUBLIC)],
        cwd=ROOT,
        check=True,
    )

    Image.open(PUBLIC / "logo.png").save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    print("Generated logo, favicon, Apple touch icon, and PWA icons from favicon.svg.")


if __name__ == "__main__":
    main()
