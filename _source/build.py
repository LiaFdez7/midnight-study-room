"""Builds the standalone Midnight Study Room website (and installable app) from the room's design file.

Usage:  python3 build.py <path to Artboard .dc.html> <output folder>

It copies the room's markup, styles and logic unchanged into index.html, so the
website and the Claude canvas always run the same room.
"""
import re, sys, shutil, pathlib, hashlib, json

src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
out = pathlib.Path(sys.argv[2])
here = pathlib.Path(__file__).parent

xdc = re.search(r'<x-dc>(.*)</x-dc>', src, re.S).group(1)
helmet = re.search(r'<helmet>(.*?)</helmet>', xdc, re.S).group(1).strip()
# The app ships its own fonts so it looks right offline: swap the Google Fonts link for the bundled copy.
helmet, n = re.subn(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">', '<link rel="stylesheet" href="fonts/fonts.css">', helmet)
assert n == 1, 'expected exactly one Google Fonts link in the room'
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
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="icon" href="icons/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
{helmet}
<link rel="stylesheet" href="stage.css">
<link rel="stylesheet" href="enchanted-room.css">
<script src="pwa.js"></script>
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
<script src="room-worlds-core.js"></script>
<script src="enchanted-room.js"></script>
</body>
</html>
'''

out.mkdir(parents=True, exist_ok=True)
for sub in ('vendor', 'fonts', 'icons'):
    (out / sub).mkdir(exist_ok=True)
(out / 'index.html').write_text(page, encoding='utf-8')
for f in ('dc-runtime.js', 'stage.css', 'stage.js', 'pwa.js', 'manifest.webmanifest'):
    shutil.copy(here / f, out / f)
for f in ('react.production.min.js', 'react-dom.production.min.js'):
    shutil.copy(here / 'vendor' / f, out / 'vendor' / f)
for folder in ('fonts', 'icons'):
    assets = here / folder
    if not assets.is_dir():
        assets = here.parent / folder
    for f in assets.iterdir():
        target = out / folder / f.name
        if f.resolve() != target.resolve():
            shutil.copy(f, target)
for name in ('room-worlds-core.js', 'enchanted-room.js', 'enchanted-room.css'):
    asset = here.parent / name
    target = out / name
    if asset.resolve() != target.resolve():
        shutil.copy(asset, target)

# Offline copy list + a version stamp that changes whenever any of these files change.
shell = ['./', 'index.html', 'stage.css', 'stage.js', 'dc-runtime.js', 'pwa.js', 'manifest.webmanifest',
         'vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'fonts/fonts.css',
         'room-worlds-core.js', 'enchanted-room.js', 'enchanted-room.css']
shell += sorted('fonts/' + f.name for f in (out / 'fonts').glob('*.woff2'))
shell += ['icons/icon.svg', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png']
h = hashlib.sha256()
for f in shell[1:]:
    h.update(f.encode()); h.update((out / f).read_bytes())
version = h.hexdigest()[:12]
sw = (here / 'sw.js').read_text(encoding='utf-8').replace("'__VERSION__'", json.dumps(version)).replace('__SHELL__', json.dumps(shell, indent=2))
(out / 'sw.js').write_text(sw, encoding='utf-8')
print('built', out / 'index.html', len(page), 'bytes · app version', version)
