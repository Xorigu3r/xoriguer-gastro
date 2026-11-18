"""Xoriguer Gastro — part comuna de l'escriptori (Windows i Linux): fitxer de dades, còpies, Raconet/TPV i QR.

Dades:  Windows  %APPDATA%\\XoriguerGastro\\dades.json
        Linux    $XDG_DATA_HOME/XoriguerGastro/dades.json  (per defecte ~/.local/share/XoriguerGastro)
Desat atòmic i una còpia per dia a copies/ (es guarden les 30 últimes).
"""
import base64
import io
import json
import os
import sqlite3
import sys
from datetime import date
from pathlib import Path

TITOL = 'Xoriguer Gastro'
BASE = Path(getattr(sys, '_MEIPASS', Path(__file__).resolve().parent.parent))
WWW = BASE / 'www'
if os.name == 'nt':
    DADES = Path(os.environ.get('APPDATA', Path.home())) / 'XoriguerGastro'
else:
    DADES = Path(os.environ.get('XDG_DATA_HOME') or (Path.home() / '.local' / 'share')) / 'XoriguerGastro'
FITXER = DADES / 'dades.json'
COPIES = DADES / 'copies'
TPV = Path.home() / '.tpv_bar'


def versio():
    import re
    try:
        return re.search(r"const VERSIO = '([^']+)'", (WWW / 'js' / 'app.js').read_text(encoding='utf-8')).group(1)
    except Exception:
        return ''


class ApiBase:
    """Mètodes que crida la web (window.pywebview.api a Windows, /api/<mètode> a Linux)."""

    # ── Dades ──────────────────────────────────────────────────────────────
    def carrega(self):
        if FITXER.exists():
            return FITXER.read_text(encoding='utf-8')
        return ''

    def desa(self, text):
        """Desat atòmic + una còpia per dia."""
        json.loads(text)  # no desis mai res que no sigui JSON vàlid
        DADES.mkdir(parents=True, exist_ok=True)
        tmp = FITXER.with_suffix('.tmp')
        tmp.write_text(text, encoding='utf-8')
        os.replace(tmp, FITXER)
        COPIES.mkdir(exist_ok=True)
        avui = COPIES / f'dades_{date.today().isoformat()}.json'
        if not avui.exists():
            avui.write_text(text, encoding='utf-8')
            for vell in sorted(COPIES.glob('dades_*.json'))[:-30]:
                vell.unlink()
        return True

    def copies(self):
        if not COPIES.exists():
            return []
        return [p.name for p in sorted(COPIES.glob('dades_*.json'), reverse=True)]

    def llegeix_copia(self, nom):
        p = (COPIES / Path(nom).name)
        return p.read_text(encoding='utf-8') if p.exists() else ''

    def info(self):
        return {'dades': str(FITXER), 'copies': str(COPIES)}

    # ── Raconet / TPV (només lectura) ────────────────────────────────────
    def raconet(self):
        p = TPV / 'raconet_gestio.json'
        return p.read_text(encoding='utf-8') if p.exists() else ''

    def tpv_disponible(self):
        return (TPV / 'tpv.db').exists()

    def tpv_vendes(self, dia):
        """[[nom producte, unitats]] d'un dia, llegit de la BD del TPV en mode només lectura."""
        db = TPV / 'tpv.db'
        if not db.exists():
            return []
        con = sqlite3.connect(f'file:{db}?mode=ro', uri=True)
        try:
            files = con.execute(
                'SELECT lv.producte_nom, SUM(lv.quantitat) FROM linies_venda lv JOIN vendes v ON v.id = lv.venda_id '
                'WHERE v.data = ? GROUP BY lv.producte_nom', (dia,)).fetchall()
            return [[n, float(q)] for n, q in files if n and q and q > 0]
        except sqlite3.Error:
            return []
        finally:
            con.close()

    # ── Altres ───────────────────────────────────────────────────────────
    def qr(self, text):
        """PNG en data: URL (si no hi ha el mòdul qrcode, la web el fa ella mateixa)."""
        try:
            import qrcode
        except ImportError:
            return ''
        img = qrcode.make(text, box_size=10, border=2)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')

    @staticmethod
    def nom_guia(nom):
        import re
        return bool(re.fullmatch(r'(guia|manual)_(ca|es|fr|en)', str(nom)))
