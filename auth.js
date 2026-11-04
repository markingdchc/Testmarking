// ============================================================
// 🔐 نظام الصلاحيات والمصادقة
// ============================================================

const USERS_URL = 'https://raw.githubusercontent.com/markingdchc/marking.dchc/main/users.json';
const CURRENT_USER_KEY = 'currentUser';
const LOGIN_ATTEMPTS_KEY = 'loginAttempts';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 دقيقة

// ========== متغيرات عامة ==========
let currentUser = null;
let cachedUsers = null;

// ============================================================
// 🔒 دوال التشفير
// ============================================================
// 🆕 حساب SHA-256 برمجياً: يُستعمل عندما تكون دالة المتصفح crypto.subtle غير متاحة
//    (تكون متاحة فقط في HTTPS و localhost، ولا تتوفر في http://عنوان-الشبكة-الداخلية)
function sha256Fallback(bytes) {
    const K = new Uint32Array([
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ]);
    const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    const len = bytes.length;
    const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    padded.set(bytes);
    padded[len] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(len / 0x20000000), false);
    view.setUint32(padded.length - 4, (len << 3) >>> 0, false);
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < padded.length; off += 64) {
        for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) >>> 0;
            h = g; g = f; f = e; e = (d + t1) >>> 0;
            d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    return Array.from(H).map(x => x.toString(16).padStart(8, '0')).join('');
}

async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    // الاتصال الآمن (HTTPS / localhost): دالة المتصفح الأصلية. غير ذلك (http داخل الشبكة): الحساب البرمجي المطابق
    if (window.crypto && window.crypto.subtle) {
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    return sha256Fallback(data);
}

async function verifyPassword(inputPassword, storedPassword) {
    // إذا كان مخزناً بدون تشفير (نص عادي) - للمرحلة الأولى
    if (!storedPassword.startsWith('sha256:')) {
        return inputPassword === storedPassword;
    }
    // إذا كان مشفراً
    const cleanHash = storedPassword.replace('sha256:', '').trim().toLowerCase();
    const inputHash = await sha256(inputPassword);
    return inputHash === cleanHash;
}

// ============================================================
// 📥 تحميل المستخدمين من GitHub
// ============================================================
async function loadUsers(forceRefresh = false) {
    if (cachedUsers && !forceRefresh) {
        return cachedUsers;
    }
    
    try {
        const response = await fetch(USERS_URL + '?t=' + Date.now());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        cachedUsers = data.users || [];
        console.log('✅ تم تحميل المستخدمين:', cachedUsers.length);
        return cachedUsers;
    } catch (error) {
        console.error('❌ فشل تحميل users.json:', error);
        // محاولة استخدام نسخة محفوظة محلياً
        const localUsers = localStorage.getItem('cached_users');
        if (localUsers) {
            console.log('📦 استخدام نسخة محلية');
            cachedUsers = JSON.parse(localUsers);
            return cachedUsers;
        }
        throw new Error('تعذّر تحميل بيانات المستخدمين');
    }
}

