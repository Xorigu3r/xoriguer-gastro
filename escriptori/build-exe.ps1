# Compila Xoriguer Gastro per a Windows: proves + PyInstaller (carpeta) + instal·lador Inno Setup.
# Ús: powershell -ExecutionPolicy Bypass -File escriptori\build-exe.ps1
$ErrorActionPreference = 'Stop'
$arrel = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $arrel
$build = Join-Path $arrel 'build-escriptori'
$versio = [regex]::Match((Get-Content (Join-Path $arrel 'www\js\app.js') -Raw), "const VERSIO = '([^']+)'").Groups[1].Value
Write-Host "Xoriguer Gastro $versio"

# carpeta per versió: no topa amb un XoriguerGastro.exe de proves que estigui obert
$dist = Join-Path $build "dist-v$versio"

node test.mjs
if ($LASTEXITCODE -ne 0) { throw 'Les proves han fallat' }

py -3.12 -m PyInstaller --noconfirm --clean --windowed --name XoriguerGastro `
  --icon (Join-Path $arrel 'assets\gastro.ico') `
  --add-data "$(Join-Path $arrel 'www');www" `
  --hidden-import qrcode --hidden-import qrcode.image.pil `
  --exclude-module numpy --exclude-module tkinter --exclude-module matplotlib --exclude-module PyQt6 --exclude-module PyQt5 --exclude-module pandas `
  --distpath $dist --workpath (Join-Path $build 'work') --specpath $build `
  --log-level WARN (Join-Path $arrel 'escriptori\gastro.py')
if ($LASTEXITCODE -ne 0) { throw 'PyInstaller ha fallat' }

$iscc = Join-Path ${env:ProgramFiles(x86)} 'Inno Setup 6\ISCC.exe'
if (-not (Test-Path $iscc)) { Write-Warning "No hi ha Inno Setup 6: només s'ha creat $dist\XoriguerGastro\"; exit 0 }
& $iscc /Q "/DMyAppVersion=$versio" "/DDistDir=$dist\XoriguerGastro" (Join-Path $arrel 'escriptori\XoriguerGastro_Setup.iss')
if ($LASTEXITCODE -ne 0) { throw 'Inno Setup ha fallat' }
Write-Host "Instal·lador: $(Join-Path $arrel "XoriguerGastro_Setup_v$versio.exe")"
