// ============================================================
// 📂 نظام الأرشيف الإلكتروني للسفن — النسخة النهائية
// ============================================================

const ARCHIVE_FOLDER = "archive";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

// ============================================================
// 🆕 بناء اسم مجلد الأرشيف
// ============================================================
// ============================================================
// 🆕 بناء اسم مجلد الأرشيف (ShipName_Date فقط)
// ============================================================
function buildArchiveFolderName() {
    let carrierName = "UnknownShip";
    let lineId = "UnknownLine";
    let shippingDate = "";

    if (typeof headerDataForUpload !== 'undefined' && headerDataForUpload) {
        carrierName = headerDataForUpload.carrierName || "UnknownShip";
        lineId = headerDataForUpload.lineId || "UnknownLine";
        shippingDate = headerDataForUpload.shippingDate || "";
    } else {
        carrierName = document.getElementById("headerCarrierName")?.innerText?.trim() || "UnknownShip";
        lineId = document.getElementById("headerLineId")?.innerText?.trim() || "UnknownLine";
        shippingDate = document.getElementById("headerShippingDate")?.innerText?.trim() || "";
    }

    const clean = (str) => (str || "")
        .toString()
        .replace(/\s+/g, '_')
        .replace(/[^\w\u0600-\u06FF\-]/g, "")
        .substring(0, 50);

    let safeCarrier = clean(carrierName) || "UnknownShip";
    let safeLine = clean(lineId) || "UnknownLine";
    let safeDate = (shippingDate || "").replace(/\//g, "-").replace(/[^\d\-]/g, "");

    if (!safeDate) {
        let today = new Date();
        safeDate = today.getFullYear() + "-" +
                   String(today.getMonth() + 1).padStart(2, '0') + "-" +
                   String(today.getDate()).padStart(2, '0');
    }

    // 🆕 المجلد = ShipName_Date (بدون خط)
    // 🆕 الملف = ShipName_Line_Date (مع خط)
    return {
        folderName: `${safeCarrier}_${safeDate}`,
        reportBaseName: `${safeCarrier}_${safeLine}_${safeDate}`,
        shipName: safeCarrier,
        lineId: safeLine,
        date: safeDate
    };
}

// ============================================================
// 🆕 نسخ ملف الحاويات إلى الأرشيف تلقائياً
// ============================================================
async function autoArchiveContainerFile() {
    console.log("📂 [الأرشيف] بدء النسخ التلقائي...");

    const fileData = localStorage.getItem("savedExcelFile");
    const originalFileName = localStorage.getItem("savedExcelFileName");

    if (!fileData || !originalFileName) {
        console.warn("⚠️ [الأرشيف] لا يوجد ملف محفوظ");
        return { success: false, error: "no file" };
    }

    let names = buildArchiveFolderName();
    if (names.shipName.includes("UnknownShip") || names.lineId.includes("UnknownLine")) {
        console.warn("⚠️ [الأرشيف] اسم السفينة أو الخط غير معروف");
        return { success: false, error: "unknown ship" };
    }

    const folderName = names.folderName;
    const extension = originalFileName.split('.').pop() || 'xls';
    const reportFileName = `${names.reportBaseName}.${extension}`;
    const archivePath = `${ARCHIVE_FOLDER}/${folderName}/${reportFileName}`;

    console.log(`📁 المجلد: ${folderName}`);
    console.log(`📄 الملف: ${reportFileName}`);

    let result = {
        success: false,
        local: { success: false, path: null },
        github: { success: false, path: null },
        folderName: folderName,
        fileName: reportFileName
    };

    // ============================================================
    // 1️⃣ رفع إلى الخادم المحلي (NAS) — دائماً
    // ============================================================
    if (typeof _localServerAvailable !== 'undefined' && _localServerAvailable) {
        console.log("🖥️ [1/2] رفع إلى الخادم المحلي...");
        try {
            let localResult = await uploadToLocalServer(folderName, reportFileName, fileData);
            if (localResult.success) {
                result.local.success = true;
                result.local.path = localResult.path;
                console.log(`✅ [المحلي] تم النسخ إلى: ${localResult.path}`);
            } else {
                console.warn(`⚠️ [المحلي] فشل: ${localResult.error}`);
            }
        } catch (e) {
            console.warn(`⚠️ [المحلي] استثناء: ${e.message}`);
        }
    } else {
        console.log("⏭️ [المحلي] الخادم المحلي غير متاح");
    }

    // ============================================================
    // 2️⃣ رفع إلى GitHub — دائماً (نسخة احتياطية)
    // ============================================================
    const token = localStorage.getItem("github_token");
    if (token) {
        console.log("☁️ [2/2] رفع إلى GitHub (نسخة احتياطية)...");
        try {
            const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${archivePath}`;
            let existingSha = null;

            const checkResp = await fetch(`${apiUrl}?ref=${GH_BRANCH}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json"
                }
            });

            if (checkResp.ok) {
                const data = await checkResp.json();
                existingSha = data.sha;
                console.log("🔄 [GitHub] الملف موجود، سيتم التحديث");
            }

            const body = {
                message: existingSha ? `Update ${reportFileName}` : `Archive ${reportFileName}`,
                content: fileData,
                branch: GH_BRANCH
            };
            if (existingSha) body.sha = existingSha;

            const uploadResp = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (uploadResp.ok) {
                result.github.success = true;
                result.github.path = archivePath;
                console.log(`✅ [GitHub] تم النسخ إلى: ${archivePath}`);

                // تحديث _info.json على GitHub
                await updateArchiveInfo(folderName, {
                    shipName: names.shipName,
                    date: names.date,
                    lastUpdate: new Date().toISOString()
                }, names.lineId);
            } else {
                const err = await uploadResp.json();
                console.warn(`⚠️ [GitHub] فشل: ${err.message}`);
            }
        } catch (e) {
            console.warn(`⚠️ [GitHub] استثناء: ${e.message}`);
        }
    } else {
        console.log("⏭️ [GitHub] لا يوجد Token");
    }

    // ============================================================
    // 3️⃣ تحديد النتيجة النهائية
    // ============================================================
    result.success = result.local.success || result.github.success;

    if (result.local.success && result.github.success) {
        console.log("🎉 [الأرشيف] تم النسخ إلى المحلي + GitHub معاً ✅✅");
    } else if (result.local.success) {
        console.log("✅ [الأرشيف] تم النسخ إلى المحلي فقط (GitHub فشل)");
    } else if (result.github.success) {
        console.log("✅ [الأرشيف] تم النسخ إلى GitHub فقط (المحلي غير متاح)");
    } else {
        console.log("❌ [الأرشيف] فشل النسخ في كلا المكانين");
    }

    return result;
}

