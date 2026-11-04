// ============================================================
// 📄 مولّد PDF نصي لتقرير التخزين — الإصدار 6.0
// الهدف: نفس شكل التقرير الصوري القديم، لكن الجدول نصي (أصغر حجماً وقابل للبحث)
//
//  • رأس التقرير + بطاقات الإجمالي + التوقيعات: تُرسم بمحرك المتصفح (html2canvas) من نفس
//    HTML الذي كانت تستعمله الطريقة الصورية، فتطابق البرنامج حرفياً (ألوان، تدرجات، أيقونات).
//  • الجدول: نص حقيقي (jsPDF). أي خلية فيها عربية أو رموز تُرسم بمحرك المتصفح نفسه
//    (canvas) بنفس خط البرنامج، فتظهر العربية متصلة وصحيحة 100% دون أي خط مضمَّن.
//  • الأرقام والإنجليزية نص قابل للبحث والنسخ؛ ❌ و✅ و— تُرسم كأشكال متجهية.
//  • عند أي فشل تعود الدالة الأصلية تلقائياً إلى الطريقة الصورية.
// للإجبار على الطريقة القديمة: localStorage.setItem('pdfMode','image')
// ============================================================
(function () {
    'use strict';

    // ---------- ثوابت التصميم (مطابقة لستايل البرنامج) ----------
    const NAVY = [10, 61, 98];
    const BORDER = [221, 221, 221];
    const GRAY = [108, 117, 125];
    const TEXT = [33, 37, 41];
    const MM_PT = 25.4 / 72;                    // ملم لكل نقطة
    const M = 8;                                // هامش الصفحة (ملم) كما في الطريقة الصورية
    const FS_MAX = 7.5, FS_MIN = 3.2;           // حدود حجم خط الجدول (نقطة)
    const MIN_PORTRAIT_FS = 5.0;                // أقل خط مقبول في الطولي؛ دونه تُستعمل صفحة أفقية للجدول العريض
    const PAD_H = 1.0;                          // حشو أفقي للخلية (ملم)
    const BLOCK_W_PX = 1000;                    // عرض رأس التقرير/التوقيعات عند التصيير
    const BLOCK_SCALE = 1.6, BLOCK_QUALITY = 0.82;
    const FONT_STACK = "'Segoe UI', Tahoma, Geneva, Verdana, 'Noto Sans Arabic', 'Noto Naskh Arabic', sans-serif";

    // ---------- 1) تنظيف النص وتصنيف الخلايا ----------
    const AR = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
    const ASCII = /^[\x20-\x7E]*$/;
    const ICON_X = /^[❌✖✕✗✘]$/;
    const ICON_OK = /^[✅✔✓☑]$/;
    const ICON_DASH = /^[—–]$/;

    function norm(s) {
        return String(s == null ? '' : s)
            .replace(/[​-‏‪-‮⁠⁦-⁩﻿]/g, '')
            .replace(/\s+/g, ' ').trim();
    }

    function classify(text) {
        const t = norm(text), bare = t.replace(/️/g, '');
        if (!t) return { k: 'empty', t };
        if (ICON_X.test(bare)) return { k: 'x', t };
        if (ICON_OK.test(bare)) return { k: 'ok', t };
        if (ICON_DASH.test(bare)) return { k: 'dash', t };
        if (ASCII.test(t)) return { k: 'text', t };
        return { k: 'img', t };                 // عربية / إيموجي / رموز: تُرسم بمحرك المتصفح
    }


    // ---------- 1b) لغة التقرير: ترجمة النصوص العربية إلى الإنجليزية (اختيارية) ----------
    // الافتراضي إنجليزي؛ التبديل بالزر الصغير أسفل الشاشة أو: localStorage.setItem('pdfLang','ar')
    const getLang = () => window.PDF_LANG || (function () { try { return localStorage.getItem('pdfLang'); } catch (e) { return null; } })() || 'en';
    const EN = {
        'رقم الحاوية': 'Container No.', 'الحجم': 'Size', 'النوع': 'Type', 'نوع': 'Type', 'الخط': 'Line', 'خطر': 'Hazardous', 'ثلاجه': 'Reefer', 'ثلاجة': 'Reefer',
        'اسم السفينة': 'Vessel Name', 'بداية': 'Start', 'نهاية': 'End', 'أيام': 'Days', 'أيام مشتركة': 'Shared Days', 'بعد الخصم': 'After Deduction',
        'طريقة الحساب': 'Calc. Method', 'سماح مستقل': 'Independent Free Time', 'سماح متسلسل': 'Sequential Free Time', 'سماح عادي': 'Normal Free Time', 'تداخل سماح': 'Overlapping Free Time',
        'طريقة مباشرة': 'Direct Method', 'أيام السماح': 'Free Days', 'عدد الأيام': 'No. of Days', 'رقم الفترة': 'Period No.', 'المنشأ': 'Origin', 'الملاحظات': 'Notes', 'ملاحظات': 'Notes',
        'تاريخ الدخول': 'Entry Date', 'تاريخ الخروج': 'Exit Date', 'أيام التخزين (جديد)': 'Storage Days (New)', 'نوع الشحنة': 'Freight Type', 'نوع الحركة': 'Move Type', 'نوع الموقع': 'Location Type',
        'نوع IMPRT': 'IMPRT Type', 'خاص': 'Special', 'عادي': 'Normal', 'فارغ': 'Empty', 'مبردة': 'Reefer', 'مبرد': 'Reefer',
        'إجمالي الحاويات': 'Total Containers', 'حاوية فريدة': 'unique containers', 'حاوية': 'containers', 'العدد': 'Count', 'قدم': 'ft', 'يوم': 'days',
        'إجمالي EXPRT (بعد الخصم)': 'Total EXPRT (after deduction)', 'إجمالي EXPRT': 'Total EXPRT', 'إجمالي TRSHP': 'Total TRSHP', 'إجمالي STRGE': 'Total STRGE', 'إجمالي IMPRT': 'Total IMPRT',
        'صافي أيام التصدير': 'Net export days', 'صافي أيام التخزين': 'Net storage days', 'صافي أيام الترانزيت': 'Net transit days', 'صافي أيام': 'Net days', 'صافي': 'Net',
        'أيام EXPRT (ثلاجه)': 'EXPRT days (reefer)', 'للحاويات ثلاجه فقط': 'reefer containers only', 'للمبردة': 'for reefers', 'إجمالي أيام': 'Total days', 'إجمالي الأيام': 'Total days',
        'إجمالي': 'Total', 'الإجمالي الكلي': 'Grand total', 'الإجمالي': 'Total', 'حسب المقاس': 'by size', 'تفاصيل الحجم': 'Size details', 'تفاصيل': 'Details',
        'إحصائيات حسب النوع': 'Statistics by type', 'إحصائيات': 'Statistics', 'الحاويات المبردة': 'Reefer containers', 'متوسط': 'Average', 'الأصلي': 'original', 'قبل الخصم': 'before deduction',
        'لا توجد بيانات': 'No data', 'من': 'from', 'إلى': 'to',
        'تقرير أيام التخزين': 'Storage Days Report', 'تاريخ الطباعة': 'Print date', 'رقم الأمر': 'Order No.', 'الخط المشغل': 'Operating Line', 'عدد الحاويات': 'Containers Count',
        'تم إنشاؤه بواسطة نظام التخزين': 'Generated by the Storage System',
        'فقط': 'only'
    };
    const EN_KEYS = Object.keys(EN).sort((a, b) => b.length - a.length);
    const hasAr = t => /[؀-ۿ]/.test(t);
    function tr(t) {
        if (getLang() !== 'en' || !t || !hasAr(t)) return t;
        const bare = t.replace(/^[^؀-ۿA-Za-z0-9]+/, '').trim();
        if (EN[bare]) return t.replace(bare, EN[bare]);
        let out = t;
        for (const k of EN_KEYS) if (out.indexOf(k) >= 0) out = out.split(k).join(EN[k]);
        return out.replace(/\s+/g, ' ').trim();
    }
    function trHtml(html) {
        if (getLang() !== 'en' || !html || !hasAr(html)) return html;
        const t = document.createElement('template');
        t.innerHTML = html;
        const w = document.createTreeWalker(t.content, NodeFilter.SHOW_TEXT);
        const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
        nodes.forEach(n => { if (hasAr(n.nodeValue)) n.nodeValue = tr(n.nodeValue); });
        return t.innerHTML;
    }
    function localizeTab(t) {
        if (getLang() !== 'en') return t;
        const re = c => { const k = classify(tr(c.t)); c.k = k.k; c.t = k.t; };
        t.heads.forEach(re); t.rows.forEach(r => r.forEach(re));
        t.title = tr(t.title); t.statsHtml = trHtml(t.statsHtml);
        return t;
    }
    const idHead = () => (getLang() === 'en' ? { k: 'text', t: 'No.' } : { k: 'img', t: 'م' });

    // ---------- 2) الألوان ----------
    function parseColor(c) {
        const m = c && String(c).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(',').map(parseFloat);
        const a = p.length > 3 ? p[3] : 1;
        if (!(a > 0)) return null;
        return p.slice(0, 3).map(v => Math.round(v * a + 255 * (1 - a)));
    }
    // لون فاتح جداً (أبيض/رمادي باهت من الستايل) لا يُعدّ تلويناً للخلية
    const isPale = rgb => !rgb || (rgb[0] >= 244 && rgb[1] >= 244 && rgb[2] >= 244);
    const css = rgb => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

    // ---------- 3) رسم النصوص العربية/الرموز بمحرك المتصفح ----------
    const RPX = 64;                              // حجم الخط المرجعي (بكسل) للرسم عالي الدقة
    const _cv = document.createElement('canvas');
    const _cx = _cv.getContext('2d');
    const _wCache = new Map(), _gCache = new Map();
    let _gSeq = 0;

    function prepCtx(bold, rtl) {
        _cx.font = `${bold ? '700' : '400'} ${RPX}px ${FONT_STACK}`;
        try { _cx.direction = rtl ? 'rtl' : 'ltr'; } catch (e) { /* متصفح قديم */ }
        _cv.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    }
    // عرض النص بوحدة em (نسبة لحجم الخط)
    function emWidth(text, bold) {
        const key = (bold ? 'b' : 'n') + '|' + text;
        let w = _wCache.get(key);
        if (w === undefined) {
            prepCtx(bold, AR.test(text));
            w = _cx.measureText(text).width / RPX;
            _wCache.set(key, w);
        }
        return w;
    }
    // صورة PNG شفافة للنص: { data, alias, wEm, hEm }
    function glyph(text, bold, color) {
        const key = (bold ? 'b' : 'n') + '|' + color.join(',') + '|' + text;
        let g = _gCache.get(key);
        if (g) return g;
        if (text.length > 120) text = text.slice(0, 118) + '…';
        const rtl = AR.test(text);
        prepCtx(bold, rtl);
        const tw = _cx.measureText(text).width;
        const pad = RPX * 0.25, cw = Math.max(8, Math.ceil(tw + pad * 2)), ch = Math.ceil(RPX * 1.6);
        _cv.width = cw; _cv.height = ch;         // يعيد ضبط الحالة
        prepCtx(bold, rtl);
        _cx.textAlign = 'center'; _cx.textBaseline = 'middle';
        _cx.fillStyle = css(color);
        _cx.fillText(text, cw / 2, ch / 2 + RPX * 0.04);
        g = { data: _cv.toDataURL('image/png'), alias: 'ar' + (++_gSeq), wEm: cw / RPX, hEm: ch / RPX };
        _gCache.set(key, g);
        return g;
    }

    // ---------- 4) قراءة الجداول الحيّة من الصفحة ----------
    const shown = el => !!el && getComputedStyle(el).display !== 'none';
    const isBold = cs => (parseInt(cs.fontWeight, 10) || 400) >= 600;

    function readCell(td, trBg) {
        const cs = getComputedStyle(td);
        const bg = parseColor(cs.backgroundColor) || trBg;
        let color = parseColor(cs.color), bold = isBold(cs), badge = null;
        const inner = td.children.length === 1 ? td.children[0] : null;
        if (inner && norm(inner.textContent) === norm(td.textContent)) {
            const ics = getComputedStyle(inner), ib = parseColor(ics.backgroundColor);
            if (ib && !isPale(ib)) badge = { bg: ib, color: parseColor(ics.color) || color };   // شارة (مثل ⭐ خاص / طريقة الحساب)
            if (isBold(ics)) bold = true;
        }
        const c = classify(td.textContent);
        return { k: c.k, t: c.t, bg: isPale(bg) ? null : bg, color, bold, badge };
    }

    function readTable(table) {
        const headRow = table.querySelector('thead tr');
        const heads = headRow ? [...headRow.children].filter(shown).map(th => classify(th.textContent)) : [];
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

    // HTML بطاقات الإجمالي كما هو (تدرجات، بطاقات متداخلة، أيقونات)
    function readStatsHtml(tabEl) {
        const st = tabEl.querySelector('.stats');
        if (!st || !shown(st)) return '';
        const html = st.innerHTML.replace(/\sid="[^"]*"/g, '').trim();
        return norm(st.textContent) ? html : '';
    }

    // ---------- 5) كتل HTML (الرأس + البطاقات / التوقيعات) → صور بمحرك المتصفح ----------
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function nowArabic() {
        return new Date().toLocaleString(getLang() === 'en' ? 'en-GB' : 'ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function topBlockHtml(tab, meta) {
        const en = getLang() === 'en', dir = en ? 'ltr' : 'rtl', T = s => tr(s);
        let extra = '';
        if (tab.extra) {
            extra = `<div style="text-align:${en ? 'left' : 'right'};margin-bottom:10px;font-size:11px;direction:${dir};background:#f8f9fa;padding:6px;border-radius:4px;">
                <div>📋 <strong>${T('رقم الأمر')}:</strong> ${esc(tab.extra.orderNumber)}</div>
                <div>🚢 <strong>${T('الخط المشغل')}:</strong> ${esc(tab.extra.lineOp)}</div>
                <div>📦 <strong>${T('عدد الحاويات')}:</strong> ${esc(tab.extra.count)}</div></div>`;
        }
        const stats = tab.statsHtml
            ? `<div style="width:100%;margin-bottom:15px;"><div style="display:flex;gap:20px;padding:20px 25px;background:#e9ecef;flex-wrap:wrap;direction:${dir};">${tab.statsHtml}</div></div>`
            : '';
        return `<div style="width:${BLOCK_W_PX}px;padding:10px;direction:${dir};background:#fff;color:#212529;box-sizing:border-box;font-family:${FONT_STACK};">
            <div style="text-align:center;border-bottom:2px solid #0a3d62;padding-bottom:10px;margin-bottom:15px;">
                <h1 style="color:#0a3d62;font-size:18px;margin:0;font-weight:bold;">📦 ${T('تقرير أيام التخزين')}</h1>
                <div style="color:#1e6f5c;font-size:12px;font-weight:bold;margin-top:5px;">
                    ${esc(tab.title)} | 🚢 ${esc(meta.carrier)} | 📅 ${esc(meta.shipDate)} | 🏷️ ${esc(meta.lineId)}
                </div>
            </div>
            <div style="text-align:left;font-size:10px;color:#6c757d;margin-bottom:10px;">📅 ${T('تاريخ الطباعة')}: ${esc(meta.printDate || nowArabic())}</div>
            ${extra}${stats}</div>`;
    }

    function bottomBlockHtml() {
        const dir = getLang() === 'en' ? 'ltr' : 'rtl';
        const sig = role => `<div style="text-align:center;width:30%;">
                <div style="height:35px;border-bottom:1px solid #000;margin-bottom:5px;"></div>
                <strong style="font-size:10px;">Signature</strong><div style="font-size:9px;">${role}</div></div>`;
        const sigs = dir === 'rtl' ? [sig('Head of Operations'), sig('Document Auditor'), sig('Line Clerk')] : [sig('Line Clerk'), sig('Document Auditor'), sig('Head of Operations')];
        return `<div style="width:${BLOCK_W_PX}px;padding:10px;direction:${dir};background:#fff;color:#212529;box-sizing:border-box;font-family:${FONT_STACK};">
            <div style="display:flex;justify-content:space-between;padding-top:15px;border-top:1px solid #0a3d62;">
                ${sigs.join('')}
            </div>
            <div style="text-align:center;font-size:9px;color:#6c757d;margin-top:15px;">${tr('تم إنشاؤه بواسطة نظام التخزين')}</div></div>`;
    }

    async function htmlToImage(html) {
        if (typeof window.html2canvas !== 'function') throw new Error('html2canvas غير محمّل');
        const box = document.createElement('div');
        box.style.cssText = `position:absolute;top:0;left:0;width:${BLOCK_W_PX}px;background:#fff;z-index:-1;`;
        box.innerHTML = html;
        document.body.appendChild(box);
        try {
            await new Promise(r => setTimeout(r, 80));
            const cv = await window.html2canvas(box, { scale: BLOCK_SCALE, backgroundColor: '#ffffff', logging: false, useCORS: true, imageTimeout: 0 });
            return { data: cv.toDataURL('image/jpeg', BLOCK_QUALITY), w: cv.width, h: cv.height };
        } finally {
            if (box.parentNode) box.parentNode.removeChild(box);
        }
    }

    // ---------- 6) تخطيط الجدول ----------
    // يقيس العرض الطبيعي لكل عمود عند خط 10pt (ملم)
    function makeMeasurer(doc) {
        const cache = new Map();
        return function (c, bold) {
            const key = c.k + '|' + (bold ? 1 : 0) + '|' + c.t;
            let w = cache.get(key);
            if (w !== undefined) return w;
            if (c.k === 'text') {
                doc.setFont('helvetica', bold ? 'bold' : 'normal');
                w = doc.getStringUnitWidth(c.t) * 10 * MM_PT;
            } else if (c.k === 'img') w = emWidth(c.t, bold) * 10 * MM_PT;
            else if (c.k === 'x' || c.k === 'ok') w = 1.1 * 10 * MM_PT;
            else if (c.k === 'dash') w = 0.9 * 10 * MM_PT;
            else w = 0;
            cache.set(key, w);
            return w;
        };
    }

    function planTab(meas, tab) {
        const n = tab.heads.length + 1;
        const nat = new Array(n).fill(0);
        nat[0] = Math.max(meas(idHead(), true), meas({ k: 'text', t: String(tab.rows.length) }, true));
        tab.heads.forEach((h, i) => { nat[i + 1] = meas(h, true); });
        tab.rows.forEach(r => r.forEach((c, i) => {
            let w = meas(c, c.bold);
            if (c.badge) w += 1.2 * 10 * MM_PT;
            if (w > nat[i + 1]) nat[i + 1] = w;
        }));
        for (let i = 0; i < n; i++) nat[i] = Math.min(Math.max(nat[i], 2), 70);   // سقف لعمود طويل (مثل الملاحظات)
        const sum = nat.reduce((a, b) => a + b, 0);
        const fit = A => Math.min(FS_MAX, Math.max(FS_MIN, (A - 2 * PAD_H * n) * 10 / sum));

        let orient = 'portrait', A = 210 - 2 * M, fs = fit(A);
        if (fs < MIN_PORTRAIT_FS && !window.PDF_FORCE_PORTRAIT) { orient = 'landscape'; A = 297 - 2 * M; fs = fit(A); }

        const base = nat.map(w => w * fs / 10 + 2 * PAD_H);
        const extra = Math.max(0, A - base.reduce((a, b) => a + b, 0));          // توزيع الفائض كجدول 100%
        const bsum = base.reduce((a, b) => a + b, 0);
        const k = bsum > A ? A / bsum : 1;                                        // أضيق من الحد الأدنى: ضغط ليتسع
        const colW = base.map(w => (w + extra * w / bsum) * k);
        return { orient, A, fs, colW, rowH: fs * MM_PT + 2.3, hdrH: fs * MM_PT + 2.9 };
    }

    // ---------- 7) الرسم ----------
    function restoreBorder(doc) { doc.setDrawColor(...BORDER); doc.setLineWidth(0.15); }
    function drawIconX(doc, cx, cy, s, color) {
        const r = s * 0.34;
        doc.setDrawColor(...color); doc.setLineWidth(s * 0.26);
        try { doc.setLineCap('round'); } catch (e) { /* ignore */ }
        doc.line(cx - r, cy - r, cx + r, cy + r); doc.line(cx - r, cy + r, cx + r, cy - r);
        try { doc.setLineCap('butt'); } catch (e) { /* ignore */ }
        restoreBorder(doc);
    }
    function drawIconOk(doc, cx, cy, s) {
        const x0 = cx - s * 0.5, y0 = cy - s * 0.5;
        doc.setFillColor(94, 166, 70);
        doc.roundedRect(x0, y0, s, s, s * 0.16, s * 0.16, 'F');
        doc.setDrawColor(255, 255, 255); doc.setLineWidth(s * 0.15);
        doc.line(x0 + s * 0.22, y0 + s * 0.54, x0 + s * 0.42, y0 + s * 0.74);
        doc.line(x0 + s * 0.42, y0 + s * 0.74, x0 + s * 0.79, y0 + s * 0.28);
        restoreBorder(doc);
    }

    function drawCell(doc, c, x, y, w, h, fs, st) {
        // خلفية + إطار
        if (c.bg) {
            doc.setFillColor(...c.bg);          // دائماً: لون النص والتعبئة يتشاركان الحالة في jsPDF
            doc.rect(x, y, w, h, 'FD');
        } else doc.rect(x, y, w, h, 'S');

        const cx = x + w / 2, cy = y + h / 2, em = fs * MM_PT;
        let color = c.color || TEXT;
        if (c.k === 'x') { drawIconX(doc, cx, cy, em * 0.95, [221, 46, 68]); return; }
        if (c.k === 'ok') { drawIconOk(doc, cx, cy, em * 0.95); st.fill = ''; return; }
        if (c.k === 'empty') return;

        if (c.badge) {                                           // شارة بحواف دائرية
            const wEm = c.k === 'img' ? emWidth(c.t, c.bold) : (doc.setFont('helvetica', c.bold ? 'bold' : 'normal'), doc.getStringUnitWidth(c.t));
            const pw = Math.min(w - 0.6, (wEm + 1.2) * em), ph = em * 1.5;
            doc.setFillColor(...c.badge.bg); st.fill = c.badge.bg.join();
            doc.roundedRect(cx - pw / 2, cy - ph / 2, pw, ph, ph / 2, ph / 2, 'F');
            color = c.badge.color || [255, 255, 255];
        }

        if (c.k === 'dash') {
            doc.setDrawColor(...(c.color || GRAY)); doc.setLineWidth(Math.max(0.12, em * 0.07));
            doc.line(cx - em * 0.35, cy, cx + em * 0.35, cy);
            restoreBorder(doc);
            return;
        }
        if (c.k === 'img') {
            const g = glyph(c.t, c.bold, color), avail = w - 0.8;
            let sz = fs;
            const tw = emWidth(c.t, c.bold) * sz * MM_PT;
            if (tw > avail) sz = Math.max(FS_MIN * 0.7, sz * avail / tw);   // انكماش ليتسع في الخلية
            const iw = g.wEm * sz * MM_PT, ih = g.hEm * sz * MM_PT;
            doc.addImage(g.data, 'PNG', cx - iw / 2, cy - ih / 2, iw, ih, g.alias, 'FAST');
            return;
        }
        // نص لاتيني/أرقام: نص حقيقي قابل للبحث
        doc.setFont('helvetica', c.bold ? 'bold' : 'normal');
        let sz = fs;
        const tw = doc.getStringUnitWidth(c.t) * sz * MM_PT, avail = w - 0.8;
        if (tw > avail) sz = Math.max(FS_MIN * 0.7, sz * avail / tw);
        doc.setFontSize(sz);
        doc.setTextColor(...color);
        doc.text(c.t, cx, cy + sz * MM_PT * 0.36, { align: 'center' });
    }

    function drawHeadCell(doc, c, x, y, w, h, fs) {
        doc.setFillColor(...NAVY); doc.setDrawColor(...BORDER);
        doc.rect(x, y, w, h, 'FD');
        const cx = x + w / 2, cy = y + h / 2;
        if (c.k === 'img') {
            const g = glyph(c.t, true, [255, 255, 255]);
            let sz = fs; const tw = emWidth(c.t, true) * sz * MM_PT;
            if (tw > w - 0.8) sz = Math.max(FS_MIN * 0.7, sz * (w - 0.8) / tw);
            const iw = g.wEm * sz * MM_PT, ih = g.hEm * sz * MM_PT;
            doc.addImage(g.data, 'PNG', cx - iw / 2, cy - ih / 2, iw, ih, g.alias, 'FAST');
        } else if (c.k === 'text') {
            doc.setFont('helvetica', 'bold');
            let sz = fs; const tw = doc.getStringUnitWidth(c.t) * sz * MM_PT;
            if (tw > w - 0.8) sz = Math.max(FS_MIN * 0.7, sz * (w - 0.8) / tw);
            doc.setFontSize(sz); doc.setTextColor(255, 255, 255);
            doc.text(c.t, cx, cy + sz * MM_PT * 0.36, { align: 'center' });
        }
    }

    function drawTable(doc, tab, plan, y) {
        const { fs, colW, rowH, hdrH } = plan;
        const W = doc.internal.pageSize.getWidth();
        const x0 = (W - plan.A) / 2;
        const st = { fill: '', text: '', reset() { this.fill = ''; this.text = ''; } };
        const head = [idHead()].concat(tab.heads);
        let bottom = doc.internal.pageSize.getHeight() - M - 5;

        const drawHead = () => {
            let x = x0;
            head.forEach((c, i) => { drawHeadCell(doc, c, x, y, colW[i], hdrH, fs); x += colW[i]; });
            y += hdrH; st.reset();
            doc.setLineWidth(0.15); doc.setDrawColor(...BORDER);
        };
        doc.setLineWidth(0.15); doc.setDrawColor(...BORDER);
        drawHead();

        tab.rows.forEach((r, ri) => {
            if (y + rowH > bottom) {
                doc.addPage('a4', plan.orient);
                bottom = doc.internal.pageSize.getHeight() - M - 5;
                y = M; drawHead();
            }
            let x = x0;
            // عمود «م»
            drawCell(doc, { k: 'text', t: String(ri + 1), bg: [248, 249, 250], color: TEXT, bold: true, badge: null }, x, y, colW[0], rowH, fs, st);
            x += colW[0];
            for (let i = 0; i < r.length; i++) {
                drawCell(doc, r[i], x, y, colW[i + 1], rowH, fs, st);
                x += colW[i + 1];
            }
            y += rowH;
        });
        return y;
    }

    function placeBlock(doc, img, y, maxW, alias) {
        const W = doc.internal.pageSize.getWidth();
        const bw = Math.min(maxW, 194), bh = img.h * bw / img.w;
        doc.addImage(img.data, 'JPEG', (W - bw) / 2, y, bw, bh, alias, 'FAST');
        return bh;
    }

    async function drawTab(doc, tab, plan, meta, first, bottomImg) {
        if (!first) doc.addPage('a4', plan.orient);
        const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
        let y = M;
        const top = await htmlToImage(topBlockHtml(tab, meta));
        y += placeBlock(doc, top, y, W - 2 * M) + 1;
        y = drawTable(doc, tab, plan, y);
        const bh = bottomImg.h * Math.min(W - 2 * M, 194) / bottomImg.w;
        if (y + 8 + bh > H - M - 4) { doc.addPage('a4', plan.orient); y = M; } else y += 8;
        placeBlock(doc, bottomImg, y, W - 2 * M, 'sigblock');
    }

    async function buildDocument(tabs, meta) {
        const jsPDF = window.jspdf && window.jspdf.jsPDF;
        if (!jsPDF) throw new Error('jsPDF غير محمّل');
        if (!tabs.length) throw new Error('لا توجد جداول');
        const meas = makeMeasurer(new jsPDF({ unit: 'mm', format: 'a4' }));
        const plans = tabs.map(t => planTab(meas, t));
        const doc = new jsPDF({ orientation: plans[0].orient, unit: 'mm', format: 'a4', compress: true });
        const bottomImg = await htmlToImage(bottomBlockHtml());
        for (let i = 0; i < tabs.length; i++) await drawTab(doc, tabs[i], plans[i], meta, i === 0, bottomImg);
        const n = doc.getNumberOfPages();
        for (let i = 1; i <= n; i++) {                              // ترقيم الصفحات (صغير ورمادي)
            doc.setPage(i);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...GRAY);
            doc.text(`Page ${i} / ${n}`, doc.internal.pageSize.getWidth() - M, doc.internal.pageSize.getHeight() - 4, { align: 'right' });
        }
        return doc;
    }

    // ---------- 8) الواجهة التي تستدعيها autoGenerateAndArchiveFullPDF ----------
    async function generateTextPDFReport(ctx) {
        if (!window.jspdf || !window.jspdf.jsPDF || typeof window.html2canvas !== 'function') return false;
        const data = {
            1: typeof currentData1 !== 'undefined' ? currentData1 : null, 2: typeof currentData2 !== 'undefined' ? currentData2 : null,
            3: typeof currentData3 !== 'undefined' ? currentData3 : null, 4: typeof currentData4 !== 'undefined' ? currentData4 : null,
            5: typeof currentData5 !== 'undefined' ? currentData5 : null, 6: typeof currentData6 !== 'undefined' ? currentData6 : null,
            7: typeof currentData7 !== 'undefined' ? currentData7 : null, 8: typeof currentData8 !== 'undefined' ? currentData8 : null
        };
        const txt = id => (document.getElementById(id) || {}).innerText || '—';
        const tabs = [];
        // نقرأ الجداول بالمظهر النهاري دائماً حتى لا يتأثر التقرير بالوضع الليلي
        const root = document.documentElement, prevTheme = root.dataset.theme;
        root.dataset.theme = 'light';
        try {
            for (const tab of ctx.tabsToPrint) {
                const arr = data[tab.id.replace('tab', '')];
                const el = document.getElementById(tab.id);
                const table = el && el.querySelector('.table-wrapper table');
                if (!arr || !arr.length || !table) continue;
                const t = readTable(table);                         // الجدول المعروض فعلاً: الأعمدة المختارة + الفلاتر
                if (!t.rows.length) continue;
                tabs.push(localizeTab({
                    id: tab.id, title: tab.title, heads: t.heads, rows: t.rows, statsHtml: readStatsHtml(el),
                    extra: tab.id === 'tab8' ? { orderNumber: txt('headerOrderNumber'), lineOp: txt('headerLineOp'), count: txt('headerCount') } : null
                }));
            }
        } finally {
            if (prevTheme === undefined) delete root.dataset.theme; else root.dataset.theme = prevTheme;
        }
        if (!tabs.length) return false;

        const loading = document.createElement('div');
        loading.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0a3d62;color:white;padding:15px 30px;border-radius:8px;z-index:100000;font-weight:bold';
        loading.textContent = '⏳ جاري إنشاء بيان التخزين...';
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

    // زر صغير لتبديل لغة التقرير (English / العربية): قابل للسحب لأي مكان، ويُحفظ موضعه
    // نقرة = تبديل اللغة | سحب = نقل | نقرتان = إرجاعه لمكانه الافتراضي (أعلى يسار الشاشة)
    function addLangChip() {
        if (document.getElementById('pdfLangChip') || !document.body) return;
        const KEY = 'pdfLangPos', b = document.createElement('div');
        b.id = 'pdfLangChip'; b.setAttribute('role', 'button');
        b.style.cssText = 'position:fixed;top:12px;left:12px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:bold;z-index:9997;background:#0a3d62;color:#fff;cursor:grab;box-shadow:0 2px 8px rgba(0,0,0,.25);direction:ltr;user-select:none;touch-action:none;opacity:.92';
        const paint = () => { b.textContent = '📄 PDF: ' + (getLang() === 'en' ? 'English' : 'العربية'); b.title = 'نقرة: تبديل لغة PDF • اسحب لنقله • نقرتان: إرجاعه'; };
        const place = (x, y) => {
            const w = b.offsetWidth || 120, h = b.offsetHeight || 28;
            x = Math.max(0, Math.min(innerWidth - w, x)); y = Math.max(0, Math.min(innerHeight - h, y));
            b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.right = 'auto'; b.style.bottom = 'auto';
            return [x, y];
        };
        paint(); document.body.appendChild(b);
        try { const sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) place(sv[0], sv[1]); } catch (e) { /* ignore */ }
        let drag = null;
        b.addEventListener('pointerdown', e => {
            const r = b.getBoundingClientRect();
            drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
            try { b.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        });
        b.addEventListener('pointermove', e => {
            if (!drag) return;
            if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 5) { drag.moved = true; b.style.cursor = 'grabbing'; }
            if (drag.moved) place(e.clientX - drag.dx, e.clientY - drag.dy);
        });
        b.addEventListener('pointerup', () => {
            if (!drag) return;
            b.style.cursor = 'grab';
            if (drag.moved) { const r = b.getBoundingClientRect(); try { localStorage.setItem(KEY, JSON.stringify([r.left, r.top])); } catch (e) { /* ignore */ } }
            else { const n = getLang() === 'en' ? 'ar' : 'en'; window.PDF_LANG = n; try { localStorage.setItem('pdfLang', n); } catch (e) { /* ignore */ } paint(); }
            drag = null;
        });
        b.addEventListener('dblclick', () => {
            try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
            b.style.top = '12px'; b.style.left = '12px';
        });
        window.addEventListener('resize', () => { const r = b.getBoundingClientRect(); place(r.left, r.top); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLangChip); else addLangChip();

    window.generateTextPDFReport = generateTextPDFReport;
    window.PdfText = { tr, trHtml, localizeTab, classify, glyph, readTable, readStatsHtml, buildDocument, planTab, makeMeasurer };
})();
