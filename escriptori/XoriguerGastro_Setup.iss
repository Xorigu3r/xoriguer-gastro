; ============================================================
; Inno Setup - Xoriguer Gastro (Windows). Es compila amb escriptori\build-exe.ps1.
; AppId de l'antic «Raconet Gastronomia» / Xoriguer Gastro 2: s'instal·la a sobre.
; Les dades (%APPDATA%\XoriguerGastro) no s'esborren en desinstal·lar.
; ============================================================
#ifndef MyAppVersion
  #define MyAppVersion "3.4"
#endif
#ifndef DistDir
  #define DistDir "..\build-escriptori\dist\XoriguerGastro"
#endif
#define MyAppName "Xoriguer Gastro"
#define MyAppPublisher "Xoriguer"
#define MyAppExeName "XoriguerGastro.exe"

[Setup]
AppId={{B7A3C2F1-4E8D-4A9B-8C3D-1F2E5A6B7C8D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\XoriguerGastro
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..
OutputBaseFilename=XoriguerGastro_Setup_v{#MyAppVersion}
SetupIconFile=..\assets\gastro.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
CloseApplications=yes
VersionInfoVersion={#MyAppVersion}.0.0
VersionInfoDescription={#MyAppName} · Escandalls i gestió de cuina
AppComments={cm:Lema}

[Languages]
Name: "catalan"; MessagesFile: "compiler:Languages\Catalan.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
catalan.Lema=Escandalls i gestió de cuina
spanish.Lema=Escandallos y gestión de cocina
french.Lema=Fiches de coût et gestion de cuisine
english.Lema=Recipe costing & kitchen management
catalan.Icona=Crea una icona a l'escriptori
spanish.Icona=Crear un icono en el escritorio
french.Icona=Créer une icône sur le bureau
english.Icona=Create a desktop icon
catalan.Obre=Obre {#MyAppName}
spanish.Obre=Abrir {#MyAppName}
french.Obre=Ouvrir {#MyAppName}
english.Obre=Open {#MyAppName}

[Tasks]
Name: "desktopicon"; Description: "{cm:Icona}"

[InstallDelete]
; restes de versions anteriors (Raconet / Xoriguer Gastro 2 amb PyQt)
Type: files; Name: "{app}\Raconet_Gastronomia.exe"
Type: filesandordirs; Name: "{app}\_internal"
Type: files; Name: "{autodesktop}\Raconet Gastronomia.lnk"
Type: files; Name: "{group}\Raconet Gastronomia.lnk"

[Files]
Source: "{#DistDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Comment: "{cm:Lema}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Comment: "{cm:Lema}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:Obre}"; Flags: nowait postinstall skipifsilent
