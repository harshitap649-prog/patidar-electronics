$ErrorActionPreference = 'Stop'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$root = 'c:\Users\Keshav\Desktop\shop'
$site = 'file:///c:/Users/Keshav/Desktop/shop'
$port = 9444

$udir = 'C:\temp\chrome_cdp_cache'
if (-not (Test-Path $udir)) { New-Item -ItemType Directory -Path $udir -Force | Out-Null }
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$proc = Start-Process -FilePath $chrome -PassThru -WindowStyle Hidden -ArgumentList @(
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--force-device-scale-factor=1', "--user-data-dir=$udir",
  "--remote-debugging-port=$port", '--no-first-run', 'about:blank'
)

# --- wait for DevTools endpoint & get page target (close any restored extra tabs) ---
$target = $null
$targetId = $null
for ($i = 0; $i -lt 50; $i++) {
  try {
    $list = Invoke-RestMethod "http://127.0.0.1:$port/json/list" -TimeoutSec 2
    $pages = @($list | Where-Object { $_.type -eq 'page' })
    if ($pages.Count -gt 0) {
      # prefer about:blank (our launched tab); close every other tab
      $page = $pages | Where-Object { $_.url -eq 'about:blank' } | Select-Object -First 1
      if (-not $page) { $page = $pages[0] }
      foreach ($t in $pages) {
        if ($t.id -ne $page.id) {
          try { Invoke-WebRequest "http://127.0.0.1:$port/json/close/$($t.id)" -TimeoutSec 2 -UseBasicParsing | Out-Null } catch { }
        }
      }
      $target = $page.webSocketDebuggerUrl
      $targetId = $page.id
      break
    }
  } catch { Start-Sleep -Milliseconds 300 }
}
if (-not $target) { throw 'DevTools target not found' }
$script:target = $target
$script:targetId = $targetId

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$ws.Options.KeepAliveInterval = [TimeSpan]::FromSeconds(30)
$ws.ConnectAsync([Uri]$target, [Threading.CancellationToken]::None).Wait()
Write-Output "CDP connected: $target"

$script:cdpId = 0
$script:recvTask = $null
$script:recvMs = $null
$script:recvBuf = New-Object byte[] 262144
$script:cdpEvents = New-Object System.Collections.ArrayList

