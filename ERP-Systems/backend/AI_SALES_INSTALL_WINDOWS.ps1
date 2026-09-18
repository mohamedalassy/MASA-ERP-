$ErrorActionPreference = 'Stop'
Write-Host 'MASA AI Sales: checking Laravel...' -ForegroundColor Cyan
php artisan optimize:clear
php artisan migrate:status
Write-Host 'Running ONLY AI Sales migrations...' -ForegroundColor Cyan
Get-ChildItem database\migrations\*ai_sales*.php | Sort-Object Name | ForEach-Object {
  php artisan migrate --path=("database/migrations/" + $_.Name) --force
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}
php artisan route:list --path=api/ai-sales
Write-Host 'AI Sales backend installed.' -ForegroundColor Green
