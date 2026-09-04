param(
    [Parameter(Mandatory=$true)][string]$ChangesetId,
    [string]$Author = 'Hidro_Smarth',
    [string]$ChangesetPath = '',
    [switch]$PreviewOnly
)

$ErrorActionPreference = 'Stop'
$base = @('compose', '-p', 'hidro_smart', '--profile', 'tooling', 'run', '--rm', 'liquibase')
$command = if ($PreviewOnly) { 'rollback-one-changeset-sql' } else { 'rollback-one-changeset' }
$cliArgs = $base + @($command, "--changeset-id=$ChangesetId", "--changeset-author=$Author")
if ($ChangesetPath) { $cliArgs += '--changeset-path=' + $ChangesetPath }
& docker @cliArgs
if ($LASTEXITCODE -ne 0) { throw "Liquibase rollback failed with exit code $LASTEXITCODE" }
