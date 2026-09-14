$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host '== Instalando dependencias ==' -ForegroundColor Cyan
npm.cmd ci --prefix BK_HS
npm.cmd ci --prefix FT_HS/frontend

Write-Host '== Levantando servicios ==' -ForegroundColor Cyan
docker compose --env-file .env up -d postgres db-bootstrap mosquitto mailpit

Write-Host '== Validando base de datos ==' -ForegroundColor Cyan
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase update

$envValues = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
    $envValues[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}
$databaseValues = @{}
Get-Content BD_HS/.env | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
    $databaseValues[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}
$appDatabaseHost = if ($envValues['DB_HOST'] -and $envValues['DB_HOST'] -ne 'postgres') { $envValues['DB_HOST'] } else { 'localhost' }
$appDatabasePort = if ($envValues['DB_PORT'] -and $envValues['DB_PORT'] -ne '5432') { $envValues['DB_PORT'] } else { '5433' }
$adminDatabaseHost = if ($databaseValues['POSTGRES_HOST']) { $databaseValues['POSTGRES_HOST'] } else { 'localhost' }
$adminDatabasePort = if ($databaseValues['POSTGRES_PORT']) { $databaseValues['POSTGRES_PORT'] } else { '5433' }
$databaseName = if ($envValues['DB_NAME']) { $envValues['DB_NAME'] } else { $databaseValues['POSTGRES_DB'] }
$appUser = if ($envValues['DB_USER']) { $envValues['DB_USER'] } else { $databaseValues['DB_USER'] }
$appPassword = if ($envValues['DB_PASSWORD']) { $envValues['DB_PASSWORD'] } else { $databaseValues['DB_PASSWORD'] }
$adminUser = $databaseValues['POSTGRES_USER']
$adminPassword = $databaseValues['POSTGRES_PASSWORD']
$env:RUN_INTEGRATION = '1'
$env:INTEGRATION_API_URL = if ($env:INTEGRATION_API_URL) { $env:INTEGRATION_API_URL } else { 'http://localhost:3000' }
$env:INTEGRATION_DATABASE_URL = if ($env:INTEGRATION_DATABASE_URL) { $env:INTEGRATION_DATABASE_URL } else { "postgresql://${appUser}:$([uri]::EscapeDataString($appPassword))@${appDatabaseHost}`:${appDatabasePort}/${databaseName}" }
$env:INTEGRATION_ADMIN_DATABASE_URL = if ($env:INTEGRATION_ADMIN_DATABASE_URL) { $env:INTEGRATION_ADMIN_DATABASE_URL } else { "postgresql://${adminUser}:$([uri]::EscapeDataString($adminPassword))@${adminDatabaseHost}`:${adminDatabasePort}/${databaseName}" }
$env:INTEGRATION_MQTT_URL = 'mqtt://localhost:1883'
$env:INTEGRATION_USER_EMAIL = if ($env:INTEGRATION_USER_EMAIL) { $env:INTEGRATION_USER_EMAIL } else { 'ci-homeuser@hidrosmart.local' }
$env:INTEGRATION_USER_PASSWORD = if ($env:INTEGRATION_USER_PASSWORD) { $env:INTEGRATION_USER_PASSWORD } else { 'CiHomeuser123!' }
$env:INTEGRATION_ADMIN_EMAIL = if ($env:INTEGRATION_ADMIN_EMAIL) { $env:INTEGRATION_ADMIN_EMAIL } else { 'ci-administrator@hidrosmart.local' }
$env:INTEGRATION_ADMIN_PASSWORD = if ($env:INTEGRATION_ADMIN_PASSWORD) { $env:INTEGRATION_ADMIN_PASSWORD } else { 'CiAdministrator123!' }
$env:INTEGRATION_SUPPORT_EMAIL = if ($env:INTEGRATION_SUPPORT_EMAIL) { $env:INTEGRATION_SUPPORT_EMAIL } else { 'ci-support@hidrosmart.local' }
$env:INTEGRATION_SUPPORT_PASSWORD = if ($env:INTEGRATION_SUPPORT_PASSWORD) { $env:INTEGRATION_SUPPORT_PASSWORD } else { 'CiSupport123!' }
$env:INTEGRATION_HOMEUSER_EMAIL = if ($env:INTEGRATION_HOMEUSER_EMAIL) { $env:INTEGRATION_HOMEUSER_EMAIL } else { 'ci-homeuser@hidrosmart.local' }
$env:INTEGRATION_HOMEUSER_PASSWORD = if ($env:INTEGRATION_HOMEUSER_PASSWORD) { $env:INTEGRATION_HOMEUSER_PASSWORD } else { 'CiHomeuser123!' }
$env:INTEGRATION_GUEST_EMAIL = if ($env:INTEGRATION_GUEST_EMAIL) { $env:INTEGRATION_GUEST_EMAIL } else { 'ci-guest@hidrosmart.local' }
$env:INTEGRATION_GUEST_PASSWORD = if ($env:INTEGRATION_GUEST_PASSWORD) { $env:INTEGRATION_GUEST_PASSWORD } else { 'CiGuest123!' }

Write-Host '== Levantando API y web ==' -ForegroundColor Cyan
docker compose --env-file .env up -d --build backend frontend
for ($attempt = 1; $attempt -le 30; $attempt++) {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri "$($env:INTEGRATION_API_URL)/health" -TimeoutSec 3 | Out-Null
    break
  } catch {
    if ($attempt -eq 30) { throw 'La API no alcanzó el estado saludable.' }
    Start-Sleep -Seconds 2
  }
}
Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173/' -TimeoutSec 5 | Out-Null

Write-Host '== Sembrando usuarios de integración ==' -ForegroundColor Cyan
npm.cmd run seed:integration --prefix BK_HS

Write-Host '== Validando backend ==' -ForegroundColor Cyan
npm.cmd run check --prefix BK_HS
npm.cmd run lint --prefix BK_HS
npm.cmd test --prefix BK_HS
npm.cmd run test:integration --prefix BK_HS

Write-Host '== Validando frontend ==' -ForegroundColor Cyan
npm.cmd run lint --prefix FT_HS/frontend
npm.cmd run typecheck --prefix FT_HS/frontend
npm.cmd test --prefix FT_HS/frontend
npm.cmd run build --prefix FT_HS/frontend

Write-Host '== Validando mobile ==' -ForegroundColor Cyan
npm.cmd run mobile:prepare --prefix FT_HS/frontend
Write-Host 'Validacion completa terminada.' -ForegroundColor Green
