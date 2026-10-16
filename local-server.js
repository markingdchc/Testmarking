// ============================================================
// 🖥️ الجسر مع الخادم المحلي (LAN)
// ============================================================

const LOCAL_SERVER_CONFIG = {
    // 🆕 استخدم عنوان الصفحة الحالي أولاً (تلقائياً)
    HOSTS: (() => {
        let hosts = [];
        
        // 1️⃣ عنوان الصفحة الحالي (إذا كان التطبيق يعمل من الخادم نفسه)
        if (window.location.origin && 
            !window.location.origin.includes('github.io') &&
            !window.location.origin.includes('localhost')) {
            hosts.push(window.location.origin);
        }
        
        // 2️⃣ عناوين احتياطية
        hosts.push(
            'http://10.5.50.111:3000',
            'http://10.63.80.178:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        );
        
        // إزالة المكرر
        return hosts.filter((v, i, a) => a.indexOf(v) === i);
    })(),
    API_KEY: 'your-secret-key-change-me',
    TIMEOUT: 3000
};

let _activeServerUrl = null;
let _localServerAvailable = false;

// ============================================================
// 🔍 كشف الخادم المحلي
// ============================================================
async function detectLocalServer() {
    console.log("🔍 البحث عن الخادم المحلي...");
    console.log("📍 عنوان الصفحة:", window.location.origin);
    console.log("📋 القائمة:", LOCAL_SERVER_CONFIG.HOSTS);
    
    for (const host of LOCAL_SERVER_CONFIG.HOSTS) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), LOCAL_SERVER_CONFIG.TIMEOUT);
            
            console.log(`  🧪 اختبار: ${host}`);
            const response = await fetch(host + '/api/ping', {
                signal: controller.signal
            });
            clearTimeout(timeout);
            
            if (response.ok) {
                const data = await response.json();
                _activeServerUrl = host;
                _localServerAvailable = true;
                console.log(`✅ تم العثور على الخادم: ${host}`, data);
                return true;
            }
        } catch (e) {
            console.log(`  ❌ فشل: ${host}`, e.message);
        }
    }
    
    _localServerAvailable = false;
    _activeServerUrl = null;
    console.log("⚠️ لم يتم العثور على الخادم المحلي");
    return false;
}

// ============================================================
// 📂 قائمة مجلدات الأرشيف من الخادم المحلي
// ============================================================
async function loadLocalArchiveFolders() {
    if (!_localServerAvailable) return null;
    
    try {
        const response = await fetch(
            `${_activeServerUrl}/api/archive/list?apiKey=${LOCAL_SERVER_CONFIG.API_KEY}`
        );
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        
        return data.folders.map(folder => ({
            name: folder.name,
            path: `archive/${folder.name}`,
            files: folder.files.map(f => ({
                name: f.name,
                size: f.size,
                path: `archive/${folder.name}/${f.name}`,
                download_url: `${_activeServerUrl}${f.url}?apiKey=${LOCAL_SERVER_CONFIG.API_KEY}`,
                sha: null,
                modified: f.modified
            })),
            filesCount: folder.filesCount,
            sha: null,
            source: 'local'
        }));
        
    } catch (error) {
        console.error("❌ فشل تحميل الأرشيف المحلي:", error.message);
        return null;
    }
}

// ============================================================
// 📤 رفع ملف إلى الخادم المحلي
// ============================================================
async function uploadToLocalServer(folderName, fileName, base64Data) {
    if (!_localServerAvailable) {
        return { success: false, error: 'الخادم المحلي غير متاح' };
    }
    
    try {
        const response = await fetch(`${_activeServerUrl}/api/archive/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': LOCAL_SERVER_CONFIG.API_KEY
            },
            body: JSON.stringify({
                folderName: folderName,
                fileName: fileName,
                base64Data: base64Data
            })
        });
        
        if (!response.ok) {
            const err = await response.json();
            return { success: false, error: err.error || 'فشل الرفع' };
        }
        
        const data = await response.json();
        return { success: true, path: data.path };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// 🗑️ حذف ملف من الخادم المحلي
// ============================================================
async function deleteFromLocalServer(folderName, fileName) {
    if (!_localServerAvailable) {
        return { success: false, error: 'الخادم المحلي غير متاح' };
    }
    
    try {
        const response = await fetch(
            `${_activeServerUrl}/api/archive/file/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}?apiKey=${LOCAL_SERVER_CONFIG.API_KEY}`,
            { method: 'DELETE' }
        );
        
        return { success: response.ok };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================
// 🚀 كشف الخادم تلقائياً عند فتح الصفحة
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    setTimeout(async () => {
        let available = await detectLocalServer();
        updateLocalServerIndicator(available);
    }, 1500);
});

// ============================================================
// 🎨 مؤشر حالة الخادم
// ============================================================
function updateLocalServerIndicator(available) {
    let indicator = document.getElementById('localServerIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'localServerIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 15px;
            left: 15px;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 9998;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.3s;
            cursor: pointer;
        `;
        document.body.appendChild(indicator);
    }
    
    if (available) {
        indicator.style.background = '#d4edda';
        indicator.style.color = '#155724';
        indicator.innerHTML = '🖥️ الخادم المحلي: <strong>متصل</strong>';
        indicator.title = 'اضغط لإعادة الفحص';
    } else {
        indicator.style.background = '#fff3cd';
        indicator.style.color = '#856404';
        indicator.innerHTML = '⚠️ الخادم المحلي: <strong>غير متصل</strong>';
        indicator.title = 'يعمل التطبيق عبر GitHub فقط. اضغط لإعادة المحاولة';
    }
    
    indicator.onclick = async function() {
        indicator.innerHTML = '⏳ جاري الفحص...';
        let available = await detectLocalServer();
        updateLocalServerIndicator(available);
    };
}