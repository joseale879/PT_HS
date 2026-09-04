& docker compose -p hidro_smart --profile tooling run --rm liquibase update
if ($LASTEXITCODE -ne 0) { throw "Liquibase update failed with exit code $LASTEXITCODE" }
