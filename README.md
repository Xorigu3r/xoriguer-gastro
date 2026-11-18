# Xoriguer Gastro · Escandalls i gestió de cuina

Programa per a bars i restaurants: escandalls amb sub-receptes, al·lèrgens (Reglament UE 1169/2011) i nutrició,
compres i albarans que actualitzen preus i estoc, inventari, mermes, comandes per proveïdor (WhatsApp / correu),
producció per partides, vendes (entrada ràpida, Xoriguer TPV o CSV), enginyeria de menú, **food cost real comparat
amb el teòric**, simulador de preus, compte de resultats, carta imprimible, carta digital amb QR, menú del dia amb
costos i APPCC. Base de ~70 plats i 124 ingredients amb preus orientatius. En català, castellà, francès i anglès.

Baixades: **https://xoriguer.dev/**

| Plataforma | Paquet | Com es fa |
|---|---|---|
| Windows 10/11 | `XoriguerGastro_Setup_v<versió>.exe` | `powershell -ExecutionPolicy Bypass -File escriptori\build-exe.ps1` (pywebview + WebView2, PyInstaller, Inno Setup) |
| Linux | `xoriguer-gastro_<versió>_all.deb` i `XoriguerGastro-<versió>-linux.tar.gz` | `bash escriptori/linux/empaqueta.sh` (només cal Python 3; s'obre en una finestra de Chromium/Chrome/Edge/Brave) |
| Android (tauletes) | `XoriguerGastro.apk` | `npm install` i `npm run apk` (Capacitor 8; JDK 21 i SDK a `~/android-tools`) |

## Estructura
```
www/                 la interfície (HTML, CSS i JavaScript sense dependències), la mateixa a totes les plataformes
  js/logica.js       càlculs: costos, al·lèrgens, nutrició, estoc, anàlisi (es prova amb `node test.mjs`)
  js/base.js         base d'ingredients (4 idiomes, preus orientatius)
  js/plats.js        base de plats i elaboracions amb escandall
  js/dades.js        desat i ponts amb cada plataforma
  manual/            manual i guia de posada en marxa (4 idiomes, amb captures)
escriptori/          nucli.py (dades comunes), gastro.py (Windows), linux/ (servidor local i empaquetat)
android/             projecte Capacitor (impressió nativa a MainActivity)
eines/               icones, captures de la guia, textos per traduir
```

Dades: Windows `%APPDATA%\XoriguerGastro`, Linux `~/.local/share/XoriguerGastro` (amb una còpia automàtica cada dia),
Android dins de l'app. Les dades no surten mai de l'ordinador o la tauleta.

Proves: `node test.mjs`. Servidor de proves sense memòria cau: `python -I eines/serve.py 8799`.