function Send-Cdp([string]$method, $params) {
  $script:cdpId++
  $obj = @{ id = $script:cdpId; method = $method }
  if ($null -ne $params) { $obj['params'] = $params }
  $json = $obj | ConvertTo-Json -Depth 8 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $seg = New-Object 'System.ArraySegment[byte]' -ArgumentList @(,$bytes)
  $ws.SendAsync($seg, [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).Wait() | Out-Null
  return $script:cdpId
}

function Recv-Cdp([int]$wantId, [int]$timeoutMs) {
  # Never abandons an in-flight ReceiveAsync: task + partial buffer persist across calls,
  # so a timeout is recoverable instead of wedging the socket.
  $deadline = [DateTime]::UtcNow.AddMilliseconds($timeoutMs)
  $buf = $script:recvBuf
  while ($true) {
    if ($null -eq $script:recvMs) { $script:recvMs = New-Object IO.MemoryStream }
    $end = $false
    while (-not $end) {
      if ($null -eq $script:recvTask) {
        $seg = New-Object 'System.ArraySegment[byte]' -ArgumentList @(,$buf)
        $script:recvTask = $ws.ReceiveAsync($seg, [Threading.CancellationToken]::None)
      }
      $remain = [int]($deadline - [DateTime]::UtcNow).TotalMilliseconds
      if ($remain -lt 1) { $remain = 1 }
      if (-not $script:recvTask.Wait($remain)) { throw "CDP recv timeout waiting for id=$wantId" }
      $res = $script:recvTask.Result
      $script:recvTask = $null
      if ($res.MessageType -eq [Net.WebSockets.WebSocketMessageType]::Close) { throw 'CDP socket closed' }
      $script:recvMs.Write($buf, 0, $res.Count)
      $end = $res.EndOfMessage
    }
    $o = [Text.Encoding]::UTF8.GetString($script:recvMs.ToArray()) | ConvertFrom-Json
    $script:recvMs = New-Object IO.MemoryStream
    if ($o.id -eq $wantId) { return $o }
    # Not our response: record event for diagnostics (never pollutes the return stream).
    if ($o.method) {
      [void]$script:cdpEvents.Add([pscustomobject]@{ m = $o.method; p = $o.params })
      if ($script:cdpEvents.Count -gt 3000) { $script:cdpEvents.RemoveAt(0) }
    }
  }
}

function Connect-CdpSocket {
  # reattach to the SAME tab (target id), never a random one
  try {
    $list = Invoke-RestMethod "http://127.0.0.1:$port/json/list" -TimeoutSec 3
    $page = $list | Where-Object { $_.type -eq 'page' -and $_.id -eq $script:targetId } | Select-Object -First 1
    if ($page) { $script:target = $page.webSocketDebuggerUrl }
  } catch { }
  try { $script:ws.Abort(); $script:ws.Dispose() } catch { }
  $script:recvTask = $null
  $script:recvMs = $null
  $script:ws = New-Object System.Net.WebSockets.ClientWebSocket
  $script:ws.Options.KeepAliveInterval = [TimeSpan]::FromSeconds(30)
  $script:ws.ConnectAsync([Uri]$script:target, [Threading.CancellationToken]::None).Wait()
  Enable-Blocking
}

# Third-party hosts that stall the HTML parser (sync ad scripts) or add nondeterminism.
# Blocking them is test-harness-only: the real site is never modified.
$script:blockUrls = @(
  '*highrevenueformat.com*',
  '*googlesyndication.com*',
  '*doubleclick.net*',
  '*google-analytics.com*',
  '*googletagmanager.com*'
)

function Enable-Blocking {
  # Must be re-applied on every (re)connect - Network state is per-session.
  try { Invoke-Cdp 'Network.enable' @{} 15000 | Out-Null } catch { }
  try { Invoke-Cdp 'Network.setBlockedURLs' @{ urls = $script:blockUrls } 15000 | Out-Null } catch { }
}

Enable-Blocking   # initial session (Connect-CdpSocket re-applies it on every reconnect)

function Invoke-Cdp([string]$method, $params, [int]$timeoutMs = 20000) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $id = Send-Cdp $method $params
  try {
    $r = Recv-Cdp $id $timeoutMs
  } catch {
    # NOTE: must NOT Write-Output here (would pollute the function's return value)
    Write-Warning "$($_.Exception.Message) on $method (id=$id, elapsed=$([int]$sw.Elapsed.TotalMilliseconds)ms) - reconnecting"
    Connect-CdpSocket
    $id = Send-Cdp $method $params
    $r = Recv-Cdp $id $timeoutMs   # second failure propagates
  }
  if ($r.PSObject.Properties['error']) { throw "CDP $method failed: $($r.error.message)" }
  return $r.result
}

function Set-Vp([int]$w, [int]$h) {
  Invoke-Cdp 'Emulation.setDeviceMetricsOverride' @{ width = $w; height = $h; deviceScaleFactor = 1; mobile = $false } | Out-Null
}

function Eval-Js([string]$expr, [int]$timeoutMs = 15000) {
  $r = Invoke-Cdp 'Runtime.evaluate' @{ expression = $expr; returnByValue = $true } $timeoutMs
  return $r.result.value
}

function Goto-Probe([string]$url) {
  Invoke-Cdp 'Page.navigate' @{ url = 'about:blank' } | Out-Null
  Start-Sleep -Milliseconds 400
  Invoke-Cdp 'Page.navigate' @{ url = $url } | Out-Null
  for ($i = 0; $i -lt 300; $i++) {
    Start-Sleep -Milliseconds 300
    try {
      $v = Eval-Js "document.getElementById('PROBE_RESULTS') ? document.getElementById('PROBE_RESULTS').textContent : ''" 15000
      if ($v) { Start-Sleep -Milliseconds 400; return $v }
    } catch { }
  }
  throw "probe timeout: $url"
}

function Goto-Page([string]$url) {
  Invoke-Cdp 'Page.navigate' @{ url = 'about:blank' } | Out-Null
  Start-Sleep -Milliseconds 400
  Invoke-Cdp 'Page.navigate' @{ url = $url } | Out-Null
  $ready = $false
  for ($i = 0; $i -lt 300; $i++) {
    Start-Sleep -Milliseconds 300
    try {
      $st = Eval-Js "document.readyState" 15000
      # accept 'interactive' after ~4.5s (load event can hang on third-party iframes)
      if ($st -eq 'complete' -or ($st -eq 'interactive' -and $i -gt 14)) { $ready = $true; break }
    } catch { }
  }
  if (-not $ready) { throw "load timeout: $url" }
  # best-effort: wait for webfonts + images (max ~15s) so screenshots render fully
  for ($j = 0; $j -lt 30; $j++) {
    try {
      $ok = Eval-Js '(document.fonts && document.fonts.status === "loaded") && Array.prototype.every.call(document.images, function (im) { return im.complete; })' 8000
      if ($ok -eq $true) { break }
    } catch { break }
    Start-Sleep -Milliseconds 500
  }
  Start-Sleep -Milliseconds 600
}


