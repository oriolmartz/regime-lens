# Windows setup notes

## If `npm` is not recognized

Install Node.js LTS or use the portable ZIP option.

Portable option:

```powershell
mkdir $env:USERPROFILE\tools -Force
$NodeVersion = "v24.18.0"
$NodeZip = "$env:TEMP\node-$NodeVersion-win-x64.zip"
$NodeUrl = "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-win-x64.zip"
$NodeInstallDir = "$env:USERPROFILE\tools"
Invoke-WebRequest -Uri $NodeUrl -OutFile $NodeZip
Expand-Archive -Path $NodeZip -DestinationPath $NodeInstallDir -Force
$NodePath = "$NodeInstallDir\node-$NodeVersion-win-x64"
$env:Path = "$NodePath;$env:Path"
node -v
npm -v
```

To make it persistent:

```powershell
[Environment]::SetEnvironmentVariable(
  "Path",
  "$NodePath;" + [Environment]::GetEnvironmentVariable("Path", "User"),
  "User"
)
```

Restart VS Code after changing PATH.

## If `npm install` fails with ENOSPC

You are out of disk space.

```powershell
Get-PSDrive C
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

Free several GB of disk space, then run:

```powershell
npm install
npm run doctor
npm run dev
```

## Tailwind/PostCSS issue

V6 pins Tailwind CSS to `3.4.17` to avoid the Tailwind v4 PostCSS plugin migration error.

If you still see a Tailwind PostCSS error, remove `node_modules` and reinstall:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force
npm install
npm run dev
```
