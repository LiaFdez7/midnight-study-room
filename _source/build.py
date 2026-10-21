"""Builds the standalone Midnight Study Room website from the room's design file.

Usage:  python3 build.py <path to Artboard .dc.html> <output folder>

It copies the room's markup, styles and logic unchanged into index.html, so the
website and the Claude canvas always run the same room.
"""
import re, sys, shutil, pathlib

src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
out = pathlib.Path(sys.argv[2])
here = pathlib.Path(__file__).parent

xdc = re.search(r'<x-dc>(.*)</x-dc>', src, re.S).group(1)
helmet = re.search(r'<helmet>(.*?)</helmet>', xdc, re.S).group(1).strip()
body = re.sub(r'<helmet>.*?</helmet>', '', xdc, flags=re.S).strip()
logic = re.search(r'<script type="text/x-dc" data-dc-script[^>]*>(.*?)</script>', src, re.S).group(1).strip()
assert '</script' not in logic.lower()

grain = ('<svg class="stage-grain" aria-hidden="true" width="1600" height="1000">'
         '<filter id="stage-grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"></feTurbulence>'
         '<feColorMatrix type="saturate" values="0"></feColorMatrix></filter>'
         '<rect width="1600" height="1000" filter="url(#stage-grain)"></rect></svg>')

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Midnight Study Room</title>
<meta name="theme-color" content="#1C2346">
<meta name="description" content="Lia's enchanted study room: focus timer, course bookshelf, and daily notebook.">
{helmet}
<link rel="stylesheet" href="stage.css">
</head>
<body>
<noscript><p>The Midnight Study Room needs JavaScript turned on.</p></noscript>
<div id="viewport">
  <div id="stage">
    <div class="wall-stripes" aria-hidden="true"></div>
    <div class="wainscot" aria-hidden="true"></div>
    <div class="baseboard" aria-hidden="true"></div>
    <div class="floor" aria-hidden="true"></div>
    <main id="room-mount"></main>
    <div class="side-veil" aria-hidden="true"></div>
    <div class="side-scrim" aria-hidden="true"></div>
    {grain}
  </div>
</div>
<template id="room-template">
{body}
</template>
<script src="vendor/react.production.min.js"></script>
<script src="vendor/react-dom.production.min.js"></script>
<script src="dc-runtime.js"></script>
<script src="stage.js"></script>
<script>
{logic}

DCRuntime.mount(Component, document.getElementById('room-mount'));
</script>
</body>
</html>
'''

out.mkdir(parents=True, exist_ok=True)
(out / 'vendor').mkdir(exist_ok=True)
(out / 'index.html').write_text(page, encoding='utf-8')
for f in ('dc-runtime.js', 'stage.css', 'stage.js'):
    shutil.copy(here / f, out / f)
for f in ('react.production.min.js', 'react-dom.production.min.js'):
    shutil.copy(here / 'vendor' / f, out / 'vendor' / f)
print('built', out / 'index.html', len(page), 'bytes')
