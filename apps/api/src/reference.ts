export const apiReference = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>Random API / Local REST</title>
<style>
:root{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#e5e0ed;background:#0e0f12;color-scheme:dark;line-height:1.7}*{box-sizing:border-box}body{margin:0}header{border-bottom:1px solid #2d2936;padding:22px max(24px,calc((100vw - 1060px)/2));display:flex;justify-content:space-between;align-items:center;font-size:15px;letter-spacing:-.4px}header strong{color:#c8b3f5}header span{font-size:10px;color:#a8cdb2;border:1px solid #33433a;border-radius:20px;padding:4px 12px;letter-spacing:.5px}main{max-width:1060px;margin:55px auto;padding:0 24px}.eyebrow{font-size:10px;letter-spacing:2px;color:#c0a9e3}h1{font-size:clamp(30px,5vw,47px);line-height:1.2;font-weight:550;letter-spacing:-1.8px;margin:18px 0}h1 span{color:#a397b5}p{color:#a99fb9;font-size:13px;max-width:700px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:35px}.card{padding:25px;border:1px solid #34303d;border-radius:10px;background:#16151c;min-width:0}h2{font-size:16px;font-weight:500;letter-spacing:-.3px}.method{font:10px ui-monospace,monospace;background:#2c253b;color:#d7b8ff;border-radius:4px;padding:5px 8px;margin-right:8px}.get{color:#aad9b5;background:#223129}pre{padding:18px;background:#101014;border:1px solid #2e2938;border-radius:7px;overflow:auto;line-height:1.8;font-size:11px;color:#c9b8de}code{font-family:ui-monospace,monospace;color:#d2c2e6}.wide{grid-column:1/-1}a{color:#c8b3f5}footer{margin-top:35px;border-top:1px solid #2e2936;padding:20px 0;color:#95899f;font-size:11px}li{color:#aaa0b7;font-size:12px;padding:3px 0}@media(max-width:680px){main{margin-top:35px}.grid{grid-template-columns:minmax(0,1fr)}.wide{grid-column:auto}header{padding:18px 24px}}
</style></head><body>
<header><strong>random<span style="color:#a59ab5">api</span> / developers</strong><span>LOOPBACK ONLY</span></header>
<main><div class="eyebrow">THE LOCAL REST INTERFACE</div><h1>A small API.<br><span>Fresh possibilities.</span></h1>
<p>Build synthetic records from field names and explicit settings. Your source JSON belongs on your device, never in an API request. This service is optional: web, desktop and CLI generation work independently.</p>
<div class="grid"><section class="card"><h2><span class="method get">GET</span><code>/health</code></h2><p>A minimal readiness check. No source data, request logging or external services.</p><pre>curl http://127.0.0.1:3000/health

{"status":"ok"}</pre><a href="/health">Check this service &rarr;</a></section>
<section class="card"><h2><span class="method">POST</span><code>/generate</code></h2><p>Accepts a seed, record count, format and field definitions. Only object records; arrays of source data and inferred schemas are not accepted.</p><pre>{
  "seed": "demo",
  "count": 2,
  "format": "json",
  "fields": [
    {"path":["id"],"generator":"uuid"},
    {"path":["email"],"generator":"email"}
  ]
}</pre></section>
<section class="card wide"><h2>Make your first request.</h2><pre>curl http://127.0.0.1:3000/generate \\
  -H 'Content-Type: application/json' \\
  -d '{"seed":"demo","count":2,"format":"json","fields":[{"path":["email"],"generator":"email"}]}'</pre><p>Use <code>"format":"csv"</code> for spreadsheet-ready output. Generators: <code>email</code>, <code>name</code>, <code>date</code>, <code>uuid</code>, <code>string</code>, <code>number</code>, <code>boolean</code>. Paths are segment arrays: <code>["profile","email"]</code> means nesting; <code>["profile.email"]</code> is a literal key.</p></section>
<section class="card wide"><h2>Local by default. Deliberately bounded.</h2><ul><li>1–1000 records, 1–200 fields, 100000 generated values and 100 levels of nesting.</li><li>64 KiB request bodies; 120 requests per minute per local service. Unknown properties are rejected.</li><li>No source documents, example values, inferred types or credentials. No browser-origin generation requests.</li><li>Responses are not cached. Validation failures are generic and never reflect request content.</li><li>No authentication. Do not expose this service publicly. Keys can themselves contain personal information.</li></ul></section></div>
<footer>randomapi / One local engine. Web, CLI, REST and Electron.</footer></main></body></html>`;
