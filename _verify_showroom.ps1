# Reuses the CDP helpers from _cdp_run.ps1 (dot-sourced in library-only mode) to
# validate the redesigned two-branch showroom: probe contract, layout metrics and
# real click-driven map re-pointing. Run: powershell -File _verify_showroom.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$env:CDP_LIB_ONLY = '1'
$env:SKIP_PROBES = '1'
$env:SKIP_SHOTS = '1'
. (Join-Path $PSScriptRoot '_cdp_run.ps1')

$root = 'c:\Users\Keshav\Desktop\shop'
$site = 'file:///c:/Users/Keshav/Desktop/shop'

$js = @'
(function () {
  function rect(el) { if (!el) return null; var r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top + window.pageYOffset), w: Math.round(r.width), h: Math.round(r.height) }; }
  var out = {};
  var actions = document.querySelector('.store-actions');
  out.actionsCount = actions ? actions.children.length : 0;
  var call = document.querySelector('.btn-call');
  out.callHref = call ? call.getAttribute('href') : null;
  var dir = document.querySelector('.btn-directions');
  out.mapsHref = dir ? dir.getAttribute('href') : null;
  var mf = document.querySelector('.map-box iframe');
  out.mapEmbed = !!(mf && mf.src.indexOf('output=embed') > -1);
  out.storeHours = !!document.querySelector('.store-hours');
  out.headingText = (document.querySelector('.branch-header h2') || {}).textContent || null;
  var cards = [].slice.call(document.querySelectorAll('.branch-card'));
  out.cardCount = cards.length;
  out.cards = cards.map(rect);
  out.gridCols = getComputedStyle(document.querySelector('.branch-grid')).gridTemplateColumns.split(' ').filter(Boolean).length;
  out.mapRect = rect(document.querySelector('.map-box'));
  out.tabsRect = rect(document.querySelector('.branch-tabs'));
  out.tabRect = rect(document.querySelector('.branch-tab.is-active'));
  out.badgeText = document.getElementById('branchMapLabel').textContent;
  out.frameSrc = document.getElementById('branchMapFrame').getAttribute('src');
  out.frameId = document.getElementById('branchMapFrame').id;
  out.mapIframes = document.querySelectorAll('iframe[src*="output=embed"]').length;
  out.mallIconBg = getComputedStyle(document.querySelector('.branch-card[data-branch="mall"] .branch-icon')).backgroundImage;
  out.activeTabBg = getComputedStyle(document.querySelector('.branch-tab.is-active')).backgroundImage;
  out.callBg = getComputedStyle(call).backgroundImage;

  document.querySelector('.branch-tab[data-branch="mobile"]').click();
  out.aMobileBadge = document.getElementById('branchMapLabel').textContent;
  out.aMobileSrc = document.getElementById('branchMapFrame').getAttribute('src');
  out.aMobileTabOn = document.querySelector('.branch-tab[data-branch="mobile"]').classList.contains('is-active');
  out.aMallTabOn = document.querySelector('.branch-tab[data-branch="mall"]').classList.contains('is-active');
  out.aMallPressed = document.querySelector('.branch-tab[data-branch="mall"]').getAttribute('aria-pressed');
  out.aMobilePressed = document.querySelector('.branch-tab[data-branch="mobile"]').getAttribute('aria-pressed');
  out.aMobileCardOn = cards[1].classList.contains('is-active');
  out.aMallCardOn = cards[0].classList.contains('is-active');

  out.overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  out.innerWidth = window.innerWidth;
  return JSON.stringify(out);
})()
'@

