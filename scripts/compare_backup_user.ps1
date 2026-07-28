$ErrorActionPreference='Stop'
$backup = Get-ChildItem -Directory frontend | Where-Object { $_.Name -like 'project_backup_*' } | Sort-Object Name -Descending | Select-Object -First 1
if(-not $backup){ Write-Output 'NO_BACKUP'; exit 0 }
$backupPath = $backup.FullName
$userPath = (Resolve-Path 'frontend\User').Path
function Write-Hashes($base,$out){
  if(-not (Test-Path $base)){ Write-Output "MISSING:$base"; return }
  $basePath = (Resolve-Path $base).Path
  Get-ChildItem -Path $base -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($basePath.Length+1) -replace '\\','/'
    $h = (Get-FileHash -Algorithm MD5 -Path $_.FullName).Hash
    $size = $_.Length
    '{0}|{1}|{2}' -f $rel,$h,$size
  } | Sort-Object | Set-Content -Path $out -Encoding UTF8
}
Write-Output ('Backup: ' + $backupPath)
Write-Output ('User: ' + $userPath)
Write-Hashes $backupPath 'backup_latest.hashes.txt'
Write-Hashes $userPath 'user.hashes.txt'
Compare-Object (Get-Content backup_latest.hashes.txt) (Get-Content user.hashes.txt) | Out-String | Set-Content compare_backup_user.txt
Write-Output 'COMPARE_DONE'
