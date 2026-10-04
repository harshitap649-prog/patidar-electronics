Add-Type -AssemblyName System.Drawing
function LastDark([string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($path)
  $w = $bmp.Width; $h = $bmp.Height; $row = -1
  for ($y = $h - 1; $y -ge 0; $y--) {
    $found = $false
    for ($x = 0; $x -lt $w; $x += 4) {
      $p = $bmp.GetPixel($x, $y)
      if ($p.R -lt 200 -and $p.G -lt 200 -and $p.B -lt 200) { $found = $true; break }
    }
    if ($found) { $row = $y; break }
  }
  $bmp.Dispose()
  return $row
}
$d = LastDark 'c:\Users\Keshav\Desktop\shop\_full_desktop.png'
$m = LastDark 'c:\Users\Keshav\Desktop\shop\_full_mobile.png'
Write-Output "full_desktop lastDarkRow=$d"
Write-Output "full_mobile lastDarkRow=$m"
Select-String -Path 'c:\Users\Keshav\Desktop\shop\_probe_results.txt' -Pattern 'index.html@' | ForEach-Object {
  $line = $_.Line
  if ($line -match '^(index\.html@\d+)') { $name = $Matches[1] } else { $name = '?' }
  if ($line -match 'docHeight":(\d+)') { Write-Output "$name docHeight=$($Matches[1])" }
}
