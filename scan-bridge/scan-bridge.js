// ============================================================
// 🔌 scan-bridge.js v1.0 — برنامج وسيط بين المتصفح وأجهزة السكانر (TWAIN / WIA / eSCL)
// يعمل على جهاز المستخدم المتصل بالسكانر، ويستمع على 127.0.0.1 فقط.
// بلا مكتبات خارجية: يحتاج Node.js 16+ فقط.
//   المحركات:  1) NAPS2 (يدعم TWAIN و WIA و eSCL)   2) WIA عبر PowerShell (ويندوز، بلا تثبيت)
// ============================================================
'use strict';
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const { execFile } = require('child_process');

const VERSION = '1.2', PORT = +process.env.SCAN_BRIDGE_PORT || 17890, HOST = '127.0.0.1';
const CFG_FILE = path.join(__dirname, 'scan-bridge.json');
const DEFAULT_CFG = {
    // المواقع المسموح لها باستخدام السكانر (الصفحة التي تفتح منها البرنامج)
    allowedOrigins: ['https://markingdchc.github.io', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    naps2Path: ''            // اتركه فارغاً للبحث التلقائي
};
let cfg = { ...DEFAULT_CFG };
try { cfg = { ...DEFAULT_CFG, ...JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) }; }
catch (e) { try { fs.writeFileSync(CFG_FILE, JSON.stringify(DEFAULT_CFG, null, 2)); } catch (_) { } }

const FAKE = process.env.SCAN_FAKE === '1';          // وضع اختبار بلا جهاز
const IS_WIN = process.platform === 'win32';
let busy = false;
const START = Date.now(), ERRORS = [];
const noteErr = (m) => { ERRORS.unshift(new Date().toLocaleTimeString() + ' — ' + String(m).slice(0, 300)); ERRORS.length = Math.min(ERRORS.length, 20); };

// ---------- أدوات ----------
const run = (cmd, args, opt = {}) => new Promise((res, rej) =>
    execFile(cmd, args, { windowsHide: true, maxBuffer: 64 * 1024 * 1024, timeout: opt.timeout || 120000, encoding: 'utf8' },
        (e, so, se) => e ? rej(Object.assign(e, { stdout: so, stderr: se })) : res({ stdout: so, stderr: se })));

function findNaps2() {
    const c = [cfg.naps2Path, process.env.NAPS2_PATH,
        'C:\\Program Files\\NAPS2\\NAPS2.Console.exe', 'C:\\Program Files (x86)\\NAPS2\\NAPS2.Console.exe',
        path.join(os.homedir(), 'AppData\\Local\\Programs\\NAPS2\\NAPS2.Console.exe'),
        '/Applications/NAPS2.app/Contents/MacOS/NAPS2', '/usr/bin/naps2', '/opt/naps2/naps2'].filter(Boolean);
    return c.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } }) || null;
}

// ---------- WIA عبر PowerShell ----------
const PS_LIST = `
$ErrorActionPreference='Stop'
$dm = New-Object -ComObject WIA.DeviceManager
$out=@(); foreach($d in $dm.DeviceInfos){ if($d.Type -eq 1){ $out += [pscustomobject]@{id=$d.DeviceID;name=($d.Properties.Item('Name').Value)} } }
ConvertTo-Json -InputObject @($out) -Compress`;

const PS_SCAN = `
param([string]$Id,[string]$Dir,[int]$Dpi,[int]$Color,[int]$Feeder)
$ErrorActionPreference='Stop'
$dm = New-Object -ComObject WIA.DeviceManager
$info = $null; foreach($d in $dm.DeviceInfos){ if($d.DeviceID -eq $Id -or -not $Id){ $info=$d; break } }
if(-not $info){ throw 'device not found' }
$dev = $info.Connect(); $item = $dev.Items.Item(1)
function SetP($o,$id,$v){ try{ $p=$o.Properties.Item("$id"); $p.Value=$v }catch{} }
SetP $item 6147 $Dpi; SetP $item 6148 $Dpi; SetP $item 6146 $Color      # 1=BW 2=Gray 4=Color
if($Feeder -eq 1){ SetP $dev 3088 1 } else { SetP $dev 3088 2 }          # 1=ADF 2=Flatbed
$n=0
while($true){
  try{ $img = $item.Transfer('{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}') }catch{ break }   # JPEG
  $n++; $img.SaveFile((Join-Path $Dir ('page{0:D3}.jpg' -f $n)))
  if($Feeder -ne 1){ break }
}
if($n -eq 0){ throw 'no pages (feeder empty?)' }`;