// ============================================================
// 🚪 تسجيل الدخول
// ============================================================
async function login(username, password, rememberMe = false) {
    // 1. تحقق من الحظر
    if (isLocked(username)) {
        const remaining = getRemainingLockTime(username);
        throw new Error(`🔒 الحساب محظور. حاول بعد ${remaining} دقيقة`);
    }
    
    // 2. تحميل المستخدمين
    const users = await loadUsers(true);
    
    // 3. البحث عن المستخدم
    const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase().trim()
    );
    
    if (!user) {
        recordFailedAttempt(username);
        throw new Error('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    
    // 4. التحقق من الحالة
    if (user.status !== 'active') {
        throw new Error('🚫 الحساب معطّل، تواصل مع المدير');
    }
    
    // 5. التحقق من كلمة المرور
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
        recordFailedAttempt(username);
        throw new Error('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    
    // 6. نجاح → حفظ المستخدم
    clearAttempts(username);
    
    const sessionUser = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        lineIds: user.lineIds,
        status: user.status,
        loginTime: Date.now()
    };
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem('cached_users', JSON.stringify(users));
    currentUser = sessionUser;
    
    console.log('✅ تسجيل دخول ناجح:', user.username);
    logActivity('login', `تسجيل دخول: ${user.fullName}`);
    
    return sessionUser;
}

// ============================================================
// 🚪 تسجيل الخروج
// ============================================================
function logout() {
    if (currentUser) {
        logActivity('logout', `تسجيل خروج: ${currentUser.fullName}`);
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    currentUser = null;
    window.location.reload();
}

// ============================================================
// 🔒 إدارة محاولات الدخول
// ============================================================
function getAttempts() {
    return JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
}

function saveAttempts(attempts) {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

function recordFailedAttempt(username) {
    const attempts = getAttempts();
    const key = username.toLowerCase();
    if (!attempts[key]) attempts[key] = { count: 0, lastAttempt: 0 };
    attempts[key].count++;
    attempts[key].lastAttempt = Date.now();
    saveAttempts(attempts);
    console.log(`⚠️ محاولة فاشلة (${attempts[key].count}/${MAX_ATTEMPTS}) لـ ${username}`);
}

function clearAttempts(username) {
    const attempts = getAttempts();
    delete attempts[username.toLowerCase()];
    saveAttempts(attempts);
}

function isLocked(username) {
    const attempts = getAttempts();
    const entry = attempts[username.toLowerCase()];
    if (!entry || entry.count < MAX_ATTEMPTS) return false;
    const elapsed = Date.now() - entry.lastAttempt;
    if (elapsed >= LOCK_DURATION_MS) {
        clearAttempts(username);
        return false;
    }
    return true;
}

function getRemainingLockTime(username) {
    const attempts = getAttempts();
    const entry = attempts[username.toLowerCase()];
    if (!entry) return 0;
    const elapsed = Date.now() - entry.lastAttempt;
    return Math.ceil((LOCK_DURATION_MS - elapsed) / 60000);
}

// ============================================================
// 👤 الحصول على المستخدم الحالي
// ============================================================
function getCurrentUser() {
    if (currentUser) return currentUser;
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
        currentUser = JSON.parse(saved);
        return currentUser;
    }
    return null;
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function isAdmin() {
    const u = getCurrentUser();
    return u && u.role === 'admin';
}

function isViewer() {
    const u = getCurrentUser();
    return u && u.role === 'viewer';
}

// ============================================================
// 🔍 فلترة البيانات حسب خطوط المستخدم
// ============================================================
function filterDataByUserLines(data) {
    const user = getCurrentUser();
    if (!user) return [];
    
    // Admin أو خطوط = ["*"] → كل البيانات
    if (user.role === 'admin' || user.lineIds.includes('*')) {
        return data;
    }
    
    // Viewer → فقط الخطوط المخصصة
    return data.filter(item => {
        const lineId = item["Line ID"] || item["الخط"] || "";
        return user.lineIds.includes(lineId);
    });
}

function canSeeLine(lineId) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin' || user.lineIds.includes('*')) return true;
    return user.lineIds.includes(lineId);
}

// ============================================================
// 🎨 تطبيق الصلاحيات على الواجهة
// ============================================================
function applyPermissions() {
    const user = getCurrentUser();
    if (!user) return;
    
    console.log('🎨 تطبيق الصلاحيات للمستخدم:', user.username, '- الدور:', user.role);
    
    // عرض معلومات المستخدم في الشريط العلوي
    updateUserBar(user);
    
    if (user.role === 'admin') {
        // 👑 Admin يرى كل شيء
        // ✅ إظهار زر التوكن إذا لم يكن محفوظاً
        const tokenBtn = document.getElementById('setTokenBtn');
        if (tokenBtn) {
            const token = localStorage.getItem('github_token');
            tokenBtn.style.display = (token && token.trim() !== '') ? 'none' : 'inline-block';
        }
        return;
    }
    
    // Viewer: إخفاء كل عناصر الإدارة
    const elementsToHide = [
        '#fileInput', '.file-label',           // رفع الملفات
        '#addGlobalLineBtn', '#newGlobalLineName', // إدارة الخطوط
        '#manageUsersBtn',                      // إدارة المستخدمين
		'#archiveBtn',
		'#setTokenBtn',                         // زر التوكن
		'#createArchiveBtn',                    // 🆕 إخفاء زر إنشاء مجلد أرشيف
        '.settings-btn'                         // أزرار الإعدادات
    ];
    
    elementsToHide.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (el.classList.contains('settings-btn') && el.id === 'selectColumnsBtn1') {
                return; // إبقاء زر اختيار الأعمدة
            }
            el.style.display = 'none';
        });
    });
    
    // إخفاء أزرار اختيار الأعمدة لكل التبويبات (اختياري)
    // document.querySelectorAll('[id^="selectColumnsBtn"]').forEach(b => b.style.display = 'none');
    
    console.log('✅ تم إخفاء عناصر Admin');
}

