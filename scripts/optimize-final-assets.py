#!/usr/bin/env python3
"""Optimize only Chapter 01 final-screen art. Preserve alpha; never alter other assets."""
from pathlib import Path
from PIL import Image, ImageOps
SOURCE = Path("assets/final-source")
TARGET = Path("assets/final")
TARGET.mkdir(parents=True, exist_ok=True)
MAX_SIZE = {
 "CH1-FINAL-BG-D-001": (1672,941),
 "CH1-FINAL-BG-M-001": (941,1672),
 "CH1-FINAL-CARD-02-001": (1200,676),
 "CH1-FINAL-CARD-03-001": (1200,676),
 "CH1-FINAL-ICON-COMPLETE-001": (400,400),
 "CH1-FINAL-DECOR-DOMINO-001": (400,400),
 "CH1-FINAL-DECOR-LAUREL-001": (900,300),
}
for stem, resolution in MAX_SIZE.items():
 src = SOURCE / (stem+".png")
 if not src.is_file(): raise FileNotFoundError(src)
 with Image.open(src) as raw:
  raw.load()
  im = ImageOps.exif_transpose(raw)
  im.thumbnail(resolution, Image.Resampling.LANCZOS)
  if im.mode not in ("RGB","RGBA"): im=im.convert("RGBA" if "A" in im.getbands() else "RGB")
  out=TARGET / (stem+".webp")
  im.save(out,format="WEBP",quality=86,method=6,exact=True)
  size=out.stat().st_size
  if size<=0 or size>1200000: raise RuntimeError(f"Unexpected size for {out}: {size}")
  print(f"{out}: {im.width}x{im.height}, {size} bytes")
