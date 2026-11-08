"""Regenerate the approved Fraunces axis subset. Requires fonttools 4.59+ and brotli."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

output = Path("public/fonts")
output.mkdir(exist_ok=True)
for style in ("normal", "italic"):
    source = Path(f"node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-{style}.woff2")
    font = TTFont(source, recalcTimestamp=False)
    font = instantiateVariableFont(font, {"SOFT": (10, 40), "WONK": (0, 1)}, inplace=True)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=list(range(32, 127)) + [0xa0,0xa9,0xb7,0x2013,0x2014,0x2018,0x2019,0x201c,0x201d,0x2026,0x2193,0x2197])
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(output / f"fraunces-{style}.woff2")
