# ============================================
# VSCode Auto-Sync for PhoneStore
# Monitors frontend/project and syncs to public
# ============================================

# Configuration
$sourceFolder = "frontend\project"
$targetFolder = "public"
$workspaceRoot = Split-Path -Parent $PSCommandPath

# Function to sync files
function Sync-Files {
    Write-Host "📁 Syncing files from $sourceFolder to $targetFolder..." -ForegroundColor Cyan
    
    try {
        # Create destination folder if not exists
        if (-not (Test-Path $targetFolder)) {
            New-Item -ItemType Directory -Path $targetFolder | Out-Null
        }
        
        # Mirror source into target so removed files disappear too
        robocopy $sourceFolder $targetFolder /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
        if ($LASTEXITCODE -ge 8) {
            throw "Robocopy failed with exit code $LASTEXITCODE"
        }
        
        Write-Host "✅ Sync completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
        
        # Write to VSCode output channel
        [System.IO.File]::AppendAllText("$workspaceRoot\.vscode\sync.log", 
            "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Sync completed`r`n")
        
    } catch {
        Write-Host "❌ Sync failed: $_" -ForegroundColor Red
    }
}

# Watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = (Resolve-Path $sourceFolder).Path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Event handlers
$onChanged = {
    param($source, $eventArgs)
    Write-Host "🔄 Detected: $($eventArgs.Name)" -ForegroundColor Yellow
    Start-Sleep -Milliseconds 500
    Sync-Files
}

$watcher.Add_Created($onChanged)
$watcher.Add_Changed($onChanged)
$watcher.Add_Deleted($onChanged)
$watcher.Add_Renamed({
    param($source, $eventArgs)
    Write-Host "🔄 Renamed: $($eventArgs.OldName) → $($eventArgs.Name)" -ForegroundColor Yellow
    Start-Sleep -Milliseconds 500
    Sync-Files
})

# Initial sync
Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🎯 VSCode Auto-Sync for PhoneStore            " -ForegroundColor Cyan
Write-Host "║  Monitoring: frontend\project                   " -ForegroundColor Yellow
Write-Host "║  Syncing to: public                            " -ForegroundColor Yellow
Write-Host "║  Status: RUNNING                               " -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Sync-Files
Write-Host ""
Write-Host "✅ Watcher started - Ready for changes!" -ForegroundColor Green
Write-Host ""

# Keep script running
while ($true) {
    Start-Sleep -Seconds 1
}