# Second pass, run AFTER the border-color transition settles: samples the active
# (mobile) card's painted styles, then switches back through the card itself.
$jsB = @'
(function () {
  var out = {};
  var cards = document.querySelectorAll('.branch-card');
  var mc = cards[1];
  var cs = getComputedStyle(mc);
  out.aMobileCardBorder = cs.borderTopColor;
  out.aMobileCardShadow = cs.boxShadow;
  out.mobileTagColor = getComputedStyle(mc.querySelector('.branch-tag')).color;
  out.mobileIconBg = getComputedStyle(mc.querySelector('.branch-icon')).backgroundImage;
  out.activeTabBg = getComputedStyle(document.querySelector('.branch-tab[data-branch="mobile"]')).backgroundImage;
  out.mallIconBg = getComputedStyle(document.querySelector('.branch-card[data-branch="mall"] .branch-icon')).backgroundImage;
  out.aMobileBtnPad = getComputedStyle(mc.querySelector('.btn-call')).paddingTop;

  cards[0].click();
  out.bBadge = document.getElementById('branchMapLabel').textContent;
  out.bSrc = document.getElementById('branchMapFrame').getAttribute('src');
  out.bMallTabOn = document.querySelector('.branch-tab[data-branch="mall"]').classList.contains('is-active');
  out.bMobileCardOn = document.querySelectorAll('.branch-card')[1].classList.contains('is-active');
  out.overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return JSON.stringify(out);
})()
'@

function Merge($target, $extra) {
  foreach ($p in $extra.PSObject.Properties) {
    $target | Add-Member -NotePropertyName $p.Name -NotePropertyValue $p.Value -Force
  }
  return $target
}

function Showroom-Clip([int]$vw) {
  $v = Eval-Js $showroomJs
  if (-not $v) { return $null }
  $p = $v -split ','
  return @{ x = 0; y = [int]$p[0]; width = $vw; height = ([int]$p[1] - [int]$p[0]) }
}

$fails = @()
function Check([bool]$ok, [string]$msg) { if (-not $ok) { $script:fails += $msg } }

function Assert-Report($r, [string]$label) {
  Check ($r.actionsCount -eq 2) "actionsCount=$($r.actionsCount)"
  Check ($r.callHref -like 'tel:*') "callHref=$($r.callHref)"
  Check ($r.mapsHref -like '*google.com/maps*') "mapsHref=$($r.mapsHref)"
  Check ($r.mapEmbed -eq $true) 'mapEmbed false'
  Check ($r.storeHours -eq $true) 'storeHours missing'
  Check ($r.headingText -like '*Visit Our Showroom*') "heading=$($r.headingText)"
  Check ($r.cardCount -eq 2) "cardCount=$($r.cardCount)"
  Check ($r.mapIframes -eq 1) "embedded map iframes=$($r.mapIframes) (want exactly 1)"
  Check ($r.frameId -eq 'branchMapFrame') "frameId=$($r.frameId)"
  if ($r.overflowX -gt 0) { $fails += "$label overflowX=$($r.overflowX)" }
}


