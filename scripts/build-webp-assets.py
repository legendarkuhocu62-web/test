#!/usr/bin/env python3
"""Build responsive, local WebP derivatives. Never alter the approved originals."""
from __future__ import annotations
from pathlib import Path
import hashlib, json, sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = [
    "assets/backgrounds/CH1-IMG-001_Главный-экран.png",
    "assets/backgrounds/CH1-IMG-006_Внешняя проходная.png",
    "assets/backgrounds/CH1-IMG-002_Входная зона и турникеты.png",
    "assets/backgrounds/CH1-IMG-005_Технологический отдел.png",
    "assets/backgrounds/CH1-IMG-014_Инженерный кабинет.png",
    "assets/backgrounds/CH1-IMG-022_S03_meeting_three_characters_mobile.png",
    "assets/backgrounds/CH1-IMG-023_S00_turnstiles_lobby_mobile.png",
    "assets/characters/CH1-IMG-011_Персонаж Марина Власова.png",
    "assets/characters/CH1-IMG-012_Персонаж Андрей Громов.png",
    "assets/characters/CH1-IMG-013_Женский персонаж с планшетом.png",
    "assets/characters/CH1-IMG-015_irina_friendly.png",
    "assets/characters/CH1-IMG-016_irina_focused.png",
    "assets/icons/CH404-CH1-S00-001_employee_badge_technician.png",
    "assets/objects/CH1-S02-production-report-desktop.png",
    "assets/objects/CH1-S02-production-report-mobile.png",
]
# Report and badge contain small text: use lossless pixel reproduction.
LOSSLESS = ("assets/objects/", "assets/icons/")
results=[]
for path in SOURCE:
    src=ROOT/path
    if not src.is_file(): raise SystemExit(f"Missing approved original: {path}")
    dest=ROOT/"assets/optimized"/Path(path).relative_to("assets").with_suffix(".webp")
    dest.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(src) as original:
        original.load()
        before_size=original.size
        has_alpha="A" in original.getbands() or "transparency" in original.info
        true_transparency=(original.convert("RGBA").getchannel("A").getextrema()[0]<255) if has_alpha else False
        picture=original.convert("RGBA" if true_transparency else "RGB")
        use_lossless=path.startswith(LOSSLESS)
        picture.save(dest,format="WEBP",quality=90 if "/characters/" in path else 88,
                     method=6,lossless=use_lossless,exact=true_transparency)
    with Image.open(dest) as converted:
        assert converted.format=="WEBP" and converted.size==before_size
        if true_transparency:
            assert "A" in converted.getbands(), f"Real transparency lost: {path}"
    old_size=src.stat().st_size
    new_size=dest.stat().st_size
    if new_size >= old_size*0.95:
        dest.unlink()
        print(f"SKIP {path}: {old_size} -> {new_size} (no meaningful benefit)",flush=True)
        continue
    ratio=round((1-new_size/old_size)*100,1)
    print(f"OK {path}: {old_size} -> {new_size} ({ratio}% smaller)",flush=True)
    results.append({"original":path, "optimized":str(dest.relative_to(ROOT)),
                    "original_bytes":old_size,"optimized_bytes":new_size,
                    "saved_percent":ratio,"dimensions":list(before_size),
                    "pixel_lossless":use_lossless,"alpha":true_transparency,
                    "sha256":hashlib.sha256(dest.read_bytes()).hexdigest()})
report={"assets":results,"original_total_bytes":sum(x["original_bytes"] for x in results),
        "optimized_total_bytes":sum(x["optimized_bytes"] for x in results)}
report["saved_percent"]=round((1-report["optimized_total_bytes"]/report["original_total_bytes"])*100,1)
(ROOT/"assets/optimized/report.json").write_text(
    json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"TOTAL {len(results)} images reduced {report['saved_percent']}%",flush=True)
if len(results)<9: raise SystemExit("Too few optimized assets: investigate the build")
