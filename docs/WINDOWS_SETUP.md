# QuantRegimeTracer Windows Setup

QuantRegimeTracer uses React + TypeScript + Vite and keeps Tailwind pinned to `3.4.17`.

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Frontend

```powershell
cd frontend
npm ci
npm run doctor
npm run typecheck
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Tests

```powershell
cd backend
pytest -q
python scripts/smoke_test.py
```

## If npm is not recognized

If you installed portable Node, add its folder to the current terminal session:

```powershell
$NodePath = "C:\Tools\node-v24.18.0-win-x64"
$env:Path = "$NodePath;$env:Path"
node -v
npm -v
```

## If npm ci fails with ENOSPC

Free disk space, then:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm cache clean --force
npm ci
```

## Tailwind note

Tailwind remains pinned to `3.4.17` to avoid the Tailwind PostCSS plugin migration issue. The config scans `.ts` and `.tsx` files.
