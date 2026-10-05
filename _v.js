const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9399;
const PAGE = "file:///C:/Users/Keshav/Desktop/shop/mobiles.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PROBE = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await sleep(600);
  const s = document.getElementById("searchInput");
  s.value = "F25"; s.dispatchEvent(new Event("input", { bubbles: true }));
  await sleep(5000);
  return JSON.stringify([...document.querySelectorAll(".product-card")].map(c => {
    const img = c.querySelector("img.product-image");
    const src = img.getAttribute("src") || "";
    const b = img.getBoundingClientRect();
    return {
      name: c.querySelector(".product-name").textContent,
      spec: c.querySelector(".product-spec").textContent,
      src, natural: img.naturalWidth + "x" + img.naturalHeight,
      loaded: img.naturalWidth > 0,
      wireframe: src.startsWith("data:image/svg+xml"),
      rendered: Math.round(b.width) + "x" + Math.round(b.height)
    };
  }), null, 2);
})()`;
(async () => {
  const profile = path.join(__dirname, "_f25p");
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox",
    `--remote-debugging-port=${PORT}`, "--user-data-dir=" + profile, PAGE], { stdio: "ignore" });
  let target = null;
  for (let i = 0; i < 40 && !target; i++) { await sleep(400);
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = l.find(t => t.type === "page" && t.webSocketDebuggerUrl); } catch (e) {} }
  if (!target) { console.log("CDP FAIL"); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (m, p) => new Promise(r => { const i = ++id; pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); });
  await new Promise(r => (ws.onopen = r));
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: PAGE });
  await sleep(4000);
  const res = await send("Runtime.evaluate", { expression: PROBE, awaitPromise: true, returnByValue: true });
  console.log(res.result && res.result.value ? res.result.value : JSON.stringify(res));
  ws.close(); chrome.kill(); await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  process.exit(0);
})();