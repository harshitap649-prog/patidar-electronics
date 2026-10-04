. 'c:\Users\Keshav\Desktop\shop\_tv_cdp.ps1'
$URLS = @(
  'https://m.media-amazon.com/images/I/71L-P21lGfL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71d5fMD3P0L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/81x2m1-2g9L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71S8T943A7L._SL1500_.jpg'
)
Start-Cdp
try {
  Goto-Page 'about:blank'
  # Load each URL as a top-level image in the real browser network stack.
  foreach ($u in $URLS) {
    $res = Eval-Js @"
(function(){
  return new Promise(function(resolve){
    var im = new Image();
    im.crossOrigin = 'anonymous';
    var done = false;
    var t = setTimeout(function(){ if(!done){done=true; resolve(JSON.stringify({url:'$(($u -split '/')[-1])', status:'TIMEOUT'}));} }, 25000);
    im.onload = function(){ if(done)return; done=true; clearTimeout(t); resolve(JSON.stringify({url:im.src.split('/').pop(), status:'LOADED', w:im.naturalWidth, h:im.naturalHeight})); };
    im.onerror = function(){ if(done)return; done=true; clearTimeout(t); resolve(JSON.stringify({url:im.src.split('/').pop(), status:'ERROR', w:im.naturalWidth})); };
    im.src = '$(($u -replace "'", "\'"))';
  });
})()
"@ 35000
    Write-Output "  $res"
  }
} finally { Stop-Cdp }