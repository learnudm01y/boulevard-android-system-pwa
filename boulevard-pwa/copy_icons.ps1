$densities = @("mipmap-mdpi","mipmap-hdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi")
$files = @("ic_launcher.png","ic_launcher_round.png","ic_launcher_foreground.png")
$srcBase = "I:\entire system - boulevard\Source Code (App)\boulevard-app\boulevard-app\android\app\src\main\res"
$dstBase = "I:\entire system - boulevard\android system\boulevard-pwa\android\app\src\main\res"

foreach ($d in $densities) {
    foreach ($f in $files) {
        $src = "$srcBase\$d\$f"
        $dst = "$dstBase\$d\$f"
        if (Test-Path $src) {
            Copy-Item $src $dst -Force
            Write-Host "OK: $d\$f"
        } else {
            Write-Host "MISSING: $src"
        }
    }
}
Write-Host "Done!"
