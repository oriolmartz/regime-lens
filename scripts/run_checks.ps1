Write-Host "Running QuantRegimeTracer backend smoke test..." -ForegroundColor Cyan
Push-Location backend
$env:PYTHONPATH = "."
python scripts/smoke_test.py
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "Checking frontend build..." -ForegroundColor Cyan
Push-Location frontend
npm run doctor
npm run build
Pop-Location
