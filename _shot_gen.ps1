$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$root = 'c:\Users\Keshav\Desktop\shop'
$site = 'file:///c:/Users/Keshav/Desktop/shop'

# Full-window captures from document top (NO scrolling - scroll breaks headless screenshots)
$shots = @(
  @{ page = 'index.html';   out = '_full_desktop.png';     w = 1280; h = 6000 },
  @{ page = 'index.html';   out = '_full_mobile.png';      w = 375;  h = 13000 },
  @{ page = 'mobiles.html'; out = '_ui_cards_desktop.png'; w = 1280; h = 1600 },
  @{ page = 'mobiles.html'; out = '_ui_cards_mobile.png';  w = 375;  h = 1400 }
)

Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.Drawing

foreach ($s in $shots) {
  $ud = "C:\temp\chrome_shot_$(Get-Random)"
  New-Item -ItemType Directory -Path $ud -Force | Out-Null
  $sizeArg = "--window-size=$($s.w),$($s.h)"
  $png = Join-Path $root $s.out
  if (Test-Path $png) { Remove-Item $png -Force }
  & $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=1 --user-data-dir=$ud $sizeArg --virtual-time-budget=9000 --screenshot="$png" "$site/$($s.page)" 2>$null | Out-Null
  Remove-Item $ud -Recurse -Force -ErrorAction SilentlyContinue
  if (Test-Path $png) {
    $img = [System.Drawing.Image]::FromFile($png)
    Write-Output "$($s.out) => $($img.Width)x$($img.Height)"
    $img.Dispose()
  } else {
    Write-Output "$($s.out) => MISSING"
  }
}

# --- helpers ---
function Get-LastContentRow([string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($path)
  $h = $bmp.Height; $w = $bmp.Width
  $row = -1
  for ($y = $h - 1; $y -ge 0; $y--) {
    $found = $false
    for ($x = 0; $x -lt $w; $x += 8) {
      $p = $bmp.GetPixel($x, $y)
      if ($p.R -lt 250 -or $p.G -lt 250 -or $p.B -lt 250) { $found = $true; break }
    }
    if ($found) { $row = $y; break }
  }
  $bmp.Dispose()
  return $row
}

function Save-Crop([string]$src, [string]$dst, [int]$y, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap($src)
  if ($y -lt 0) { $y = 0 }
  if ($y + $h -gt $bmp.Height) { $h = $bmp.Height - $y }
  $rect = New-Object System.Drawing.Rectangle(0, $y, $bmp.Width, $h)
  $crop = $bmp.Clone($rect, $bmp.PixelFormat)
  $bmp.Dispose()
  if (Test-Path $dst) { Remove-Item $dst -Force }
  $crop.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
  Write-Output "$dst <= $src rows [$y..$($y+$h)]"
}

# --- crops ---
$fullD = Join-Path $root '_full_desktop.png'
$fullM = Join-Path $root '_full_mobile.png'

if (Test-Path $fullD) {
  Save-Crop $fullD (Join-Path $root '_ui_strip_desktop.png') 400 900
  $last = Get-LastContentRow $fullD
  Write-Output "_full_desktop.png lastContentRow=$last (window h=6000$(if ($last -ge 5997) { ' - POSSIBLY CLIPPED' }))"
  Save-Crop $fullD (Join-Path $root '_ui_showroom_desktop.png') ([Math]::Max(0, $last - 1150)) 1150
}
if (Test-Path $fullM) {
  Save-Crop $fullM (Join-Path $root '_ui_strip_mobile.png') 0 1100
  $last = Get-LastContentRow $fullM
  Write-Output "_full_mobile.png lastContentRow=$last (window h=13000$(if ($last -ge 12997) { ' - POSSIBLY CLIPPED' }))"
  Save-Crop $fullM (Join-Path $root '_ui_showroom_mobile.png') ([Math]::Max(0, $last - 1800)) 1800
}

Get-ChildItem (Join-Path $root '_ui_*.png') | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  Write-Output "$($_.Name) => $($img.Width)x$($img.Height)"
  $img.Dispose()
}
