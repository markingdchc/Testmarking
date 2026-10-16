// ============================================================
// 🖥️ خادم الأرشيف المحلي (LAN)
// ============================================================
// يستمع على المنفذ 3000، ويعمل كجسر بين المتصفح و NAS
// ============================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

// ============================================================
// ⚙️ الإعدادات — عدّلها حسب بيئتك
// ============================================================
const CONFIG = {
    PORT: 3000,
    // مسار مجلد الأرشيف على NAS
    ARCHIVE_PATH: '\\\\192.168.1.10\\Archive',
    // المسارات الممنوعة لأسباب أمنية
    MAX_FILE_SIZE: 50 * 1024 * 1024,  // 50 MB
    ALLOWED_EXTENSIONS: ['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    // كلمة مرور بسيطة (اختيارية)
    API_KEY: 'your-secret-key-change-me'
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '60mb' }));

// ============================================================
// 🔐 Middleware للتحقق من API Key (اختياري)
// ============================================================
app.use((req, res, next) => {
    // اسمح بطلب فحص الحالة بدون مفتاح
    if (req.path === '/api/ping') return next();
    
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (CONFIG.API_KEY && apiKey !== CONFIG.API_KEY) {
        return res.status(401).json({ error: 'مفتاح غير صحيح' });
    }
    next();
});

// ============================================================
// 🔍 فحص الحالة
// ============================================================
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        archivePath: CONFIG.ARCHIVE_PATH,
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// 📥 فحص الوصول لمجلد الأرشيف
// ============================================================
app.get('/api/check-access', async (req, res) => {
    try {
        await fs.access(CONFIG.ARCHIVE_PATH);
        let stats = await fs.stat(CONFIG.ARCHIVE_PATH);
        res.json({
            success: true,
            exists: true,
            isDirectory: stats.isDirectory(),
            path: CONFIG.ARCHIVE_PATH
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            path: CONFIG.ARCHIVE_PATH
        });
    }
});

// ============================================================
// 📂 قائمة المجلدات (السفن)
// ============================================================
app.get('/api/archive/list', async (req, res) => {
    try {
        const entries = await fs.readdir(CONFIG.ARCHIVE_PATH, { withFileTypes: true });
        const folders = [];
        
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            
            const folderPath = path.join(CONFIG.ARCHIVE_PATH, entry.name);
            let files = [];
            
            try {
                const fileEntries = await fs.readdir(folderPath, { withFileTypes: true });
                for (const fe of fileEntries) {
                    if (!fe.isFile() || fe.name === '_info.json') continue;
                    
                    const filePath = path.join(folderPath, fe.name);
                    const stats = await fs.stat(filePath);
                    
                    files.push({
                        name: fe.name,
                        size: stats.size,
                        modified: stats.mtime,
                        url: `/api/archive/file/${encodeURIComponent(entry.name)}/${encodeURIComponent(fe.name)}`
                    });
                }
            } catch (e) {
                console.warn('خطأ في قراءة مجلد:', entry.name, e.message);
            }
            
            folders.push({
                name: entry.name,
                files: files,
                filesCount: files.length
            });
        }
        
        // ترتيب تنازلي حسب الاسم (الأحدث أولاً)
        folders.sort((a, b) => b.name.localeCompare(a.name));
        
        res.json({ success: true, folders });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// 📄 قراءة/تحميل ملف
// ============================================================
app.get('/api/archive/file/:folder/:file', async (req, res) => {
    try {
        const folderName = decodeURIComponent(req.params.folder);
        const fileName = decodeURIComponent(req.params.file);
        
        // حماية من path traversal
        if (folderName.includes('..') || fileName.includes('..')) {
            return res.status(400).json({ error: 'مسار غير صالح' });
        }
        
        const filePath = path.join(CONFIG.ARCHIVE_PATH, folderName, fileName);
        const stats = await fs.stat(filePath);
        
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Type', getMimeType(fileName));
        res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(fileName) + '"');
        
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        res.status(404).json({ success: false, error: 'الملف غير موجود: ' + error.message });
    }
});

// ============================================================
// 📤 رفع ملف جديد (أو تحديث)
// ============================================================
app.post('/api/archive/upload', async (req, res) => {
    try {
        const { folderName, fileName, base64Data } = req.body;
        
        if (!folderName || !fileName || !base64Data) {
            return res.status(400).json({ error: 'بيانات ناقصة' });
        }
        
        // التحقق من الامتداد
        const ext = '.' + fileName.toLowerCase().split('.').pop();
        if (!CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
            return res.status(400).json({ error: 'نوع الملف غير مسموح: ' + ext });
        }
        
        // التحقق من الحجم
        const size = Buffer.from(base64Data, 'base64').length;
        if (size > CONFIG.MAX_FILE_SIZE) {
            return res.status(400).json({ error: 'الملف كبير جداً (الأقصى 50 MB)' });
        }
        
        // تنظيف الأسماء
        const safeFolder = sanitizeName(folderName);
        const safeFile = sanitizeName(fileName);
        
        const folderPath = path.join(CONFIG.ARCHIVE_PATH, safeFolder);
        const filePath = path.join(folderPath, safeFile);
        
        // إنشاء المجلد إذا لم يكن موجوداً
        await fs.mkdir(folderPath, { recursive: true });
        
        // كتابة الملف
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(filePath, buffer);
        
        console.log('✅ تم حفظ:', filePath, '(' + (size / 1024).toFixed(1) + ' KB)');
        
        res.json({
            success: true,
            path: filePath,
            size: size,
            folder: safeFolder,
            file: safeFile
        });
        
    } catch (error) {
        console.error('❌ خطأ في الحفظ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// 🗑️ حذف ملف
// ============================================================
app.delete('/api/archive/file/:folder/:file', async (req, res) => {
    try {
        const folderName = decodeURIComponent(req.params.folder);
        const fileName = decodeURIComponent(req.params.file);
        
        if (folderName.includes('..') || fileName.includes('..')) {
            return res.status(400).json({ error: 'مسار غير صالح' });
        }
        
        const filePath = path.join(CONFIG.ARCHIVE_PATH, folderName, fileName);
        await fs.unlink(filePath);
        
        console.log('🗑️ تم حذف:', filePath);
        res.json({ success: true });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// 🔧 دوال مساعدة
// ============================================================
function sanitizeName(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
}

function getMimeType(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const types = {
        'pdf': 'application/pdf',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
    };
    return types[ext] || 'application/octet-stream';
}

// ============================================================
// 🚀 تشغيل الخادم
// ============================================================
app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('  🖥️  خادم الأرشيف المحلي يعمل');
    console.log('═══════════════════════════════════════════════');
    console.log('  📡 المنفذ:           ' + CONFIG.PORT);
    console.log('  📁 مجلد الأرشيف:     ' + CONFIG.ARCHIVE_PATH);
    console.log('  🔐 API Key:          ' + (CONFIG.API_KEY ? 'مفعّل' : 'معطّل'));
    console.log('');
    console.log('  🌐 روابط الوصول:');
    
    // اطبع عناوين IP المحلية
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (let name in interfaces) {
        for (let iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log('     → http://' + iface.address + ':' + CONFIG.PORT);
            }
        }
    }
    console.log('     → http://localhost:' + CONFIG.PORT);
    console.log('');
    console.log('  ⏹️  للإيقاف: Ctrl + C');
    console.log('═══════════════════════════════════════════════');
    console.log('');
});