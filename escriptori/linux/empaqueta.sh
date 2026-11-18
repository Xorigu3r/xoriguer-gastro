#!/usr/bin/env bash
# Empaqueta Xoriguer Gastro per a Linux: un .deb (Debian, Ubuntu, Mint…) i un .tar.gz (qualsevol distribució).
# Ús (des de l'arrel del projecte, a Linux o al WSL):  bash escriptori/linux/empaqueta.sh
# Surt a dist-linux/: xoriguer-gastro_<versió>_all.deb i XoriguerGastro-<versió>-linux.tar.gz
set -euo pipefail
ARREL="$(cd "$(dirname "$0")/../.." && pwd)"
VERSIO="$(grep -oP "const VERSIO = '\K[^']+" "$ARREL/www/js/app.js")"
SORT="$ARREL/dist-linux"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$SORT"
echo "Xoriguer Gastro $VERSIO per a Linux"

copia_app() {  # $1 = carpeta de destinació
  mkdir -p "$1"
  cp "$ARREL/escriptori/linux/xoriguer-gastro.py" "$ARREL/escriptori/nucli.py" "$1/"
  # la web, sense el que només serveix a Android
  (cd "$ARREL" && tar --exclude='www/capacitor.js' -cf - www) | tar -xf - -C "$1"
  find "$1" -type d -exec chmod 755 {} +; find "$1" -type f -exec chmod 644 {} +
  chmod 755 "$1/xoriguer-gastro.py"
  sed -i 's/\r$//' "$1/xoriguer-gastro.py" "$1/nucli.py"
}

ESCRIPTORI='[Desktop Entry]
Type=Application
Name=Xoriguer Gastro
GenericName=Escandalls i gestió de cuina
GenericName[es]=Escandallos y gestión de cocina
GenericName[fr]=Fiches de coût et gestion de cuisine
GenericName[en]=Recipe costing & kitchen management
Comment=Escandalls, al·lèrgens, compres, estoc i vendes del teu restaurant
Comment[es]=Escandallos, alérgenos, compras, stock y ventas de tu restaurante
Comment[fr]=Fiches de coût, allergènes, achats, stock et ventes de votre restaurant
Comment[en]=Recipe costing, allergens, purchasing, stock and sales for your restaurant
Exec=EXEC
Icon=ICONA
Terminal=false
Categories=Office;Finance;
Keywords=escandall;food cost;restaurant;recepta;al·lèrgens;APPCC;
StartupWMClass=Xoriguer Gastro'

# ── .deb ──────────────────────────────────────────────────────────────
D="$TMP/deb"
copia_app "$D/opt/xoriguer-gastro"
mkdir -p "$D/usr/bin" "$D/usr/share/applications" "$D/usr/share/icons/hicolor/256x256/apps" "$D/DEBIAN"
printf '#!/bin/sh\nexec python3 /opt/xoriguer-gastro/xoriguer-gastro.py "$@"\n' > "$D/usr/bin/xoriguer-gastro"
chmod 755 "$D/usr/bin/xoriguer-gastro"
echo "$ESCRIPTORI" | sed -e 's|EXEC|xoriguer-gastro|' -e 's|ICONA|xoriguer-gastro|' > "$D/usr/share/applications/xoriguer-gastro.desktop"
cp "$ARREL/assets/icona-256.png" "$D/usr/share/icons/hicolor/256x256/apps/xoriguer-gastro.png"
chmod 644 "$D/usr/share/applications/xoriguer-gastro.desktop" "$D/usr/share/icons/hicolor/256x256/apps/xoriguer-gastro.png"
MIDA="$(du -sk "$D" | cut -f1)"
cat > "$D/DEBIAN/control" <<EOF
Package: xoriguer-gastro
Version: $VERSIO
Section: misc
Priority: optional
Architecture: all
Depends: python3 (>= 3.8), xdg-utils
Recommends: chromium | chromium-browser | google-chrome-stable | microsoft-edge-stable | brave-browser
Suggests: python3-qrcode
Installed-Size: $MIDA
Maintainer: Xoriguer <xoriguer.dev>
Homepage: https://xoriguer.dev/
Description: Escandalls i gestió de cuina per a bars i restaurants
 Xoriguer Gastro calcula el cost de cada plat (amb sub-receptes), els al·lèrgens
 i la nutrició, porta les compres, l'estoc, l'inventari, les comandes i les vendes,
 i fa la carta, el menú del dia, l'enginyeria de menú i l'APPCC. En 4 idiomes.
 Les dades es desen a ~/.local/share/XoriguerGastro.
