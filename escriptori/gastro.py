"""Xoriguer Gastro per a Windows: la web de www/ dins una finestra pròpia (pywebview + WebView2 d'Edge).

Dades i API comuna: nucli.py (%APPDATA%\\XoriguerGastro\\dades.json, còpies diàries).
API per a la web (window.pywebview.api): la de nucli.ApiBase + desa_fitxer, obre_fitxer, carpeta, titol, obre_guia, obre.
Compilar: escriptori\\build-exe.ps1
"""
import ctypes
import os
import socket
from pathlib import Path

import webview

from nucli import ApiBase, DADES, TITOL, WWW, versio

PORT = 47833
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'


def missatge(text):
    ctypes.windll.user32.MessageBoxW(None, text, TITOL, 0x40)


def port_lliure(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('127.0.0.1', port))
            return True
        except OSError:
            return False


def finestra():
    return webview.windows[0]


class Api(ApiBase):
    def carpeta(self):
        DADES.mkdir(parents=True, exist_ok=True)
        os.startfile(str(DADES))
        return True

    def desa_fitxer(self, nom, text, tipus='JSON'):
        tipus_f = {'CSV': ('CSV (*.csv)', 'Tots els fitxers (*.*)'), 'JSON': ('JSON (*.json)', 'Tots els fitxers (*.*)'),
                   'HTML': ('Pàgina web (*.html)', 'Tots els fitxers (*.*)')}.get(tipus, ('Tots els fitxers (*.*)',))
        res = finestra().create_file_dialog(webview.FileDialog.SAVE, save_filename=nom, file_types=tipus_f,
                                            directory=str(Path.home() / 'Documents'))
        if not res:
            return ''
        cami = res if isinstance(res, str) else res[0]
        Path(cami).write_text(text, encoding='utf-8')
        return cami

    def obre_fitxer(self, accept=''):
        tipus = ('Fitxers (*.json;*.csv;*.txt)', 'Tots els fitxers (*.*)')
        res = finestra().create_file_dialog(webview.FileDialog.OPEN, file_types=tipus, directory=str(Path.home() / 'Documents'))
        if not res:
            return ''
        cami = Path(res[0] if isinstance(res, (list, tuple)) else res)
        dades = cami.read_bytes()
        for cod in ('utf-8-sig', 'cp1252'):
            try:
                return dades.decode(cod)
            except UnicodeDecodeError:
                continue
        return dades.decode('utf-8', 'replace')

    def titol(self, text):
        """Títol de la finestra en l'idioma de la interfície («Xoriguer Gastro · Escandalls i gestió de cuina»)."""
        text = str(text)[:90]
        if text.startswith(TITOL):
            finestra().set_title(text)
        return True

    def obre_guia(self, nom):
        """Obre la guia o el manual (www/manual/<nom>.html) al navegador del sistema."""
        if not self.nom_guia(nom):
            return False
        cami = WWW / 'manual' / f'{nom}.html'
        if cami.exists():
            os.startfile(str(cami))
        return True

    def obre(self, url):
        if url.lower().startswith(('https://', 'mailto:')):
            os.startfile(url)
        return True


def neteja_memoria_cau():
    """En canviar de versió, esborra la memòria cau del WebView2 (si no, mostraria l'HTML/JS/CSS antics).
    No toca el localStorage ni les dades."""
    import shutil
    v = versio()
    if not v:
        return
    marca = DADES / 'webview' / 'versio.txt'
    try:
        if marca.exists() and marca.read_text(encoding='utf-8').strip() == v:
            return
        perfil = DADES / 'webview' / 'EBWebView' / 'Default'
        for nom in ('Cache', 'Code Cache', 'GPUCache', 'Service Worker'):
            shutil.rmtree(perfil / nom, ignore_errors=True)
        marca.parent.mkdir(parents=True, exist_ok=True)
        marca.write_text(v, encoding='utf-8')
    except Exception:
        pass


def main():
    try:
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID('cat.xoriguer.gastro')
    except Exception:
        pass
    if not port_lliure(PORT):
        missatge('Xoriguer Gastro ja està obert.')
        return
    DADES.mkdir(parents=True, exist_ok=True)
    neteja_memoria_cau()
    user32 = ctypes.windll.user32
    w, h = user32.GetSystemMetrics(0), user32.GetSystemMetrics(1)
    webview.create_window(TITOL, url=str(WWW / 'index.html'), js_api=Api(), width=min(1440, int(w * 0.92)), height=min(920, int(h * 0.9)),
                          min_size=(980, 640), background_color='#1E2A3B', text_select=True, zoomable=True, http_port=PORT,
                          maximized=w < 1400)
    webview.start(gui='edgechromium', http_server=True, http_port=PORT, private_mode=False,
                  storage_path=str(DADES / 'webview'), user_agent=UA + ' XoriguerEscriptori')


if __name__ == '__main__':
    main()
