<#
.SYNOPSIS
  Syncs the canonical Boulevard PWA (the one served at /pwa/ by the .NET admin
  server, e.g. http://localhost:5000/pwa/) into THIS Capacitor project so the
  Android APK shows the EXACT same design – no more drift between the two.

.DESCRIPTION
  The real, actively-developed PWA lives at:
      ..\..\SourceCode of ADmin\Boulevard\Boulevard\pwa
  This Capacitor project used to keep its own stale copy of index.html / app.js /
  style.css, which is why the phone showed the old "Merchant Portal" design.

  This script copies the real PWA into .\dist (Capacitor's webDir) and applies the
  only two changes a bundled app needs:
    1. Logo path  ../new_logo.png  ->  new_logo.png   (logo sits at bundle root)
    2. API base   BASE_URL = ''    ->  BASE_URL = '<ApiBase>'  (absolute server)

  After running this, finish the build with:
      npx cap copy android
      cd android ; .\gradlew assembleDebug

.PARAMETER ApiBase
  Absolute URL of the Boulevard API/server the phone app should call.
  Default: https://boulevard.r-y-x.net  (verified live, works on any device).
  For an emulator hitting your local PC server on port 5000 use:
      -ApiBase 'http://10.0.2.2:5000'
  For a real phone on the same Wi-Fi as your PC use your PC LAN IP, e.g.:
      -ApiBase 'http://192.168.1.50:5000'
#>
param(
    [string]$ApiBase = 'https://boulevard.r-y-x.net'
)

$ErrorActionPreference = 'Stop'

$root    = $PSScriptRoot
$srcPwa  = (Resolve-Path (Join-Path $root '..\..\SourceCode of ADmin\Boulevard\Boulevard\pwa')).Path
$srcLogo = (Resolve-Path (Join-Path $root '..\..\SourceCode of ADmin\Boulevard\Boulevard\new_logo.png')).Path
$dest    = Join-Path $root 'dist'

# Trim a trailing slash so we never produce a double slash in JS URLs.
$ApiBase = $ApiBase.TrimEnd('/')

Write-Host "------------------------------------------------------------"
Write-Host " Boulevard PWA -> Capacitor sync"
Write-Host "   Source : $srcPwa"
Write-Host "   Dest   : $dest"
Write-Host "   ApiBase: $ApiBase"
Write-Host "------------------------------------------------------------"

# 1. Clean dist ------------------------------------------------------------
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest | Out-Null

# 2. Copy top-level files --------------------------------------------------
foreach ($f in @('index.html', 'home-services.html', 'delivery-driver.html', 'manifest.json', 'sw.js', 'version.json')) {
    Copy-Item (Join-Path $srcPwa $f) (Join-Path $dest $f) -Force
}

# 3. Copy asset folders ----------------------------------------------------
foreach ($d in @('css', 'js', 'icons', 'sounds')) {
    Copy-Item (Join-Path $srcPwa $d) $dest -Recurse -Force
}

# 4. Copy the logo (lives one level above /pwa/) into the bundle root -------
Copy-Item $srcLogo (Join-Path $dest 'new_logo.png') -Force

# 5. Helper: UTF-8 (no BOM) read/write so Arabic strings survive -----------
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Edit-File([string]$path, [scriptblock]$transform) {
    $text = [System.IO.File]::ReadAllText($path)
    $text = & $transform $text
    [System.IO.File]::WriteAllText($path, $text, $utf8)
}

# 6. Fix the logo path in the two HTML pages -------------------------------
foreach ($html in @('index.html', 'home-services.html', 'delivery-driver.html')) {
    Edit-File (Join-Path $dest $html) { param($t) $t -replace '\.\./new_logo\.png', 'new_logo.png' }
}

# 7. Point the API BASE_URL at the real server in config.js ---------
$configPath = Join-Path $dest 'js\config.js'
Edit-File $configPath {
    param($t)
    # Replace the entire IIFE or string assignment with the static variable
    $t -replace "(?s)const\s+BASE_URL\s*=\s*\(function\(\)\s*\{.*?\}\)\(\)\s*;", "const BASE_URL = '$ApiBase';"
}

# 8. Configure Capacitor as a Dynamic Web Wrapper (server.url) -------------
$capConfigPath = Join-Path $root 'capacitor.config.json'
if (Test-Path $capConfigPath) {
    # Parse existing config
    $config = Get-Content $capConfigPath | ConvertFrom-Json
    
    # Ensure server object exists
    if ($null -eq $config.server) {
        $config | Add-Member -MemberType NoteProperty -Name "server" -Value @{}
    }
    
    # Set server.url to the ApiBase + /pwa/
    $config.server.url = "$ApiBase/pwa/index.html"
    
    # Set allowNavigation to allow the capacitor bridge to inject native plugins
    $config.server.allowNavigation = @("10.0.2.2", "localhost", "boulevard.r-y-x.net", "192.168.*.*")
    
    # Save back to file with proper formatting
    $config | ConvertTo-Json -Depth 10 | Set-Content $capConfigPath
    Write-Host "Updated capacitor.config.json (Dynamic Web Wrapper mode enabled)."
}

Write-Host "Done. PWA design copied into dist (API -> $ApiBase)."
Write-Host "Next: npx cap copy android ; cd android ; .\gradlew assembleDebug"