// ============================================================
// 🆕 تحديث _info.json
// ============================================================
// ============================================================
// 🆕 تحديث _info.json
// ============================================================
async function updateArchiveInfo(folderName, newData, lineId) {
    const token = localStorage.getItem("github_token");
    if (!token) return;

    const infoPath = `${ARCHIVE_FOLDER}/${folderName}/_info.json`;
    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${infoPath}`;

    try {
        let existingInfo = {};
        let existingSha = null;

        const getResp = await fetch(`${apiUrl}?ref=${GH_BRANCH}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json"
            }
        });

        if (getResp.ok) {
            const data = await getResp.json();
            existingSha = data.sha;
            try {
                existingInfo = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
            } catch (e) {
                existingInfo = {};
            }
        }

        // 🆕 إدارة قائمة الخطوط المسجلة
        let existingLines = existingInfo.lines || [];
        if (lineId && !existingLines.includes(lineId)) {
            existingLines.push(lineId);
        }

        const mergedInfo = {
            ...existingInfo,
            ...newData,
            lines: existingLines,
            documents: existingInfo.documents || []
        };

        const body = {
            message: `Update info for ${folderName}`,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(mergedInfo, null, 2)))),
            branch: GH_BRANCH
        };
        if (existingSha) body.sha = existingSha;

        await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

    } catch (e) {
        console.warn("⚠️ [الأرشيف] فشل تحديث _info.json:", e.message);
    }
}

// ============================================================
// 🎯 فتح نافذة الأرشيف
// ============================================================
async function openArchiveWindow() {
    console.log("📂 فتح الأرشيف الإلكتروني...");
    
    let filterShip = "";
    let filterDate = "";
    
    // 🔍 اقرأ السفينة المحددة
    let shipSelect = document.getElementById('ghShipSelect');
    if (shipSelect && shipSelect.value && shipSelect.value.trim() !== "") {
        filterShip = shipSelect.value.trim();
        console.log("🔍 السفينة:", filterShip);
    }
    
    // 🔍 اقرأ التاريخ المحدد
    let dateSelect = document.getElementById('ghDateSelect');
    if (dateSelect && dateSelect.value) {
        let selectedOption = dateSelect.options[dateSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset && selectedOption.dataset.date) {
            filterDate = selectedOption.dataset.date;
        }
        console.log("🔍 التاريخ:", filterDate);
    }
    
    // 🆕 التحقق: إذا كانت السفينة محددة، يجب تحديد التاريخ أيضاً
    if (filterShip && !filterDate) {
        alert('⚠️ يرجى اختيار التاريخ أيضاً\n\nلكي يعرض الأرشيف رحلة محددة، اختر التاريخ من القائمة.');
        return;
    }
    
    // إذا لم تكن السفينة محددة، اعرض الأرشيف كاملاً (اختياري)
    // إذا أردت اشتراط تحديد السفينة أيضاً، فعّل السطر التالي:
    // if (!filterShip) { alert('⚠️ يرجى اختيار السفينة أولاً'); return; }
    
    // افتح الأرشيف مع الفلتر (اسم السفينة + التاريخ)
    await openArchiveInternal(filterShip, filterDate);
}

window.openFilteredArchive = async function(shipName, shipDate) {
    console.log("📂 فتح الأرشيف للسفينة:", shipName, "| التاريخ:", shipDate);
    await openArchiveInternal(shipName, shipDate || "");
};

