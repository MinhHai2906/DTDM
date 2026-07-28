$ErrorActionPreference='Stop'
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

Write-Output 'Generating hashes...'
Write-Hashes 'public' 'public.hashes.txt'
if (Test-Path 'frontend/project') { Write-Hashes 'frontend/project' 'project.hashes.txt' } else { Write-Output 'No project folder' }
$backup = Get-ChildItem -Directory frontend | Where-Object { $_.Name -like 'project_backup_*' } | Sort-Object Name -Descending | Select-Object -First 1
if($backup){ Write-Hashes $backup.FullName 'backup.hashes.txt' } else { Write-Output 'No backup folder' }

if(Test-Path 'project.hashes.txt'){
  Compare-Object (Get-Content public.hashes.txt) (Get-Content project.hashes.txt) | Out-String | Set-Content compare_public_project.txt
} else { 'No project.hashes.txt' | Set-Content compare_public_project.txt }

if(Test-Path 'backup.hashes.txt'){
  Compare-Object (Get-Content public.hashes.txt) (Get-Content backup.hashes.txt) | Out-String | Set-Content compare_public_backup.txt
} else { 'No backup.hashes.txt' | Set-Content compare_public_backup.txt }

Write-Output 'Done. Generated: public.hashes.txt, project.hashes.txt (if existed), backup.hashes.txt (if existed), compare_public_project.txt, compare_public_backup.txt'
