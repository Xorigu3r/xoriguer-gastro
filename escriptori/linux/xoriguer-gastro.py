#!/usr/bin/env python3
"""Xoriguer Gastro per a Linux.

Només fa servir Python 3 (ja ve amb totes les distribucions): un servidor local a 127.0.0.1:47833 serveix la web de www/
i l'API de dades (nucli.py) a /api/<mètode>. La interfície s'obre en una finestra d'aplicació de Chromium / Chrome / Edge /
Brave (--app, amb un perfil propi) o, si no n'hi ha cap, al navegador per defecte.
Dades: ~/.local/share/XoriguerGastro/dades.json (o $XDG_DATA_HOME), amb còpies diàries.

Seguretat: només escolta a 127.0.0.1 i l'API demana un testimoni aleatori que només rep la pàgina del programa
(cap altra web oberta al navegador pot llegir ni canviar les dades).
"""
import json
import os
import secrets
import shutil
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

AQUI = Path(__file__).resolve().parent
for c in (AQUI, AQUI.parent):  # instal·lat (/opt/xoriguer-gastro) o des del codi (escriptori/linux)
    if (c / 'nucli.py').exists():
        sys.path.insert(0, str(c))
        break
import nucli  # noqa: E402

if not nucli.WWW.exists():  # instal·lat: www/ al costat
    nucli.WWW = AQUI / 'www'
PORT = 47833
URL = f'http://127.0.0.1:{PORT}/'
TESTIMONI = secrets.token_urlsafe(24)
ULTIM = [time.time(), False]  # últim senyal de vida de la pàgina, i si n'ha arribat algun


class Api(nucli.ApiBase):
    def carpeta(self):
        nucli.DADES.mkdir(parents=True, exist_ok=True)
        subprocess.Popen(['xdg-open', str(nucli.DADES)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True

    def obre(self, url):
        if str(url).lower().startswith(('https://', 'mailto:')):
            webbrowser.open(url)
        return True

    def obre_guia(self, nom):
        if self.nom_guia(nom):
            webbrowser.open(f'{URL}manual/{nom}.html')
        return True

    def titol(self, text):
        return True

    def ping(self):
        return True


API = Api()
PUBLICS = {'carrega', 'desa', 'copies', 'llegeix_copia', 'info', 'raconet', 'tpv_disponible', 'tpv_vendes', 'qr',
           'carpeta', 'obre', 'obre_guia', 'titol', 'ping'}


class Gestor(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(nucli.WWW), **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')  # sempre la versió instal·lada
        super().end_headers()

    def do_GET(self):
        if self.path.split('?')[0] in ('/', '/index.html'):
            html = (nucli.WWW / 'index.html').read_text(encoding='utf-8')
            html = html.replace('<head>', f'<head><meta name="xg-api" content="{TESTIMONI}">', 1)
            cos = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(cos)))
            self.end_headers()
            self.wfile.write(cos)
            return
        super().do_GET()

    def do_POST(self):
        nom = self.path.split('?')[0].rsplit('/', 1)[-1]
        if not self.path.startswith('/api/') or nom not in PUBLICS:
            return self.send_error(404)
        if self.headers.get('X-XG-Testimoni') != TESTIMONI:
            return self.send_error(403)
        try:
            n = int(self.headers.get('Content-Length') or 0)
            args = json.loads(self.rfile.read(n) or b'[]') if n else []
            ULTIM[0], ULTIM[1] = time.time(), True
            res = getattr(API, nom)(*args)
            cos, codi = json.dumps(res).encode('utf-8'), 200
        except Exception as e:  # el missatge torna a la web, que l'ensenya
            cos, codi = json.dumps({'error': str(e)}).encode('utf-8'), 500
        self.send_response(codi)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(cos)))
        self.end_headers()
        self.wfile.write(cos)


def ja_obert():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex(('127.0.0.1', PORT)) == 0


def obre_finestra():
    """Finestra d'aplicació (sense barres del navegador) amb un perfil propi. Torna el procés si l'hem pogut seguir."""
    perfil = nucli.DADES / 'navegador'
    for nav in ('chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', 'microsoft-edge', 'microsoft-edge-stable',
                'brave-browser', 'vivaldi'):
        cami = shutil.which(nav)
        if cami:
            return subprocess.Popen([cami, f'--app={URL}', f'--user-data-dir={perfil}', '--no-first-run', '--no-default-browser-check',
                                     '--window-size=1400,900', f'--class={nucli.TITOL}'],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    webbrowser.open(URL)
    return None


def main():
    if '--versio' in sys.argv:
        print(nucli.versio())
        return
    if ja_obert():  # ja funciona: només cal obrir-ne la finestra
        obre_finestra()
        return
    nucli.DADES.mkdir(parents=True, exist_ok=True)
    srv = ThreadingHTTPServer(('127.0.0.1', PORT), Gestor)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    if '--servidor' in sys.argv:  # sense finestra (proves)
        print(f'Xoriguer Gastro {nucli.versio()} a {URL}', flush=True)
        srv_espera = threading.Event()
        try:
            srv_espera.wait()
        except KeyboardInterrupt:
            pass
        return
    proc = obre_finestra()
    try:
        if proc is not None:
            proc.wait()  # normalment, quan es tanca la finestra
        # Si el navegador ha passat la finestra a un altre procés (snap, navegador per defecte...), seguim mentre la
        # pàgina doni senyals de vida (n'envia un cada 20 s).
        while True:
            time.sleep(5)
            quiet = time.time() - ULTIM[0]
            if (ULTIM[1] and quiet > 75) or (not ULTIM[1] and quiet > 600):
                break
    except KeyboardInterrupt:
        pass
    srv.shutdown()


if __name__ == '__main__':
    main()
