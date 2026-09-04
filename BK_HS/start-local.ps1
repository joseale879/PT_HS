param(
    [switch]$BuildBackend
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$dbRoot = Join-Path $projectRoot 'BD_HS'
$backendRoot = Join-Path $projectRoot 'BK_HS'

if (-not (Test-Path (Join-Path $dbRoot '.env'))) {
    throw "Falta BD_HS/.env. Copia BD_HS/.env.example a BD_HS/.env y configura sus valores locales."
}

if (-not (Test-Path (Join-Path $backendRoot '.env'))) {
    throw "Falta BK_HS/.env. Copia BK_HS/.env.local.example a BK_HS/.env y configura DB_PASSWORD/JWT_SECRET."
}

Write-Host 'Levantando PostgreSQL local...'
docker compose --env-file (Join-Path $dbRoot '.env') -p hidro_smart -f (Join-Path $dbRoot 'docker-compose.yml') up -d postgres

if ($BuildBackend) {
    Write-Host 'Construyendo y levantando backend local...'
    docker compose --env-file (Join-Path $backendRoot '.env') -p hidro_smart_backend -f (Join-Path $backendRoot 'docker-compose.yml') up -d --build
} else {
    Write-Host 'Levantando backend local...'
    docker compose --env-file (Join-Path $backendRoot '.env') -p hidro_smart_backend -f (Join-Path $backendRoot 'docker-compose.yml') up -d
}

Write-Host 'Servicios locales:'
Write-Host '  PostgreSQL: localhost:5433'
Write-Host '  Backend:    http://localhost:3000'
Write-Host '  Health:     http://localhost:3000/health'
