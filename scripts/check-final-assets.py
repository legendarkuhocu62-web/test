"""Static regression for CH1 S08 art; run without third-party packages."""
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
css=(root/"s06-s08-ui.css").read_text(encoding="utf8")
js=(root/"s06-s08-ui.js").read_text(encoding="utf8")
html=(root/"index.html").read_text(encoding="utf8")
ids=["BG-D","BG-M","CARD-02","CARD-03","ICON-COMPLETE","DECOR-DOMINO","DECOR-LAUREL"]
total=0
for part in ids:
    names=list((root/"assets/final").glob("CH1-FINAL-"+part+"-001.webp"))
    assert len(names)==1,part
    p=names[0]; b=p.read_bytes()
    assert b[:4]==b"RIFF" and b[8:12]==b"WEBP",(p,"not WebP")
    assert 1000<len(b)<1_200_000,(p,len(b))
    assert ('assets/final/'+p.name) in css,p.name
    total+=len(b)
assert total<2_000_000,total
assert "ch1-final-webp-20261123-v1" in html
assert "function renderS08Complete" in js
assert "s08ReturnToSummary" in js
assert "button('НАЧАТЬ ЗАНОВО','reset')" in js
assert "@media(max-width:720px)" in css
assert "grid-template-columns:minmax(0,1fr)" in css
print("PASS: seven optimized WebPs, local references, mobile final, navigation preserved;",total,"bytes total")
