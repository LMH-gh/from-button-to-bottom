import sys,os
from playwright.sync_api import sync_playwright
# usage: render2.py <dir> start end
d=sys.argv[1];a,bnd=int(sys.argv[2]),int(sys.argv[3]);FPS=30
import os;os.makedirs(f'{d}/frames',exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    pg.goto(f'http://localhost:{os.environ.get("PORT","8766")}/{d}/index.html');pg.wait_for_function('window.ready===true',timeout=60000);pg.evaluate('document.fonts.ready')
    for i in range(a,bnd):
        if os.path.exists(f'{d}/frames/f{i:04d}.jpg'): continue
        pg.evaluate(f'renderFrame({i/FPS})')
        pg.screenshot(path=f'{d}/frames/f{i:04d}.jpg',type='jpeg',quality=93)
    b.close()