# =================== PART 2: PROBES ===================
$widths = @(320, 375, 600, 768, 900, 1024, 1280)
$results = @()

if (-not $env:SKIP_PROBES) {
foreach ($page in @('index.html', 'mobiles.html')) {
  foreach ($w in $widths) {
   try {
    Set-Vp $w 900
    $raw = Goto-Probe "$site/_probe_$page"
    $inner = Eval-Js 'window.innerWidth'
    if ($raw -like 'PROBE::*') { $raw = $raw.Substring(7) }
    $r = $raw | ConvertFrom-Json
    $fails = @()
    if ([int]$inner -ne $w) { $fails += "innerWidth=$inner (want $w)" }
    if ([int]$r.overflowX -gt 0) { $fails += "overflowX=$($r.overflowX)" }
    if ([int]$r.docHeight -le 0) { $fails += 'docHeight<=0' }

    if ($page -eq 'index.html') {
      if (-not $r.stripExists)   { $fails += 'strip missing' }
      if ([int]$r.stripItems -ne 4) { $fails += "stripItems=$($r.stripItems)" }
      if (-not $r.stripBelowSlider) { $fails += 'strip not below slider' }
      $wantCols = if ($w -ge 768) { 4 } elseif ($w -le 600) { 2 } else { 0 }
      if ($wantCols -gt 0 -and [int]$r.stripCols -ne $wantCols) { $fails += "stripCols=$($r.stripCols) want $wantCols" }
      if (-not $r.stripIconsRendered) { $fails += 'strip icons not rendered' }
      if ($r.callHref -notlike 'tel:*') { $fails += "callHref=$($r.callHref)" }
      if ([int]$r.actionsCount -ne 2) { $fails += "actionsCount=$($r.actionsCount)" }
      if (-not $r.dirBtnRect -or [int]$r.dirBtnRect.w -le 0) { $fails += 'dirBtn w<=0' }
      if (-not $r.callBtnRect -or [int]$r.callBtnRect.w -le 0) { $fails += 'callBtn w<=0' }
      if ($r.mapsHref -notlike '*google.com/maps*') { $fails += 'mapsHref bad' }
      if (-not $r.showroomHeading) { $fails += 'showroom heading missing' }
      if (-not $r.mapEmbed) { $fails += 'map embed missing' }
      if (-not $r.storeHours) { $fails += 'store hours missing' }
    } else {
      if ([int]$r.cardCount -le 0) { $fails += 'no cards' }
      if (-not $r.badge) { $fails += 'badge missing' }
      if (-not $r.emi) { $fails += 'emi missing' }
      if (-not $r.emiMathOk) { $fails += 'emiMathOk false' }
      if (-not $r.waHasModel) { $fails += 'wa model missing' }
      if (-not $r.waHasPrice) { $fails += 'wa price missing' }
      if (-not $r.waHasVariant) { $fails += 'wa variant missing' }
      if (-not $r.allCardsHaveBadge) { $fails += 'not all cards badge' }
      if (-not $r.allCardsHaveEmi) { $fails += 'not all cards emi' }
      if (-not $r.waBtnVisible) { $fails += 'wa btn hidden' }
      if (-not $r.stockIconRendered) { $fails += 'stock icon hidden' }
      if (-not $r.emiIconRendered) { $fails += 'emi icon hidden' }
    }

    $status = if ($fails.Count -eq 0) { 'PASS' } else { 'FAIL: ' + ($fails -join '; ') }
    $line = "$page@$w (innerWidth=$inner) :: $status"
    $results += $line
    Write-Output $line
   } catch {
    $line = "$page@$w :: FAIL: EXCEPTION $($_.Exception.Message)"
    $results += $line
    Write-Output $line
   }
  }
}

$results | Set-Content -Path (Join-Path $root '_probe_results_v2.txt') -Encoding UTF8
$pass = @($results | Where-Object { $_ -like '*:: PASS' }).Count
Write-Output "PROBE SUMMARY: $pass/$($results.Count) PASS"
}

# =================== PART 3: SCREENSHOTS ===================
function Get-DocH { return [int](Eval-Js 'document.documentElement.scrollHeight') }

