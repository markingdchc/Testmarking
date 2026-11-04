// ============================================================
// 📄 مولّد PDF نصي لتقرير التخزين (بديل أصغر حجماً من الطريقة الصورية)
// (نسخة البرنامج المرفق + إصلاح ترتيب الكلمات اللاتينية المتتالية داخل النص العربي)
// - يقرأ الجداول الحيّة من الصفحة، فيحترم اختيار الأعمدة والفلاتر وألوان الخلايا كما هي
// - النص قابل للبحث والنسخ، والعربية بخط مضمَّن (pdf-font.js)
// - عند أي فشل تعود الدالة الأصلية تلقائياً إلى الطريقة الصورية
// للإجبار على الطريقة القديمة: localStorage.setItem('pdfMode','image')
// ============================================================
(function () {
    'use strict';

    const NAVY = [10, 61, 98], GREEN = [30, 111, 92], GRAY = [108, 117, 125];
    const AUTOTABLE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';

    // ---------- 1) تشكيل الحروف العربية (أشكال العرض FE70–FEFC) ----------
    const q = b => [b, b + 1, b + 2, b + 3];      // معزول، نهاية، بداية، وسط
    const d = b => [b, b + 1];                    // معزول، نهاية (يتصل بما قبله فقط)
    const FORMS = {
        0x621: [0xFE80], 0x622: d(0xFE81), 0x623: d(0xFE83), 0x624: d(0xFE85), 0x625: d(0xFE87),
        0x626: q(0xFE89), 0x627: d(0xFE8D), 0x628: q(0xFE8F), 0x629: d(0xFE93), 0x62A: q(0xFE95),
        0x62B: q(0xFE99), 0x62C: q(0xFE9D), 0x62D: q(0xFEA1), 0x62E: q(0xFEA5), 0x62F: d(0xFEA9),
        0x630: d(0xFEAB), 0x631: d(0xFEAD), 0x632: d(0xFEAF), 0x633: q(0xFEB1), 0x634: q(0xFEB5),
        0x635: q(0xFEB9), 0x636: q(0xFEBD), 0x637: q(0xFEC1), 0x638: q(0xFEC5), 0x639: q(0xFEC9),
        0x63A: q(0xFECD), 0x641: q(0xFED1), 0x642: q(0xFED5), 0x643: q(0xFED9), 0x644: q(0xFEDD),
        0x645: q(0xFEE1), 0x646: q(0xFEE5), 0x647: q(0xFEE9), 0x648: d(0xFEED), 0x649: d(0xFEEF),
        0x64A: q(0xFEF1)
    };
    const LAM_ALEF = { 0x622: d(0xFEF5), 0x623: d(0xFEF7), 0x625: d(0xFEF9), 0x627: d(0xFEFB) };
    const isDual = cp => cp === 0x640 || (FORMS[cp] && FORMS[cp].length === 4);
    const isJoinable = cp => cp === 0x640 || (FORMS[cp] && cp !== 0x621);

    // يرجع الحروف المشكَّلة بالترتيب المنطقي
    function shape(codes) {
        const out = [];
        for (let i = 0; i < codes.length; i++) {
            const cp = codes[i], prev = i > 0 ? codes[i - 1] : 0, next = codes[i + 1];
            const joinPrev = isDual(prev) && isJoinable(cp);
            if (cp === 0x644 && LAM_ALEF[next]) {                       // لام + ألف = لا
                out.push(LAM_ALEF[next][joinPrev ? 1 : 0]); i++; continue;
            }
            const f = FORMS[cp];
            if (!f) { out.push(cp); continue; }
            const joinNext = isDual(cp) && next !== undefined && isJoinable(next);
            let idx = 0;
            if (f.length === 4) idx = joinPrev && joinNext ? 3 : joinPrev ? 1 : joinNext ? 2 : 0;
            else if (f.length === 2) idx = joinPrev ? 1 : 0;
            out.push(f[idx]);
        }
        return out;
    }

    // ---------- 2) تنظيف النص وترتيبه بصرياً (RTL) ----------
    const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '<': '>', '>': '<', '{': '}', '}': '{' };
    const AR_LETTERS = /[\u0621-\u064A]/;

    function clean(s) {
        return String(s == null ? '' : s)
            .replace(/[\u0660-\u0669]/g, c => String(c.charCodeAt(0) - 0x660))
            .replace(/[\u06F0-\u06F9]/g, c => String(c.charCodeAt(0) - 0x6F0))
            .replace(/[\u274C\u2716\u2715\u2717\u2718]/g, '\u2716')
            .replace(/[\u2705\u2714\u2713]/g, '\u2714')
            .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\uFE0F]/g, '')
            .replace(/[\u{1F000}-\u{1FFFF}\u2600-\u26FF\u2700-\u2713\u2715\u2717-\u27BF\u2B00-\u2BFF]/gu, '')
            .replace(/\s+/g, ' ').trim();
    }

    // jsPDF يرتّب أي نص يحوي حروفاً عربية بنفسه (فيعكس ترتيبنا البصري). لذلك نمرّر الحروف العربية
    // برموز الاستخدام الخاص (E200–E7FF) التي يحوّلها الخط المضمَّن (pdf-font.js) إلى الأشكال الصحيحة.
    function toPUA(str) {
        return str.replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, ch => {
            const c = ch.charCodeAt(0);
            return String.fromCharCode(c <= 0x06FF ? 0xE200 + (c - 0x600) : c <= 0x077F ? 0xE700 + (c - 0x750) : c <= 0xFDFF ? 0xE400 + (c - 0xFB50) : 0xE300 + (c - 0xFE70));
        });
    }

    function toVisual(text) { return toPUA(toVisualRaw(text)); }

    // الترتيب البصري (RTL). المقاطع اللاتينية/الأرقام المتتالية تُحفظ بترتيبها الطبيعي
    // (مثل «MSC JADE» أو «TRSHP + EXPRT» أو «(Container) 123») وتُعامل كمقطع واحد، كما يفعل المتصفح.
    function toVisualRaw(text) {
        text = clean(text);
        if (!AR_LETTERS.test(text)) return text;
        const toks = [];
        const re = /([\u0621-\u064A\u0640\u064B-\u0652]+)|(\(?[A-Za-z0-9][A-Za-z0-9.\-\/:_#%+@&]*\)?)|(\s+)|([\s\S])/gu;
        let m;
        while ((m = re.exec(text))) {
            if (m[1]) {
                const codes = [...m[1]].map(c => c.codePointAt(0)).filter(c => c < 0x64B || c > 0x652);
                toks.push({ k: 'ar', s: String.fromCodePoint(...shape(codes).reverse()) });
            } else if (m[2]) toks.push({ k: 'lt', s: m[2] });
            else if (m[3]) toks.push({ k: 'sp', s: ' ' });
            else toks.push({ k: MIRROR[m[4]] ? 'br' : 'ne', s: m[4] });
        }
        // دمج: لاتيني + (مسافات/رموز محايدة) + لاتيني ← مقطع LTR واحد
        const runs = [];
        for (let i = 0; i < toks.length; i++) {
            const t = toks[i];
            if (t.k === 'lt') {
                let s = t.s, j = i + 1;
                for (;;) {
                    let n = j; while (n < toks.length && (toks[n].k === 'sp' || toks[n].k === 'ne')) n++;
                    if (n < toks.length && toks[n].k === 'lt') { for (let q = j; q <= n; q++) s += toks[q].s; j = n + 1; } else break;
                }
                runs.push(s); i = j - 1;
            } else if (t.k === 'ar') runs.push(t.s);
            else if (t.k === 'sp') runs.push(' ');
            else runs.push(t.k === 'br' ? MIRROR[t.s] : t.s);
        }
        return runs.reverse().join('');
    }

    // خلية فيها عربية: نمنع كسر السطر (الكسر يفسد الترتيب البصري)
    function cellText(text) {
        const v = toVisual(text);
        return /[\uE200-\uE7FF]/.test(v) ? v.replace(/ /g, '\u00A0') : v;
    }

    // ---------- 3) الألوان ----------
    function parseColor(c) {
        const m = c && String(c).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(',').map(parseFloat);
        const a = p.length > 3 ? p[3] : 1;
        if (!(a > 0)) return null;
        return p.slice(0, 3).map(v => Math.round(v * a + 255 * (1 - a)));
    }
    const isWhite = rgb => !rgb || (rgb[0] >= 250 && rgb[1] >= 250 && rgb[2] >= 250);

    // ---------- 4) قراءة الجداول الحيّة من الصفحة ----------
    const shown = el => !!el && getComputedStyle(el).display !== 'none';

    function readCell(td, trBg) {
        const cs = getComputedStyle(td);
        let bg = parseColor(cs.backgroundColor) || trBg;
        let color = parseColor(cs.color);
        const inner = td.children.length === 1 ? td.children[0] : null;
        if (isWhite(bg) && inner) {                          // شارة داخل الخلية: نأخذ لونها
            const ics = getComputedStyle(inner), ib = parseColor(ics.backgroundColor);
            if (ib && !isWhite(ib)) { bg = ib; color = parseColor(ics.color) || color; }
        }
        const text = clean(td.textContent);
        if (text === '\u2716') color = [220, 53, 69];
        else if (text === '\u2714') color = [40, 167, 69];
        return { text: td.textContent, bg: isWhite(bg) ? null : bg, color, bold: (parseInt(cs.fontWeight, 10) || 400) >= 600 };
    }

    function readTable(table) {
        const headRow = table.querySelector('thead tr');
        const heads = headRow ? [...headRow.children].filter(shown).map(th => th.textContent) : [];
        const rows = [];
        table.querySelectorAll('tbody tr').forEach(tr => {
            if (!shown(tr)) return;                                          // مخفي بالفلترة
            const cells = [...tr.children].filter(shown);
            if (cells.length === 1 && (cells[0].colSpan || 1) > 1) return;   // سطر رسالة (مثل: يرجى التحميل)
            const trBg = parseColor(getComputedStyle(tr).backgroundColor);
            rows.push(cells.map(td => readCell(td, trBg)));
        });
        return { heads, rows };
    }

    // ---------- بطاقات الإجمالي: تُقرأ كما هي (ألوان البطاقات، العناوين، الأرقام، أسطر التفاصيل) ----------
    const pxOf = v => parseFloat(v) || 12;
    function bgOf(el) {                                  // خلفية العنصر؛ التدرج يُستبدل بمتوسط لونيه
        const cs = getComputedStyle(el);
        const g = (cs.backgroundImage || '').match(/rgba?\([^)]+\)/g);
        if (g && g.length) {
            const c = g.slice(0, 2).map(parseColor).filter(Boolean);
            if (c.length) return c.length === 1 ? c[0] : c[0].map((v, i) => Math.round((v + c[1][i]) / 2));
        }
        return parseColor(cs.backgroundColor);
    }
    function isCardContainer(el) {                       // حاوية مرنة تضم عدة بطاقات
        const kids = [...el.children].filter(shown);
        if (kids.length < 2) return false;
        const d = getComputedStyle(el).display;
        if (d !== 'flex' && d !== 'grid') return false;
        return kids.every(k => bgOf(k) || parseFloat(getComputedStyle(k).flexGrow) >= 1 || (k.classList && k.classList.contains('stat-card')));
    }
    function findCards(root, out) {
        [...root.children].filter(shown).forEach(el => { if (isCardContainer(el)) findCards(el, out); else out.push(el); });
        return out;
    }
    function collectLines(card) {                        // كل سطر نصي داخل البطاقة بنمطه ولون خلفيته
        const lines = [];
        const walk = el => {
            const kids = [...el.children].filter(shown);
            if (kids.every(c => /^inline/.test(getComputedStyle(c).display))) {
                const t = clean(el.textContent);
                if (!t) return;
                const cs = getComputedStyle(el);
                let bg = null, p = el;
                while (p && p !== card) { const b = bgOf(p); if (b) { bg = b; break; } p = p.parentElement; }
                lines.push({ text: t, px: pxOf(cs.fontSize), bold: (parseInt(cs.fontWeight, 10) || 400) >= 600, color: parseColor(cs.color), bg });
            } else kids.forEach(walk);
        };
        walk(card);
        return lines;
    }
    function readCards(tabEl) {
        const st = tabEl.querySelector('.stats');
        if (!st) return [];
        return findCards(st, []).map(card => ({ bg: bgOf(card), lines: collectLines(card) })).filter(c => c.lines.length);
    }

    // ---------- 5) تهيئة المكتبات ----------
    async function ensureAutoTable() {
        const probe = () => { try { return typeof new window.jspdf.jsPDF().autoTable === 'function'; } catch (e) { return false; } };
        if (probe()) return;
        // في index.html تُحمَّل jsPDF مرتين، والثانية تمسح إضافة autoTable؛ فنعيد تحميل الإضافة هنا
        await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = AUTOTABLE_URL; s.onload = res; s.onerror = () => rej(new Error('تعذّر تحميل autoTable'));
            document.head.appendChild(s);
        });
        if (!probe()) throw new Error('autoTable غير متاح');
    }

    function registerFonts(doc) {
        if (!window.PDF_AR_FONT) throw new Error('الخط العربي غير محمّل (pdf-font.js)');
        // العريض عائلة مستقلة بنمط normal: أضمن من تسجيل نمط bold لنفس العائلة في jsPDF
        doc.addFileToVFS('ArFont-Regular.ttf', window.PDF_AR_FONT.regular);
        doc.addFont('ArFont-Regular.ttf', 'ArFont', 'normal', 'normal', 'Identity-H');
        doc.addFileToVFS('ArFontBold-Regular.ttf', window.PDF_AR_FONT.bold);
        doc.addFont('ArFontBold-Regular.ttf', 'ArFontBold', 'normal', 'normal', 'Identity-H');
    }
    const useBold = doc => doc.setFont('ArFontBold', 'normal');
    const useReg = doc => doc.setFont('ArFont', 'normal');

    // ---------- 6) تخطيط الجدول (طولي): خط يناسب عدد الأعمدة + تقسيم الأسطر بالترتيب المنطقي ----------
    // قياس عند 10pt ثم تحجيم خطي (عرض النص يتناسب مع حجم الخط)
    function makeMeasure(doc) {
        useBold(doc); doc.setFontSize(10);
        const cache = new Map();
        return str => { let w = cache.get(str); if (w === undefined) { w = doc.getTextWidth(toVisual(str)); cache.set(str, w); } return w; };
    }

    // تقسيم نص منطقي إلى أسطر بحسب العرض، ثم تحويل كل سطر بصرياً على حدة
    function wrapLogical(measure, text, maxW, fs) {
        const t = clean(text);
        if (!t || measure(t) * fs / 10 <= maxW) return toVisual(t);
        const words = t.split(' '), lines = [];
        let cur = '';
        words.forEach(w => {
            const tryLine = cur ? cur + ' ' + w : w;
            if (cur && measure(tryLine) * fs / 10 > maxW) { lines.push(cur); cur = w; } else cur = tryLine;
        });
        if (cur) lines.push(cur);
        return lines.map(toVisual).join('\n');
    }

    function layoutTable(doc, heads, rows, availW) {
        const measure = makeMeasure(doc);
        const N = Math.max(heads.length, ...rows.map(r => r.length)) + 1;
        heads = heads.concat(new Array(Math.max(0, N - 1 - heads.length)).fill(''));
        const colMax = new Array(N).fill(0), hdrWord = new Array(N).fill(0), bodyWord = new Array(N).fill(0);
        const idxW = measure(String(rows.length));
        const cap = availW * 0.2;                                   // أقصى عرض مرغوب للنص الطويل قبل أن يلتف
        heads.forEach((h, j) => { clean(h).split(' ').forEach(w => { hdrWord[j + 1] = Math.max(hdrWord[j + 1], measure(w)); }); });
        rows.forEach(r => r.forEach((c, j) => {
            const t = clean(c.text);
            colMax[j + 1] = Math.max(colMax[j + 1], measure(t));
            t.split(' ').forEach(w => { bodyWord[j + 1] = Math.max(bodyWord[j + 1], measure(w)); });
        }));
        let fs = N <= 9 ? 8 : N <= 13 ? 7 : N <= 17 ? 6 : 5.4, pad = 1, widths;
        for (; ; fs = +(fs - 0.2).toFixed(1)) {
            pad = Math.max(0.55, fs * 0.15);
            const k = fs / 10;
            widths = new Array(N).fill(0);
            widths[0] = Math.max(idxW, measure('م')) * k + 2 * pad;
            for (let j = 1; j < N; j++) widths[j] = Math.max(hdrWord[j], bodyWord[j], Math.min(colMax[j], cap / k)) * k + 2 * pad;
            if (widths.reduce((a, b) => a + b, 0) <= availW || fs <= 3.6) break;
        }
        const total = widths.reduce((a, b) => a + b, 0), f = availW / total;   // توزيع المساحة المتبقية بالتناسب
        widths = widths.map(w => w * f);
        const k = fs / 10;
        const headTxt = [toVisual('م')].concat(heads.map((h, j) => wrapLogical(measure, h, widths[j + 1] - 2 * pad, fs)));
        const bodyTxt = rows.map(r => r.map((c, j) => wrapLogical(measure, c.text, widths[j + 1] - 2 * pad, fs)));
        return { fs, pad, widths, headTxt, bodyTxt };
    }

    // ---------- 7) رسم المستند ----------
    function fit(doc, str, maxW, size, min) {
        doc.setFontSize(size);
        while (size > min && doc.getTextWidth(str) > maxW) { size -= 0.5; doc.setFontSize(size); }
    }

    function nowText() {
        const n = new Date(), p = v => String(v).padStart(2, '0');
        return `${p(n.getDate())}/${p(n.getMonth() + 1)}/${n.getFullYear()} ${p(n.getHours())}:${p(n.getMinutes())}`;
    }

    // رسم البطاقات: صف واحد قدر الإمكان (الأولى يميناً كما في الصفحة)، وتلتف الأسطر الطويلة بالترتيب العربي الصحيح
    function drawCards(doc, cards, y, W, M) {
        const availW = W - 2 * M, gap = 2.5, minW = 33, pad = 1.6;
        const per = Math.max(1, Math.min(cards.length, Math.floor((availW + gap) / (minW + gap))));
        const cw = (availW - gap * (per - 1)) / per;
        const measure = makeMeasure(doc);
        cards.forEach(card => {
            card.items = []; let h = pad;
            card.lines.forEach(l => {
                const pt = Math.max(4.6, Math.min(15, l.px * 0.62)), lh = pt * 0.3528 * 1.4;
                wrapLogical(measure, l.text, cw - 2 * pad - 1, pt).split('\n').forEach(vis => { card.items.push({ vis, pt, l, y: h, lh }); h += lh; });
                h += 0.5;
            });
            card.h = h + pad - 0.5;
        });
        for (let r = 0; r * per < cards.length; r++) {
            const row = cards.slice(r * per, r * per + per), rh = Math.max(...row.map(c => c.h));
            if (y + rh > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 14; }
            row.forEach((c, i) => {
                const x = W - M - cw - i * (cw + gap);
                const fill = c.bg && !isWhite(c.bg) ? c.bg : [255, 255, 255];
                doc.setFillColor(...fill); doc.setDrawColor(222, 226, 230); doc.setLineWidth(0.2);
                doc.roundedRect(x, y, cw, rh, 2, 2, isWhite(fill) ? 'FD' : 'F');
                c.items.forEach(it => {
                    if (it.l.bg && !isWhite(it.l.bg)) { doc.setFillColor(...it.l.bg); doc.rect(x + 0.6, y + it.y - 0.1, cw - 1.2, it.lh + 0.2, 'F'); }
                    if (it.l.bold) useBold(doc); else useReg(doc);
                    doc.setFontSize(it.pt); doc.setTextColor(...(it.l.color || [33, 37, 41]));
                    doc.text(it.vis, x + cw / 2, y + it.y + it.lh * 0.76, { align: 'center' });
                });
            });
            y += rh + gap;
        }
        return y;
    }

    function drawTab(doc, tab, meta, first) {
        if (!first) doc.addPage();
        const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 8;
        let y = 14;

        useBold(doc); doc.setFontSize(14); doc.setTextColor(...NAVY);
        doc.text(toVisual('تقرير أيام التخزين'), W / 2, y, { align: 'center' });
        y += 6;
        useBold(doc); doc.setFontSize(8.5); doc.setTextColor(...GREEN);
        doc.text(toVisual([tab.title, meta.carrier, meta.shipDate, meta.lineId].join(' | ')), W / 2, y, { align: 'center' });
        y += 3;
        doc.setDrawColor(...NAVY); doc.setLineWidth(0.5); doc.line(M, y, W - M, y);
        y += 5;

        useReg(doc); doc.setFontSize(7); doc.setTextColor(...GRAY);
        doc.text(toVisual('تاريخ الطباعة: ' + nowText()), M, y);
        y += 3;

        if (tab.extra) {                                      // بيانات تبويب Finalout
            const lines = [['رقم الأمر', tab.extra.orderNumber], ['الخط المشغل', tab.extra.lineOp], ['عدد الحاويات', tab.extra.count]];
            doc.setFillColor(248, 249, 250); doc.roundedRect(W - M - 70, y, 70, 16, 1.5, 1.5, 'F');
            useReg(doc); doc.setFontSize(8); doc.setTextColor(33, 37, 41);
            lines.forEach((l, i) => doc.text(toVisual(l[0] + ': ' + l[1]), W - M - 2, y + 4.5 + i * 4.5, { align: 'right' }));
            y += 19;
        }

        if (tab.stats.length) y = drawCards(doc, tab.stats, y, W, M) + 2;     // بطاقات الإجمالي بألوانها وتفاصيلها

        const L = layoutTable(doc, tab.heads, tab.rows, W - 2 * M);
        const body = tab.rows.map((r, i) => [{ content: String(i + 1), styles: { font: 'ArFontBold', fontStyle: 'normal', fillColor: [248, 249, 250] } }]
            .concat(r.map((c, j) => {
                const st = {};
                if (c.bg) st.fillColor = c.bg;
                if (c.color) st.textColor = c.color;
                if (c.bold) { st.font = 'ArFontBold'; st.fontStyle = 'normal'; }
                return { content: L.bodyTxt[i][j], styles: st };
            })));
        const columnStyles = {};
        L.widths.forEach((w, i) => { columnStyles[i] = { cellWidth: w }; });

        doc.autoTable({
            head: [L.headTxt], body, startY: y, margin: { left: M, right: M, top: 12, bottom: 14 },
            theme: 'grid', rowPageBreak: 'avoid', tableWidth: W - 2 * M, columnStyles,
            styles: { font: 'ArFont', fontStyle: 'normal', fontSize: L.fs, cellPadding: L.pad, halign: 'center', valign: 'middle', lineColor: [221, 221, 221], lineWidth: 0.15, textColor: [33, 37, 41], overflow: 'linebreak' },
            headStyles: { font: 'ArFontBold', fontStyle: 'normal', fillColor: NAVY, textColor: [255, 255, 255] }
        });

        // التوقيعات + التذييل (تنتقل لصفحة جديدة إن لم تتسع)
        let fy = doc.lastAutoTable.finalY + 10;
        if (fy + 32 > H - 12) { doc.addPage(); fy = 22; }
        const sig = [['Head of Operations', W - M - 32], ['Document Auditor', W / 2], ['Line Clerk', M + 32]];
        sig.forEach(([role, cx]) => {
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3); doc.line(cx - 26, fy + 12, cx + 26, fy + 12);
            useBold(doc); doc.setFontSize(7.5); doc.setTextColor(33, 37, 41);
            doc.text('Signature', cx, fy + 16.5, { align: 'center' });
            useReg(doc); doc.setFontSize(6.5);
            doc.text(role, cx, fy + 20.5, { align: 'center' });
        });
        useReg(doc); doc.setFontSize(6.5); doc.setTextColor(...GRAY);
        doc.text(toVisual('تم إنشاؤه بواسطة نظام التخزين'), W / 2, fy + 28, { align: 'center' });
    }

    async function buildDocument(tabs, meta) {
        await ensureAutoTable();
        const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
        registerFonts(doc);
        tabs.forEach((t, i) => drawTab(doc, t, meta, i === 0));
        const n = doc.getNumberOfPages(), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
        for (let i = 1; i <= n; i++) {
            doc.setPage(i); useReg(doc); doc.setFontSize(6.5); doc.setTextColor(...GRAY);
            doc.text(`Page ${i} / ${n}`, W - 8, H - 6, { align: 'right' });
        }
        return doc;
    }

    // ---------- 8) الواجهة التي تستدعيها autoGenerateAndArchiveFullPDF ----------
    async function generateTextPDFReport(ctx) {
        if (!window.jspdf || !window.jspdf.jsPDF) return false;
        const data = {
            1: typeof currentData1 !== 'undefined' ? currentData1 : null, 2: typeof currentData2 !== 'undefined' ? currentData2 : null,
            3: typeof currentData3 !== 'undefined' ? currentData3 : null, 4: typeof currentData4 !== 'undefined' ? currentData4 : null,
            5: typeof currentData5 !== 'undefined' ? currentData5 : null, 6: typeof currentData6 !== 'undefined' ? currentData6 : null,
            7: typeof currentData7 !== 'undefined' ? currentData7 : null, 8: typeof currentData8 !== 'undefined' ? currentData8 : null
        };
        const txt = id => (document.getElementById(id) || {}).innerText || '—';
        const tabs = [];
        for (const tab of ctx.tabsToPrint) {
            const arr = data[tab.id.replace('tab', '')];
            const el = document.getElementById(tab.id);
            const table = el && el.querySelector('.table-wrapper table');
            if (!arr || !arr.length || !table) continue;
            const t = readTable(table);                     // الجدول المعروض فعلاً: الأعمدة المختارة + الفلاتر
            if (!t.rows.length) continue;
            tabs.push({
                id: tab.id, title: tab.title, heads: t.heads, rows: t.rows, stats: readCards(el),
                extra: tab.id === 'tab8' ? { orderNumber: txt('headerOrderNumber'), lineOp: txt('headerLineOp'), count: txt('headerCount') } : null
            });
        }
        if (!tabs.length) return false;

        const loading = document.createElement('div');
        loading.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0a3d62;color:white;padding:15px 30px;border-radius:8px;z-index:100000;font-weight:bold';
        loading.textContent = '⏳ جاري إنشاء بيان التخزين (PDF نصي)...';
        document.body.appendChild(loading);
        try {
            const doc = await buildDocument(tabs, { carrier: ctx.headerCarrierName, shipDate: ctx.headerShippingDate, lineId: ctx.headerLineId });
            const b64 = doc.output('datauristring').split(',')[1].replace(/\s/g, '');
            const result = await uploadBase64ToArchive(ctx.folderName, ctx.fileName, b64);
            if (!result.success) throw new Error(result.error || 'فشل الرفع');
            const footer = document.getElementById('footerMsg');
            if (footer) { footer.innerHTML = `✅ تم حفظ تقرير PDF الشامل في الأرشيف: <strong>${ctx.fileName}</strong>`; footer.style.color = '#28a745'; }
            if (typeof showUploadNotification === 'function') showUploadNotification('success', 'تم إنشاء PDF', `تم حفظ التقرير باسم: ${ctx.fileName}`);
            console.log(`✅ PDF نصي: ${(b64.length * 0.75 / 1024).toFixed(0)} KB، ${doc.getNumberOfPages()} صفحة`);
            return true;
        } finally {
            if (loading.parentNode) loading.parentNode.removeChild(loading);
        }
    }

    window.generateTextPDFReport = generateTextPDFReport;
    window.PdfText = { toVisual, toPUA, clean, cellText, parseColor, readTable, readCards, readStats: readCards, buildDocument, layoutTable, drawCards };
})();
