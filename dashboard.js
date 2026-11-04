// ============================================================
// 🌗 الوضع الليلي / النهاري (يُحفظ اختيار المستخدم، والافتراضي حسب نظام الجهاز)
// ============================================================
(function () {
    try {
        const KEY = 'theme';
        let saved = null;
        try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
        const sys = () => (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const apply = v => {
            document.documentElement.dataset.theme = v;
            const b = document.getElementById('themeToggle');
            if (b) { b.textContent = v === 'dark' ? '☀️' : '🌙'; b.title = v === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'; }
        };
        apply(saved === 'dark' || saved === 'light' ? saved : sys());
        const make = () => {
            if (document.getElementById('themeToggle')) return;
            const b = document.createElement('span');
            b.id = 'themeToggle'; b.setAttribute('role', 'button'); b.tabIndex = 0;
            const flip = () => {
                const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
                try { localStorage.setItem(KEY, n); } catch (e) { /* ignore */ }
                apply(n);
            };
            b.onclick = flip;
            b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
            document.body.appendChild(b);
            apply(document.documentElement.dataset.theme);
        };
        if (document.body) make(); else document.addEventListener('DOMContentLoaded', make);
    } catch (e) { /* بيئة بدون DOM */ }
})();

// ============================================================
// 🧭 القائمة الجانبية + 📊 لوحة المؤشرات
// البيانات تُجمع من الخادم المحلي ومن GitHub (archive_index.json) وتُدمج، ثم تُفلتر حسب خطوط المستخدم
// ============================================================
(function () {
    const esc = v => (typeof escapeHtml === 'function' ? escapeHtml(v) : String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
    const $ = (s, r) => (r || document).querySelector(s);
    const fmtSize = b => b >= 1073741824 ? (b / 1073741824).toFixed(2) + ' GB' : b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
    const fmtDate = d => { try { return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return d; } };
    const ago = d => { if (!d) return '—'; const n = Math.floor((Date.now() - new Date(d)) / 864e5); return n <= 0 ? 'اليوم' : n === 1 ? 'أمس' : `منذ ${n} يوم`; };
    const COLORS = ['#0e7490', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

    // ---------- تحليل البيانات ----------
    const lineOf = n => { const p = String(n).replace(/\.[^.]+$/, '').split('_'); return p.length >= 3 ? p[p.length - 2] : p.length === 2 ? p[1] : null; };
    function canSee(name) {
        const u = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (!u) return false;
        if (u.role === 'admin' || (u.lineIds || []).includes('*')) return true;
        const l = lineOf(name);
        return !!l && (u.lineIds || []).some(x => String(x).toLowerCase() === l.toLowerCase());
    }
    const dateOf = (folder, file) => {
        const m = /(\d{4})-(\d{2})-(\d{2})/.exec(file.name) || /(\d{4})-(\d{2})-(\d{2})/.exec(folder.name);
        if (m) return `${m[1]}-${m[2]}-${m[3]}`;
        return file.modified ? new Date(file.modified).toISOString().slice(0, 10) : null;
    };

    function analyze(localFolders, ghFolders) {
        const map = new Map();
        const add = (folders, key) => (folders || []).forEach(f => (f.files || []).forEach(x => {
            if (x.name === '_info.json' || !canSee(x.name)) return;
            const k = f.name + '/' + x.name;
            const r = map.get(k) || { folder: f.name, name: x.name, size: 0, url: null, local: false, gh: false, date: null };
            r[key] = true; r.size = r.size || x.size || 0; r.date = r.date || dateOf(f, x);
            if (key === 'local' || !r.url) r.url = x.download_url || r.url;
            map.set(k, r);
        }));
        add(ghFolders, 'gh'); add(localFolders, 'local');
        const files = [...map.values()];
        const tally = (fn, n) => Object.entries(files.reduce((m, f) => { const k = fn(f); m[k] = (m[k] || 0) + 1; return m; }, {}))
            .sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, value]) => ({ name, value }));
        const folders = {};
        files.forEach(f => { const o = folders[f.folder] || (folders[f.folder] = { name: f.folder, date: '', files: [] }); o.files.push(f); if (f.date && f.date > o.date) o.date = f.date; });
        const ships = Object.values(folders).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.name.localeCompare(a.name));
        const byDate = [...files].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return {
            files, ships, total: files.length, bytes: files.reduce((a, f) => a + f.size, 0),
            latest: ships[0] || null, recent: byDate.slice(0, 8),
            byLine: tally(f => lineOf(f.name) || '—', 8),
            byType: tally(f => (f.name.split('.').pop() || '—').toUpperCase(), 5),
            byMonth: Object.entries(files.reduce((m, f) => { if (f.date) { const k = f.date.slice(0, 7); m[k] = (m[k] || 0) + 1; } return m; }, {})).sort().slice(-6).map(([name, value]) => ({ name, value })),
            sync: { both: files.filter(f => f.local && f.gh).length, localOnly: files.filter(f => f.local && !f.gh).length, ghOnly: files.filter(f => f.gh && !f.local).length }
        };
    }
    window.DashboardUtil = { analyze };

    // ---------- جلب البيانات ----------
    // fresh=true: رابط فريد يتجاوز ذاكرة GitHub المؤقتة (يُستعمل عند الفتح والتحديث اليدوي وبعد رفعك).
    // fresh=false: طلب شرطي يعيد 304 بلا محتوى إن لم يتغير الفهرس (للفحص الدوري).
    async function fetchGithubIndex(fresh = true) {
        try {
            const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/archive/archive_index.json${fresh ? '?t=' + Date.now() : ''}`;
            const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 8000);
            const r = await fetch(url, fresh ? { signal: ctl.signal } : { signal: ctl.signal, cache: 'no-cache' }).finally(() => clearTimeout(tm));
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const d = await r.json();
            return Array.isArray(d) ? d : d.folders || [];
        } catch (e) {
            return Array.isArray(window.savedArchiveFolders) ? window.savedArchiveFolders : null;
        }
    }

    // ---------- الرسم ----------
    function hbars(items) {
        if (!items.length) return '<div class="dv-empty">لا توجد بيانات</div>';
        const max = Math.max(...items.map(i => i.value), 1);
        return items.map(i => `<div class="dv-bar"><span class="l" title="${esc(i.name)}">${esc(i.name)}</span><span class="t"><i style="width:${Math.max(5, i.value / max * 100)}%"></i></span><span class="v">${i.value}</span></div>`).join('');
    }
    function vbars(items) {
        if (!items.length) return '<div class="dv-empty">لا توجد بيانات</div>';
        const max = Math.max(...items.map(i => i.value), 1);
        return `<div class="dv-cols">${items.map(i => `<div class="c"><b>${i.value}</b><i style="height:${Math.max(6, i.value / max * 100)}%"></i><span>${esc(i.name.slice(2))}</span></div>`).join('')}</div>`;
    }
    function donut(items, centerLabel) {
        const sum = items.reduce((a, i) => a + i.value, 0);
        if (!sum) return '<div class="dv-empty">لا توجد بيانات</div>';
        let acc = 0;
        const stops = items.map((i, k) => { const s = acc / sum * 100; acc += i.value; return `${COLORS[k % COLORS.length]} ${s}% ${acc / sum * 100}%`; }).join(',');
        return `<div class="dv-donut"><div class="ring" style="background:conic-gradient(${stops})"><div><b>${sum}</b><small>${esc(centerLabel)}</small></div></div>
            <ul>${items.map((i, k) => `<li><u style="background:${COLORS[k % COLORS.length]}"></u>${esc(i.name)}<b>${i.value}</b></li>`).join('')}</ul></div>`;
    }
    // لا روابط لفتح ملفات الأرشيف في اللوحة: عرض معلومات فقط
    const srcTag = f => `<em class="tag ${f.local && f.gh ? 'both' : f.local ? 'loc' : 'gh'}">${f.local && f.gh ? 'محلي + GitHub' : f.local ? 'محلي' : 'GitHub'}</em>`;
    const row = (f, withFolder) => `<li><span class="nm" title="${esc(f.name)}">📄 ${withFolder ? esc(f.folder) + ' / ' : ''}${esc(f.name)}</span><span class="mt">${fmtSize(f.size)}${f.date ? ' · ' + ago(f.date) : ''}</span>${srcTag(f)}</li>`;
    const kpi = (icon, label, val, sub, c) => `<div class="dv-kpi" style="--c:${c}"><div class="ic">${icon}</div><div><small>${label}</small><div class="n">${val}</div><div class="s">${sub || '&nbsp;'}</div></div></div>`;

    function render(d, st) {
        const L = d.latest, s = d.sync;
        $('#dvBody').innerHTML = `
        <div class="dv-kpis">
            ${kpi('📁', 'إجمالي الملفات', d.total, `${d.ships.length} سفينة`, '#0e7490')}
            ${kpi('🚢', 'آخر سفينة', L ? esc(L.name.split('_')[0]) : '—', L && L.date ? fmtDate(L.date) + ' · ' + ago(L.date) : '', '#14b8a6')}
            ${kpi('💾', 'حجم الأرشيف', fmtSize(d.bytes), '', '#f59e0b')}
            ${kpi('🔄', 'المزامنة', s.localOnly + s.ghOnly === 0 ? 'متطابقة ✓' : (s.localOnly + s.ghOnly) + ' فرق', `${s.both} ملف في المصدرين`, s.localOnly + s.ghOnly === 0 ? '#16a34a' : '#ef4444')}
        </div>

        <div class="dv-grid g3">
            <div class="dv-card"><h3>🏷️ حسب الخط الملاحي</h3>${hbars(d.byLine)}</div>
            <div class="dv-card"><h3>📅 النشاط الشهري</h3>${vbars(d.byMonth)}</div>
            <div class="dv-card"><h3>🗂️ نوع الملفات</h3>${donut(d.byType, 'ملف')}</div>
        </div>
        <div class="dv-grid g2">
            <div class="dv-card"><h3>☁️ حالة المصادر</h3>${donut([{ name: 'في المصدرين', value: s.both }, { name: 'محلي فقط', value: s.localOnly }, { name: 'GitHub فقط', value: s.ghOnly }].filter(i => i.value), 'ملف')}
                <p class="dv-note">${st.local || !st.localDone ? '' : '⚠️ الخادم المحلي غير متصل؛ تُعرض بيانات GitHub فقط. '}${st.gh || !st.ghDone ? '' : '⚠️ تعذّر قراءة فهرس GitHub. '}${s.localOnly ? `يوجد ${s.localOnly} ملف محلي غير مرفوع إلى GitHub (استخدم «مزامنة» من نافذة الأرشيف). ` : ''}${s.ghOnly ? `يوجد ${s.ghOnly} ملف على GitHub غير موجود محلياً.` : ''}</p></div>
            <div class="dv-card"><h3>🚢 أحدث السفن</h3><ul class="dv-list">${d.ships.slice(0, 6).map(sh => `<li><span class="nm">${esc(sh.name)}</span><span class="mt">${sh.files.length} ملف${sh.date ? ' · ' + fmtDate(sh.date) : ''}</span></li>`).join('') || '<li class="dv-empty">—</li>'}</ul></div>
        </div>
		
		        <div class="dv-grid g2">
            <div class="dv-card"><h3>🚢 آخر سفينة${L ? ` <small dir="ltr">${esc(L.name)}</small>` : ''}</h3>
                ${L ? `<ul class="dv-list">${L.files.map(f => row(f)).join('')}</ul>` : '<div class="dv-empty">لا توجد ملفات بعد</div>'}</div>
            <div class="dv-card"><h3>🕘 آخر الملفات</h3>
                ${d.recent.length ? `<ul class="dv-list">${d.recent.map(f => row(f, true)).join('')}</ul>` : '<div class="dv-empty">لا توجد ملفات</div>'}</div>
        </div>`;
    }

    // ---------- تحميل اللوحة + التحديث التلقائي ----------
    // عرض فوري من آخر نسخة محفوظة ← تحديث المصدرين بالتوازي ← فحص دوري هادئ يكشف أي بيانات جديدة يضيفها أي مستخدم
    let runId = 0, detectP = null, CUR = null, polling = false, lastPoll = 0, tick = 0;
    const POLL_MS = 60000;                       // فحص كل دقيقة: GitHub شرطي (رخيص)، والمحلي كل دقيقتين لتخفيف الحمل على الـ NAS
    const cacheKey = () => 'dashCache:' + ((typeof getCurrentUser === 'function' && (getCurrentUser() || {}).username) || '');
    const slim = list => list && list.map(f => ({ name: f.name, files: (f.files || []).map(x => ({ name: x.name, size: x.size, modified: x.modified })) }));
    const readCache = () => { try { return JSON.parse(localStorage.getItem(cacheKey()) || 'null'); } catch (e) { return null; } };
    const writeCache = (local, gh) => { try { localStorage.setItem(cacheKey(), JSON.stringify({ t: Date.now(), local: slim(local), gh: slim(gh) })); } catch (e) { /* المساحة ممتلئة */ } };

    // بصمة المحتوى: تتغير عند إضافة/حذف/تعديل أي ملف، فنعرف أن هناك جديداً دون مقارنة ثقيلة
    const keysOf = (l, g) => { const k = new Set(); [l, g].forEach(list => (list || []).forEach(f => (f.files || []).forEach(x => { if (x.name !== '_info.json' && canSee(x.name)) k.add(f.name + '/' + x.name + ':' + (x.size || 0)); }))); return k; };
    const sigOf = (l, g) => { const str = [...keysOf(l, g)].sort().join('|'); let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return str.length + ':' + h; };
    window.DashboardUtil.sigOf = sigOf;

    function toast(msg) {
        let t = document.getElementById('dvToast');
        if (!t) { t = document.createElement('div'); t.id = 'dvToast'; document.body.appendChild(t); }
        t.textContent = msg; t.classList.add('show');
        clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 7000);
    }

    function paintState(S) {
        const body = $('#dvBody'), pill = (label, done, ok) => `<span class="dv-pill ${done && ok ? 'ok' : 'bad'}">${label} ${!done ? 'جاري الفحص…' : ok ? 'متصل' : 'غير متصل'}</span>`;
        if (!body) return;
        $('#dvStatus').innerHTML = pill('🖥️ المحلي', S.localDone, !!S.local) + pill('☁️ GitHub', S.ghDone, !!S.gh)
            + (S.localDone && S.ghDone ? '' : '<span class="dv-pill bad">⏳ جاري التحديث</span>');
        if (!S.local && !S.gh) {
            body.innerHTML = S.localDone && S.ghDone
                ? '<div class="dv-empty big">لا يمكن الوصول إلى أي مصدر للأرشيف حالياً.<br>تحقق من الخادم المحلي أو الاتصال بالإنترنت ثم اضغط «تحديث».</div>'
                : '<div class="dv-skel"></div><div class="dv-skel"></div>';
            return;
        }
        try { render(analyze(S.local, S.gh), { local: !!S.local, gh: !!S.gh, localDone: S.localDone, ghDone: S.ghDone }); }
        catch (e) { body.innerHTML = `<div class="dv-empty big">❌ ${esc(e.message)}</div>`; }
    }

    async function loadDash() {
        const my = ++runId;
        const cache = readCache();
        const S = { local: cache ? cache.local : null, gh: cache ? cache.gh : null, localDone: false, ghDone: false };
        const paint = () => { if (my === runId) paintState(S); };      // تجاهل نتيجة تحديث أقدم
        paint();                                                        // آخر نسخة محفوظة تظهر فوراً إن وُجدت

        const localJob = (async () => {
            try {
                let up = typeof _localServerAvailable !== 'undefined' && _localServerAvailable;   // لا نعيد الكشف إن كان معروفاً
                if (!up) up = await (detectP || (detectP = Promise.resolve(detectLocalServer()).catch(() => false).finally(() => { detectP = null; })));
                S.local = up ? await loadLocalArchiveFolders() : null;
            } catch (e) { S.local = null; }
            S.localDone = true; paint();
        })();
        const ghJob = fetchGithubIndex().then(g => { S.gh = g; }).catch(() => { S.gh = null; }).then(() => { S.ghDone = true; paint(); });

        await Promise.allSettled([localJob, ghJob]);
        if (my === runId) {
            CUR = S; CUR.sig = sigOf(S.local, S.gh); CUR.keys = keysOf(S.local, S.gh);
            if (S.local || S.gh) writeCache(S.local, S.gh);
        }
    }

    // فحص هادئ في الخلفية: لا يغيّر الشاشة إلا إذا تغيّرت البيانات فعلاً، ولا يستبدل بيانات سليمة بنتيجة فاشلة
    async function pollNow(force, fresh) {
        const dash = document.getElementById('dashView');
        if (polling || !CUR || !dash || document.hidden || !document.body.classList.contains('dash-mode')) return;
        polling = true; lastPoll = Date.now(); tick++;
        try {
            const doLocal = force || tick % 2 === 0;
            const [lr, gr] = await Promise.allSettled([
                doLocal && typeof _localServerAvailable !== 'undefined' && _localServerAvailable ? loadLocalArchiveFolders() : Promise.resolve(null),
                fetchGithubIndex(!!fresh)
            ]);
            const l = lr.status === 'fulfilled' && lr.value ? lr.value : CUR.local;
            const g = gr.status === 'fulfilled' && gr.value ? gr.value : CUR.gh;
            const sig = sigOf(l, g);
            if (sig === CUR.sig) return;
            const keys = keysOf(l, g);
            const added = [...keys].filter(k => !CUR.keys.has(k));
            CUR = Object.assign(CUR, { local: l, gh: g, localDone: true, ghDone: true, sig, keys });
            paintState(CUR);
            writeCache(l, g);
            if (added.length) toast(`🔔 تمت إضافة ${added.length} ملف جديد — ${added[0].split('/')[0]}`);
            else toast('🔄 تم تحديث بيانات الأرشيف');
        } catch (e) { /* نحاول في الدورة التالية */ }
        finally { polling = false; }
    }

    function startPolling() {
        setInterval(() => pollNow(false), POLL_MS);
        document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastPoll > 8000) pollNow(true); });
        window.addEventListener('focus', () => { if (Date.now() - lastPoll > 8000) pollNow(true); });
        // تحديث فوري عندما يرفع هذا المستخدم أو يحذف في الأرشيف المحلي (تمرير كامل للدالة الأصلية دون تغيير نتيجتها)
        ['uploadToLocalServer', 'deleteFromLocalServer'].forEach(n => {
            const orig = window[n];
            if (typeof orig !== 'function' || orig.__dash) return;
            const wrapped = async function () {
                const r = await orig.apply(this, arguments);
                try { if (r && r.success) setTimeout(() => pollNow(true, true), 1000); } catch (e) { /* ignore */ }
                return r;
            };
            wrapped.__dash = true; window[n] = wrapped;
        });
    }

    // ---------- تلوين كل الأزرار بتدرجات مختلفة (ثابتة لكل زر حسب نصه وموضعه) ----------
    const SKIP = /\b(delete-btn|edit-btn|tab-btn|sb-item|tb-chip)\b/;
    function colorize() {
        const app = document.getElementById('appContainer');
        if (!app) return;
        app.querySelectorAll('button, .file-label').forEach(b => {
            if (b.dataset.bx !== undefined || SKIP.test(b.className) || b.id === 'logoutBtn' || b.closest('#sidebar, #toolbar')) return;
            const txt = (b.textContent || '').trim();
            let h = 7;
            for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) % 9973;
            const pos = b.parentElement ? [...b.parentElement.children].indexOf(b) : 0;
            const k = (h + pos * 3) % 10;
            b.dataset.bx = k;
            b.classList.add('bx', 'bx' + k);
        });
    }
    function watchButtons() {
        let t = null;
        colorize();
        new MutationObserver(() => { clearTimeout(t); t = setTimeout(colorize, 200); })
            .observe(document.getElementById('appContainer'), { childList: true, subtree: true });
    }

    // ---------- شريط "تحميل من GitHub" القابل للطي (ينقل اللوحة الأصلية نفسها بدون نسخ) ----------
    function buildGhBar(header) {
        const panel = document.getElementById('githubFilesPanel');
        if (!panel || document.getElementById('ghbar')) return;
        const bar = document.createElement('section');
        bar.id = 'ghbar';
        // الصف نفسه (اللوحة الأصلية) + شريط مختصر يظهر عند الطي + زر الطي/الفرد
        bar.innerHTML = '<div class="ghb-head"><span class="tb-title">☁️ تحميل من GitHub <small id="ghbSummary"></small></span></div><div id="ghbBody"></div><span class="tb-toggle" id="ghbToggle" role="button" tabindex="0" title="طي / فرد">▾</span>';
        header.after(bar);
        $('#ghbBody').appendChild(panel);          // نفس العنصر: كل المستمعات والمعرّفات باقية

        const sel = id => { const e = document.getElementById(id); return e && e.value ? e.options[e.selectedIndex].text : ''; };
        const summary = () => {
            const t = [sel('ghShipSelect'), sel('ghLineSelect'), sel('ghDateSelect')].filter(Boolean).join(' • ');
            $('#ghbSummary').textContent = t ? '— ' + t : '';
        };
        panel.addEventListener('change', summary);
        summary();

        const KEY = 'ghbarCollapsed';
        const apply = c => { bar.classList.toggle('collapsed', c); $('#ghbToggle').textContent = c ? '▸' : '▾'; if (c) summary(); };
        apply(localStorage.getItem(KEY) === '1');
        const toggle = () => { const c = !bar.classList.contains('collapsed'); apply(c); try { localStorage.setItem(KEY, c ? '1' : '0'); } catch (e) { /* ignore */ } };
        // الضغط في أي مكان فارغ من الشريط يطويه أو يفرده (كشريط الأدوات)، دون التأثير على عناصر التحكم نفسها
        bar.addEventListener('click', e => {
            if (e.target.closest('select, option, button, input, label, a, #archiveNotification')) return;
            toggle();
        });
        $('#ghbToggle').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
    }

    // ---------- شريط الأدوات الأفقي القابل للطي (يجمع أزرار منطقة الرفع الأصلية) ----------
    function buildToolbar(header) {
        const area = $('.upload-area');
        if (!area) return;
        const bar = document.createElement('section');
        bar.id = 'toolbar';
        bar.innerHTML = '<div class="tb-head"><span class="tb-title">🧰 الأدوات <small id="tbCount"></small></span><span class="tb-toggle" id="tbToggle" role="button" tabindex="0" title="طي / فرد">▾</span></div><div class="tb-body" id="tbBody"></div>';
        header.after(bar);
        document.body.classList.add('has-toolbar');
        const body = $('#tbBody');
        let timer = null;

        const sync = () => {
            const items = [...new Set([...area.querySelectorAll('button, label.file-label, .file-label, .settings-btn')])]
                .filter(el => getComputedStyle(el).display !== 'none' && el.textContent.trim());
            body.innerHTML = '';
            items.forEach((el, i) => {
                const chip = document.createElement('span');
                chip.className = 'tb-chip c' + (i % 7);
                chip.setAttribute('role', 'button'); chip.tabIndex = 0;
                chip.textContent = el.textContent.trim();
                const run = () => el.click();
                chip.onclick = run;
                chip.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } };
                body.appendChild(chip);
            });
            $('#tbCount').textContent = items.length ? `(${items.length})` : '';
        };
        sync();
        new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(sync, 150); })
            .observe(area, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'disabled'] });

        const KEY = 'toolbarCollapsed';
        const apply = c => { bar.classList.toggle('collapsed', c); $('#tbToggle').textContent = c ? '▸' : '▾'; };
        apply(localStorage.getItem(KEY) === '1');
        const toggle = () => { const c = !bar.classList.contains('collapsed'); apply(c); try { localStorage.setItem(KEY, c ? '1' : '0'); } catch (e) { /* ignore */ } };
        $('#tbToggle').onclick = toggle;
        $('.tb-head').onclick = e => { if (e.target.id !== 'tbToggle') toggle(); };
    }

    // ---------- القائمة الجانبية ----------
    let built = false;
    const setActive = b => { document.querySelectorAll('#sidebar .sb-item').forEach(x => x.classList.toggle('active', x === b)); $('#sidebar').classList.remove('open'); };

    function build() {
        if (built) return; built = true;
        const user = (typeof getCurrentUser === 'function' && getCurrentUser()) || {};
        const tabs = [...document.querySelectorAll('.tabs .tab-btn')];
        const side = document.createElement('aside');
        side.id = 'sidebar';
        side.innerHTML = `
            <div class="sb-brand"><span class="logo">📦</span><div>إدارة السفينة<small>الأرشيف والتقارير</small></div></div>
            <nav>
                <button class="sb-item active" data-go="dash">📊 لوحة المؤشرات</button>
                <div class="sb-title">التقارير</div>
                ${tabs.map(t => `<button class="sb-item" data-tab="${esc(t.dataset.tab)}">${esc(t.textContent.trim())}</button>`).join('')}
                <div class="sb-title">الأرشيف</div>
                <button class="sb-item" data-go="archive">🗄️ فتح الأرشيف</button>
            </nav>
            <div class="sb-user"><div class="av">${esc((user.fullName || '?').trim().charAt(0).toUpperCase())}</div>
                <div><b>${esc(user.fullName || '')}</b><span>${user.role === 'admin' ? 'مدير' : 'مشاهد'} · ${esc((user.lineIds || []).includes('*') ? 'كل الخطوط' : (user.lineIds || []).join(' • '))}</span></div>
                <button id="sbLogout" title="تسجيل الخروج">⏻</button></div>`;
        document.body.appendChild(side);
        const tg = document.createElement('button');
        tg.id = 'sbToggle'; tg.textContent = '☰'; tg.onclick = () => side.classList.toggle('open');
        document.body.appendChild(tg);

        const view = document.createElement('section');
        view.id = 'dashView';
        view.innerHTML = '<div class="dv-head"><div><h2>لوحة المؤشرات</h2><p>نظرة شاملة على الأرشيف المحلي وGitHub</p></div><div class="dv-tools"><span id="dvStatus"></span><button class="dv-btn" id="dvRefresh">🔄 تحديث</button></div></div><div id="dvBody"></div>';
        const header = $('#appContainer .header');
        header.parentNode.insertBefore(view, header.nextSibling);
        buildToolbar(header);
        buildGhBar(header);   // يظهر فوق شريط الأدوات
        watchButtons();
        document.body.classList.add('has-sidebar', 'dash-mode');

        side.addEventListener('click', e => {
            const b = e.target.closest('.sb-item'); if (!b) return;
            if (b.dataset.go === 'dash') { document.body.classList.add('dash-mode'); setActive(b); loadDash(); }
            else if (b.dataset.tab) { document.body.classList.remove('dash-mode'); setActive(b); const o = $(`.tabs .tab-btn[data-tab="${b.dataset.tab}"]`); if (o) o.click(); }
            else if (b.dataset.go === 'archive') { const a = $('#archiveBtn') || document.querySelector('button[id*="rchive"]:not(#createArchiveBtn)'); if (a) a.click(); else alert('زر الأرشيف غير متاح لحسابك.'); }
        });
        $('#sbLogout').onclick = () => { if (confirm('تسجيل الخروج؟')) logout(); };
        $('#dvRefresh').onclick = loadDash;
        loadDash();
    }

    startPolling();

    const timer = setInterval(() => {
        const app = document.getElementById('appContainer');
        if (app && app.style.display === 'block' && $('#appContainer .header')) { clearInterval(timer); build(); }
    }, 300);
})();
