Add-Type -AssemblyName System.Drawing

$sourceFile = "i:\entire system - boulevard\android system\boulevard-pwa\public\icons\icon-512.png"
$resBase = "i:\entire system - boulevard\android system\boulevard-pwa\android\app\src\main\res"
$srcImage = [System.Drawing.Image]::FromFile($sourceFile)
Write-Host "Source image: $($srcImage.Width) x $($srcImage.Height)"

$densities = @("mipmap-mdpi","mipmap-hdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi")
$legacySizes = @(48, 72, 96, 144, 192)
$fgSizes = @(108, 162, 216, 324, 432)

for ($i = 0; $i -lt $densities.Count; $i++) {
    $d = $densities[$i]
    $s = $legacySizes[$i]
    $logoW = [int]($s * 0.80)
    $logoH = [int]($s * 0.40)
    $x = [int](($s - $logoW) / 2)
    $y = [int](($s - $logoH) / 2)

    foreach ($name in @("ic_launcher.png","ic_launcher_round.png")) {
        $bmp = New-Object System.Drawing.Bitmap($s, $s)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.Clear([System.Drawing.Color]::Black)
        $g.DrawImage($srcImage, $x, $y, $logoW, $logoH)
        $g.Dispose()
        $bmp.Save("$resBase\$d\$name", [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    }

    $fs = $fgSizes[$i]
    $fgW = [int]($fs * 0.80)
    $fgH = [int]($fs * 0.40)
    $fx = [int](($fs - $fgW) / 2)
    $fy = [int](($fs - $fgH) / 2)
    $fbmp = New-Object System.Drawing.Bitmap($fs, $fs)
    $fg2 = [System.Drawing.Graphics]::FromImage($fbmp)
    $fg2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $fg2.Clear([System.Drawing.Color]::Transparent)
    $fg2.DrawImage($srcImage, $fx, $fy, $fgW, $fgH)
    $fg2.Dispose()
    $fbmp.Save("$resBase\$d\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $fbmp.Dispose()

    Write-Host "$d done (legacy: $s x $s, fg: $fs x $fs)"
}
$srcImage.Dispose()
Write-Host "All icons generated successfully!"