// ============================================================
// 🎯 الدالة الداخلية — تنشئ نافذة الأرشيف
// ============================================================
async function openArchiveInternal(filterShip, filterDate) {
    let archiveWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    if (!archiveWindow) {
        alert("⚠️ الرجاء السماح للنوافذ المنبثقة");
        return;
    }

    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const isAdminUser = user && user.role === 'admin';
    // 🆕 بناء عنوان يعرض السفينة + التاريخ (إن وُجد)
    let titleParts = [];
    if (filterShip) titleParts.push(filterShip);
    if (filterDate) titleParts.push(filterDate);
    let titleText = titleParts.length > 0 ? titleParts.join(' | ') : 'أرشيف السفن';
    
    const pageTitle = `📂 أرشيف: ${titleText}`;
    const headerTitle = `📂 الأرشيف: ${titleText}`;

    archiveWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${pageTitle}</title>
            <style>
                * { font-family: 'Segoe UI', Tahoma, sans-serif; box-sizing: border-box; }
                body { background: #f0f2f5; padding: 20px; margin: 0; direction: rtl; }
                .container { max-width: 1200px; margin: auto; background: white; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); padding: 25px; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0a3d62; padding-bottom: 15px; margin-bottom: 20px; }
                .header h1 { color: #0a3d62; margin: 0; font-size: 22px; }
                .header-actions { display: flex; gap: 10px; }
                .btn-header { color: white; border: none; padding: 10px 20px; border-radius: 30px; cursor: pointer; font-weight: bold; }
                .btn-refresh { background: #17a2b8; }
                .btn-close { background: #dc3545; }
                .search-bar { display: flex; gap: 10px; margin-bottom: 20px; }
                .search-bar input { flex: 1; padding: 12px 18px; border: 2px solid #dee2e6; border-radius: 10px; font-size: 15px; }
                .search-bar input:focus { border-color: #0a3d62; outline: none; }
                .loading { text-align: center; padding: 50px; color: #6c757d; font-size: 18px; }
                .folder-card { background: #f8f9fa; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border-right: 4px solid #0a3d62; }
                .folder-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; user-select: none; }
                .folder-header:hover { background: #e9ecef; }
                .folder-name { font-weight: bold; color: #0a3d62; font-size: 16px; }
                .folder-count { background: #cce5ff; color: #004085; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
                .folder-body { display: none; padding: 15px 20px; background: white; border-top: 1px solid #dee2e6; }
                .folder-body.active { display: block; }
                .file-row { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #e9ecef; gap: 10px; flex-wrap: wrap; }
                .file-row:last-child { border-bottom: none; }
                .file-name { display: flex; align-items: center; gap: 10px; color: #333; flex: 1; min-width: 0; }
                .file-name span:first-child { flex-shrink: 0; font-size: 20px; }
                .file-name span:nth-child(2) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .file-actions { display: flex; gap: 8px; flex-shrink: 0; }
                .btn-small { padding: 6px 14px; border-radius: 20px; border: none; cursor: pointer; font-size: 13px; font-weight: bold; }
                .btn-view { background: #17a2b8; color: white; }
                .btn-download { background: #28a745; color: white; }
                .btn-delete { background: #dc3545; color: white; }
                .btn-upload { background: #8b5cf6; color: white; padding: 10px 20px; border-radius: 20px; border: none; cursor: pointer; font-weight: bold; margin-top: 10px; font-size: 14px; }
                .btn-upload:hover { background: #7c3aed; }
                .empty { text-align: center; padding: 30px; color: #adb5bd; font-size: 15px; }
                .no-archive { background: #fff3cd; border-right: 4px solid #ffc107; padding: 20px; border-radius: 12px; text-align: center; color: #856404; }
                .uploading-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; }
                .uploading-box { background: white; padding: 30px 50px; border-radius: 16px; text-align: center; }
                .spinner { display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0a3d62; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .preview-modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 99999; justify-content: center; align-items: center; padding: 20px; }
                .preview-modal.active { display: flex; }
                .preview-content { background: white; border-radius: 12px; width: 95%; height: 95%; max-width: 1400px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
                .preview-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #0a3d62; color: white; }
                .preview-title { font-weight: bold; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; margin-left: 10px; }
                .preview-actions { display: flex; gap: 8px; }
                .preview-btn { background: rgba(255,255,255,0.15); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.2s; }
                .preview-btn:hover { background: rgba(255,255,255,0.3); }
                .preview-btn-close { background: #dc3545; }
                .preview-btn-close:hover { background: #c82333; }
                .preview-body { flex: 1; overflow: auto; background: #525659; display: flex; justify-content: center; align-items: flex-start; padding: 20px; }
                .preview-body img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                .preview-body iframe { width: 100%; height: 100%; border: none; border-radius: 8px; background: white; }
                .preview-body .no-preview { color: white; text-align: center; font-size: 18px; padding: 40px; }
                .preview-body .no-preview button { margin-top: 15px; background: #28a745; color: white; border: none; padding: 12px 30px; border-radius: 30px; cursor: pointer; font-weight: bold; font-size: 15px; }
            </style>
        </head>
        <body>
            <div class="preview-modal" id="previewModal">
                <div class="preview-content">
                    <div class="preview-header">
                        <div class="preview-title" id="previewTitle">معاينة الملف</div>
                        <div class="preview-actions">
                            <button class="preview-btn" onclick="window.downloadPreviewFile()">📥 تنزيل</button>
                            <button class="preview-btn" onclick="window.openPreviewInNewTab()">🔗 فتح في تاب جديد</button>
                            <button class="preview-btn preview-btn-close" onclick="window.closePreview()">✖ إغلاق</button>
                        </div>
                    </div>
                    <div class="preview-body" id="previewBody"></div>
                </div>
            </div>

            <div class="container">
                <div class="header">
                    <h1>${headerTitle}</h1>
                    <div class="header-actions">
                        <button class="btn-header btn-refresh" onclick="window.refreshArchiveContent()">🔄 تحديث</button>
                        <button class="btn-header btn-close" onclick="window.close()">✖ إغلاق</button>
                    </div>
                </div>
                ${!filterShip ? `
                <div class="search-bar">
                    <input type="text" id="archiveSearch" placeholder="🔍 ابحث باسم السفينة أو الخط أو التاريخ..." />
                </div>` : ''}
                <div id="archiveContent">
                    <div class="loading">⏳ جاري تحميل الأرشيف...</div>
                </div>
            </div>
            <script>
                window.archiveOpener = window.opener;
                window.isAdminUser = ${isAdminUser};
                window.currentFilterShip = "${filterShip || ''}";
                window.currentFilterDate = "${filterDate || ''}";
                window.currentPreviewUrl = null;
                window.currentPreviewName = null;
                
                window.refreshArchiveContent = async function() {
                    console.log("🔄 تحديث محتوى الأرشيف...");
                    let content = document.getElementById('archiveContent');
                    if (content) {
                        content.innerHTML = '<div class="loading">⏳ جاري التحديث...</div>';
                    }
                    await window.archiveOpener.refreshArchiveWindow(
                        window, 
                        window.currentFilterShip || "", 
                        window.currentFilterDate || ""
                    );
                };
                
                window.toggleFolder = function(folderName) {
                    console.log("📁 toggleFolder:", folderName);
                    let body = document.getElementById('folder_' + folderName);
                    if (body) {
                        body.classList.toggle('active');
                    }
                };
                
                window.downloadFileInArchive = function(url, fileName) {
                    let a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
                
                window.viewFileInArchive = function(url, fileName) {
                    console.log("👁️ معاينة:", fileName);
                    
                    window.currentPreviewUrl = url;
                    window.currentPreviewName = fileName || 'file';
                    
                    let modal = document.getElementById('previewModal');
                    let body = document.getElementById('previewBody');
                    let title = document.getElementById('previewTitle');
                    
                    title.textContent = '👁️ ' + (fileName || 'معاينة الملف');
                    
                    let ext = (fileName || '').toLowerCase().split('.').pop();
                    
                    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
                        body.innerHTML = '<img src="' + url + '" alt="' + fileName + '">';
                    } else if (ext === 'pdf') {
                        // 🆕 حل مشكلة CORS: استخدام Google Docs Viewer أو Microsoft Office Viewer
                        let googleViewerUrl = 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(url);
                        body.innerHTML = 
                            '<iframe src="' + googleViewerUrl + '" ' +
                            'style="width:100%;height:100%;border:none;background:white;" ' +
                            'allowfullscreen></iframe>' +
                            '<div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:6px 12px;border-radius:20px;font-size:11px;">' +
                            'إذا لم يظهر الملف، <a href="#" onclick="window.downloadPreviewFile(); return false;" style="color:#4facfe;text-decoration:underline;">اضغط هنا للتنزيل</a>' +
                            '</div>';
                    } else {
                        body.innerHTML = 
                            '<div class="no-preview">' +
                            '📄 لا يمكن معاينة هذا النوع (' + ext + ') مباشرة' +
                            '<br>' +
                            '<button onclick="window.downloadPreviewFile()">📥 تنزيل الملف</button>' +
                            '</div>';
                    }
                    
                    modal.classList.add('active');
                };
                
                window.closePreview = function() {
                    let modal = document.getElementById('previewModal');
                    let body = document.getElementById('previewBody');
                    modal.classList.remove('active');
                    setTimeout(() => {
                        body.innerHTML = '';
                    }, 200);
                    window.currentPreviewUrl = null;
                    window.currentPreviewName = null;
                };
                
                window.downloadPreviewFile = function() {
                    if (!window.currentPreviewUrl) return;
                    let a = document.createElement('a');
                    a.href = window.currentPreviewUrl;
                    a.download = window.currentPreviewName || 'file';
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
                
                window.openPreviewInNewTab = function() {
                    if (window.currentPreviewUrl) {
                        window.open(window.currentPreviewUrl, '_blank');
                    }
                };
                
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        let modal = document.getElementById('previewModal');
                        if (modal && modal.classList.contains('active')) {
                            window.closePreview();
                        }
                    }
                });
                
                document.addEventListener('click', function(e) {
                    if (e.target.id === 'previewModal') {
                        window.closePreview();
                    }
                });
                
                window.deleteFileInArchive = async function(filePath, sha, folderName) {
                    if (!confirm('هل أنت متأكد من حذف:\\n' + filePath.split('/').pop() + '؟')) return;
                    
                    const token = localStorage.getItem('github_token');
                    if (!token) {
                        alert('❌ لا يوجد Token');
                        return;
                    }
                    
                    try {
                        const apiUrl = 'https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/' + filePath;
                        const resp = await fetch(apiUrl, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Accept': 'application/vnd.github+json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: 'Delete ' + filePath.split('/').pop(),
                                sha: sha,
                                branch: '${GH_BRANCH}'
                            })
                        });
                        
                        if (!resp.ok) {
                            const err = await resp.json();
                            throw new Error(err.message);
                        }
                        
                        alert('✅ تم الحذف');
                        await window.refreshArchiveContent();
                    } catch (error) {
                        alert('❌ فشل الحذف: ' + error.message);
                    }
                };
                
                window.handleArchiveUpload = function(folderName) {
                    console.log("📤 بدء رفع مستندات إلى:", folderName);
                    
                    let input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png';
                    input.style.display = 'none';
                    
                    input.onchange = async function(e) {
                        let files = Array.from(e.target.files);
                        if (files.length === 0) return;
                        
                        let invalidFiles = [];
                        let validFiles = [];
                        const MAX_SIZE = 25 * 1024 * 1024;
                        const ALLOWED = ['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
                        
                        for (let file of files) {
                            let ext = '.' + file.name.toLowerCase().split('.').pop();
                            if (!ALLOWED.includes(ext)) {
                                invalidFiles.push(file.name + ' (نوع غير مسموح)');
                            } else if (file.size > MAX_SIZE) {
                                invalidFiles.push(file.name + ' (يتجاوز 25 MB)');
                            } else {
                                validFiles.push(file);
                            }
                        }
                        
                        if (invalidFiles.length > 0) {
                            alert('⚠️ تم تجاهل:\\n' + invalidFiles.join('\\n'));
                        }
                        
                        if (validFiles.length === 0) return;
                        
                        let overlay = document.createElement('div');
                        overlay.className = 'uploading-overlay';
                        overlay.innerHTML = 
                            '<div class="uploading-box">' +
                            '<div class="spinner"></div>' +
                            '<div id="uploadProgress" style="margin-top:15px;font-weight:bold;color:#0a3d62;">' +
                            '⏳ جاري قراءة الملفات...' +
                            '</div>' +
                            '</div>';
                        document.body.appendChild(overlay);
                        
                        let successCount = 0;
                        let failCount = 0;
                        let errorMessages = [];
                        
                        for (let i = 0; i < validFiles.length; i++) {
                            let file = validFiles[i];
                            let progressEl = document.getElementById('uploadProgress');
                            if (progressEl) {
                                progressEl.textContent = '📄 رفع ' + (i+1) + '/' + validFiles.length + ': ' + file.name;
                            }
                            
                            try {
                                let base64 = await new Promise((resolve, reject) => {
                                    let reader = new FileReader();
                                    reader.onload = () => {
                                        let binary = '';
                                        let bytes = new Uint8Array(reader.result);
                                        let chunkSize = 8192;
                                        for (let j = 0; j < bytes.length; j += chunkSize) {
                                            binary += String.fromCharCode.apply(null, bytes.subarray(j, j + chunkSize));
                                        }
                                        resolve(btoa(binary));
                                    };
                                    reader.onerror = reject;
                                    reader.readAsArrayBuffer(file);
                                });
                                
                                let result = await new Promise((resolve, reject) => {
                                    const messageId = 'upload_' + Date.now() + '_' + i;
                                    
                                    const handler = (event) => {
                                        if (event.data && 
                                            event.data.type === 'uploadFileResult' && 
                                            event.data.messageId === messageId) {
                                            window.removeEventListener('message', handler);
                                            resolve(event.data);
                                        }
                                    };
                                    
                                    window.addEventListener('message', handler);
                                    
                                    window.archiveOpener.postMessage({
                                        type: 'uploadFileFromArchive',
                                        messageId: messageId,
                                        folderName: folderName,
                                        fileName: file.name,
                                        base64Data: base64
                                    }, '*');
                                    
                                    setTimeout(() => {
                                        window.removeEventListener('message', handler);
                                        reject(new Error('انتهت المهلة'));
                                    }, 60000);
                                });
                                
                                if (result.success) {
                                    successCount++;
                                } else {
                                    failCount++;
                                    errorMessages.push(file.name + ': ' + result.error);
                                }
                            } catch (err) {
                                failCount++;
                                errorMessages.push(file.name + ': ' + err.message);
                            }
                        }
                        
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                        
                        let msg = '✅ تم الرفع بنجاح: ' + successCount + ' ملف';
                        if (failCount > 0) {
                            msg += '\\n❌ فشل: ' + failCount + '\\n\\nالتفاصيل:\\n' + errorMessages.join('\\n');
                        }
                        alert(msg);
                        
                        await window.refreshArchiveContent();
                    };
                    
                    document.body.appendChild(input);
                    input.click();
                    
                    setTimeout(() => {
                        if (input.parentNode) input.parentNode.removeChild(input);
                    }, 1000);
                };
            <\/script>
        </body>
        </html>
    `);
    archiveWindow.document.close();

    await refreshArchiveWindow(archiveWindow, filterShip, filterDate);
}

// ============================================================
// 🔄 تحديث محتوى نافذة الأرشيف
// ============================================================
async function refreshArchiveWindow(archiveWindow, filterShip, filterDate) {
    try {
        let folders = await loadArchiveFolders();

        // 🔍 فلترة باسم السفينة
        if (filterShip && filterShip.trim() !== "") {
            let cleanShip = filterShip.toLowerCase().replace(/\s+/g, '_');
            folders = folders.filter(f => f.name.toLowerCase().includes(cleanShip));
        }

        // 🔍 فلترة بالتاريخ (إن وُجد)
        if (filterDate && filterDate.trim() !== "") {
            // التاريخ بصيغة YYYY-MM-DD
            let cleanDate = filterDate.replace(/\//g, '-').trim();
            folders = folders.filter(f => f.name.includes(cleanDate));
            console.log(`🔍 بعد فلترة التاريخ ${cleanDate}: ${folders.length} مجلد`);
        }

        archiveWindow.archiveFolders = folders;

        if (folders.length === 0) {
            let msg = '📭 لا يوجد أرشيف';
            if (filterShip && filterDate) {
                msg = `📭 لا يوجد أرشيف لـ ${filterShip} بتاريخ ${filterDate}`;
            } else if (filterShip) {
                msg = `📭 لا يوجد أرشيف لـ ${filterShip}`;
            }
            archiveWindow.document.getElementById('archiveContent').innerHTML = 
                `<div class="no-archive">${msg}</div>`;
            return;
        }

        renderArchiveFolders(archiveWindow, folders);

        // ربط البحث (فقط عند عدم وجود فلتر)
        if (!filterShip && !filterDate) {
            let searchInput = archiveWindow.document.getElementById('archiveSearch');
            if (searchInput && !searchInput.dataset.bound) {
                searchInput.dataset.bound = "1";
                searchInput.addEventListener('input', (e) => {
                    let query = e.target.value.toLowerCase();
                    let filtered = folders.filter(f => f.name.toLowerCase().includes(query));
                    renderArchiveFolders(archiveWindow, filtered);
                });
            }
        }

    } catch (error) {
        console.error("خطأ في تحميل الأرشيف:", error);
        archiveWindow.document.getElementById('archiveContent').innerHTML = 
            `<div class="no-archive" style="border-color:#dc3545;background:#f8d7da;color:#721c24;">
                ❌ فشل تحميل الأرشيف: ${error.message}
            </div>`;
    }
}

// ============================================================
// 📥 تحميل قائمة مجلدات الأرشيف
// ============================================================
// ============================================================
// 📥 تحميل قائمة مجلدات الأرشيف (فلترة الخط على مستوى الملفات)
// ============================================================
async function loadArchiveFolders() {
    // 🆕 أولوية للخادم المحلي (إذا كان متاحاً)
    if (typeof _localServerAvailable !== 'undefined' && _localServerAvailable) {
        let localFolders = await loadLocalArchiveFolders();
        if (localFolders) {
            console.log("📂 استخدام الأرشيف المحلي");
            // طبّق فلترة الصلاحيات
            let user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (user && user.role !== 'admin' && !user.lineIds.includes('*')) {
                localFolders = localFolders.filter(f => {
                    let parts = f.name.split('_');
                    if (parts.length >= 2) {
                        let line = parts[parts.length - 2];
                        return user.lineIds.includes(line);
                    }
                    return true;
                });
            }
            return localFolders;
        }
    }
    
    // fallback: GitHub
    console.log("📂 استخدام الأرشيف من GitHub");
    const token = localStorage.getItem("github_token");
    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${ARCHIVE_FOLDER}?ref=${GH_BRANCH}`;

    const headers = { "Accept": "application/vnd.github+json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(apiUrl, { headers });

    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`فشل الجلب: ${response.status}`);

    const contents = await response.json();
    let folders = contents.filter(item => item.type === "dir");

    // 🆕 هل المستخدم مقيّد بخطوط معينة؟
    let user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    let isRestricted = user && user.role !== 'admin' && !user.lineIds.includes('*');

    let result = [];
    for (let folder of folders) {
        try {
            let allFiles = await fetchFolderContents(folder.path, token);

            // 🆕 فلترة الملفات حسب الخط للمستخدمين المقيّدين
            let visibleFiles = allFiles;
            if (isRestricted) {
                visibleFiles = allFiles.filter(file => {
                    let line = extractLineFromFileName(file.name);
                    return line && user.lineIds.includes(line);
                });
                // تجاهل المجلد إذا لم توجد ملفات مرئية
                if (visibleFiles.length === 0) continue;
            }

            result.push({
                name: folder.name,
                path: folder.path,
                files: visibleFiles,
                filesCount: visibleFiles.length,
                sha: folder.sha
            });
        } catch (e) {
            result.push({
                name: folder.name,
                path: folder.path,
                files: [],
                filesCount: 0,
                sha: folder.sha
            });
        }
    }

    result.sort((a, b) => b.name.localeCompare(a.name));
    return result;
}

// ============================================================
// 🆕 استخراج Line ID من اسم الملف
// الصيغة: ShipName_Line_Date.ext
// ============================================================
function extractLineFromFileName(fileName) {
    let nameNoExt = fileName.replace(/\.[^.]+$/, '');
    let parts = nameNoExt.split('_');
    if (parts.length >= 3) {
        // الجزء قبل الأخير هو الخط (الأخير هو التاريخ)
        return parts[parts.length - 2];
    }
    return null;
}

// ============================================================
// 📁 تحميل محتويات مجلد
// ============================================================
// ============================================================
// 📁 تحميل محتويات مجلد
// ============================================================
async function fetchFolderContents(folderPath, token) {
    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${folderPath}?ref=${GH_BRANCH}`;
    const headers = { "Accept": "application/vnd.github+json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(apiUrl, { headers });
    if (!response.ok) return [];

    const contents = await response.json();
    return contents.filter(item => item.type === "file" && item.name !== "_info.json");
}

// ============================================================
// 🎨 عرض المجلدات
// ============================================================
function renderArchiveFolders(archiveWindow, folders) {
    let content = archiveWindow.document.getElementById('archiveContent');

    if (folders.length === 0) {
        content.innerHTML = `<div class="empty">🔍 لا توجد نتائج مطابقة</div>`;
        return;
    }

    let html = '';
    for (let folder of folders) {
        let displayName = folder.name.replace(/_/g, ' ');
        let uploadBtn = archiveWindow.isAdminUser 
            ? `<button class="btn-upload" onclick="event.stopPropagation(); window.handleArchiveUpload('${folder.name}')">📤 رفع مستندات</button>` 
            : '';

        html += `
            <div class="folder-card" data-folder-name="${folder.name}">
                <div class="folder-header" data-folder="${folder.name}" onclick="window.toggleFolder(this.dataset.folder)">
                    <div><span class="folder-name">📁 ${displayName}</span></div>
                    <span class="folder-count">${folder.filesCount} مستند</span>
                </div>
                <div class="folder-body" id="folder_${folder.name}">
                    ${renderFolderFiles(folder, archiveWindow)}
                    ${uploadBtn}
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
}

// ============================================================
// 📄 عرض ملفات مجلد
// ============================================================
function renderFolderFiles(folder, archiveWindow) {
    if (!folder.files || folder.files.length === 0) {
        return `<div class="empty" style="padding:20px;font-size:14px;">📭 لا توجد مستندات في هذا المجلد</div>`;
    }

    let html = '';
    for (let file of folder.files) {
        let sizeText = formatFileSize(file.size);
        let icon = getFileIcon(file.name);
        let deleteBtn = archiveWindow.isAdminUser
            ? `<button class="btn-small btn-delete" onclick="event.stopPropagation(); window.deleteFileInArchive('${file.path}', '${file.sha}', '${folder.name}')">🗑️</button>`
            : '';

        html += `
            <div class="file-row">
                <div class="file-name">
                    <span>${icon}</span>
                    <span title="${file.name}">${file.name}</span>
                    <span style="color:#6c757d;font-size:12px;flex-shrink:0;">(${sizeText})</span>
                </div>
                <div class="file-actions">
                    <button class="btn-small btn-view" onclick="event.stopPropagation(); window.viewFileInArchive('${file.download_url}', '${file.name}')">👁️ عرض</button>
                    <button class="btn-small btn-download" onclick="event.stopPropagation(); window.downloadFileInArchive('${file.download_url}', '${file.name}')">📥</button>
                    ${deleteBtn}
                </div>
            </div>
        `;
    }

    return html;
}

// ============================================================
// 🎯 دوال مساعدة
// ============================================================
function getFileIcon(fileName) {
    let ext = fileName.toLowerCase().split('.').pop();
    switch(ext) {
        case 'pdf': return '📕';
        case 'xls': case 'xlsx': return '📊';
        case 'doc': case 'docx': return '📘';
        case 'jpg': case 'jpeg': case 'png': return '🖼️';
        default: return '📄';
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================================
// 📤 رفع ملفات إلى الأرشيف
// ============================================================
window.uploadFilesToArchive = async function(folderName, fileDataList) {
    console.log(`📤 [الأرشيف] رفع ${fileDataList.length} ملف إلى ${folderName}`);
    
    let successCount = 0;
    let failCount = 0;
    let errors = [];
    
    for (let i = 0; i < fileDataList.length; i++) {
        let file = fileDataList[i];
        console.log(`  📄 (${i+1}/${fileDataList.length}) ${file.name}`);
        
        try {
            let result = await uploadBase64ToArchive(folderName, file.name, file.base64);
            if (result.success) {
                successCount++;
                console.log(`  ✅ تم: ${file.name}`);
            } else {
                failCount++;
                errors.push(file.name + ': ' + result.error);
            }
        } catch (e) {
            failCount++;
            errors.push(file.name + ': ' + e.message);
        }
    }
    
    if (typeof showUploadNotification === 'function') {
        let msg = `✅ نجح: ${successCount}`;
        if (failCount > 0) msg += `\n❌ فشل: ${failCount}\n\n${errors.join('\n')}`;
        showUploadNotification(
            failCount > 0 ? "warning" : "success",
            `رفع ${successCount + failCount} ملف`,
            msg
        );
    }
    
    return { successCount, failCount };
};

// ============================================================
// 📤 رفع ملف واحد كـ base64
// ============================================================
async function uploadBase64ToArchive(folderName, fileName, base64Data) {
    // 🆕 جرّب الخادم المحلي أولاً
    if (typeof _localServerAvailable !== 'undefined' && _localServerAvailable) {
        let result = await uploadToLocalServer(folderName, fileName, base64Data);
        if (result.success) {
            console.log("✅ تم الرفع إلى الخادم المحلي:", result.path);
            // ✨ اختياري: نسخة احتياطية على GitHub
            // (يمكن تفعيل هذا لاحقاً)
            return result;
        }
        console.warn("⚠️ فشل الرفع المحلي، جاري المحاولة عبر GitHub...");
    }
    
    // fallback: GitHub
    const token = localStorage.getItem("github_token");
    // ... (باقي الكود كما هو)
    if (!token) throw new Error("لا يوجد Token");
    
    let cleanName = fileName.replace(/[^\w\u0600-\u06FF.\-]/g, '_');
    const filePath = `${ARCHIVE_FOLDER}/${folderName}/${cleanName}`;
    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}`;
    
    let existingSha = null;
    try {
        const checkResp = await fetch(`${apiUrl}?ref=${GH_BRANCH}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json"
            }
        });
        if (checkResp.ok) {
            const data = await checkResp.json();
            existingSha = data.sha;
        }
    } catch (e) {}
    
    const body = {
        message: `Upload ${cleanName} to ${folderName}`,
        content: base64Data,
        branch: GH_BRANCH
    };
    if (existingSha) body.sha = existingSha;
    
    const resp = await fetch(apiUrl, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    
    if (!resp.ok) {
        const err = await resp.json();
        return { success: false, error: err.message };
    }
    
    await updateArchiveInfo(folderName, {});
    return { success: true };
}

// ============================================================
// 🔔 فحص وجود أرشيف للسفينة
// ============================================================
async function checkShipArchive(shipName, shipDate) {
    // 🆕 لا تنبيه إلا إذا كانت السفينة **و** التاريخ محددين
    if (!shipName || shipName.trim() === "" || !shipDate || shipDate.trim() === "") {
        hideArchiveNotification();
        return;
    }
    
    try {
        let folders = await loadArchiveFolders();
        let cleanShip = shipName.toLowerCase().replace(/\s+/g, '_');
        let cleanDate = shipDate.replace(/\//g, '-').trim();
        
        // فلترة بالسفينة والتاريخ معاً
        let matches = folders.filter(f => 
            f.name.toLowerCase().includes(cleanShip) && 
            f.name.includes(cleanDate)
        );
        
        console.log(`🔍 فلترة ${shipName} + ${cleanDate}: ${matches.length} مجلد`);
        
        if (matches.length > 0) {
            showArchiveNotification(shipName, shipDate, matches);
        } else {
            hideArchiveNotification();
        }
    } catch (e) {
        console.warn("⚠️ فشل فحص الأرشيف:", e.message);
        hideArchiveNotification();
    }
}

function showArchiveNotification(shipName, shipDate, matches) {
    hideArchiveNotification();
    
    let totalFiles = matches.reduce((sum, f) => sum + f.filesCount, 0);
    
    // 🆕 نص التاريخ
    let dateText = shipDate ? ` • ${shipDate}` : '';
    
    let notif = document.createElement('div');
    notif.id = 'archiveNotification';
    notif.style.cssText = `
        background: linear-gradient(135deg, #d4edda, #c3e6cb);
        border-right: 4px solid #28a745;
        padding: 12px 18px;
        border-radius: 10px;
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    `;
    
    notif.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; color: #155724;">
            <span style="font-size: 20px;">📂</span>
            <div>
                <div style="font-weight: bold;">مستندات هذه الرحلة موجودة في الأرشيف</div>
                <div style="font-size: 12px; opacity: 0.8;">
                    ${shipName}${dateText} • ${matches.length} مجلد • ${totalFiles} مستند
                </div>
            </div>
        </div>
        <button onclick="openFilteredArchive('${shipName}', '${shipDate || ''}')" 
                style="background: #28a745; color: white; border: none; 
                       padding: 8px 20px; border-radius: 20px; cursor: pointer; 
                       font-weight: bold; font-size: 14px;">
            📂 فتح الأرشيف
        </button>
    `;
    
    let shipSelect = document.getElementById('ghShipSelect');
    if (shipSelect && shipSelect.parentElement) {
        shipSelect.parentElement.appendChild(notif);
    }
}

function hideArchiveNotification() {
    let old = document.getElementById('archiveNotification');
    if (old) old.remove();
}

// ============================================================
// 🎯 ربط زر الأرشيف + حدث تغيير السفينة
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    let toolbar = document.querySelector('.upload-area');
    if (!toolbar) return;

    if (!document.getElementById('archiveBtn')) {
        let archiveBtn = document.createElement('button');
        archiveBtn.id = 'archiveBtn';
        archiveBtn.innerHTML = '📂 أرشيف السفن';
        archiveBtn.style.cssText = 'background: #0a3d62; color: white; padding: 12px 28px; border-radius: 40px; cursor: pointer; display: inline-block; font-weight: bold; font-size: 16px; margin: 5px; border: none; transition: 0.3s;';
        archiveBtn.onmouseover = function() { this.style.transform = 'translateY(-2px)'; };
        archiveBtn.onmouseout = function() { this.style.transform = 'translateY(0)'; };
        archiveBtn.onclick = openArchiveWindow;
        toolbar.appendChild(archiveBtn);
    }

    setTimeout(() => {
        let shipSelect = document.getElementById('ghShipSelect');
        let dateSelect = document.getElementById('ghDateSelect');
        
        // 🆕 دالة موحدة لفحص الأرشيف
        function checkArchiveFromSelectors() {
            let shipName = shipSelect ? shipSelect.value : "";
            let shipDate = "";
            
            if (dateSelect && dateSelect.value) {
                let selectedOption = dateSelect.options[dateSelect.selectedIndex];
                if (selectedOption && selectedOption.dataset && selectedOption.dataset.date) {
                    shipDate = selectedOption.dataset.date;
                }
            }
            
            if (shipName) {
                checkShipArchive(shipName, shipDate);
            } else {
                hideArchiveNotification();
            }
        }
        
        // ربط حدث السفينة
        if (shipSelect) {
            shipSelect.addEventListener('change', checkArchiveFromSelectors);
        }
        
        // 🆕 ربط حدث التاريخ
        if (dateSelect) {
            dateSelect.addEventListener('change', checkArchiveFromSelectors);
        }
        
        console.log("✅ تم ربط تنبيه الأرشيف بـ ghShipSelect + ghDateSelect");
    }, 2500);
});

// ============================================================
// 📨 مستمع الرسائل من نافذة الأرشيف (لرفع المستندات)
// ============================================================
window.addEventListener('message', async (event) => {
    if (event.source === window) return;
    
    if (event.data && event.data.type === 'uploadFileFromArchive') {
        console.log("📨 [الأرشيف] استلام طلب رفع من نافذة الأرشيف");
        
        const { messageId, folderName, fileName, base64Data } = event.data;
        
        try {
            const result = await uploadBase64ToArchive(folderName, fileName, base64Data);
            event.source.postMessage({
                type: 'uploadFileResult',
                messageId: messageId,
                success: result.success,
                error: result.error || null
            }, '*');
        } catch (err) {
            event.source.postMessage({
                type: 'uploadFileResult',
                messageId: messageId,
                success: false,
                error: err.message
            }, '*');
        }
    }
});
