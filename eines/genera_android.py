"""Imatges per a l'APK (les fa servir `npm run icons` amb @capacitor/assets): icona, icona adaptativa i pantalla d'inici.
Ús: python -I eines/genera_android.py   (des de l'arrel del projecte)"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from genera_logo import ASSETS, FONS, dibuixa  # noqa: E402

ASSETS.mkdir(exist_ok=True)
# Icona normal: motiu sobre el fons blau pissarra, quadrada (Android la retalla)
dibuixa(1024, rodo=False).convert('RGB').save(ASSETS / 'icon-only.png')
# Adaptativa: el motiu dins la zona segura (~62 %) sobre fons transparent + el fons a part
fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
fg.alpha_composite(dibuixa(640, amb_fons=False), (192, 182))
fg.save(ASSETS / 'icon-foreground.png')
Image.new('RGBA', (1024, 1024), FONS).save(ASSETS / 'icon-background.png')
# Pantalla d'inici (també fosca: el mateix blau, mai negre)
sp = Image.new('RGBA', (2732, 2732), FONS)
sp.alpha_composite(dibuixa(760, amb_fons=False), (986, 936))
sp.convert('RGB').save(ASSETS / 'splash.png')
sp.convert('RGB').save(ASSETS / 'splash-dark.png')
print('Fet: icon-only, icon-foreground, icon-background, splash, splash-dark')
