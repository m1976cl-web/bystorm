# Sync frontend: static/ is the source of truth (Bystorm v2.1 D1).
# Copies static/app.js, index.html, style.css to repo root for Netlify/local dual layout.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$static = Join-Path $root "static"
$files = @("app.js", "index.html", "style.css")

foreach ($f in $files) {
    $src = Join-Path $static $f
    $dst = Join-Path $root $f
    if (-not (Test-Path $src)) {
        Write-Error "Missing source: $src"
    }
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "Synced $f  (static/ -> root)"
}

Write-Host "Done. Prefer editing files under static/ only."
