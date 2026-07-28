$ErrorActionPreference='Stop'
$basePath = Resolve-Path 'frontend\User' -ErrorAction SilentlyContinue
if(-not $basePath){ Write-Output 'NO_USER'; exit 0 }
$base = $basePath.Path
Get-ChildItem -Path $base -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($base.Length+1) -replace '\\','/'
  $h = (Get-FileHash -Algorithm MD5 -Path $_.FullName).Hash
  $size = $_.Length
  '{0}|{1}|{2}' -f $rel,$h,$size
} | Sort-Object | Set-Content user.hashes.txt -Encoding UTF8

if(Test-Path 'public.hashes.txt'){
  Compare-Object (Get-Content public.hashes.txt) (Get-Content user.hashes.txt) | Out-String | Set-Content compare_public_user.txt
  Write-Output 'COMPARE_DONE'
} else {
  Write-Output 'NO_PUBLIC_HASHES'
}