function updateUserBar(user) {
    const bar = document.getElementById('userBar');
    if (!bar) return;
    
    const roleLabel = user.role === 'admin' ? '👑 مدير' : '👁️ مشاهد';
    const linesLabel = user.lineIds.includes('*') ? 'كل الخطوط' : user.lineIds.join(' • ');
    
    bar.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
            <div style="background:rgba(255,255,255,0.15); padding:6px 14px; border-radius:20px;">
                <strong>👤 ${user.fullName}</strong> <span style="opacity:0.8;">(${user.username})</span>
            </div>
            <div style="background:rgba(255,255,255,0.15); padding:6px 14px; border-radius:20px;">
                ${roleLabel}
            </div>
            <div style="background:rgba(255,255,255,0.15); padding:6px 14px; border-radius:20px;">
                🏷️ ${linesLabel}
            </div>
            <button onclick="if(confirm('تسجيل الخروج؟')) logout();" 
                    style="background:#dc3545; color:white; border:none; padding:6px 16px; 
                           border-radius:20px; cursor:pointer; font-weight:bold;">
                🚪 خروج
            </button>
        </div>
    `;
}

// ============================================================
// 📊 سجل النشاط
// ============================================================
function logActivity(action, details) {
    try {
        const user = getCurrentUser();
        const logs = JSON.parse(localStorage.getItem('activity_log') || '[]');
        logs.unshift({
            timestamp: new Date().toISOString(),
            userId: user?.id || 0,
            username: user?.username || 'unknown',
            fullName: user?.fullName || 'غير معروف',
            action,
            details
        });
        // الاحتفاظ بآخر 500 سجل فقط
        localStorage.setItem('activity_log', JSON.stringify(logs.slice(0, 500)));
    } catch(e) {
        console.warn('فشل تسجيل النشاط:', e);
    }
}

function getActivityLog() {
    return JSON.parse(localStorage.getItem('activity_log') || '[]');
}

// ============================================================
// 🌐 تهيئة نظام الصلاحيات عند فتح الصفحة
// ============================================================
async function initAuth() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    
    if (isLoggedIn()) {
        // المستخدم مسجّل → إخفاء شاشة الدخول + عرض التطبيق
        if (loginScreen) loginScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
        
        // 🔄 تحديث بيانات المستخدم من GitHub
        try {
            const users = await loadUsers(true);
            const fresh = users.find(u => u.id === currentUser.id);
            if (fresh) {
                currentUser = {
                    id: fresh.id,
                    username: fresh.username,
                    fullName: fresh.fullName,
                    role: fresh.role,
                    lineIds: fresh.lineIds,
                    status: fresh.status,
                    loginTime: currentUser.loginTime
                };
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
                
                if (fresh.status !== 'active') {
                    alert('🚫 تم تعطيل حسابك');
                    logout();
                    return;
                }
            } else {
                alert('⚠️ تم حذف حسابك');
                logout();
                return;
            }
        } catch(e) {
            console.warn('تعذّر تحديث بيانات المستخدم:', e);
        }
        
        applyPermissions();
        
        // ✅ إخفاء زر Admin فقط للمشاهد
        const manageBtn = document.getElementById('manageUsersBtn');
        if (manageBtn && !isAdmin()) manageBtn.style.display = 'none';
        
    } else {
        // غير مسجّل → عرض شاشة الدخول
        if (loginScreen) loginScreen.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        setupLoginForm();
    }
}

// ============================================================
// 📝 ربط نموذج تسجيل الدخول
// ============================================================
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.onsubmit = async function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        const errorDiv = document.getElementById('loginError');
        const btn = document.getElementById('loginBtn');
        
        // تعطيل الزر
        btn.disabled = true;
        btn.textContent = '⏳ جاري التحقق...';
        errorDiv.style.display = 'none';
        
        try {
            await login(username, password, rememberMe);
            // نجاح → إعادة تحميل الصفحة
            window.location.reload();
        } catch(err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = '🔓 تسجيل الدخول';
        }
    };
}

// ============================================================
// 🚀 تشغيل عند التحميل
// ============================================================
document.addEventListener('DOMContentLoaded', initAuth);