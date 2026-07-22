# Push a origin/main usando credencial local (GCM o .env.local).
# No imprime el token. Uso: .\scripts\push-main.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

# Cargar .env.local si existe (por si GCM no tiene la credencial)
$envFile = Join-Path $root ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2].Trim()
        }
    }
}

git status -sb
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push falló. Revisá GCM o .env.local (GITHUB_TOKEN)." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Push OK." -ForegroundColor Green