function Save-Shot([string]$png, $clip) {
  # $clip: $null = full document; else @{x,y,width,height}
  $params = @{ format = 'png'; captureBeyondViewport = $true }
  if ($null -ne $clip) { $params['clip'] = @{ x = $clip.x; y = $clip.y; width = $clip.width; height = $clip.height; scale = 1 } }
  $res = Invoke-Cdp 'Page.captureScreenshot' $params 60000
  if (Test-Path $png) { Remove-Item $png -Force }
  [IO.File]::WriteAllBytes($png, [Convert]::FromBase64String($res.data))
  Add-Type -AssemblyName System.Drawing
  $img = [System.Drawing.Image]::FromFile($png)
  Write-Output "$([IO.Path]::GetFileName($png)) => $($img.Width)x$($img.Height) clip=$(if ($null -ne $clip) { "$($clip.x),$($clip.y) $($clip.width)x$($clip.height)" } else { 'FULL' })"
  $img.Dispose()
}

$showroomJs = @'
(function(){
  var hs=[].slice.call(document.querySelectorAll('h2')).filter(function(h){return h.textContent.indexOf('Visit Our Showroom')>-1;})[0];
  if(!hs)return null;
  var top=Infinity,bottom=-Infinity;
  function add(el){ if(!el)return; var r=el.getBoundingClientRect(); if(r.width<=0&&r.height<=0)return; top=Math.min(top,r.top+window.pageYOffset); bottom=Math.max(bottom,r.bottom+window.pageYOffset); }
  add(hs); if(hs.previousElementSibling)add(hs.previousElementSibling);
  add(document.querySelector('.map-box'));
  add(document.querySelector('.store-actions'));
  add(document.querySelector('.store-hours'));
  if(top===Infinity)return null;
  return Math.max(0,Math.round(top-40))+','+Math.round(bottom+40);
})()
'@
$stripJs = @'
(function(){var s=document.querySelector('.section-container .store-trust-strip');if(!s)return null;var r=s.getBoundingClientRect();return Math.max(0,Math.round(r.top+window.pageYOffset));})()
'@
$cardsJs = @'
(function(){var c=document.querySelector('.product-card');if(!c)return null;var r=c.getBoundingClientRect();return Math.max(0,Math.round(r.top+window.pageYOffset-160));})()
'@

function Get-ShowroomClip([int]$vw) {
  $v = Eval-Js $showroomJs
  if (-not $v) { return $null }
  $parts = $v -split ','
  return @{ x = 0; y = [int]$parts[0]; width = $vw; height = ([int]$parts[1] - [int]$parts[0]) }
}

# --- index.html @1280 ---
if (-not $env:SKIP_SHOTS) {
Set-Vp 1280 1600
Goto-Page "$site/index.html"
$stripTop = [int](Eval-Js $stripJs)
Save-Shot (Join-Path $root '_v3_strip_desktop.png') @{ x = 0; y = ([Math]::Max(0, $stripTop - 60)); width = 1280; height = 340 }
Save-Shot (Join-Path $root '_v3_showroom_desktop.png') (Get-ShowroomClip 1280)
Save-Shot (Join-Path $root '_v3_full_desktop.png') $null

# --- index.html @375 ---
Set-Vp 375 812
Goto-Page "$site/index.html"
$stripTop = [int](Eval-Js $stripJs)
Save-Shot (Join-Path $root '_v3_strip_mobile.png') @{ x = 0; y = ([Math]::Max(0, $stripTop - 30)); width = 375; height = 460 }
Save-Shot (Join-Path $root '_v3_showroom_mobile.png') (Get-ShowroomClip 375)
Save-Shot (Join-Path $root '_v3_full_mobile.png') $null

# --- mobiles.html @1280 ---
Set-Vp 1280 1600
Goto-Page "$site/mobiles.html"
$cardTop = [int](Eval-Js $cardsJs)
Save-Shot (Join-Path $root '_v3_cards_desktop.png') @{ x = 0; y = $cardTop; width = 1280; height = 1500 }

# --- mobiles.html @375 ---
Set-Vp 375 812
Goto-Page "$site/mobiles.html"
$cardTop = [int](Eval-Js $cardsJs)
Save-Shot (Join-Path $root '_v3_cards_mobile.png') @{ x = 0; y = $cardTop; width = 375; height = 1500 }
}

# --- cleanup ---
if (-not $env:CDP_LIB_ONLY) {
$ws.Dispose()
try { $proc.Kill() } catch { }
Start-Sleep -Milliseconds 500
Write-Output 'DONE'
}
