$ErrorActionPreference='Stop'
$src = 'public'
$dst = 'frontend\User'
if(-not (Test-Path $src)){
  Write-Output 'NO_PUBLIC'
  exit 0
}
if(-not (Test-Path 'frontend')){
  New-Item -ItemType Directory -Path 'frontend' | Out-Null
}
if(Test-Path $dst){
  Write-Output 'DEST_EXISTS'
  exit 0
}
New-Item -ItemType Directory -Path $dst -Force | Out-Null
Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
$srcCount = (Get-ChildItem -Path $src -Recurse -File | Measure-Object).Count
$dstCount = (Get-ChildItem -Path $dst -Recurse -File | Measure-Object).Count
Write-Output ("SRC_COUNT=$srcCount")
Write-Output ("DST_COUNT=$dstCount")
if($srcCount -eq $dstCount){
  Remove-Item -Recurse -Force $src
  Write-Output 'REMOVED_PUBLIC'
} else {
  Write-Output 'COUNT_MISMATCH'
}
