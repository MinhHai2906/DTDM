$ErrorActionPreference='Stop'

if (Test-Path 'frontend/project') {
  Remove-Item -Recurse -Force 'frontend/project'
  Write-Output 'REMOVED: frontend/project'
} else {
  Write-Output 'NO_PROJECT'
}

$backs = Get-ChildItem -Directory frontend | Where-Object { $_.Name -like 'project_backup_*' }
if ($backs -and $backs.Count -gt 0) {
  foreach ($b in $backs) {
    Remove-Item -Recurse -Force $b.FullName
    Write-Output ('REMOVED:' + $b.FullName)
  }
} else {
  Write-Output 'NO_BACKUPS'
}

Write-Output 'Remaining folders in frontend:'
Get-ChildItem -Directory frontend | Select-Object -ExpandProperty Name | ForEach-Object { Write-Output $_ }
