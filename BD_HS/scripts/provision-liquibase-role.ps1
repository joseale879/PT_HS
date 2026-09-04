param(
    [Parameter(Mandatory=$true)][string]$AdminUser,
    [Parameter(Mandatory=$true)][string]$AdminPassword,
    [Parameter(Mandatory=$true)][string]$LiquibasePassword,
    [string]$LiquibaseUser = 'hidro_smart_liquibase',
    [string]$Database = 'hidro_smart'
)

$ErrorActionPreference = 'Stop'
$env:POSTGRES_PASSWORD = $AdminPassword
$env:POSTGRES_DB = $Database
$env:POSTGRES_USER = $AdminUser

$escapedPassword = $LiquibasePassword.Replace("'", "''")
$sql = @"
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$LiquibaseUser') THEN
        EXECUTE format('CREATE ROLE $LiquibaseUser LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION CONNECTION LIMIT 10 PASSWORD %L', '$escapedPassword');
    ELSE
        EXECUTE format('ALTER ROLE $LiquibaseUser LOGIN PASSWORD %L', '$escapedPassword');
    END IF;
END
`$`$;

GRANT CONNECT ON DATABASE "$Database" TO "$LiquibaseUser";
ALTER ROLE "$LiquibaseUser" CREATEROLE;
GRANT CREATE ON DATABASE "$Database" TO "$LiquibaseUser";
GRANT USAGE, CREATE ON SCHEMA public TO "$LiquibaseUser";
"@

$sql | docker compose exec -T postgres psql -U $AdminUser -d $Database -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw "No se pudo provisionar el rol de Liquibase" }
Write-Host "Rol $LiquibaseUser provisionado. Configura LIQUIBASE_USER y LIQUIBASE_PASSWORD antes de ejecutar Liquibase."