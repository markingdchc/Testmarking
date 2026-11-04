// ============================================================
// 📠 scanner.js v2.1 — مسح المستندات إلى الأرشيف (أي سكانر، أي مستخدم)
// الإدخال: سكانر مباشر (عبر scan-bridge) | مجلد مسح | كاميرا | رفع ملفات
// الجديد 2.0: OCR لاقتراح رقم الحاوية (ISO 6346) · محرر صفحة (قص/ميل/تباين/أبيض وأسود)
//             حذف الصفحات الفارغة · نوع المستند · PDF قابل للبحث · ضغط ذكي
//             سجل مسح مشترك · تشخيص الوسيط · تنبيه بإصدار الوسيط
// ============================================================
(function () {
    'use strict';
    const MAX_PX = 2000, JPEG_Q = 0.8, POLL_MS = 3000;
    const REQUIRED_BRIDGE = '1.2';
    const TESS_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    const LEVELS = [{ px: MAX_PX, q: JPEG_Q }, { px: 1600, q: 0.65 }, { px: 1300, q: 0.5 }, { px: 1000, q: 0.42 }];
    const limitBytes = () => window.SCANNER_LIMIT_BYTES || 20 * 1024 * 1024;
    const IMG_RE = /\.(jpe?g|png|bmp|tiff?|webp)$/i, PDF_RE = /\.pdf$/i;
    const DOC_TYPES = [['', 'بدون نوع'], ['BL', 'بوليصة شحن (BL)'], ['INVOICE', 'فاتورة'], ['PACKING_LIST', 'قائمة تعبئة'], ['DO', 'إذن تسليم (DO)'], ['RECEIPT', 'إيصال'], ['CUSTOMS', 'جمارك'], ['OTHER', 'أخرى']];
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
    };
    const today = () => new Date().toISOString().slice(0, 10);

    // ============================================================
    // أدوات مشتركة (لا تعتمد على نافذة معينة)
    // ============================================================
    const fileToDataUrl = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
    const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

    function otsu(gray) {      // عتبة أوتسو لتحويل المستند لأبيض وأسود
        const hist = new Array(256).fill(0); for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
        const total = gray.length; let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
        let sB = 0, wB = 0, mx = 0, th = 128;
        for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = total - wB; if (!wF) break; sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF); if (v > mx) { mx = v; th = t; } }
        return th;
    }
    // المعالجة: تدوير + ميل + سطوع/تباين + قص + أبيض وأسود
    async function processImage(src, ops, maxPx, q) {
        ops = ops || {};
        const im = await loadImg(src);
        let w = im.naturalWidth, h = im.naturalHeight; const k = Math.min(1, maxPx / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
        const rot = (((ops.rot || 0) % 360) + 360) % 360, sw = rot % 180 ? h : w, sh = rot % 180 ? w : h;
        let c = mkCanvas(sw, sh), x = c.getContext('2d'); x.fillStyle = ops.fill || '#fff'; x.fillRect(0, 0, sw, sh);
        x.translate(sw / 2, sh / 2); x.rotate(rot * Math.PI / 180 + (ops.angle || 0) * Math.PI / 180);
        const f = []; if (ops.contrast && ops.contrast !== 1) f.push('contrast(' + ops.contrast + ')'); if (ops.brightness && ops.brightness !== 1) f.push('brightness(' + ops.brightness + ')'); if (ops.gray || ops.bw) f.push('grayscale(1)');
        if (f.length) x.filter = f.join(' ');
        x.drawImage(im, -w / 2, -h / 2, w, h);
        if (ops.crop) {
            const cr = ops.crop, c2 = mkCanvas(cr.w * sw, cr.h * sh);
            c2.getContext('2d').drawImage(c, cr.x * sw, cr.y * sh, cr.w * sw, cr.h * sh, 0, 0, c2.width, c2.height); c = c2;
        }
        if (ops.bw) {
            const cx = c.getContext('2d'), id = cx.getImageData(0, 0, c.width, c.height), d = id.data, g = new Uint8Array(d.length / 4);
            for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
            const th = otsu(g); for (let i = 0, j = 0; i < d.length; i += 4, j++) { const v = g[j] > th ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; }
            cx.putImageData(id, 0, 0);
        }
        return { url: c.toDataURL('image/jpeg', q), w: c.width, h: c.height };
    }
    async function smallGray(src, width) {
        const im = await loadImg(src), k = Math.min(1, width / im.naturalWidth), c = mkCanvas(im.naturalWidth * k, im.naturalHeight * k), x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        return c;
    }
    // نسبة الحبر: هل الصفحة فارغة؟
    async function isBlank(src) {
        try {
            const c = await smallGray(src, 180), w = c.width, h = c.height, mx = Math.round(w * 0.05), my = Math.round(h * 0.05);
            const d = c.getContext('2d').getImageData(mx, my, w - 2 * mx, h - 2 * my).data; let n = d.length / 4, s = 0;
            for (let i = 0; i < d.length; i += 4) s += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
            const m = s / n; let ink = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114 < m - 45) ink++;
            return ink / n < 0.002;
        } catch (e) { return false; }
    }
    // تقدير ميل الصفحة (بالدرجات): نختار الزاوية التي تجعل أسطر النص أوضح (أعلى تباين للصفوف)
    async function estimateSkew(src) {
        const base = await smallGray(src, 360), W = base.width, H = base.height;
        const score = (ang) => {
            const c = mkCanvas(W, H), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
            x.translate(W / 2, H / 2); x.rotate(ang * Math.PI / 180); x.drawImage(base, -W / 2, -H / 2);
            const d = x.getImageData(0, 0, W, H).data; let s = 0; const mean = (() => { let t = 0; for (let i = 0; i < d.length; i += 16) t += d[i]; return t / (d.length / 16); })();
            const rows = new Float64Array(H);
            for (let yy = 0; yy < H; yy++) { let r = 0; for (let xx = 0; xx < W; xx++) if (d[(yy * W + xx) * 4] < mean - 40) r++; rows[yy] = r; }
            for (let yy = 1; yy < H; yy++) { const df = rows[yy] - rows[yy - 1]; s += df * df; }
            return s;
        };
        let best = 0, bs = -1; for (let a = -8; a <= 8; a += 0.5) { const v = score(a); if (v > bs) { bs = v; best = a; } }
        const c0 = best; for (let a = c0 - 0.5; a <= c0 + 0.5; a += 0.1) { const v = score(a); if (v > bs) { bs = v; best = a; } }
        return Math.round(best * 10) / 10;
    }
    // حذف الحواف الخارجية: يكشف حدود الورقة (الحواف الداكنة/ظل غطاء السكانر/زوايا الميل) ويرجع مستطيل قص نسبي أو null
    async function estimateCropBox(src, rot, angle) {
        const r = await processImage(src, { rot: rot || 0, angle: angle || 0, fill: '#000' }, 420, 0.8);
        const c = await smallGray(r.url, 300), W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data;
        const g = new Uint8Array(W * H); for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
        const th = Math.max(70, Math.min(190, otsu(g)));
        const lineOk = (isRow, i, a, b) => { let n = 0; for (let k = a; k <= b; k++) if ((isRow ? g[i * W + k] : g[k * W + i]) > th) n++; return n / (b - a + 1) >= 0.3; };
        const edge = (isRow, len, a, b, fromEnd) => {
            for (let t = 0; t < len - 3; t++) { const i = fromEnd ? len - 1 - t : t; let ok = true; for (let q = 0; q < 3 && ok; q++) ok = lineOk(isRow, fromEnd ? i - q : i + q, a, b); if (ok) return i; }
            return -1;
        };
        let y0 = edge(true, H, 0, W - 1, false), y1 = edge(true, H, 0, W - 1, true);
        if (y0 < 0 || y1 <= y0) return null;
        let x0 = edge(false, W, y0, y1, false), x1 = edge(false, W, y0, y1, true);
        if (x0 < 0 || x1 <= x0) return null;
        y0 = Math.max(y0, edge(true, H, x0, x1, false)); y1 = Math.min(y1, edge(true, H, x0, x1, true));
        if (y1 <= y0) return null;
        const ins = 0.006, L = x0 / W, T = y0 / H, R = (W - 1 - x1) / W, B = (H - 1 - y1) / H;
        if (Math.max(L, T, R, B) < 0.008) return null;      // لا توجد حواف ملحوظة
        const bx = { x: Math.min(0.4, L + (L > 0.004 ? ins : 0)), y: Math.min(0.4, T + (T > 0.004 ? ins : 0)) };
        bx.w = 1 - bx.x - Math.min(0.4, R + (R > 0.004 ? ins : 0)); bx.h = 1 - bx.y - Math.min(0.4, B + (B > 0.004 ? ins : 0));
        if (bx.w * bx.h < 0.55) return null;                // أمان: لا نقص أكثر من اللازم
        return bx;
    }
    // ISO 6346
    function isoValid(code) {
        const vals = {}; let v = 10; for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') { if (v % 11 === 0) v++; vals[ch] = v++; }
        let sum = 0; for (let i = 0; i < 10; i++) { const n = i < 4 ? vals[code[i]] : +code[i]; if (n === undefined || isNaN(n)) return false; sum += n * Math.pow(2, i); }
        return (sum % 11) % 10 === +code[10];
    }
    function detectContainers(text) {
        const T = String(text || '').toUpperCase(), found = new Map();
        const add = (c) => { if (!found.has(c)) found.set(c, isoValid(c)); };
        let m; const re1 = /([A-Z]{3}[UJZ])[\s\-.]?(\d{6})[\s\-.]?(\d)/g; while ((m = re1.exec(T))) add(m[1] + m[2] + m[3]);
        const fix = { O: '0', I: '1', L: '1', S: '5', B: '8', Z: '2', G: '6', Q: '0' };
        const re2 = /([A-Z]{3}[A-Z0-9])[\s\-.]?([A-Z0-9]{6})[\s\-.]?([A-Z0-9])/g;
        while ((m = re2.exec(T))) {
            const own = m[1].slice(0, 3), eq = m[1][3] === '0' ? 'U' : m[1][3];
            const digs = (m[2] + m[3]).split('').map(ch => /\d/.test(ch) ? ch : (fix[ch] || '?')).join('');
            if (/^\d{7}$/.test(digs) && /[UJZ]/.test(eq)) { const c = own + eq + digs; if (isoValid(c)) add(c); }
        }
        return Array.from(found, ([code, valid]) => ({ code, valid })).sort((a, b) => b.valid - a.valid);
    }
    // OCR (Tesseract.js يُحمَّل عند الحاجة فقط)
    let ocrP = null;
    const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('تعذّر تحميل محرك القراءة (تحقق من الاتصال بالإنترنت)')); document.head.appendChild(s); });
    function ocrWorker() {
        if (!ocrP) ocrP = (async () => { if (!window.Tesseract) await loadScript(TESS_URL); return await window.Tesseract.createWorker('eng'); })().catch(e => { ocrP = null; throw e; });
        return ocrP;
    }
    function flattenWords(data) {
        if (Array.isArray(data.words) && data.words.length) return data.words.map(w => ({ t: w.text, b: w.bbox }));
        const out = []; (data.blocks || []).forEach(b => (b.paragraphs || []).forEach(p => (p.lines || []).forEach(l => (l.words || []).forEach(w => out.push({ t: w.text, b: w.bbox })))));
        return out;
    }
    async function ocrImage(url) {
        const w = await ocrWorker(), r = await w.recognize(url), im = await loadImg(url);
        return { for: url, w: im.naturalWidth, h: im.naturalHeight, text: r.data.text || '', words: flattenWords(r.data) };
    }
    // GitHub: قراءة _info.json لسجل المسح (مشترك بين المستخدمين)
    async function ghInfo(folder) {
        const token = store.get('github_token', ''); if (!token || typeof GH_OWNER === 'undefined') return null;
        const r = await fetch('https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + ARCHIVE_FOLDER + '/' + encodeURIComponent(folder) + '/_info.json?ref=' + GH_BRANCH, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' } });
        if (!r.ok) return null; const d = await r.json();
        try { return JSON.parse(decodeURIComponent(escape(atob(d.content.replace(/\n/g, ''))))); } catch (e) { return null; }
    }
    async function appendScanLog(folder, entry) {
        try {
            if (!store.get('github_token', '') || typeof updateArchiveInfo !== 'function') return;
            const info = await ghInfo(folder), log = (info && info.scanLog) || []; log.unshift(entry);
            await updateArchiveInfo(folder, { scanLog: log.slice(0, 200) });
        } catch (e) { console.warn('scanLog:', e); }
    }
    const verCmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
    const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // IndexedDB لتذكر مجلد المسح
    const idb = () => new Promise((res, rej) => { const r = indexedDB.open('scannerDB', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    async function kvGet(k) { try { const d = await idb(); return await new Promise(r => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(null); }); } catch (e) { return null; } }
    async function kvSet(k, v) { try { const d = await idb(); d.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch (e) { } }

    // ============================================================
    // نسخة الشاشة (لكل نافذة أرشيف)
    // ============================================================
    function create(doc, win, opts) {
        opts = opts || {};
        let pages = [], seen = new Set(), dirHandle = null, pollTimer = null, stream = null, uid = 0, root = null;
        let bridgeOk = false, bridgeInfo = null, devices = [], lastErr = '', lastDevice = '';
        const $ = (s) => root.querySelector(s);
        const BRIDGE = store.get('scanBridgeUrl', '') || 'http://127.0.0.1:17890';

        // ---------- إضافة الصفحات ----------
        async function addImages(files, source) {
            const made = []; let skipped = 0;
            for (const f of files) {
                const name = f.name || ('scan_' + Date.now()), d = await fileToDataUrl(f);
                try {
                    let n = await processImage(d, {}, MAX_PX, JPEG_Q), ops = {}, fixed = 0, edges = false;
                    const blank = await isBlank(n.url);
                    if (!blank && $('#sc-optdeskew').checked) {
                        try { const a = await estimateSkew(n.url); if (Math.abs(a) >= 0.4 && Math.abs(a) <= 7.5) { ops = { angle: a }; n = await processImage(d, ops, MAX_PX, JPEG_Q); fixed = a; } } catch (e) { }
                    }
                    if (!blank && $('#sc-optedges').checked) {
                        try { const bx = await estimateCropBox(d, 0, ops.angle || 0); if (bx) { ops = { ...ops, crop: bx }; n = await processImage(d, ops, MAX_PX, JPEG_Q); edges = true; } } catch (e) { }
                    }
                    made.push({ id: ++uid, name, kind: 'img', orig: d, ops, dataUrl: n.url, src: source, blank, fixed, edges });
                }
                catch (e) { toast('تعذّر فتح الصورة: ' + name + ' (جرّب JPG أو PDF)', true); }
            }
            let keep = made;
            if ($('#sc-optblank').checked && made.some(p => !p.blank)) { keep = made.filter(p => !p.blank); skipped = made.length - keep.length; }
            pages.push(...keep);
            if (skipped) toast('🧹 تم تجاهل ' + skipped + ' صفحة فارغة');
            render();
            if ($('#sc-optocr').checked && keep.length) runOcr();
        }
        async function addFile(file, source) {
            const name = file.name || ('scan_' + Date.now());
            if (PDF_RE.test(name) || file.type === 'application/pdf') {
                const d = await fileToDataUrl(file); pages.push({ id: ++uid, name, kind: 'pdf', dataUrl: d, base64: d.split(',')[1], src: source }); render();
            } else if (IMG_RE.test(name) || /^image\//.test(file.type)) await addImages([file], source);
        }
        async function addMany(files, source) {
            const imgs = [], rest = [];
            for (const f of files) ((IMG_RE.test(f.name || '') || /^image\//.test(f.type || '')) ? imgs : rest).push(f);
            if (imgs.length) await addImages(imgs, source);
            for (const f of rest) await addFile(f, source);
        }
        async function reprocess(p) { const n = await processImage(p.orig, p.ops, MAX_PX, JPEG_Q); p.dataUrl = n.url; p.ocr = null; }

        // ---------- مجلد المسح ----------
        async function pickFolder() {
            if (!win.showDirectoryPicker) return toast('هذا المتصفح لا يدعم مراقبة المجلد. استخدم Chrome أو Edge.', true);
            try { dirHandle = await win.showDirectoryPicker({ mode: 'read' }); await kvSet('dir', dirHandle); seen = new Set(); await primeSeen(); startPoll(); render(); } catch (e) { }
        }
        async function primeSeen() { if (!dirHandle) return; for await (const [n, h] of dirHandle.entries()) if (h.kind === 'file') seen.add(n + '|' + (await h.getFile()).lastModified); }
        async function restoreFolder() {
            const h = await kvGet('dir'); if (!h) return;
            try { dirHandle = h; if (await h.queryPermission({ mode: 'read' }) === 'granted') { await primeSeen(); startPoll(); } render(); } catch (e) { }
        }
        async function regrant() { try { if (await dirHandle.requestPermission({ mode: 'read' }) === 'granted') { await primeSeen(); startPoll(); render(); } } catch (e) { } }
        function startPoll() {
            clearInterval(pollTimer);
            pollTimer = setInterval(async () => {
                if (win.closed) { clearInterval(pollTimer); return; }
                if (!dirHandle || doc.hidden || !root || root.hidden) return;
                try {
                    const fresh = [];
                    for await (const [n, h] of dirHandle.entries()) {
                        if (h.kind !== 'file' || !(IMG_RE.test(n) || PDF_RE.test(n))) continue;
                        const f = await h.getFile(), key = n + '|' + f.lastModified;
                        if (seen.has(key) || Date.now() - f.lastModified < 1500) continue;
                        seen.add(key); fresh.push(f);
                    }
                    if (fresh.length) { await addMany(fresh, 'مجلد المسح'); toast('📥 تم استيراد ' + fresh.length + ' ملف'); }
                } catch (e) { clearInterval(pollTimer); pollTimer = null; render(); }
            }, POLL_MS);
        }

        // ---------- الكاميرا ----------
        async function camStart() {
            try {
                stream = await win.navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 } }, audio: false });
                const v = $('#sc-video'); v.srcObject = stream; v.hidden = false; $('#sc-snap').hidden = false; $('#sc-camstop').hidden = false; $('#sc-cam').hidden = true;
            } catch (e) { toast('تعذّر فتح الكاميرا (يتطلب HTTPS وإذن الكاميرا).', true); }
        }
        function camStop() { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; if (!root) return; $('#sc-video').hidden = true; $('#sc-snap').hidden = true; $('#sc-camstop').hidden = true; $('#sc-cam').hidden = false; }
        async function camSnap() {
            const v = $('#sc-video'), c = mkCanvas(v.videoWidth, v.videoHeight); c.getContext('2d').drawImage(v, 0, 0);
            const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)); blob.name = 'camera_' + Date.now() + '.jpg'; await addImages([blob], 'كاميرا');
        }

        // ---------- السكانر المباشر (scan-bridge) ----------
        async function bj(path, o) {
            const c = new AbortController(), t = setTimeout(() => c.abort(), (o && o.timeout) || 4000);
            try { const r = await fetch(BRIDGE + path, { ...(o || {}), signal: c.signal, targetAddressSpace: 'loopback' }); const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status); return j; }
            finally { clearTimeout(t); }
        }
        async function bridgeCheck() {
            const st = $('#sc-bstate'); if (!st) return;
            st.innerHTML = '<span class="sc-dot off"></span> جارٍ البحث عن السكانر…'; $('#sc-go').disabled = true; $('#sc-ver').hidden = true;
            try {
                bridgeInfo = await bj('/ping');
                if (bridgeInfo.allowed === false) { bridgeOk = false; devices = []; $('#sc-dev').innerHTML = '<option value="">—</option>'; st.innerHTML = '<span class="sc-dot warn"></span> الوسيط يعمل لكن هذا الموقع غير مسموح'; const v = $('#sc-ver'); v.hidden = false; const og = bridgeInfo.origin || window.location.origin; v.innerHTML = og === 'null' ? 'أنت تفتح البرنامج من ملف على الجهاز (file://)، ويُرسَل للوسيط باسم <b dir="ltr">"null"</b>. أضف <b dir="ltr">"null"</b> (بعلامتي الاقتباس) إلى <b>allowedOrigins</b> في ملف <b>scan-bridge.json</b> ثم شغّل <b>stop-scan-bridge.bat</b> ثم <b>install-autostart.bat</b>.' : 'أضف عنوان الموقع <b dir="ltr">' + esc(og) + '</b> إلى <b>allowedOrigins</b> في ملف <b>scan-bridge.json</b> بجانب الوسيط ثم أعد تشغيله (stop-scan-bridge.bat ثم install-autostart.bat).'; $('#sc-bhelp').hidden = true; return; }
                bridgeOk = true;
                devices = (await bj('/devices', { timeout: 60000 })).devices;
                $('#sc-dev').innerHTML = devices.length ? devices.map(x => '<option value="' + esc(x.id) + '" data-e="' + (x.engine || '') + '">' + esc(x.name) + '</option>').join('') : '<option value="">— لا توجد أجهزة —</option>';
                const last = store.get('scanDevice', ''); if (last && devices.some(x => x.id === last)) $('#sc-dev').value = last;
                st.innerHTML = devices.length ? '<span class="sc-dot ok"></span> متصل (الوسيط v' + esc(bridgeInfo.version) + ') — ' + devices.length + ' جهاز' : '<span class="sc-dot warn"></span> الوسيط متصل لكن لا يوجد سكانر معرَّف';
                if (verCmp(bridgeInfo.version, REQUIRED_BRIDGE) < 0) { const v = $('#sc-ver'); v.hidden = false; v.innerHTML = '⚠️ نسخة الوسيط على هذا الجهاز (' + esc(bridgeInfo.version) + ') أقدم من المطلوبة (' + REQUIRED_BRIDGE + '). استبدل ملف <b>scan-bridge.js</b> بالنسخة الجديدة من الحزمة ثم أعد تشغيل الوسيط.'; }
            } catch (e) { bridgeOk = false; devices = []; lastErr = 'bridge: ' + e.message; $('#sc-dev').innerHTML = '<option value="">—</option>'; st.innerHTML = '<span class="sc-dot bad"></span> الوسيط غير متصل'; }
            $('#sc-bhelp').hidden = bridgeOk; $('#sc-go').disabled = !bridgeOk || !devices.length;
        }
        async function bridgeScan() {
            const go = $('#sc-go'), sel = $('#sc-dev'); if (!sel.value) return;
            const dev = devices.find(x => x.id === sel.value) || {}; store.set('scanDevice', sel.value); lastDevice = dev.name || sel.value;
            go.disabled = true; go.textContent = '⏳ جارٍ المسح… لا تحرّك الأوراق';
            try {
                const r = await bj('/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: 300000, body: JSON.stringify({ device: sel.value, engine: dev.engine, dpi: +$('#sc-dpi').value, color: $('#sc-color').value, source: $('#sc-source').value }) });
                const files = r.pages.map(pg => { const bin = atob(pg.base64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); const b = new Blob([u], { type: pg.mime }); b.name = pg.name; return b; });
                await addImages(files, 'سكانر: ' + lastDevice); toast('📠 تم مسح ' + r.pages.length + ' صفحة');
            } catch (e) { lastErr = 'scan: ' + e.message; toast('❌ ' + (e.name === 'AbortError' ? 'انتهت المهلة' : e.message), true); }
            go.disabled = false; go.textContent = '📠 ابدأ المسح'; render();
        }

        // ---------- OCR واقتراح الاسم ----------
        async function runOcr() {
            const first = pages.find(p => p.kind === 'img'); const box = $('#sc-sug'); if (!first) return;
            box.hidden = false; box.innerHTML = '⏳ جارٍ قراءة الصفحة الأولى… (أول مرة يتم تحميل محرك القراءة)';
            try {
                if (!first.ocr || first.ocr.for !== first.dataUrl) first.ocr = await ocrImage(first.dataUrl);
                const c = detectContainers(first.ocr.text);
                if (!c.length) { box.innerHTML = '🔎 لم يُعثر على رقم حاوية في الصفحة الأولى. يمكنك كتابة الاسم يدوياً.'; return; }
                box.innerHTML = '🔎 تم اكتشاف: ' + c.slice(0, 4).map(x => '<button class="sc-chipbtn ' + (x.valid ? 'ok' : 'warn') + '" data-c="' + x.code + '" title="' + (x.valid ? 'رقم الفحص مطابق (ISO 6346)' : 'رقم الفحص غير مطابق — راجعه') + '">' + x.code + (x.valid ? ' ✓' : ' ؟') + '</button>').join(' ') + ' <small>اضغط لاستخدامه في اسم الملف</small>';
                box.querySelectorAll('button').forEach(b => b.onclick = () => { $('#sc-ref').value = b.dataset.c; updatePreview(); });
                const ok = c.find(x => x.valid); if (ok && !$('#sc-ref').value) { $('#sc-ref').value = ok.code; updatePreview(); }
            } catch (e) { lastErr = 'ocr: ' + e.message; box.innerHTML = '❌ ' + esc(e.message); }
        }

        // ---------- محرر الصفحة ----------
        function openEditor(p) {
            const ed = doc.createElement('div'); ed.id = 'sc-ed'; ed.className = 'sc-ov';
            const o = Object.assign({ rot: 0, angle: 0, contrast: 1, brightness: 1, gray: false, bw: false, crop: null }, p.ops || {});
            ed.innerHTML = '<div class="sc-edbox"><div class="sc-head"><div class="sc-ttl"><div class="sc-ico">✎</div><div><h3>تحرير الصفحة</h3><p class="sc-sub">اسحب على الصورة لتحديد منطقة القص</p></div></div><button class="sc-x" id="sc-edx">✕</button></div>' +
                '<div class="sc-edmain"><div class="sc-edview" id="sc-edview"><div class="sc-edwrap" id="sc-edwrap"><canvas id="sc-edc"></canvas><div id="sc-edsel" hidden></div></div></div>' +
                '<div class="sc-edtools">' +
                '<div class="sc-row"><button class="sc-ghost" data-e="rl">⟲ تدوير يسار</button><button class="sc-ghost" data-e="rr">⟳ تدوير يمين</button></div>' +
                '<div class="sc-row"><button class="sc-ghost" data-e="skew">📐 تصحيح الميل تلقائياً</button><button class="sc-ghost" data-e="edges">🔲 حذف الحواف تلقائياً</button></div>' +
                '<label class="sc-f"><span>زاوية الميل: <b id="sc-v-angle">0</b>°</span><input type="range" id="sc-r-angle" min="-10" max="10" step="0.1"></label>' +
                '<label class="sc-f"><span>السطوع: <b id="sc-v-brightness">1</b></span><input type="range" id="sc-r-brightness" min="0.6" max="1.6" step="0.05"></label>' +
                '<label class="sc-f"><span>التباين: <b id="sc-v-contrast">1</b></span><input type="range" id="sc-r-contrast" min="0.6" max="2.2" step="0.05"></label>' +
                '<label class="sc-chk"><input type="checkbox" id="sc-c-gray"> رمادي</label><label class="sc-chk"><input type="checkbox" id="sc-c-bw"> أبيض وأسود (للنصوص)</label>' +
                '<div class="sc-row"><button class="sc-ghost" data-e="nocrop">✂ إلغاء القص</button><button class="sc-ghost" data-e="zoom">🔍 تكبير / ملاءمة</button><button class="sc-ghost" data-e="reset">↺ إعادة ضبط</button></div>' +
                '<div class="sc-row" style="margin-top:auto"><button class="sc-primary" id="sc-edok" style="flex:1">✔ تطبيق</button><button class="sc-ghost" id="sc-edcancel">إلغاء</button></div></div></div></div>';
            root.appendChild(ed);
            const cv = ed.querySelector('#sc-edc'), wrap = ed.querySelector('#sc-edwrap'), sel = ed.querySelector('#sc-edsel'), view = ed.querySelector('#sc-edview');
            let zoom = false, busy = false, again = false, selDrag = null;
            const syncUI = () => { ['angle', 'brightness', 'contrast'].forEach(k => { ed.querySelector('#sc-r-' + k).value = o[k]; ed.querySelector('#sc-v-' + k).textContent = o[k]; }); ed.querySelector('#sc-c-gray').checked = !!o.gray; ed.querySelector('#sc-c-bw').checked = !!o.bw; };
            async function draw() {
                if (busy) { again = true; return; } busy = true;
                try { const r = await processImage(p.orig, { ...o, crop: null }, zoom ? 1800 : 900, 0.7), im = await loadImg(r.url); cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext('2d').drawImage(im, 0, 0); cv.style.width = zoom ? im.naturalWidth + 'px' : '100%'; showSel(); } catch (e) { }
                busy = false; if (again) { again = false; draw(); }
            }
            function showSel() { if (!o.crop) { sel.hidden = true; return; } sel.hidden = false; Object.assign(sel.style, { left: o.crop.x * 100 + '%', top: o.crop.y * 100 + '%', width: o.crop.w * 100 + '%', height: o.crop.h * 100 + '%' }); }
            ['angle', 'brightness', 'contrast'].forEach(k => ed.querySelector('#sc-r-' + k).oninput = (e) => { o[k] = +e.target.value; ed.querySelector('#sc-v-' + k).textContent = o[k]; draw(); });
            ed.querySelector('#sc-c-gray').onchange = (e) => { o.gray = e.target.checked; draw(); };
            ed.querySelector('#sc-c-bw').onchange = (e) => { o.bw = e.target.checked; draw(); };
            wrap.onpointerdown = (e) => { const r = cv.getBoundingClientRect(); selDrag = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; wrap.setPointerCapture(e.pointerId); };
            wrap.onpointermove = (e) => { if (!selDrag) return; const r = cv.getBoundingClientRect(), cl = (v) => Math.min(1, Math.max(0, v)), x = cl((e.clientX - r.left) / r.width), y = cl((e.clientY - r.top) / r.height); o.crop = { x: Math.min(selDrag.x, x), y: Math.min(selDrag.y, y), w: Math.abs(x - selDrag.x), h: Math.abs(y - selDrag.y) }; showSel(); };
            wrap.onpointerup = () => { selDrag = null; if (o.crop && (o.crop.w < 0.03 || o.crop.h < 0.03)) { o.crop = null; showSel(); } };
            ed.querySelectorAll('[data-e]').forEach(b => b.onclick = async () => {
                const a = b.dataset.e;
                if (a === 'rl') { o.rot = (o.rot + 270) % 360; o.crop = null; } else if (a === 'rr') { o.rot = (o.rot + 90) % 360; o.crop = null; }
                else if (a === 'skew') { b.disabled = true; b.textContent = '⏳ …'; try { const base = await processImage(p.orig, { rot: o.rot }, 900, 0.7); o.angle = Math.max(-10, Math.min(10, await estimateSkew(base.url))); } catch (e) { } b.disabled = false; b.textContent = '📐 تصحيح الميل تلقائياً'; }
                else if (a === 'edges') { b.disabled = true; b.textContent = '⏳ …'; try { const bx = await estimateCropBox(p.orig, o.rot, o.angle); if (bx) o.crop = bx; else toast('لم تُكتشف حواف خارجية لحذفها'); } catch (e) { } b.disabled = false; b.textContent = '🔲 حذف الحواف تلقائياً'; }
                else if (a === 'nocrop') o.crop = null; else if (a === 'zoom') zoom = !zoom; else if (a === 'reset') Object.assign(o, { rot: 0, angle: 0, contrast: 1, brightness: 1, gray: false, bw: false, crop: null });
                syncUI(); draw();
            });
            const close = () => ed.remove();
            ed.querySelector('#sc-edx').onclick = close; ed.querySelector('#sc-edcancel').onclick = close;
            ed.querySelector('#sc-edok').onclick = async () => { p.ops = { ...o }; try { await reprocess(p); } catch (e) { toast('تعذّر تطبيق التعديل', true); } close(); render(); };
            syncUI(); draw();
        }

        // ---------- التسمية ----------
        const existingNames = () => { try { return opts.existingNames ? opts.existingNames() : []; } catch (e) { return []; } };
        const cleanPart = (t) => (t || '').trim().replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '');
        function nextSerial(prefix) { const re = new RegExp('^' + escRe(prefix) + '_(\\d+)(\\.|$)'); let mx = 0; existingNames().forEach(n => { const m = re.exec(n); if (m) mx = Math.max(mx, +m[1]); }); return mx + 1; }
        function planNames(count) {
            const type = $('#sc-type').value, f = opts.folder, prefix = f + (type ? '_' + type : ''), custom = cleanPart($('#sc-ref').value);
            if (custom) return Array.from({ length: count }, (_, i) => prefix + '_' + custom + (i ? '_' + (i + 1) : ''));
            const n0 = nextSerial(prefix); return Array.from({ length: count }, (_, i) => prefix + '_' + String(n0 + i).padStart(2, '0'));
        }
        const estBytes = () => pages.reduce((s, p) => s + (p.kind === 'pdf' ? p.base64.length : p.dataUrl.length) * 0.75, 0);
        function updatePreview() {
            const el = $('#sc-preview'); if (!el) return;
            const jobs = (pages.some(p => p.kind === 'img') ? 1 : 0) + pages.filter(p => p.kind === 'pdf').length;
            el.textContent = jobs ? 'سيُحفظ باسم: ' + planNames(jobs).map(n => n + '.pdf').join(' ، ') + '  ·  الحجم التقريبي: ' + (estBytes() / 1048576).toFixed(1) + ' MB' : '';
        }

        // ---------- بناء PDF (ضغط ذكي + نص قابل للبحث) ----------
        async function buildPdf(imgs, level, searchable) {
            const J = window.jspdf && window.jspdf.jsPDF; if (!J) throw new Error('jsPDF غير محمّل');
            let pdf = null;
            for (let i = 0; i < imgs.length; i++) {
                const p = imgs[i]; let url = p.dataUrl;
                if (level > 0) url = (await processImage(p.orig, p.ops, LEVELS[level].px, LEVELS[level].q)).url;
                const im = await loadImg(url), land = im.naturalWidth > im.naturalHeight;
                if (!pdf) pdf = new J({ orientation: land ? 'l' : 'p', unit: 'mm', format: 'a4' }); else pdf.addPage('a4', land ? 'l' : 'p');
                const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), m = 5, k = Math.min((W - 2 * m) / im.naturalWidth, (H - 2 * m) / im.naturalHeight);
                const w = im.naturalWidth * k, h = im.naturalHeight * k, ox = (W - w) / 2, oy = (H - h) / 2;
                pdf.addImage(url, 'JPEG', ox, oy, w, h);
                if (searchable) {
                    $('#sc-save').textContent = '⏳ قراءة النص ' + (i + 1) + '/' + imgs.length + '…';
                    if (!p.ocr || p.ocr.for !== p.dataUrl) p.ocr = await ocrImage(p.dataUrl);
                    pdf.setFont('helvetica', 'normal');
                    for (const wd of p.ocr.words) {
                        const t = String(wd.t || '').replace(/[^\x20-\x7E]/g, '').trim(); if (!t || !wd.b) continue;
                        const hmm = (wd.b.y1 - wd.b.y0) / p.ocr.h * h; pdf.setFontSize(Math.max(2, hmm * 2.835 * 0.9));
                        pdf.text(t, ox + wd.b.x0 / p.ocr.w * w, oy + wd.b.y1 / p.ocr.h * h, { renderingMode: 'invisible' });
                    }
                }
            }
            return pdf.output('datauristring').split(',')[1].replace(/\s/g, '');
        }
        async function buildSmart(imgs, searchable) {
            let b64 = '', lv = 0;
            for (; lv < LEVELS.length; lv++) { b64 = await buildPdf(imgs, lv, searchable && lv === 0); if (b64.length * 0.75 <= limitBytes()) break; }
            if (lv >= LEVELS.length) { lv = LEVELS.length - 1; toast('⚠️ الملف كبير جداً حتى بعد الضغط (' + (b64.length * 0.75 / 1048576).toFixed(1) + ' MB)', true); }
            else if (lv > 0) toast('🗜️ تم خفض جودة الصور تلقائياً ليناسب حد الحجم');
            return b64;
        }

        // ---------- الحفظ ----------
        async function save() {
            if (!pages.length) return toast('لا توجد صفحات للحفظ', true);
            if (typeof uploadBase64ToArchive !== 'function') return toast('وحدة الأرشيف غير متاحة', true);
            const folder = opts.folder, imgs = pages.filter(p => p.kind === 'img'), pdfs = pages.filter(p => p.kind === 'pdf');
            const names = planNames((imgs.length ? 1 : 0) + pdfs.length).map(n => n + '.pdf');
            const dup = names.filter(n => existingNames().includes(n));
            if (dup.length && !win.confirm('يوجد ملف بنفس الاسم وسيتم استبداله:\n' + dup.join('\n') + '\nمتابعة؟')) return;
            const btn = $('#sc-save'); btn.disabled = true; btn.textContent = '⏳ جارٍ الحفظ…';
            let ok = 0, fail = 0, saved = [];
            try {
                const jobs = []; let k = 0;
                if (imgs.length) jobs.push([names[k++], await buildSmart(imgs, $('#sc-optsearch').checked)]);
                pdfs.forEach(p => jobs.push([names[k++], p.base64]));
                btn.textContent = '⏳ رفع إلى الأرشيف…';
                for (const [n, b64] of jobs) { const r = await uploadBase64ToArchive(folder, n, b64); if (r && r.success) { ok++; saved.push(n); } else fail++; }
                const srcs = Array.from(new Set(pages.map(p => p.src).filter(Boolean))).join(' + ') || '—';
                if (ok) {
                    const entry = { t: new Date().toISOString(), user: (window.getCurrentUser && (getCurrentUser() || {}).fullName) || '—', files: saved, pages: pages.length, type: $('#sc-type').value || '', source: srcs, searchable: !!$('#sc-optsearch').checked };
                    try { window.logActivity && logActivity('scan', 'مسح مستند: ' + folder + '/' + saved.join(',') + ' (' + pages.length + ' صفحة)'); } catch (e) { }
                    appendScanLog(folder, entry);
                    toast('✅ تم حفظ ' + ok + ' ملف في الأرشيف: ' + folder); pages = []; $('#sc-ref').value = ''; $('#sc-sug').hidden = true;
                    if (opts.onSaved) try { opts.onSaved(); } catch (e) { }
                }
                if (fail) toast('⚠️ فشل حفظ ' + fail + ' ملف (تحقق من رمز GitHub أو الخادم المحلي)', true);
            } catch (e) { lastErr = 'save: ' + e.message; toast('❌ ' + e.message, true); }
            btn.disabled = false; btn.textContent = '💾 حفظ في الأرشيف'; render();
        }

        // ---------- لوحات: سجل المسح / التشخيص ----------
        function panel(title, html) {
            const old = root.querySelector('#sc-panel'); if (old) old.remove();
            const p = doc.createElement('div'); p.id = 'sc-panel'; p.className = 'sc-ov';
            p.innerHTML = '<div class="sc-edbox" style="max-width:760px"><div class="sc-head"><div class="sc-ttl"><h3>' + title + '</h3></div><button class="sc-x" id="sc-px">✕</button></div><div class="sc-body" id="sc-pbody">' + html + '</div></div>';
            root.appendChild(p); p.querySelector('#sc-px').onclick = () => p.remove(); return p;
        }
        async function showLog() {
            const p = panel('📜 سجل المسح — ' + esc(opts.folder), '⏳ جارٍ التحميل…'), body = p.querySelector('#sc-pbody');
            try {
                const info = await ghInfo(opts.folder), log = (info && info.scanLog) || [];
                if (!store.get('github_token', '')) body.innerHTML = 'السجل مخزَّن على GitHub ويحتاج رمز GitHub مفعّلاً في هذا الجهاز.';
                else if (!log.length) body.innerHTML = 'لا توجد عمليات مسح مسجّلة لهذا المجلد بعد.';
                else body.innerHTML = '<table class="sc-tbl"><tr><th>التاريخ</th><th>المستخدم</th><th>الملفات</th><th>الصفحات</th><th>النوع</th><th>المصدر</th></tr>' + log.map(e => '<tr><td>' + esc(new Date(e.t).toLocaleString('ar-EG')) + '</td><td>' + esc(e.user || '') + '</td><td dir="ltr">' + esc((e.files || []).join(', ')) + '</td><td>' + (e.pages || '') + '</td><td>' + esc(e.type || '—') + '</td><td>' + esc(e.source || '') + (e.searchable ? ' 🔎' : '') + '</td></tr>').join('') + '</table>';
            } catch (e) { body.textContent = 'تعذّر تحميل السجل: ' + e.message; }
        }
        async function showDiag() {
            const p = panel('🩺 تشخيص السكانر', '⏳ جارٍ الفحص…'), body = p.querySelector('#sc-pbody'), L = [];
            const yn = (b) => b ? '✅' : '❌';
            L.push('المتصفح: ' + win.navigator.userAgent); L.push('اتصال آمن (HTTPS): ' + yn(win.isSecureContext)); L.push('مراقبة المجلد: ' + yn(!!win.showDirectoryPicker) + '   الكاميرا: ' + yn(!!(win.navigator.mediaDevices && win.navigator.mediaDevices.getUserMedia)));
            L.push('jsPDF: ' + yn(!!(window.jspdf && window.jspdf.jsPDF)) + '   محرك OCR محمّل: ' + yn(!!window.Tesseract) + '   رمز GitHub: ' + yn(!!store.get('github_token', '')));
            L.push('وحدة الأرشيف: ' + yn(typeof uploadBase64ToArchive === 'function') + '   الخادم المحلي: ' + yn(typeof _localServerAvailable !== 'undefined' && _localServerAvailable));
            L.push('عنوان هذا الموقع (Origin): ' + window.location.origin + (window.location.protocol === 'file:' ? '   ← ملف محلي، يُرسَل للوسيط باسم "null"' : ''));
            try { const ps = await win.navigator.permissions.query({ name: 'local-network-access' }); L.push('إذن الشبكة المحلية في المتصفح: ' + ps.state + (ps.state === 'denied' ? ' ❌ (فعّله من أيقونة القفل بجانب العنوان ← إعدادات الموقع)' : '')); } catch (e) { try { const ps2 = await win.navigator.permissions.query({ name: 'loopback-network' }); L.push('إذن الشبكة المحلية في المتصفح: ' + ps2.state); } catch (e2) { L.push('إذن الشبكة المحلية: غير قابل للقراءة في هذا المتصفح'); } }
            L.push('— الوسيط (' + BRIDGE + ') —');
            let reach = null; try { await fetch(BRIDGE + '/ping', { mode: 'no-cors', targetAddressSpace: 'loopback' }); reach = true; } catch (e) { reach = false; }
            L.push('فحص الوصول للمنفذ (بدون CORS): ' + (reach ? '✅ الوسيط يعمل ويصل إليه المتصفح' : '❌ لا يوجد رد — الوسيط غير مشغّل، أو إذن الشبكة المحلية مرفوض، أو المنفذ محجوب'));
            try {
                const pg = await bj('/ping'); if (pg.allowed === false) L.push('⛔ الوسيط يرفض هذا الموقع. أضف ' + (pg.origin === 'null' ? '"null"' : (pg.origin || window.location.origin)) + ' إلى allowedOrigins في scan-bridge.json وأعد تشغيله.'); L.push('الاتصال: ✅  الإصدار: ' + pg.version + (verCmp(pg.version, REQUIRED_BRIDGE) < 0 ? ' ⚠️ قديم (المطلوب ' + REQUIRED_BRIDGE + ')' : ' ✅') + '  النظام: ' + pg.platform + '  المحرك: ' + pg.engine);
                try { const d = await bj('/diag'); L.push('Node: ' + d.node + '   NAPS2: ' + (d.naps2 || 'غير موجود')); L.push('المواقع المسموحة: ' + d.allowedOrigins.join(' , ')); L.push('مدة التشغيل: ' + d.uptimeMin + ' دقيقة'); L.push('آخر أخطاء الوسيط: ' + (d.errors.length ? '\n   ' + d.errors.join('\n   ') : 'لا يوجد')); } catch (e) { L.push('تعذّر قراءة /diag: ' + e.message); }
                try { const dv = (await bj('/devices', { timeout: 60000 })).devices; L.push('الأجهزة (' + dv.length + '): ' + (dv.map(x => x.name).join(' | ') || 'لا يوجد')); } catch (e) { L.push('الأجهزة: ' + e.message); }
            } catch (e) {
                L.push('الاتصال: ❌ ' + e.message);
                L.push(reach ? 'التشخيص: الوسيط يعمل لكن المتصفح حجب القراءة — غالباً الموقع غير مسموح (CORS) أو نسخة الوسيط قديمة. حدّث scan-bridge.js إلى 1.2: شغّل stop-scan-bridge.bat ثم install-autostart.bat.' : 'التشخيص: غالباً الوسيط غير مشغّل. افتح في المتصفح الرابط ' + BRIDGE + '/ping فإن لم يظهر نص JSON فشغّل scan-bridge (start-scan-bridge.bat) وأبقِ نافذته مفتوحة، ثم تحقق من إذن «الشبكة المحلية».');
            }
            L.push('آخر خطأ في الشاشة: ' + (lastErr || 'لا يوجد'));
            const txt = L.join('\n'); body.innerHTML = '<pre class="sc-pre">' + esc(txt) + '</pre><div class="sc-row"><button class="sc-primary" id="sc-copy" style="padding:9px 16px;font-size:14px">📋 نسخ التقرير</button></div>';
            body.querySelector('#sc-copy').onclick = async () => { try { await win.navigator.clipboard.writeText(txt); toast('تم النسخ'); } catch (e) { toast('تعذّر النسخ', true); } };
        }

        // ---------- الواجهة ----------
        function toast(msg, err) { const t = doc.createElement('div'); t.className = 'sc-toast' + (err ? ' bad' : ''); t.textContent = msg; doc.body.appendChild(t); setTimeout(() => t.remove(), 3800); }
        function render() {
            if (!root) return;
            const fb = $('#sc-folderstate');
            if (!win.showDirectoryPicker) fb.innerHTML = '<span class="sc-dot bad"></span> هذا المتصفح لا يدعم مراقبة المجلد — استخدم Chrome أو Edge.';
            else if (dirHandle && !pollTimer) fb.innerHTML = '<span class="sc-dot warn"></span> <b>' + esc(dirHandle.name) + '</b> — <a href="#" id="sc-regrant">اضغط لإعادة التفعيل</a>';
            else if (dirHandle) fb.innerHTML = '<span class="sc-dot ok"></span> تتم مراقبة المجلد: <b>' + esc(dirHandle.name) + '</b>';
            else fb.innerHTML = '<span class="sc-dot off"></span> لم يتم اختيار مجلد بعد.';
            const rg = $('#sc-regrant'); if (rg) rg.onclick = (e) => { e.preventDefault(); regrant(); };
            $('#sc-count').textContent = pages.length;
            const box = $('#sc-pages'); box.innerHTML = ''; box.classList.toggle('empty', !pages.length);
            if (!pages.length) box.innerHTML = '<div class="sc-empty"><div>🗂️</div><b>لا توجد صفحات بعد</b><small>ابدأ المسح أو استورد ملفات، وستظهر الصفحات هنا للمراجعة قبل الحفظ.</small></div>';
            pages.forEach((p, i) => {
                const d = doc.createElement('div'); d.className = 'sc-pg';
                d.innerHTML = '<span class="sc-num">' + (i + 1) + '</span>' + (p.blank ? '<span class="sc-blank" title="تبدو فارغة">فارغة؟</span>' : '') + (p.fixed ? '<span class="sc-fixed" title="تم تصحيح الميل تلقائياً — اضغط للتحرير">↻ ' + Math.abs(p.fixed).toFixed(1) + '°</span>' : '') + (p.edges ? '<span class="sc-fixed sc-edg" title="تم حذف الحواف الخارجية — اضغط للتحرير">✂ حواف</span>' : '') +
                    (p.kind === 'img' ? '<img src="' + p.dataUrl + '" alt="" data-a="edit" title="اضغط للتحرير">' : '<div class="sc-pdf">PDF</div>') +
                    '<div class="sc-nm" title="' + esc(p.name) + '">' + esc(p.name.slice(0, 22)) + '</div>' +
                    '<div class="sc-act"><button data-a="r" title="تقديم">→</button><button data-a="l" title="تأخير">←</button>' + (p.kind === 'img' ? '<button data-a="rot" title="تدوير">⟳</button><button data-a="edit" title="تحرير">✎</button>' : '') + '<button data-a="x" title="حذف" class="del">✕</button></div>';
                d.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
                    const a = b.dataset.a, j = pages.indexOf(p);
                    if (a === 'x') pages.splice(j, 1);
                    else if (a === 'r' && j > 0) [pages[j - 1], pages[j]] = [pages[j], pages[j - 1]];
                    else if (a === 'l' && j < pages.length - 1) [pages[j + 1], pages[j]] = [pages[j], pages[j + 1]];
                    else if (a === 'rot') { p.ops = { ...(p.ops || {}), rot: (((p.ops || {}).rot || 0) + 90) % 360, crop: null }; await reprocess(p); }
                    else if (a === 'edit') return openEditor(p);
                    render();
                });
                box.appendChild(d);
            });
            $('#sc-save').disabled = !pages.length; $('#sc-clear').disabled = !pages.length; $('#sc-ocr').disabled = !pages.some(p => p.kind === 'img'); updatePreview();
        }
        const CSS = `
#sc-root{--bg:#fff;--bg2:#f3f6fa;--bd:#dde4ec;--tx:#1b2733;--mu:#6b7c8f;--pri:#0a6cff;--pri2:#0a3d62;--ok:#1e9e5a;--bad:#d64545;--warn:#e8a317;position:fixed;inset:0;z-index:100000;background:#0a1624b3;backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;direction:rtl;font-family:Tahoma,"Segoe UI",sans-serif;color:var(--tx)}
@media (prefers-color-scheme:dark){#sc-root{--bg:#18222e;--bg2:#202d3c;--bd:#32445a;--tx:#e8eef5;--mu:#93a4b8}}
:root[data-theme=dark] #sc-root{--bg:#18222e;--bg2:#202d3c;--bd:#32445a;--tx:#e8eef5;--mu:#93a4b8}
:root[data-theme=light] #sc-root{--bg:#fff;--bg2:#f3f6fa;--bd:#dde4ec;--tx:#1b2733;--mu:#6b7c8f}
#sc-root[hidden],#sc-root [hidden]{display:none!important}#sc-root *{box-sizing:border-box}
#sc-box{background:var(--bg);width:min(920px,96vw);max-height:94vh;border-radius:18px;box-shadow:0 24px 70px #0007;display:flex;flex-direction:column;overflow:hidden;animation:scIn .18s ease-out}
@keyframes scIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
.sc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;background:linear-gradient(135deg,#0a3d62,#1e6fa8);color:#fff}
.sc-ttl{display:flex;align-items:center;gap:12px}.sc-ico{font-size:24px;background:#ffffff26;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.sc-head h3{margin:0;font-size:17px}.sc-sub{margin:3px 0 0;font-size:12.5px;opacity:.9}.sc-chip{display:inline-block;background:#ffffff2e;border-radius:999px;padding:2px 10px;direction:ltr;font-weight:700}
.sc-hbtns{display:flex;gap:8px;align-items:center}.sc-hb{border:0;background:#ffffff26;color:#fff;border-radius:999px;padding:7px 13px;font:700 12.5px Tahoma,sans-serif;cursor:pointer}.sc-hb:hover{background:#ffffff44}
.sc-x{border:0;background:#ffffff26;color:#fff;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer}.sc-x:hover{background:#ffffff44}
.sc-tabs{display:flex;gap:6px;padding:10px 16px 0;background:var(--bg2);border-bottom:1px solid var(--bd);overflow-x:auto}
.sc-tabs button{border:0;background:transparent;color:var(--mu);padding:10px 16px;font:700 13.5px Tahoma,sans-serif;cursor:pointer;border-radius:10px 10px 0 0;white-space:nowrap;border-bottom:3px solid transparent}.sc-tabs button:hover{color:var(--tx)}.sc-tabs button.on{color:var(--pri);background:var(--bg);border-bottom-color:var(--pri)}
.sc-body{padding:18px 20px;overflow:auto;flex:1}
.sc-pane{background:var(--bg2);border:1px solid var(--bd);border-radius:14px;padding:16px;margin-bottom:18px}
.sc-status{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;font-weight:700;font-size:13.5px}
.sc-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-left:6px;vertical-align:middle;background:var(--mu)}.sc-dot.ok{background:var(--ok);box-shadow:0 0 0 4px #1e9e5a2e}.sc-dot.bad{background:var(--bad);box-shadow:0 0 0 4px #d645452e}.sc-dot.warn{background:var(--warn)}
.sc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}.sc-full{grid-column:1/-1}
.sc-f{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--mu);font-weight:700}
#sc-root select,#sc-root input[type=text]{width:100%;padding:10px 12px;border:1px solid var(--bd);border-radius:10px;background:var(--bg);color:var(--tx);font:600 14px Tahoma,sans-serif;outline:none}
#sc-root select:focus,#sc-root input[type=text]:focus{border-color:var(--pri);box-shadow:0 0 0 3px #0a6cff26}
.sc-primary{border:0;border-radius:12px;padding:12px 22px;background:linear-gradient(135deg,#0a6cff,#0a4fd1);color:#fff;font:700 15px Tahoma,sans-serif;cursor:pointer;box-shadow:0 6px 16px #0a6cff40;transition:transform .12s,opacity .12s}.sc-primary:hover:not(:disabled){transform:translateY(-1px)}.sc-primary:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
#sc-go{width:100%;font-size:16px;padding:14px}
.sc-ghost{border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:10px;padding:7px 12px;font:700 12.5px Tahoma,sans-serif;cursor:pointer}.sc-ghost:hover:not(:disabled){border-color:var(--pri);color:var(--pri)}.sc-ghost:disabled{opacity:.45;cursor:not-allowed}
.sc-help,.sc-warnbar{margin:14px 0 0;padding:12px 14px;background:#fff7e0;border:1px solid #f0d78c;border-radius:10px;color:#6b5100;font-size:13px;line-height:1.9}.sc-help ol{margin:6px 18px 0 0;padding:0}
:root[data-theme=dark] .sc-help,:root[data-theme=dark] .sc-warnbar{background:#3a3115;border-color:#6b5a22;color:#f2dc99}
.sc-note{font-size:13px;color:var(--mu);line-height:1.9;margin:0 0 12px}
.sc-drop{border:2px dashed var(--bd);border-radius:14px;padding:26px 16px;text-align:center;background:var(--bg)}.sc-drop.over{border-color:var(--pri);background:#0a6cff12}.sc-drop .big{font-size:34px}.sc-drop p{margin:6px 0 14px;color:var(--mu);font-size:13px}
#sc-video{width:100%;max-height:340px;background:#000;border-radius:12px;margin-bottom:10px}
.sc-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sc-ph{display:flex;align-items:center;gap:10px;margin:2px 0 8px;flex-wrap:wrap}.sc-ph h4{margin:0;font-size:15px}
.sc-badge{display:inline-block;min-width:24px;text-align:center;background:var(--pri);color:#fff;border-radius:999px;padding:1px 8px;font-size:12.5px;margin-right:4px}
.sc-opts{display:flex;gap:16px;flex-wrap:wrap;margin:0 0 10px;padding:8px 12px;background:var(--bg2);border:1px solid var(--bd);border-radius:10px}
.sc-chk{font-size:12.5px;color:var(--mu);display:flex;align-items:center;gap:5px}.sc-sp{margin-right:auto}
.sc-sug{margin:0 0 10px;padding:9px 12px;border-radius:10px;background:#e8f4ff;border:1px solid #b6dcff;color:#0b4a82;font-size:13px}
:root[data-theme=dark] .sc-sug{background:#14314d;border-color:#245b8c;color:#bfe0ff}
.sc-chipbtn{border:1px solid var(--ok);background:#e9f8ef;color:#136b3b;border-radius:999px;padding:3px 12px;font:700 13px Consolas,monospace;cursor:pointer;direction:ltr}.sc-chipbtn.warn{border-color:var(--warn);background:#fff7e0;color:#7a5600}
#sc-pages{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}#sc-pages.empty{display:block}
.sc-empty{text-align:center;padding:30px 10px;border:2px dashed var(--bd);border-radius:14px;color:var(--mu)}.sc-empty div{font-size:36px}.sc-empty b{display:block;color:var(--tx);margin:6px 0 4px}.sc-empty small{font-size:12.5px}
.sc-pg{position:relative;background:var(--bg2);border:1px solid var(--bd);border-radius:12px;padding:8px;text-align:center;transition:.15s}.sc-pg:hover{border-color:var(--pri);box-shadow:0 6px 16px #0002}
.sc-pg img{width:100%;height:130px;object-fit:contain;background:#fff;border-radius:8px;display:block;cursor:pointer}
.sc-pdf{height:130px;display:flex;align-items:center;justify-content:center;background:#fdecea;border-radius:8px;font-weight:800;color:#c0392b;font-size:20px}
.sc-num{position:absolute;top:4px;right:4px;z-index:1;background:var(--pri2);color:#fff;border-radius:999px;min-width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.sc-blank{position:absolute;top:4px;left:4px;z-index:1;background:var(--warn);color:#fff;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:700}
.sc-fixed{position:absolute;top:4px;left:4px;z-index:1;background:var(--ok);color:#fff;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:700}.sc-blank~.sc-fixed{top:26px}.sc-fixed.sc-edg{top:auto;bottom:4px;background:#0a6cff}
.sc-nm{font-size:11.5px;color:var(--mu);margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sc-act{display:flex;justify-content:center;gap:4px;margin-top:6px}.sc-act button{background:var(--bg);border:1px solid var(--bd);color:var(--tx);border-radius:7px;width:28px;height:26px;cursor:pointer;font-size:13px}.sc-act button:hover{border-color:var(--pri);color:var(--pri)}.sc-act button.del:hover{border-color:var(--bad);color:var(--bad)}
.sc-foot{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;padding:14px 20px;border-top:1px solid var(--bd);background:var(--bg)}.sc-foot .sc-f{flex:1;min-width:180px}.sc-foot .sc-f.t{flex:0 0 190px;min-width:150px}.sc-prev{flex-basis:100%;order:3;font-size:13px;font-weight:700;color:var(--ok);min-height:18px}
.sc-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:100003;padding:11px 18px;border-radius:12px;color:#fff;font:700 13.5px Tahoma,sans-serif;box-shadow:0 8px 24px #0005;background:#1e9e5a}.sc-toast.bad{background:#d64545}
.sc-ov{position:fixed;inset:0;z-index:100002;background:#0a1624d9;display:flex;align-items:center;justify-content:center;padding:12px}
.sc-edbox{background:var(--bg);width:min(1100px,98vw);max-height:96vh;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 70px #000a}
.sc-edmain{display:flex;gap:0;flex:1;min-height:0}.sc-edview{flex:1;overflow:auto;background:#2b3744;padding:14px;display:flex;justify-content:center;align-items:flex-start;min-height:300px}
.sc-edwrap{position:relative;display:inline-block;max-width:100%;touch-action:none;cursor:crosshair;background:#fff}#sc-edc{display:block;max-width:none}
#sc-edsel{position:absolute;border:2px dashed #0a6cff;background:#0a6cff22;box-shadow:0 0 0 9999px #0006;pointer-events:none}
.sc-edtools{width:270px;padding:14px;display:flex;flex-direction:column;gap:12px;overflow:auto;border-right:1px solid var(--bd)}
.sc-tbl{width:100%;border-collapse:collapse;font-size:12.5px}.sc-tbl th,.sc-tbl td{border-bottom:1px solid var(--bd);padding:7px 8px;text-align:right}.sc-tbl th{color:var(--mu)}
.sc-pre{direction:rtl;text-align:right;unicode-bidi:plaintext;white-space:pre-wrap;background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:12px;font:12.5px/1.7 Consolas,monospace;max-height:55vh;overflow:auto}
@media (max-width:760px){.sc-grid{grid-template-columns:1fr 1fr}.sc-edmain{flex-direction:column}.sc-edtools{width:auto;border-right:0;border-top:1px solid var(--bd)}.sc-body{padding:12px}}`;
        function build() {
            if (!doc.getElementById('sc-style')) { const st = doc.createElement('style'); st.id = 'sc-style'; st.textContent = CSS; doc.head.appendChild(st); }
            root = doc.createElement('div'); root.id = 'sc-root'; root.hidden = true;
            root.innerHTML = `<div id="sc-box">
 <div class="sc-head"><div class="sc-ttl"><div class="sc-ico">📠</div><div><h3>مسح مستند</h3><p class="sc-sub">سيُحفظ داخل مجلد الأرشيف: <span class="sc-chip">${esc(opts.folder)}</span></p></div></div>
  <div class="sc-hbtns"><button class="sc-hb" id="sc-hlog">📜 سجل المسح</button><button class="sc-hb" id="sc-hdiag">🩺 تشخيص</button><button class="sc-x" id="sc-close" title="إغلاق">✕</button></div></div>
 <div class="sc-tabs"><button data-tab="scan" class="on">🖨️ السكانر</button><button data-tab="folder">📁 مجلد المسح</button><button data-tab="cam">📷 الكاميرا</button><button data-tab="file">📤 رفع ملفات</button></div>
 <div class="sc-body">
  <div class="sc-pane" data-pane="scan">
   <div class="sc-status"><span id="sc-bstate">…</span><button class="sc-ghost" id="sc-brefresh">↻ تحديث</button></div>
   <div class="sc-warnbar" id="sc-ver" hidden style="margin:0 0 14px"></div>
   <div class="sc-grid">
    <label class="sc-f sc-full">الجهاز<select id="sc-dev"></select></label>
    <label class="sc-f">الدقة<select id="sc-dpi"><option value="150">150 — سريعة</option><option value="200" selected>200 — عادية</option><option value="300">300 — جودة عالية</option><option value="600">600 — ممتازة (بطيئة)</option></select></label>
    <label class="sc-f">اللون<select id="sc-color"><option value="color">ملوّن</option><option value="gray">رمادي</option><option value="bw">أبيض وأسود</option></select></label>
    <label class="sc-f">مصدر الورق<select id="sc-source"><option value="glass">زجاج السكانر (صفحة واحدة)</option><option value="feeder">مغذّي الأوراق (وجه واحد)</option><option value="duplex">مغذّي الأوراق (وجهان)</option></select></label>
   </div>
   <button class="sc-primary" id="sc-go" disabled>📠 ابدأ المسح</button>
   <div class="sc-help" id="sc-bhelp" hidden><b>البرنامج الوسيط غير متصل على هذا الجهاز.</b><ol><li>ثبّت Node.js ثم شغّل <b>scan-bridge/install-autostart.bat</b> مرة واحدة.</li><li>تأكد أن السكانر موصول ومعرَّف في ويندوز.</li><li>اضغط «تحديث» أعلاه، أو افتح «🩺 تشخيص» لمعرفة السبب. (يمكنك أيضاً استخدام المجلد أو الكاميرا أو رفع الملفات.)</li></ol></div>
  </div>
  <div class="sc-pane" data-pane="folder" hidden>
   <p class="sc-note">اضبط برنامج السكانر (TWAIN / WIA / Scan-to-folder) ليحفظ الصور في مجلد على هذا الجهاز، ثم اختر المجلد هنا. تُستورد أي صورة أو PDF جديد تلقائياً. (يعمل في Chrome وEdge)</p>
   <div class="sc-row"><button class="sc-primary" id="sc-pick" style="padding:10px 18px;font-size:14px">📁 اختيار مجلد المسح</button><span id="sc-folderstate"></span></div>
  </div>
  <div class="sc-pane" data-pane="cam" hidden>
   <video id="sc-video" autoplay playsinline muted hidden></video>
   <div class="sc-row"><button class="sc-primary" id="sc-cam" style="padding:10px 18px;font-size:14px">📷 تشغيل الكاميرا</button><button class="sc-primary" id="sc-snap" hidden style="padding:10px 18px;font-size:14px">📸 التقاط صورة</button><button class="sc-ghost" id="sc-camstop" hidden>إيقاف الكاميرا</button></div>
  </div>
  <div class="sc-pane" data-pane="file" hidden>
   <div class="sc-drop" id="sc-drop"><div class="big">📤</div><p>اسحب الصور أو ملفات PDF وأفلتها هنا</p><button class="sc-primary" id="sc-up" style="padding:10px 18px;font-size:14px">اختيار ملفات</button><input type="file" id="sc-file" multiple accept="image/*,.pdf" hidden></div>
  </div>
  <div class="sc-ph"><h4>الصفحات <span class="sc-badge" id="sc-count">0</span></h4><button class="sc-ghost" id="sc-ocr" disabled title="يقرأ الصفحة الأولى ويقترح رقم الحاوية">🔎 قراءة رقم الحاوية (OCR)</button><button class="sc-ghost sc-sp" id="sc-clear" disabled>🗑 مسح الكل</button></div>
  <div class="sc-opts"><label class="sc-chk"><input type="checkbox" id="sc-optblank"> حذف الصفحات الفارغة تلقائياً</label><label class="sc-chk" title="يقدّر ميل كل صفحة ويعدّلها فور استلامها"><input type="checkbox" id="sc-optdeskew"> تصحيح الميل تلقائياً</label><label class="sc-chk" title="يقص الحواف الداكنة وظل غطاء السكانر حول الورقة فور استلام كل صفحة"><input type="checkbox" id="sc-optedges"> حذف الحواف الخارجية تلقائياً</label><label class="sc-chk"><input type="checkbox" id="sc-optocr"> قراءة رقم الحاوية تلقائياً بعد المسح</label><label class="sc-chk" title="يضيف نصاً مخفياً (إنجليزي وأرقام) للبحث داخل الملف — أبطأ في الحفظ"><input type="checkbox" id="sc-optsearch"> PDF قابل للبحث (إنجليزي/أرقام)</label></div>
  <div class="sc-sug" id="sc-sug" hidden></div>
  <div id="sc-pages" class="empty"></div>
 </div>
 <div class="sc-foot">
  <label class="sc-f t">نوع المستند<select id="sc-type">${DOC_TYPES.map(t => '<option value="' + t[0] + '">' + t[1] + '</option>').join('')}</select></label>
  <label class="sc-f">نص مميز بعد اسم المجلد (فارغ = ترقيم تلقائي)<input type="text" id="sc-ref" placeholder="مثال: 01 أو MSKU1234567"></label>
  <button class="sc-primary" id="sc-save" disabled>💾 حفظ في الأرشيف</button>
  <div class="sc-prev" id="sc-preview"></div>
 </div></div>`;
            doc.body.appendChild(root);
            // خيارات محفوظة
            const opt = (id, key, def) => { const el = $(id); el.checked = store.get(key, def) === '1'; el.onchange = () => store.set(key, el.checked ? '1' : '0'); };
            opt('#sc-optblank', 'scOptBlank', '1'); opt('#sc-optdeskew', 'scOptDeskew', '1'); opt('#sc-optedges', 'scOptEdges', '1'); opt('#sc-optocr', 'scOptOcr', '0'); opt('#sc-optsearch', 'scOptSearch', '0');
            $('#sc-type').value = store.get('scDocType', ''); $('#sc-type').onchange = () => { store.set('scDocType', $('#sc-type').value); updatePreview(); };
            const tabs = root.querySelectorAll('.sc-tabs button');
            tabs.forEach(t => t.onclick = () => { tabs.forEach(x => x.classList.toggle('on', x === t)); root.querySelectorAll('.sc-pane').forEach(p => p.hidden = p.dataset.pane !== t.dataset.tab); if (t.dataset.tab !== 'cam') camStop(); });
            $('#sc-ref').oninput = updatePreview;
            api.open = () => { root.hidden = false; render(); bridgeCheck(); };
            $('#sc-brefresh').onclick = bridgeCheck; $('#sc-go').onclick = bridgeScan; $('#sc-ocr').onclick = runOcr;
            $('#sc-hlog').onclick = showLog; $('#sc-hdiag').onclick = showDiag;
            const closeIt = () => { root.hidden = true; camStop(); clearInterval(pollTimer); pollTimer = null; };
            $('#sc-close').onclick = closeIt; root.addEventListener('mousedown', e => { if (e.target === root) closeIt(); });
            $('#sc-pick').onclick = pickFolder; $('#sc-up').onclick = () => $('#sc-file').click();
            $('#sc-file').onchange = async e => { await addMany(Array.from(e.target.files), 'رفع ملفات'); e.target.value = ''; };
            $('#sc-cam').onclick = camStart; $('#sc-camstop').onclick = camStop; $('#sc-snap').onclick = camSnap;
            $('#sc-save').onclick = save; $('#sc-clear').onclick = () => { pages = []; $('#sc-sug').hidden = true; render(); };
            const dz = $('#sc-drop');
            dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over');
            dz.ondrop = async e => { e.preventDefault(); dz.classList.remove('over'); await addMany(Array.from(e.dataTransfer.files), 'رفع ملفات'); };
            restoreFolder(); render(); api.open();
        }
        const api = { addFile, pages: () => pages, save, open: null };
        build();
        return api;
    }

    // ============================================================
    // الواجهة العامة: تُستدعى من شاشة الأرشيف
    // ============================================================
    const folderInst = new WeakMap();
    window.Scanner = {
        openForFolder: function (win, folderName) {
            let inst = folderInst.get(win);
            if (!inst || inst.__folder !== folderName || !win.document.getElementById('sc-root')) {
                const old = win.document.getElementById('sc-root'); if (old) old.remove();
                inst = create(win.document, win, {
                    folder: folderName,
                    existingNames: () => Array.from(win.document.querySelectorAll('.folder-card[data-folder-name="' + folderName.replace(/"/g, '\\"') + '"] .file-name [title]')).map(e => e.getAttribute('title') || e.textContent.trim()),
                    onSaved: () => { try { win.refreshArchiveContent && win.refreshArchiveContent(); } catch (e) { } }
                });
                inst.__folder = folderName; folderInst.set(win, inst);
            } else inst.open();
        },
        _t: { isoValid, detectContainers, isBlank, estimateSkew, estimateCropBox, processImage }   // للاختبار
    };
})();