async function ps(script, args = []) {
    const f = path.join(os.tmpdir(), 'sb_' + process.pid + '_' + Date.now() + '.ps1');
    fs.writeFileSync(f, '\ufeff' + script);
    try { return await run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', f, ...args], { timeout: 300000 }); }
    finally { fs.unlink(f, () => { }); }
}

// ---------- الأجهزة ----------
async function listDevices() {
    if (FAKE) return [{ id: 'fake:1', name: 'جهاز تجريبي', driver: 'fake' }];
    const out = [], n2 = findNaps2();
    if (n2) {
        for (const drv of ['twain', 'wia', 'escl']) {
            if (drv === 'wia' && !IS_WIN) continue;
            try {
                const r = await run(n2, ['--listdevices', '--driver', drv], { timeout: 20000 });
                r.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(name => out.push({ id: drv + ':' + name, name: name + ' (' + drv.toUpperCase() + ')', driver: drv, engine: 'naps2', device: name }));
            } catch (e) { /* السائق غير مدعوم على هذا الجهاز */ }
        }
    }
    if (IS_WIN && !out.length) {   // بدون NAPS2: WIA الأصلي
        try {
            const r = await ps(PS_LIST);
            const j = JSON.parse(r.stdout.trim() || '[]'); (Array.isArray(j) ? j : [j]).forEach(d => d && d.id && out.push({ id: 'wia:' + d.id, name: d.name + ' (WIA)', driver: 'wia', engine: 'wia', device: d.id }));
        } catch (e) { }
    }
    return out;
}

// ---------- المسح ----------
async function scan(o) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-'));
    const dpi = Math.min(600, Math.max(75, +o.dpi || 200)), color = ['color', 'gray', 'bw'].includes(o.color) ? o.color : 'color';
    const source = ['glass', 'feeder', 'duplex'].includes(o.source) ? o.source : 'glass';
    try {
        if (FAKE) {   // صورتان 1×1 للاختبار
            const px = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
            for (let i = 1; i <= (source === 'glass' ? 1 : 2); i++) fs.writeFileSync(path.join(dir, 'page' + i + '.png'), Buffer.from(px, 'base64'));
        } else {
            const dev = (o.device || '').trim(), kind = dev.split(':')[0], name = dev.slice(kind.length + 1);
            if (kind === 'wia' && (!findNaps2() || !(o.engine === 'naps2'))) {
                await ps(PS_SCAN, ['-Id', name, '-Dir', dir, '-Dpi', String(dpi), '-Color', color === 'bw' ? '1' : color === 'gray' ? '2' : '4', '-Feeder', source === 'glass' ? '0' : '1']);
            } else {
                const n2 = findNaps2(); if (!n2) throw new Error('NAPS2 غير مثبّت');
                const args = ['-o', path.join(dir, 'page.jpg'), '--noprofile', '--force', '--driver', kind, '--dpi', String(dpi),
                    '--bitdepth', color, '--source', source];
                if (name) args.push('--device', name);
                await run(n2, args, { timeout: 300000 });
            }
        }
        const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        if (!files.length) throw new Error('لم يُنتج السكانر صفحات (تحقق من الورق/الغطاء)');
        return files.map(f => ({ name: f, mime: /png$/i.test(f) ? 'image/png' : 'image/jpeg', base64: fs.readFileSync(path.join(dir, f)).toString('base64') }));
    } finally { fs.rm(dir, { recursive: true, force: true }, () => { }); }
}

// ---------- الخادم ----------
const send = (res, code, obj, h = {}) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...h }); res.end(JSON.stringify(obj)); };
http.createServer(async (req, res) => {
    const origin = req.headers.origin || '';
    const okOrigin = !origin || cfg.allowedOrigins.includes('*') || cfg.allowedOrigins.includes(origin);
    // رؤوس CORS تُرسل دائماً (ليستطيع المتصفح قراءة سبب الرفض)، أما التنفيذ فيُمنع لغير المسموح
    const cors = origin ? {
        'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Private-Network': 'true', 'Access-Control-Max-Age': '600'
    } : {};
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    const url = (req.url || '').split('?')[0];
    try {
        if (url === '/ping') return send(res, 200, { ok: true, version: VERSION, allowed: okOrigin, origin, platform: process.platform, engine: FAKE ? 'fake' : (findNaps2() ? 'naps2' : (IS_WIN ? 'wia' : 'none')) }, cors);
        if (!okOrigin) { noteErr('رُفض موقع غير مسموح: ' + origin + ' — أضفه إلى allowedOrigins في scan-bridge.json'); console.log('⛔ موقع غير مسموح:', origin); return send(res, 403, { error: 'هذا الموقع غير مسموح: ' + origin, origin }, cors); }
        if (url === '/diag') return send(res, 200, { version: VERSION, node: process.version, platform: process.platform + ' ' + os.release(), naps2: findNaps2(), allowedOrigins: cfg.allowedOrigins, uptimeMin: Math.round((Date.now() - START) / 60000), errors: ERRORS }, cors);
        if (url === '/devices') return send(res, 200, { devices: await listDevices() }, cors);
        if (url === '/scan' && req.method === 'POST') {
            if (busy) return send(res, 409, { error: 'السكانر مشغول' }, cors);
            let body = ''; for await (const c of req) { body += c; if (body.length > 1e5) throw new Error('too large'); }
            busy = true;
            try { return send(res, 200, { pages: await scan(JSON.parse(body || '{}')) }, cors); } finally { busy = false; }
        }
        send(res, 404, { error: 'not found' }, cors);
    } catch (e) { noteErr(url + ': ' + (e.message || e)); send(res, 500, { error: String(e.message || e).slice(0, 500) }, cors); }
}).on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? '❌ المنفذ ' + PORT + ' مشغول — الوسيط يعمل بالفعل (ربما نسخة قديمة). شغّل stop-scan-bridge.bat ثم أعد المحاولة.' : '❌ ' + e.message); process.exit(1); }).listen(PORT, HOST, () => {
    console.log(`🔌 Scan Bridge v${VERSION} يعمل على http://${HOST}:${PORT}  (المحرك: ${FAKE ? 'تجريبي' : (findNaps2() ? 'NAPS2' : (IS_WIN ? 'WIA' : 'لا يوجد'))})`);
    console.log('   المواقع المسموحة:', cfg.allowedOrigins.join(' , '));
});
