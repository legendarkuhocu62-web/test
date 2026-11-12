#!/usr/bin/env python3
"""Import the 13 explicitly approved Drive images, verify exact bytes, crop photo thumbs.

Used only on the test integration branch. Original images are saved unchanged.
The GDrive file IDs and SHA256 hashes fix source revisions (especially A/F/K).
"""
from __future__ import annotations
import hashlib
from pathlib import Path
import sys
import gdown
from PIL import Image, ImageOps

ASSETS = {
    "A": ("15D-LxpZJ6TM6Okyj9d7hGycq9B5chkGo", "b0d8518596bb040ff00f0eac562d6b184ba3c078d78d688b5e3eeb0e04f00fc4", (30, 160, 470, 550)),
    "B": ("1_lGMCZtgH8y3Lw2EJxrkbu4c0Q9a8ZJg", "90607628788cde2eaa4f46381ef420e7e43eaafc4f9bdc8373df98a760ad04db", (30, 145, 970, 490)),
    "C": ("1r6YYWkhtOj0C871WZLDkwFsIr_PS-kow", "5106e7ecb159ffd69f2dab124a88dac0db268649b127258d5962d237db8441c8", (30, 145, 970, 545)),
    "D": ("1zH0Sky2pJbyMk6qbb0WhdErfI_TKE_Jf", "b6c4181493fde501db0da28fb253d2caf70d52f0f44cd37c6a737380a2cfe110", (30, 150, 975, 550)),
    "E": ("1HFI1GHkz1ZqGC7KazXdLOsSGfwDT9JWn", "aa6c4ca1d9367c0656c07006246665f268c04cbbc3bf67e5bee4e24cbb310ea2", (30, 155, 475, 548)),
    "F": ("1G_687hAS3B9OstBgMzfI_fX08lMCbpfY", "0afb153f5ab4ea895c43bf25dd4e1776c8efd3c817b122bd4ba6db3b05e726a8", (30, 155, 475, 548)),
    "G": ("15aIs9zLjd1N0dtG_0IVmjvceBHWICqS4", "c9dcded58e516facce64b9b1336d2a9d15e07802490f4ed39f4e8c55c6402136", (30, 145, 975, 500)),
    "H": ("1xEI2FWSmzXVU-3QDLitoIHr_-i76dSdj", "0637527f97e5cbe54b4ad2f62bc35ba1fa245fe0a91f8ab8f5ac10b7bb65ff35", (30, 160, 480, 548)),
    "I": ("1lCBaS6H9xmzp9wm3KpNfhwFu3aLdCZyc", "5ad691cb9073d77e914c088c492f5ebe8e9647cdab70c622624b0da352d37fd6", (30, 155, 480, 548)),
    "J": ("1Sq7IhrZ8DDjtUOca77Nmm3Oyu8ExJdGb", "40564b8e256248e82cf85ad31a1a7bcc6f0524288e516b34aa80c75d7289dce6", (30, 155, 480, 548)),
    "K": ("1iGVXtESXqUWZjuN6I64b1eC5nmvh7WE-", "103ef44bd42eecc21f9a82a36b0c35b4de62fe5994e7c987e714016815fbd006", (30, 155, 480, 548)),
    "L": ("1XKLQSBxwA8L2aLIpIsvyCLJohbYEvC9F", "4323bde8220bd535b0af5bf6b2289195aa71aeda70d9b8553197e29563cf56cc", (30, 150, 490, 550)),
    "M": ("1dM03d_dg35ENzi9ZlUHgJ3rLgG0sDxXl", "88b0c8bbecf91f675c2adce61e5909cd6cfc4bc7cd56f2c8217ac1d05cc04b6d", (30, 145, 490, 540)),
}
DEST = Path("assets/investments")
def main():
    DEST.mkdir(parents=True,exist_ok=True)
    (DEST / "thumbs").mkdir(parents=True,exist_ok=True)
    for letter,(drive_id, expected, crop) in ASSETS.items():
        original=DEST / f"CH1-VA-{letter}-001.png"
        if not original.exists():
            if not gdown.download(id=drive_id, output=str(original), quiet=True):
                raise RuntimeError(f"{letter}: image download failed; no substitution allowed")
        actual=hashlib.sha256(original.read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError(f"{letter}: SHA256 mismatch; expected approved revision {expected}, received {actual}")
        with Image.open(original) as image:
            if image.width != 1024 or image.height not in (1535, 1536):
                raise RuntimeError(f"{letter}: unexpected image dimensions")
            photo=ImageOps.fit(image.crop(crop).convert("RGB"),(360,240),method=Image.Resampling.LANCZOS)
            photo.save(DEST/"thumbs"/f"CH1-VA-{letter}-001.webp",format="WEBP",quality=84,method=5)
        print(f"{letter}: verified original {original.stat().st_size} bytes; thumbnail created")
    print("All 13 source originals verified against the approved SHA256 list.")
if __name__ == "__main__":
    sys.exit(main())