# ---------- desktop ----------
Set-Vp 1280 1600
Goto-Page "$site/index.html"
$d = (Eval-Js $js) | ConvertFrom-Json
Start-Sleep -Milliseconds 700
$d = Merge $d ((Eval-Js $jsB) | ConvertFrom-Json)
Assert-Report $d 'desktop'
Check ($d.gridCols -eq 2) "desktop gridCols=$($d.gridCols) (want 2)"
Check ($d.cards[0].t -eq $d.cards[1].t) "desktop cards not on one row (@$($d.cards[0].t) vs $($d.cards[1].t))"
Check ($d.cards[0].l -lt $d.cards[1].l) 'desktop card order wrong'
Check ($d.aMobileBadge -like '*Mobile Gallery*') "after-mobile badge=$($d.aMobileBadge)"
Check ($d.aMobileSrc -like '*Patidar%20Mobile%20Gallery*') "after-mobile src=$($d.aMobileSrc)"
Check ($d.aMobileTabOn -eq $true) 'mobile tab not active after click'
Check ($d.aMallTabOn -eq $false) 'mall tab still active after mobile click'
Check ($d.aMallPressed -eq 'false' -and $d.aMobilePressed -eq 'true') 'aria-pressed out of sync'
Check ($d.aMobileCardOn -eq $true -and $d.aMallCardOn -eq $false) 'card highlight out of sync'
Check ($d.aMobileCardBorder -ne 'rgb(226, 232, 240)') "mobile card border not accented ($($d.aMobileCardBorder))"
Check ($d.aMobileCardShadow -like '*37, 211, 102*') "mobile card shadow not green ($($d.aMobileCardShadow))"
Check ($d.mobileTagColor -eq 'rgb(21, 128, 61)') "mobile tag color=$($d.mobileTagColor)"
Check ($d.bBadge -like '*Main Showroom*') "back-to-mall badge=$($d.bBadge)"
Check ($d.bSrc -like '*Sagore%20Bus%20Stand*') "back-to-mall src=$($d.bSrc)"
Check ($d.bMallTabOn -eq $true) 'mall tab not restored after card click'
Check ($d.bMobileCardOn -eq $false) 'mobile card still highlighted'
Check ($d.mallIconBg -like '*gradient*') 'mall icon gradient missing'
Check ($d.mobileIconBg -like '*gradient*') 'mobile icon gradient missing'
Check ($d.callBg -like '*gradient*') 'call button gradient missing'
Check ($d.activeTabBg -like '*gradient*') 'active tab gradient missing'
Check ($d.tabsRect.w -gt 0) 'tabs have no width'
Save-Shot (Join-Path $root '_vb_showroom_desktop.png') (Showroom-Clip 1280)

# ---------- mobile ----------
Set-Vp 375 812
Goto-Page "$site/index.html"
$m = (Eval-Js $js) | ConvertFrom-Json
Start-Sleep -Milliseconds 700
$m = Merge $m ((Eval-Js $jsB) | ConvertFrom-Json)
Assert-Report $m 'mobile375'
Check ($m.gridCols -eq 1) "mobile gridCols=$($m.gridCols) (want 1)"
Check ($m.cards[1].t -gt $m.cards[0].t) 'mobile cards not stacked'
Check ($m.tabsRect.w -le 375) "mobile tabs overflow container (w=$($m.tabsRect.w))"
Check ($m.tabRect.h -le 48) "mobile tab wrapped onto 2 lines (h=$($m.tabRect.h))"
Check ($m.tabRect.w -lt $m.tabsRect.w) "mobile tab wider than its track (w=$($m.tabRect.w) track=$($m.tabsRect.w))"
Check ($m.mapRect.w -le 375) "mobile map overflows (w=$($m.mapRect.w))"
Check ($m.aMobileSrc -like '*Patidar%20Mobile%20Gallery*') 'mobile: map did not re-point'
Check ($m.bSrc -like '*Sagore%20Bus%20Stand*') 'mobile: map did not restore'
Save-Shot (Join-Path $root '_vb_showroom_mobile.png') (Showroom-Clip 375)

# ---------- summary ----------
Write-Output ''
Write-Output "desktop: cards=($($d.cards[0].l),$($d.cards[0].t)) ($($d.cards[1].l),$($d.cards[1].t)) tabsW=$($d.tabsRect.w) mapW=$($d.mapRect.w) overflowX=$($d.overflowX)"
Write-Output "mobile : cards=($($m.cards[0].l),$($m.cards[0].t)) ($($m.cards[1].l),$($m.cards[1].t)) tabsW=$($m.tabsRect.w) mapW=$($m.mapRect.w) overflowX=$($m.overflowX)"
Write-Output "default: $($d.badgeText) | $($d.frameSrc)"
Write-Output "mobile map src: $($d.aMobileSrc)"
Write-Output "restored src  : $($d.bSrc)"
if ($fails.Count -eq 0) { Write-Output 'SHOWROOM VERIFY: ALL PASS' } else { Write-Output ('SHOWROOM VERIFY: FAIL -> ' + ($fails -join ' | ')) }

$ws.Dispose()
try { $proc.Kill() } catch { }