EOF
cat > "$D/DEBIAN/postinst" <<'EOF'
#!/bin/sh
set -e
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q /usr/share/applications || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q -t /usr/share/icons/hicolor || true
exit 0
EOF
chmod 755 "$D/DEBIAN/postinst"
DEB="$SORT/xoriguer-gastro_${VERSIO}_all.deb"
dpkg-deb --root-owner-group --build "$D" "$DEB" >/dev/null
echo "  $DEB"

# ── .tar.gz (sense instal·lar res al sistema) ─────────────────────────
T="$TMP/XoriguerGastro"
copia_app "$T"
cp "$ARREL/assets/icona-256.png" "$T/icona.png"
cat > "$T/xoriguer-gastro" <<'EOF'
#!/bin/sh
# Obre Xoriguer Gastro (cal Python 3). Les dades es desen a ~/.local/share/XoriguerGastro
cd "$(dirname "$0")" && exec python3 ./xoriguer-gastro.py "$@"
EOF
echo "$ESCRIPTORI" | sed -e 's|ICONA|xoriguer-gastro|' > "$T/xoriguer-gastro.desktop.in"
cat > "$T/instal-la.sh" <<'EOF'
#!/bin/sh
# Instal·la Xoriguer Gastro per a l'usuari actual (sense permisos d'administrador) i el posa al menú d'aplicacions.
set -e
ORIGEN="$(cd "$(dirname "$0")" && pwd)"
DESTI="${XDG_DATA_HOME:-$HOME/.local/share}/xoriguer-gastro-app"
APPS="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONES="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/256x256/apps"
mkdir -p "$DESTI" "$APPS" "$ICONES"
cp -r "$ORIGEN"/. "$DESTI/"
cp "$DESTI/icona.png" "$ICONES/xoriguer-gastro.png"
sed "s|EXEC|\"$DESTI/xoriguer-gastro\"|" "$DESTI/xoriguer-gastro.desktop.in" > "$APPS/xoriguer-gastro.desktop"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q "$APPS" || true
echo "Fet: Xoriguer Gastro és al menú d'aplicacions (desinstal·lar: esborra $DESTI i $APPS/xoriguer-gastro.desktop)."
EOF
cat > "$T/LLEGEIX-ME.txt" <<EOF
Xoriguer Gastro $VERSIO · Escandalls i gestió de cuina — per a Linux

Cal Python 3 (ja hi és a gairebé totes les distribucions) i, per tenir-lo en una finestra pròpia, Chromium,
Google Chrome, Microsoft Edge o Brave. Si no n'hi ha cap, s'obre al navegador per defecte.

  ./xoriguer-gastro     l'obre directament des d'aquesta carpeta
  ./instal-la.sh        el posa al menú d'aplicacions (per a l'usuari actual)

A Debian, Ubuntu i Mint també pots fer servir el paquet xoriguer-gastro_${VERSIO}_all.deb.
Les dades es desen a ~/.local/share/XoriguerGastro (amb una còpia automàtica cada dia, es guarden 30 dies).
Més informació: https://xoriguer.dev/
EOF
chmod 755 "$T/xoriguer-gastro" "$T/instal-la.sh"
TGZ="$SORT/XoriguerGastro-${VERSIO}-linux.tar.gz"
tar -C "$TMP" --owner=0 --group=0 -czf "$TGZ" XoriguerGastro
echo "  $TGZ"
