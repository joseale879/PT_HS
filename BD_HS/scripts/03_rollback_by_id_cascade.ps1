param([Parameter(Mandatory=$true)][string]$ChangesetId, [int]$Count = 1)
Write-Warning 'Liquibase revierte por cantidad desde el último changeset; confirma que el respaldo corresponde al entorno.'
$confirmation = Read-Host 'Escribe ROLLBACK para continuar'
if ($confirmation -ne 'ROLLBACK') { exit 1 }
& docker compose -p hidro_smart --profile tooling run --rm liquibase rollback-count --count=$Count
if ($LASTEXITCODE -ne 0) { throw "Liquibase rollback failed with exit code $LASTEXITCODE" }
