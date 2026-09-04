param([switch]$OnlyNext, [switch]$AllPending, [switch]$AutoConfirm)
if (-not ($OnlyNext -or $AllPending)) { $OnlyNext = $true }
if (-not $AutoConfirm) {
    $confirmation = Read-Host 'Escribe UPDATE para aplicar los cambios pendientes'
    if ($confirmation -ne 'UPDATE') { exit 1 }
}
& docker compose -p hidro_smart --profile tooling run --rm liquibase update
if ($LASTEXITCODE -ne 0) { throw "Liquibase update failed with exit code $LASTEXITCODE" }
