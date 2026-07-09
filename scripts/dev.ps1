Write-Host "QuantRegimeTracer dev helper" -ForegroundColor Cyan
Write-Host "Open two terminals:" -ForegroundColor Yellow
Write-Host "1) Backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\.venv\Scripts\activate" -ForegroundColor Gray
Write-Host "   uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
Write-Host "2) Frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm ci" -ForegroundColor Gray
Write-Host "   npm run doctor" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
