"""Genera la icona i el rètol de Xoriguer Gastro (campana de plat).

Ús:  python -I eines/genera_logo.py   (des de l'arrel del projecte)
Fons: paleta «Blau pissarra» (#1E2A3B), mai negre. Sense falcó (com Receptes).
Surt:  assets/gastro.ico, assets/icona-256.png, assets/rotul.png (capçalera de l'app)
"""
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ARREL = Path(__file__).resolve().parent.parent
ASSETS = ARREL / 'assets'
sys.path.insert(0, str(Path('C:/Users/Xorigu3r/Documents/LOGOS-XORIGUER/_eines')))
sys.path.insert(0, str(Path('C:/Users/Xorigu3r/Documents/LOGOS-XORIGUER/_eines/tk')))
try:
    import marca  # noqa: E402
    import fes_rotul  # noqa: E402
except Exception as e:  # pragma: no cover
    print('Sense marca:', e)
    marca = fes_rotul = None

FONS = (30, 42, 59, 255)
CREMA = (246, 239, 226, 255)
TARONJA = (255, 168, 46, 255)
TARONJA_FOSC = (242, 101, 15, 255)
S = 4


def degradat(N, c1, c2, y0, y1):
    g = Image.new('RGBA', (1, N))
    for y in range(N):
        t = min(1, max(0, (y - y0) / max(1, y1 - y0)))
        g.putpixel((0, y), tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(4)))
    return g.resize((N, N))


def dibuixa(mida, amb_fons=True, rodo=True):
    N = 512 * S
    k = S
    capa = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    # halo taronja suau
    g = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse([90 * k, 120 * k, 422 * k, 420 * k], fill=TARONJA[:3] + (70,))
    capa.alpha_composite(g.filter(ImageFilter.GaussianBlur(46 * k)))
    # campana (mitja el·lipse) amb degradat
    m = Image.new('L', (N, N), 0)
    ImageDraw.Draw(m).pieslice([104 * k, 150 * k, 408 * k, 454 * k], 180, 360, fill=255)
    capa.paste(degradat(N, TARONJA, TARONJA_FOSC, 150 * k, 302 * k), (0, 0), m)
    d = ImageDraw.Draw(capa)
    d.arc([104 * k, 150 * k, 408 * k, 454 * k], 180, 360, fill=CREMA, width=7 * k)
    # pom
    d.ellipse([234 * k, 112 * k, 278 * k, 156 * k], fill=CREMA)
    d.rounded_rectangle([248 * k, 146 * k, 264 * k, 160 * k], radius=3 * k, fill=CREMA)
    # reflex
    d.arc([140 * k, 186 * k, 372 * k, 418 * k], 205, 245, fill=(255, 236, 205, 210), width=10 * k)
    # plata
    d.rounded_rectangle([70 * k, 300 * k, 442 * k, 326 * k], radius=13 * k, fill=CREMA)
    d.rounded_rectangle([150 * k, 334 * k, 362 * k, 350 * k], radius=8 * k, fill=(246, 239, 226, 150))
    # fum (tres ondes)
    for x0 in (206, 256, 306):
        pts = [((x0 + 8 * math.sin(t * math.pi * 2)) * k, (96 - 46 * t) * k) for t in (i / 24 for i in range(25))]
        d.line(pts, fill=(246, 239, 226, 190), width=7 * k, joint='curve')
    # baixa una mica el motiu per centrar-lo
    motiu = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    motiu.alpha_composite(capa, (0, 40 * k))
    im = Image.new('RGBA', (N, N), FONS if amb_fons else (0, 0, 0, 0))
    im.alpha_composite(motiu)
    if rodo and amb_fons:
        mk = Image.new('L', (N, N), 0)
        ImageDraw.Draw(mk).rounded_rectangle([0, 0, N - 1, N - 1], radius=N // 5, fill=255)
        im.putalpha(mk)
    return im.resize((mida, mida), Image.LANCZOS)


if __name__ == '__main__':
    ASSETS.mkdir(exist_ok=True)
    dibuixa(256).save(ASSETS / 'gastro.ico',
                      sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    dibuixa(256).save(ASSETS / 'icona-256.png')
    dibuixa(128, amb_fons=False).save(ASSETS / 'simbol-128.png')
    # marca de les caselles (QCheckBox) en crema sobre taronja
    ck = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    ImageDraw.Draw(ck).line([(14, 33), (27, 46), (51, 18)], fill=(42, 20, 0, 255), width=8, joint='curve')
    ck.resize((16, 16), Image.LANCZOS).save(ASSETS / 'check.png')
    if fes_rotul:
        fes_rotul.rotul('GASTRO', 30, 'fosc').save(ASSETS / 'rotul.png')
    if marca:
        im = Image.new('RGBA', (1024, 1024), FONS)
        im.alpha_composite(dibuixa(700, amb_fons=False), (162, 20))
        marca.enganxa(im, marca.rotul('XORIGUER', 'GASTRO', amplada=760), 512, 760)
        im.convert('RGB').save(ASSETS / 'logo-complet.png')
    print('Fet:', sorted(p.name for p in ASSETS.iterdir()))
