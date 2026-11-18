"""Fa les captures de la guia (www/manual/img/<ll>/*.webp) amb el mateix motor del programa (WebView2).
Cal el servidor de proves engegat:  python -I eines/serve.py 8799
Ús:  py -3.12 eines/captures.py [ca es fr en]
"""
import ctypes
import ctypes.wintypes as wt
import sys
import threading
import time
from pathlib import Path

import webview
from PIL import Image

ARREL = Path(__file__).resolve().parent.parent
SORTIDA = ARREL / 'www' / 'manual' / 'img'
BASE = 'http://localhost:8799/'
AMPLE, ALT = 1360, 820
TITOL = 'Xoriguer Gastro captures'

# nom de la imatge → (ruta, acció, espera en s)
CAPTURES = [
    ('01-benvinguda', 'benvinguda', '', 1.2),
    ('02-ajustos', 'ajustos', '', 1.0),
    ('03-proveidors', 'proveidors', '', 1.0),
    ('04-base-ingredients', 'ingredients', 'baseIng', 1.4),
    ('05-ingredient', 'ingredients/i2', '', 1.3),
    ('06-base-plats', 'receptes', 'basePlats', 1.4),
    ('07-escandall', 'receptes/r2', '', 1.3),
    ('08-receptes', 'receptes', '', 1.0),
    ('09-compra', 'compres', 'novaCompra', 1.3),
    ('10-inventari', 'estoc/inventari', '', 1.0),
    ('11-comandes', 'comandes', '', 1.0),
    ('12-vendes', 'vendes', '', 1.2),
    ('13-tauler', 'tauler', '', 1.3),
    ('14-enginyeria', 'analisi', '', 1.4),
    ('15-carta', 'carta', '', 1.3),
    ('16-menu', 'carta/menu', '', 1.2),
    ('17-produccio', 'produccio', 'prod', 1.2),
    ('18-appcc', 'appcc', 'appcc', 1.2),
    ('19-paleta', 'receptes', 'paleta', 1.2),
]

u32 = ctypes.windll.user32
u32.SetProcessDPIAware()


def captura(hwnd, desti):
    r = wt.RECT()
    u32.GetClientRect(hwnd, ctypes.byref(r))
    w, h = r.right, r.bottom
    gdi = ctypes.windll.gdi32
    hdc = u32.GetDC(hwnd)
    mem = gdi.CreateCompatibleDC(hdc)
    bmp = gdi.CreateCompatibleBitmap(hdc, w, h)
    gdi.SelectObject(mem, bmp)
    u32.PrintWindow(hwnd, mem, 3)  # PW_CLIENTONLY | PW_RENDERFULLCONTENT

    class BIH(ctypes.Structure):
        _fields_ = [('biSize', wt.DWORD), ('biWidth', wt.LONG), ('biHeight', wt.LONG), ('biPlanes', wt.WORD), ('biBitCount', wt.WORD),
                    ('biCompression', wt.DWORD), ('biSizeImage', wt.DWORD), ('biXPelsPerMeter', wt.LONG), ('biYPelsPerMeter', wt.LONG),
                    ('biClrUsed', wt.DWORD), ('biClrImportant', wt.DWORD)]
    bi = BIH(ctypes.sizeof(BIH), w, -h, 1, 32, 0, 0, 0, 0, 0, 0)
    buf = ctypes.create_string_buffer(w * h * 4)
    gdi.GetDIBits(mem, bmp, 0, h, buf, ctypes.byref(bi), 0)
    img = Image.frombuffer('RGBA', (w, h), buf, 'raw', 'BGRA', 0, 1).convert('RGB')
    gdi.DeleteObject(bmp); gdi.DeleteDC(mem); u32.ReleaseDC(hwnd, hdc)
    if img.width > 1280:
        img = img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS)
    desti.parent.mkdir(parents=True, exist_ok=True)
    img.save(desti, 'WEBP', quality=80, method=6)


def de_aquest_proces():
    """La finestra visible més gran d'aquest procés (el títol el pot canviar la pàgina)."""
    import os
    trobades = []
    CB = ctypes.WINFUNCTYPE(wt.BOOL, wt.HWND, wt.LPARAM)

    def cb(h, _):
        pid = wt.DWORD()
        u32.GetWindowThreadProcessId(h, ctypes.byref(pid))
        r = wt.RECT()
        if pid.value == os.getpid() and u32.IsWindowVisible(h) and u32.GetClientRect(h, ctypes.byref(r)):
            trobades.append((r.right * r.bottom, h))
        return True
    u32.EnumWindows(CB(cb), 0)
    return max(trobades)[1] if trobades else 0


def finestra():
    for _ in range(40):
        hwnd = u32.FindWindowW(None, TITOL) or de_aquest_proces()
        r = wt.RECT()
        if hwnd and u32.GetClientRect(hwnd, ctypes.byref(r)) and r.right > 100:
            return hwnd
        time.sleep(0.25)
    raise RuntimeError('No trobo la finestra')


def feina(win, llengues):
    try:
        time.sleep(1.5)
        for ll in llengues:
            for nom, ruta, accio, espera in CAPTURES:
                url = f'{BASE}?captura={ll}&ruta={ruta}' + (f'&accio={accio}' if accio else '') + f'&t={time.time()}#/{ruta}'
                win.load_url(url)
                time.sleep(espera + 0.8)
                captura(finestra(), SORTIDA / ll / f'{nom}.webp')
                print(ll, nom, flush=True)
    finally:
        win.destroy()


if __name__ == '__main__':
    llengues = sys.argv[1:] or ['ca', 'es', 'fr', 'en']
    w = webview.create_window(TITOL, BASE + '?captura=ca', width=AMPLE, height=ALT, resizable=False)
    webview.start(feina, (w, llengues), private_mode=True)
