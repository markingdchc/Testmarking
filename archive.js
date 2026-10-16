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
						<div class="header-actions">
							<button class="btn-header" style="background: #e67e22;" onclick="window.archiveOpener.syncArchive(window)">🔄 مزامنة</button>
							<button class="btn-header btn-refresh" onclick="window.refreshArchiveContent()">🔄 تحديث</button>
							<button class="btn-header btn-close" onclick="window.close()">✖ إغلاق</button>
						</div>
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
                    let fileName = filePath.split('/').pop();
                    
                    if (!confirm('هل أنت متأكد من حذف:\\n' + fileName + '؟')) return;
                    
                    let results = {
                        local: { success: false, error: null },
                        github: { success: false, error: null }
                    };
                    
                    // ============================================================
                    // 1️⃣ حذف من الخادم المحلي — دائماً
                    // ============================================================
                    console.log('🖥️ [1/2] حذف من المحلي:', fileName);
                    try {
                        let localResult = await window.archiveOpener.deleteFromLocalServer(folderName, fileName);
                        if (localResult.success) {
                            results.local.success = true;
                            console.log('✅ [المحلي] تم الحذف');
                        } else {
                            results.local.error = localResult.error;
                            console.warn('⚠️ [المحلي] فشل:', localResult.error);
                        }
                    } catch (e) {
                        results.local.error = e.message;
                        console.warn('⚠️ [المحلي] استثناء:', e.message);
                    }
                    
                    // ============================================================
                    // 2️⃣ حذف من GitHub
                    // ============================================================
                    const token = localStorage.getItem('github_token');
                    if (token) {
                        console.log('☁️ [2/2] حذف من GitHub:', fileName);
                        try {
                            let shaToUse = sha;
                            
                            // 🆕 إذا لم يوجد sha → اجلبه من GitHub
                            if (!shaToUse) {
                                console.log('🔍 لا يوجد SHA، جاري البحث...');
                                const checkUrl = 'https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/' + filePath + '?ref=${GH_BRANCH}';
                                const checkResp = await fetch(checkUrl, {
                                    headers: {
                                        'Authorization': 'Bearer ' + token,
                                        'Accept': 'application/vnd.github+json'
                                    }
                                });
                                if (checkResp.ok) {
                                    const data = await checkResp.json();
                                    shaToUse = data.sha;
                                    console.log('✅ تم جلب SHA:', shaToUse);
                                } else {
                                    results.github.error = 'الملف غير موجود على GitHub';
                                    console.log('⏭️ الملف غير موجود على GitHub');
                                }
                            }
                            
                            if (shaToUse) {
                                const apiUrl = 'https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/' + filePath;
                                const resp = await fetch(apiUrl, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': 'Bearer ' + token,
                                        'Accept': 'application/vnd.github+json',
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        message: 'Delete ' + fileName,
                                        sha: shaToUse,
                                        branch: '${GH_BRANCH}'
                                    })
                                });
                                
                                if (resp.ok) {
                                    results.github.success = true;
                                    console.log('✅ [GitHub] تم الحذف');
                                } else {
                                    const err = await resp.json();
                                    results.github.error = err.message;
                                    console.warn('⚠️ [GitHub] فشل:', err.message);
                                }
                            }
                        } catch (e) {
                            results.github.error = e.message;
                            console.warn('⚠️ [GitHub] استثناء:', e.message);
                        }
                    } else {
                        results.github.error = 'لا يوجد Token';
                    }
                    
                    // ============================================================
                    // 3️⃣ النتيجة النهائية
                    // ============================================================
                    let messages = [];
                    
                    if (results.local.success) {
                        messages.push('✅ المحلي (NAS)');
                    } else {
                        messages.push('❌ المحلي: ' + (results.local.error || 'فشل'));
                    }
                    
                    if (results.github.success) {
                        messages.push('✅ السحابي (GitHub)');
                    } else {
                        messages.push('❌ السحابي: ' + (results.github.error || 'فشل'));
                    }
                    
                    if (results.local.success || results.github.success) {
                        alert('✅ تم الحذف:\\n\\n' + messages.join('\\n'));
                        await window.refreshArchiveContent();
                    } else {
                        alert('❌ فشل الحذف:\\n\\n' + messages.join('\\n'));
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
                        
                        // فلترة الملفات
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
                        
                        // ============================================================
                        // 🆕 إنشاء Modal احترافي للرفع
                        // ============================================================
                        let modal = document.getElementById('uploadModal');
                        if (modal) modal.remove();
                        
                        modal = document.createElement('div');
                        modal.id = 'uploadModal';
                        modal.style.cssText = `
                            position: fixed;
                            inset: 0;
                            background: rgba(0,0,0,0.85);
                            z-index: 99999;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 20px;
                            direction: rtl;
                        `;
                        
                        let totalSize = validFiles.reduce((s, f) => s + f.size, 0);
                        
                        modal.innerHTML = `
                            <div style="background: white; border-radius: 16px; width: 95%; max-width: 850px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                                <div style="background: #8b5cf6; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                                    <h2 style="margin: 0; font-size: 18px;">📤 رفع المستندات</h2>
                                    <button id="uploadCloseBtn" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 13px;">✖ إغلاق</button>
                                </div>
                                <div style="padding: 20px; overflow-y: auto; flex: 1;">
                                    
                                    <!-- الحالة -->
                                    <div id="uploadStatus" style="padding: 12px 15px; border-radius: 10px; margin-bottom: 15px; font-size: 14px; background: #e7f3ff; color: #004085; font-weight: bold;">
                                        ⏳ جاري التحضير...
                                    </div>
                                    
                                    <!-- شريط التقدم الرئيسي -->
                                    <div style="background: #e9ecef; border-radius: 10px; overflow: hidden; height: 30px; margin-bottom: 15px; position: relative;">
                                        <div id="uploadProgressBar" style="height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); transition: width 0.3s; width: 0%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;"></div>
                                        <div id="uploadProgressText" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; color: #0a3d62;">0%</div>
                                    </div>
                                    
                                    <!-- الإحصائيات الحية -->
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 15px;">
                                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 11px; color: #6c757d;">📊 الملفات</div>
                                            <div id="uploadFileCounter" style="font-size: 16px; font-weight: bold; color: #0a3d62;">0 / ${validFiles.length}</div>
                                        </div>
                                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 11px; color: #6c757d;">⏱️ الوقت المنقضي</div>
                                            <div id="uploadElapsed" style="font-size: 16px; font-weight: bold; color: #0a3d62;">00:00</div>
                                        </div>
                                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 11px; color: #6c757d;">⏳ الوقت المتبقي</div>
                                            <div id="uploadRemaining" style="font-size: 16px; font-weight: bold; color: #e67e22;">--:--</div>
                                        </div>
                                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 11px; color: #6c757d;">⚡ السرعة</div>
                                            <div id="uploadSpeed" style="font-size: 16px; font-weight: bold; color: #28a745;">0 KB/s</div>
                                        </div>
                                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 11px; color: #6c757d;">📊 متوسط السرعة</div>
                                            <div id="uploadAvgSpeed" style="font-size: 16px; font-weight: bold; color: #17a2b8;">0 KB/s</div>
                                        </div>
                                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 11px; color: #6c757d;">📦 الحجم الكلي</div>
                                            <div id="uploadTotalSize" style="font-size: 16px; font-weight: bold; color: #0a3d62;">${formatFileSize(totalSize)}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- الملف الحالي -->
                                    <div id="uploadCurrentFile" style="background: #f3e5ff; padding: 12px; border-radius: 8px; margin-bottom: 15px; border-right: 4px solid #8b5cf6;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                            <span style="font-weight: bold; color: #6b21a8;">📄 <span id="currentUploadFileName">—</span></span>
                                            <span id="currentUploadFileSize" style="color: #6b21a8; font-size: 12px; font-weight: bold;">—</span>
                                        </div>
                                        <div style="background: #fff; border-radius: 5px; overflow: hidden; height: 12px;">
                                            <div id="currentUploadFileProgress" style="height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); transition: width 0.2s; width: 0%;"></div>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 11px; color: #6b21a8;">
                                            <span id="currentUploadFileStatus">—</span>
                                            <span id="currentUploadFileStage">—</span>
                                        </div>
                                    </div>
                                    
                                    <!-- السجل -->
                                    <div id="uploadLog" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 11px; direction: ltr; text-align: left;"></div>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        
                        // ============================================================
                        // دوال مساعدة
                        // ============================================================
                        let startTime = Date.now();
                        let currentFileStartTime = 0;
                        let lastSpeedUpdate = Date.now();
                        let lastBytesSnapshot = 0;
                        let speedHistory = [];
                        let transferredBytes = 0;
                        let currentFileIndex = 0;
                        
                        function formatTime(seconds) {
                            if (!isFinite(seconds) || seconds < 0) return '--:--';
                            let h = Math.floor(seconds / 3600);
                            let m = Math.floor((seconds % 3600) / 60);
                            let s = Math.floor(seconds % 60);
                            if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                            return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                        }
                        
                        function formatSpeed(bytesPerSec) {
                            if (!isFinite(bytesPerSec) || bytesPerSec <= 0) return '0 KB/s';
                            if (bytesPerSec < 1024) return bytesPerSec.toFixed(0) + ' B/s';
                            if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
                            return (bytesPerSec / (1024 * 1024)).toFixed(2) + ' MB/s';
                        }
                        
                        function uploadLog(msg, type = 'info') {
                            let log = document.getElementById('uploadLog');
                            if (!log) return;
                            let entry = document.createElement('div');
                            entry.style.cssText = 'padding: 2px 0; ' + 
                                (type === 'success' ? 'color: #28a745;' : 
                                 type === 'error' ? 'color: #dc3545;' : 
                                 type === 'warning' ? 'color: #e67e22;' : 
                                 'color: #17a2b8;');
                            let time = new Date().toLocaleTimeString('ar-EG');
                            entry.textContent = '[' + time + '] ' + msg;
                            log.appendChild(entry);
                            log.scrollTop = log.scrollHeight;
                        }
                        
                        function uploadStatus(msg, type = 'info') {
                            let st = document.getElementById('uploadStatus');
                            if (!st) return;
                            let colors = {
                                info: 'background: #e7f3ff; color: #004085;',
                                success: 'background: #d4edda; color: #155724;',
                                warning: 'background: #fff3cd; color: #856404;',
                                error: 'background: #f8d7da; color: #721c24;'
                            };
                            st.style.cssText = 'padding: 12px 15px; border-radius: 10px; margin-bottom: 15px; font-size: 14px; font-weight: bold; ' + (colors[type] || colors.info);
                            st.textContent = msg;
                        }
                        
                        function uploadProgress(pct, text) {
                            let bar = document.getElementById('uploadProgressBar');
                            let txt = document.getElementById('uploadProgressText');
                            if (bar) bar.style.width = pct + '%';
                            if (txt) txt.textContent = text || (pct + '%');
                        }
                        
                        function updateCurrentFile(fileName, fileSize, index, total) {
                            document.getElementById('currentUploadFileName').textContent = fileName;
                            document.getElementById('currentUploadFileSize').textContent = formatFileSize(fileSize);
                            document.getElementById('currentUploadFileProgress').style.width = '0%';
                            document.getElementById('currentUploadFileStatus').textContent = `📄 ${index} / ${total}`;
                            document.getElementById('currentUploadFileStage').textContent = '⏳ جاري القراءة...';
                            
                            currentFileStartTime = Date.now();
                        }
                        
                        function updateCurrentFileStage(stage, pct = null) {
                            document.getElementById('currentUploadFileStage').textContent = stage;
                            if (pct !== null) {
                                document.getElementById('currentUploadFileProgress').style.width = pct + '%';
                            }
                        }
                        
                        // مؤقت التحديث
                        let timerInterval = setInterval(() => {
                            let elapsed = (Date.now() - startTime) / 1000;
                            let elapsedEl = document.getElementById('uploadElapsed');
                            if (elapsedEl) elapsedEl.textContent = formatTime(elapsed);
                            
                            // الوقت المتبقي
                            if (transferredBytes > 0 && totalSize > 0) {
                                let rate = transferredBytes / elapsed;
                                let remaining = (totalSize - transferredBytes) / rate;
                                let remainingEl = document.getElementById('uploadRemaining');
                                if (remainingEl) remainingEl.textContent = formatTime(remaining);
                            }
                            
                            // السرعة
                            let now = Date.now();
                            if (now - lastSpeedUpdate >= 1000) {
                                let timeDiff = (now - lastSpeedUpdate) / 1000;
                                let bytesDiff = transferredBytes - lastBytesSnapshot;
                                let currentSpeed = bytesDiff / timeDiff;
                                
                                if (currentSpeed > 0) {
                                    speedHistory.push(currentSpeed);
                                    if (speedHistory.length > 10) speedHistory.shift();
                                }
                                
                                let avgSpeed = speedHistory.length > 0 
                                    ? speedHistory.reduce((a,b) => a+b, 0) / speedHistory.length 
                                    : 0;
                                
                                let speedEl = document.getElementById('uploadSpeed');
                                let avgEl = document.getElementById('uploadAvgSpeed');
                                if (speedEl) speedEl.textContent = formatSpeed(currentSpeed);
                                if (avgEl) avgEl.textContent = formatSpeed(avgSpeed);
                                
                                lastSpeedUpdate = now;
                                lastBytesSnapshot = transferredBytes;
                            }
                        }, 500);
                        
                        document.getElementById('uploadCloseBtn').onclick = () => {
                            if (confirm('هل تريد إلغاء الرفع؟')) {
                                clearInterval(timerInterval);
                                modal.remove();
                            }
                        };
                        
                        // ============================================================
                        // 🚀 بدء الرفع
                        // ============================================================
                        uploadStatus(`📤 رفع ${validFiles.length} ملف (${formatFileSize(totalSize)})...`);
                        uploadLog(`🚀 بدء رفع ${validFiles.length} ملف`, 'info');
                        uploadLog(`📦 الحجم الكلي: ${formatFileSize(totalSize)}`, 'info');
                        
                        let successCount = 0;
                        let failCount = 0;
                        let errorMessages = [];
                        
                        for (let i = 0; i < validFiles.length; i++) {
                            let file = validFiles[i];
                            currentFileIndex = i + 1;
                            
                            // عرض معلومات الملف الحالي
                            updateCurrentFile(file.name, file.size, i + 1, validFiles.length);
                            
                            // تحديث العداد
                            document.getElementById('uploadFileCounter').textContent = `${i} / ${validFiles.length}`;
                            
                            uploadLog(`📄 [${i+1}/${validFiles.length}] ${file.name} (${formatFileSize(file.size)})`, 'warning');
                            updateCurrentFileStage('📖 قراءة الملف...', 10);
                            
                            try {
                                // 1️⃣ قراءة الملف كـ base64
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
                                
                                updateCurrentFileStage('📖 تم القراءة', 30);
                                transferredBytes += file.size * 0.3;  // 30% للقراءة
                                
                                // 2️⃣ رفع إلى المحلي + GitHub عبر postMessage
                                updateCurrentFileStage('🖥️ رفع إلى المحلي...', 40);
                                
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
                                    
                                    // تحديث وهمي للتقدم (لأننا لا نعرف الحالة الحقيقية)
                                    let fakeProgress = 40;
                                    let fakeInterval = setInterval(() => {
                                        fakeProgress += 5;
                                        if (fakeProgress > 90) fakeProgress = 90;
                                        updateCurrentFileStage('☁️ رفع إلى GitHub...', fakeProgress);
                                        transferredBytes = (currentFileIndex - 1) * (totalSize / validFiles.length) + (file.size * fakeProgress / 100);
                                    }, 500);
                                    
                                    setTimeout(() => {
                                        clearInterval(fakeInterval);
                                        window.removeEventListener('message', handler);
                                        reject(new Error('انتهت المهلة (60 ثانية)'));
                                    }, 60000);
                                    
                                    // حفظ الـ interval للإلغاء عند النجاح
                                    handler.fakeInterval = fakeInterval;
                                });
                                
                                updateCurrentFileStage('✅ تم الرفع', 100);
                                transferredBytes = currentFileIndex * (totalSize / validFiles.length);
                                
                                if (result.success) {
                                    successCount++;
                                    uploadLog(`  ✅ تم بنجاح`, 'success');
                                } else {
                                    failCount++;
                                    errorMessages.push(file.name + ': ' + (result.error || 'فشل'));
                                    uploadLog(`  ❌ فشل: ${result.error}`, 'error');
                                }
                                
                            } catch (err) {
                                failCount++;
                                errorMessages.push(file.name + ': ' + err.message);
                                uploadLog(`  ❌ خطأ: ${err.message}`, 'error');
                                updateCurrentFileStage('❌ فشل', 100);
                            }
                            
                            // تحديث الشريط الرئيسي
                            let progress = Math.round(((i + 1) / validFiles.length) * 100);
                            uploadProgress(progress);
                            document.getElementById('uploadFileCounter').textContent = `${i + 1} / ${validFiles.length}`;
                            
                            // إيقاف مؤقت بسيط
                            await new Promise(r => setTimeout(r, 200));
                        }
                        
                        // ============================================================
                        // النتيجة النهائية
                        // ============================================================
                        clearInterval(timerInterval);
                        
                        let totalElapsed = (Date.now() - startTime) / 1000;
                        let avgSpeed = totalSize / totalElapsed;
                        
                        if (failCount === 0) {
                            uploadStatus(`🎉 تم رفع ${successCount} ملف بنجاح في ${formatTime(totalElapsed)}`, 'success');
                        } else {
                            uploadStatus(`⚠️ نجح: ${successCount}، فشل: ${failCount}`, 'warning');
                        }
                        
                        uploadLog("═══════════════════════════", 'info');
                        uploadLog(`⏱️ الوقت: ${formatTime(totalElapsed)}`, 'info');
                        uploadLog(`⚡ متوسط السرعة: ${formatSpeed(avgSpeed)}`, 'info');
                        uploadLog(`✅ نجح: ${successCount}`, 'success');
                        uploadLog(`❌ فشل: ${failCount}`, failCount > 0 ? 'error' : 'info');
                        
                        document.getElementById('uploadFileCounter').textContent = `${validFiles.length} / ${validFiles.length}`;
                        
                        // تحديث الأرشيف بعد 2 ثانية
                        setTimeout(async () => {
                            if (modal.parentNode) modal.remove();
                            alert(`✅ تم الرفع بنجاح: ${successCount} ملف${failCount > 0 ? '\\n❌ فشل: ' + failCount : ''}`);
                            await window.refreshArchiveContent();
                        }, 2000);
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
async function loadArchiveFolders() {
    console.log("📂 تحميل الأرشيف من جميع المصادر...");
    
    let localFolders = [];
    let githubFolders = [];
    
    // ============================================================
    // 1️⃣ من الخادم المحلي
    // ============================================================
    if (typeof _localServerAvailable !== 'undefined' && _localServerAvailable) {
        try {
            let result = await loadLocalArchiveFolders();
            if (result && result.length > 0) {
                localFolders = result;
                console.log(`📂 [المحلي] ${localFolders.length} مجلد`);
            } else {
                console.log("📂 [المحلي] فارغ");
            }
        } catch (e) {
            console.warn("⚠️ [المحلي] فشل:", e.message);
        }
    } else {
        console.log("⏭️ [المحلي] غير متاح");
    }
    
    // ============================================================
    // 2️⃣ من GitHub (دائماً — حتى لو نجح المحلي)
    // ============================================================
    const token = localStorage.getItem("github_token");
    if (token) {
        try {
            githubFolders = await loadGitHubArchiveFolders(token);
            console.log(`☁️ [GitHub] ${githubFolders.length} مجلد`);
        } catch (e) {
            console.warn("⚠️ [GitHub] فشل:", e.message);
        }
    } else {
        console.log("⏭️ [GitHub] لا يوجد Token");
    }
    
    // ============================================================
    // 3️⃣ دمج النتائج
    // ============================================================
    let merged = mergeArchiveFolders(localFolders, githubFolders);
    console.log(`🎉 [الأرشيف] ${merged.length} مجلد بعد الدمج`);
    
    // فلترة حسب الصلاحيات
    let user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user && user.role !== 'admin' && !user.lineIds.includes('*')) {
        merged = merged.filter(f => {
            let parts = f.name.split('_');
            if (parts.length >= 2) {
                let line = parts[parts.length - 2];
                return user.lineIds.includes(line);
            }
            return true;
        });
    }
    
    return merged;
}

// ============================================================
// 📥 تحميل الأرشيف من GitHub
// ============================================================
async function loadGitHubArchiveFolders(token) {
    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${ARCHIVE_FOLDER}?ref=${GH_BRANCH}`;
    
    const headers = { "Accept": "application/vnd.github+json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const response = await fetch(apiUrl, { headers });
    
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const contents = await response.json();
    let folders = contents.filter(item => item.type === "dir");
    
    let result = [];
    for (let folder of folders) {
        try {
            let folderFiles = await fetchFolderContents(folder.path, token);
            result.push({
                name: folder.name,
                path: `archive/${folder.name}`,
                files: folderFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    path: f.path,
                    download_url: f.download_url,
                    sha: f.sha,
                    modified: f.modified
                })),
                filesCount: folderFiles.length,
                sha: folder.sha,
                source: 'github'
            });
        } catch (e) {
            result.push({
                name: folder.name,
                path: `archive/${folder.name}`,
                files: [],
                filesCount: 0,
                sha: folder.sha,
                source: 'github'
            });
        }
    }
    
    return result;
}

// ============================================================
// 🔄 دمج المجلدات من المصدرين
// ============================================================
function mergeArchiveFolders(localFolders, githubFolders) {
    let mergedMap = new Map();
    
    // 1️⃣ GitHub أولاً
    for (let folder of githubFolders) {
        mergedMap.set(folder.name, {
            name: folder.name,
            path: folder.path,
            files: [...folder.files].map(f => ({ ...f, source: 'github' })),
            filesCount: folder.filesCount,
            sha: folder.sha,
            source: 'github'
        });
    }
    
    // 2️⃣ المحلي (يدمج أو يضيف)
    for (let folder of localFolders) {
        if (mergedMap.has(folder.name)) {
            let existing = mergedMap.get(folder.name);
            let existingFileNames = new Set(existing.files.map(f => f.name));
            
            for (let localFile of folder.files) {
                if (!existingFileNames.has(localFile.name)) {
                    existing.files.push({ ...localFile, source: 'local' });
                } else {
                    // موجود في الاثنين — فضّل المحلي (أسرع)
                    let idx = existing.files.findIndex(f => f.name === localFile.name);
                    if (idx !== -1) {
                        existing.files[idx] = { ...existing.files[idx], source: 'both' };
                    }
                }
            }
            existing.filesCount = existing.files.length;
        } else {
            mergedMap.set(folder.name, {
                name: folder.name,
                path: folder.path,
                files: folder.files.map(f => ({ ...f, source: 'local' })),
                filesCount: folder.filesCount,
                sha: folder.sha,
                source: 'local'
            });
        }
    }
    
    let merged = Array.from(mergedMap.values());
    merged.sort((a, b) => b.name.localeCompare(a.name));
    return merged;
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
// ============================================================
// 📤 رفع ملف واحد كـ base64 (المحلي + GitHub معاً)
// ============================================================
async function uploadBase64ToArchive(folderName, fileName, base64Data) {
    let cleanName = fileName.replace(/[^\w\u0600-\u06FF.\-]/g, '_');
    const filePath = `${ARCHIVE_FOLDER}/${folderName}/${cleanName}`;
    
    let result = {
        success: false,
        local: { success: false, path: null, error: null },
        github: { success: false, path: null, error: null }
    };
    
    // ============================================================
    // 1️⃣ رفع إلى الخادم المحلي (NAS) — دائماً
    // ============================================================
    if (typeof _localServerAvailable !== 'undefined' && _localServerAvailable) {
        console.log("🖥️ [1/2] رفع إلى الخادم المحلي:", cleanName);
        try {
            let localResult = await uploadToLocalServer(folderName, cleanName, base64Data);
            if (localResult.success) {
                result.local.success = true;
                result.local.path = localResult.path;
                console.log(`✅ [المحلي] تم: ${localResult.path}`);
            } else {
                result.local.error = localResult.error;
                console.warn(`⚠️ [المحلي] فشل: ${localResult.error}`);
            }
        } catch (e) {
            result.local.error = e.message;
            console.warn(`⚠️ [المحلي] استثناء: ${e.message}`);
        }
    } else {
        console.log("⏭️ [المحلي] الخادم المحلي غير متاح");
        result.local.error = 'الخادم المحلي غير متاح';
    }
    
    // ============================================================
    // 2️⃣ رفع إلى GitHub — دائماً (نسخة احتياطية)
    // ============================================================
    const token = localStorage.getItem("github_token");
    if (token) {
        console.log("☁️ [2/2] رفع إلى GitHub:", cleanName);
        try {
            const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}`;
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
            
            if (resp.ok) {
                result.github.success = true;
                result.github.path = filePath;
                console.log(`✅ [GitHub] تم: ${filePath}`);
                
                // تحديث _info.json
                await updateArchiveInfo(folderName, {});
            } else {
                const err = await resp.json();
                result.github.error = err.message;
                console.warn(`⚠️ [GitHub] فشل: ${err.message}`);
            }
        } catch (e) {
            result.github.error = e.message;
            console.warn(`⚠️ [GitHub] استثناء: ${e.message}`);
        }
    } else {
        console.log("⏭️ [GitHub] لا يوجد Token");
        result.github.error = 'لا يوجد Token';
    }
    
    // ============================================================
    // 3️⃣ النتيجة النهائية
    // ============================================================
    result.success = result.local.success || result.github.success;
    
    if (result.local.success && result.github.success) {
        console.log("🎉 [رفع] تم النسخ إلى المحلي + GitHub ✅✅");
    } else if (result.local.success) {
        console.log("✅ [رفع] تم النسخ إلى المحلي فقط");
    } else if (result.github.success) {
        console.log("✅ [رفع] تم النسخ إلى GitHub فقط");
    } else {
        console.log("❌ [رفع] فشل في كلا المكانين");
    }
    
    // للتوافق مع الكود القديم (يرجع path)
    result.path = result.local.path || result.github.path;
    
    return result;
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
            
            // 🆕 جمع رسائل الأخطاء من كل من المحلي و GitHub
            let errorMsg = null;
            if (!result.success) {
                let errors = [];
                if (!result.local.success && result.local.error) {
                    errors.push('المحلي: ' + result.local.error);
                }
                if (!result.github.success && result.github.error) {
                    errors.push('GitHub: ' + result.github.error);
                }
                errorMsg = errors.join(' | ') || 'فشل الرفع';
            }
            
            event.source.postMessage({
                type: 'uploadFileResult',
                messageId: messageId,
                success: result.success,
                error: errorMsg
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



// ============================================================
// 🔄 مزامنة الأرشيف — نسخة احترافية مع سرعة وشريط تقدم
// ============================================================
window.syncArchive = async function(targetWindow) {
    const win = targetWindow || window;
    const doc = win.document;
    
    console.log("🔄 بدء المزامنة الكاملة...");
    
    const token = localStorage.getItem("github_token");
    if (!token) {
        alert("❌ لا يوجد GitHub Token");
        return;
    }
    
    // ============================================================
    // 🆕 إنشاء Modal
    // ============================================================
    let modal = doc.getElementById('syncModal');
    if (modal) modal.remove();
    
    modal = doc.createElement('div');
    modal.id = 'syncModal';
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.85);
        z-index: 99999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        direction: rtl;
    `;
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; width: 95%; max-width: 900px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            <div style="background: #0a3d62; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 18px;">🔄 مزامنة الأرشيف</h2>
                <button id="syncCloseBtn" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 13px;">✖ إغلاق</button>
            </div>
            <div style="padding: 20px; overflow-y: auto; flex: 1;">
                
                <!-- الحالة -->
                <div id="syncStatus" style="padding: 12px 15px; border-radius: 10px; margin-bottom: 15px; font-size: 14px; background: #e7f3ff; color: #004085; font-weight: bold;">
                    ⏳ جاري الفحص...
                </div>
                
                <!-- شريط التقدم الرئيسي -->
                <div style="background: #e9ecef; border-radius: 10px; overflow: hidden; height: 30px; margin-bottom: 10px; position: relative;">
                    <div id="syncProgressBar" style="height: 100%; background: linear-gradient(90deg, #0a3d62, #17a2b8); transition: width 0.3s; width: 0%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;"></div>
                    <div id="syncProgressText" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: #0a3d62; mix-blend-mode: difference;">0%</div>
                </div>
                
                <!-- الإحصائيات -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 11px; color: #6c757d;">⏱️ الوقت المنقضي</div>
                        <div id="syncElapsed" style="font-size: 16px; font-weight: bold; color: #0a3d62;">00:00</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 11px; color: #6c757d;">⏳ الوقت المتبقي</div>
                        <div id="syncRemaining" style="font-size: 16px; font-weight: bold; color: #e67e22;">--:--</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 11px; color: #6c757d;">⚡ السرعة الحالية</div>
                        <div id="syncSpeed" style="font-size: 16px; font-weight: bold; color: #28a745;">0 KB/s</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 11px; color: #6c757d;">📊 متوسط السرعة</div>
                        <div id="syncAvgSpeed" style="font-size: 16px; font-weight: bold; color: #17a2b8;">0 KB/s</div>
                    </div>
                </div>
                
                <!-- الملف الحالي -->
                <div id="syncCurrentFile" style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: bold; color: #856404;">📄 <span id="currentFileName">—</span></span>
                        <span id="currentFileSize" style="color: #856404; font-size: 12px;">—</span>
                    </div>
                    <div style="background: #fff; border-radius: 5px; overflow: hidden; height: 12px;">
                        <div id="currentFileProgress" style="height: 100%; background: linear-gradient(90deg, #e67e22, #f39c12); transition: width 0.2s; width: 0%;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 11px; color: #856404;">
                        <span id="currentFileStatus">—</span>
                        <span id="currentFileSpeed">0 KB/s</span>
                    </div>
                </div>
                
                <!-- ملخص -->
                <div id="syncSummary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 15px;"></div>
                
                <!-- السجل -->
                <div id="syncLog" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 11px; direction: ltr; text-align: left;"></div>
            </div>
        </div>
    `;
    doc.body.appendChild(modal);
    
    doc.getElementById('syncCloseBtn').onclick = function() {
        if (window._syncAbortController) {
            window._syncAbortController.abort();
        }
        modal.remove();
    };
    
    // ============================================================
    // 🆕 دوال مساعدة
    // ============================================================
    let startTime = Date.now();
    let totalBytes = 0;
    let transferredBytes = 0;
    let currentFileStartTime = 0;
    let currentFileLoaded = 0;
    let currentFileTotal = 0;
    let lastSpeedUpdate = Date.now();
    let lastBytesSnapshot = 0;
    let speedHistory = [];
    
    window._syncAbortController = new AbortController();
    
    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '--:--';
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    
    function formatSpeed(bytesPerSec) {
        if (!isFinite(bytesPerSec) || bytesPerSec <= 0) return '0 KB/s';
        if (bytesPerSec < 1024) return bytesPerSec.toFixed(0) + ' B/s';
        if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
        return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
    }
    
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    function syncLog(msg, type = 'info') {
        let log = doc.getElementById('syncLog');
        if (!log) return;
        let entry = doc.createElement('div');
        entry.style.cssText = 'padding: 2px 0; ' + 
            (type === 'success' ? 'color: #28a745;' : 
             type === 'error' ? 'color: #dc3545;' : 
             type === 'warning' ? 'color: #e67e22;' : 
             'color: #17a2b8;');
        let time = new Date().toLocaleTimeString('ar-EG');
        entry.textContent = '[' + time + '] ' + msg;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }
    
    function syncStatus(msg, type = 'info') {
        let st = doc.getElementById('syncStatus');
        if (!st) return;
        let colors = {
            info: 'background: #e7f3ff; color: #004085;',
            success: 'background: #d4edda; color: #155724;',
            warning: 'background: #fff3cd; color: #856404;',
            error: 'background: #f8d7da; color: #721c24;'
        };
        st.style.cssText = 'padding: 12px 15px; border-radius: 10px; margin-bottom: 15px; font-size: 14px; font-weight: bold; ' + (colors[type] || colors.info);
        st.textContent = msg;
    }
    
    function syncProgress(pct, text) {
        let bar = doc.getElementById('syncProgressBar');
        let txt = doc.getElementById('syncProgressText');
        if (bar) bar.style.width = pct + '%';
        if (txt) txt.textContent = text || (pct + '%');
    }
    
    function syncSummary(items) {
        let html = '';
        for (let item of items) {
            html += '<div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">' +
                '<div style="font-size: 20px; font-weight: bold; color: ' + (item.color || '#0a3d62') + ';">' + item.num + '</div>' +
                '<div style="font-size: 11px; color: #6c757d;">' + item.lbl + '</div></div>';
        }
        doc.getElementById('syncSummary').innerHTML = html;
    }
    
    function updateTimer() {
        let elapsed = (Date.now() - startTime) / 1000;
        let elapsedEl = doc.getElementById('syncElapsed');
        if (elapsedEl) elapsedEl.textContent = formatTime(elapsed);
        
        // حساب الوقت المتبقي
        if (transferredBytes > 0 && totalBytes > 0) {
            let rate = transferredBytes / elapsed;
            let remainingBytes = totalBytes - transferredBytes;
            let remaining = remainingBytes / rate;
            let remainingEl = doc.getElementById('syncRemaining');
            if (remainingEl) remainingEl.textContent = formatTime(remaining);
        }
        
        // حساب السرعة
        let now = Date.now();
        if (now - lastSpeedUpdate >= 1000) {
            let timeDiff = (now - lastSpeedUpdate) / 1000;
            let bytesDiff = transferredBytes - lastBytesSnapshot;
            let currentSpeed = bytesDiff / timeDiff;
            
            if (currentSpeed > 0) {
                speedHistory.push(currentSpeed);
                if (speedHistory.length > 10) speedHistory.shift();
            }
            
            let avgSpeed = speedHistory.length > 0 
                ? speedHistory.reduce((a,b) => a+b, 0) / speedHistory.length 
                : 0;
            
            let speedEl = doc.getElementById('syncSpeed');
            let avgEl = doc.getElementById('syncAvgSpeed');
            if (speedEl) speedEl.textContent = formatSpeed(currentSpeed);
            if (avgEl) avgEl.textContent = formatSpeed(avgSpeed);
            
            lastSpeedUpdate = now;
            lastBytesSnapshot = transferredBytes;
        }
    }
    
    let timerInterval = setInterval(updateTimer, 500);
    
    function showCurrentFile(fileName, fileSize) {
        let el = doc.getElementById('syncCurrentFile');
        if (!el) return;
        el.style.display = 'block';
        doc.getElementById('currentFileName').textContent = fileName;
        doc.getElementById('currentFileSize').textContent = formatBytes(fileSize);
        doc.getElementById('currentFileProgress').style.width = '0%';
        doc.getElementById('currentFileStatus').textContent = '0%';
        doc.getElementById('currentFileSpeed').textContent = '0 KB/s';
        
        currentFileStartTime = Date.now();
        currentFileLoaded = 0;
        currentFileTotal = fileSize;
    }
    
    function updateCurrentFile(loaded, total) {
        if (total <= 0) return;
        let pct = Math.round((loaded / total) * 100);
        let bar = doc.getElementById('currentFileProgress');
        let status = doc.getElementById('currentFileStatus');
        let speedEl = doc.getElementById('currentFileSpeed');
        
        if (bar) bar.style.width = pct + '%';
        if (status) status.textContent = pct + '% (' + formatBytes(loaded) + ' / ' + formatBytes(total) + ')';
        
        let elapsed = (Date.now() - currentFileStartTime) / 1000;
        if (elapsed > 0.5 && speedEl) {
            let speed = loaded / elapsed;
            speedEl.textContent = formatSpeed(speed);
        }
        
        // تحديث الإجمالي
        transferredBytes = (totalBytes - currentFileTotal) + loaded;
    }
    
    function hideCurrentFile() {
        let el = doc.getElementById('syncCurrentFile');
        if (el) el.style.display = 'none';
    }
    
    // ============================================================
    // 🆕 رفع ملف مع تتبع التقدم
    // ============================================================
    async function uploadWithProgress(url, options, fileName, fileSize) {
        showCurrentFile(fileName, fileSize);
        
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    updateCurrentFile(e.loaded, e.total);
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({ ok: true, status: xhr.status, json: () => JSON.parse(xhr.responseText) });
                } else {
                    resolve({ ok: false, status: xhr.status, json: () => JSON.parse(xhr.responseText || '{}') });
                }
            });
            
            xhr.addEventListener('error', () => reject(new Error('Network error')));
            xhr.addEventListener('abort', () => reject(new Error('Aborted')));
            
            xhr.open(options.method || 'GET', url);
            if (options.headers) {
                for (let key in options.headers) {
                    xhr.setRequestHeader(key, options.headers[key]);
                }
            }
            
            xhr.send(options.body || null);
        });
    }
    
    // ============================================================
    // 🆕 تنزيل ملف مع تتبع التقدم
    // ============================================================
    async function downloadWithProgress(url, fileName, expectedSize) {
        showCurrentFile(fileName, expectedSize);
        
        let response = await fetch(url);
        let contentLength = parseInt(response.headers.get('content-length')) || expectedSize;
        let reader = response.body.getReader();
        let chunks = [];
        let loaded = 0;
        
        currentFileTotal = contentLength;
        
        while (true) {
            let { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value);
            loaded += value.length;
            updateCurrentFile(loaded, contentLength);
        }
        
        // تجميع القطع
        let allChunks = new Uint8Array(loaded);
        let position = 0;
        for (let chunk of chunks) {
            allChunks.set(chunk, position);
            position += chunk.length;
        }
        
        return allChunks;
    }
    
    // ============================================================
    // 🚀 البدء
    // ============================================================
    try {
        syncStatus("⏳ جاري تحميل قائمة المحلي...");
        syncLog("📂 جلب قائمة المحلي...");
        
        let localFolders = await loadLocalArchiveFolders() || [];
        syncLog(`✅ المحلي: ${localFolders.length} مجلد`, 'success');
        syncProgress(10);
        
        syncStatus("⏳ جاري تحميل قائمة GitHub...");
        syncLog("☁️ جلب قائمة GitHub...");
        
        let githubFolders = await loadGitHubArchiveFolders(token);
        syncLog(`✅ GitHub: ${githubFolders.length} مجلد`, 'success');
        syncProgress(20);
        
        // بناء Maps
        let localMap = new Map();
        for (let folder of localFolders) {
            let filesMap = new Map();
            for (let file of folder.files) filesMap.set(file.name, file);
            localMap.set(folder.name, { folder, filesMap });
        }
        
        let githubMap = new Map();
        for (let folder of githubFolders) {
            let filesMap = new Map();
            for (let file of folder.files) filesMap.set(file.name, file);
            githubMap.set(folder.name, { folder, filesMap });
        }
        
        // حساب الفروقات
        let toDownload = [];
        let toUpload = [];
        
        for (let [folderName, githubData] of githubMap) {
            let localData = localMap.get(folderName);
            for (let [fileName, file] of githubData.filesMap) {
                if (!localData || !localData.filesMap.has(fileName)) {
                    toDownload.push({ folderName, fileName, file });
                }
            }
        }
        
        for (let [folderName, localData] of localMap) {
            let githubData = githubMap.get(folderName);
            for (let [fileName, file] of localData.filesMap) {
                if (!githubData || !githubData.filesMap.has(fileName)) {
                    toUpload.push({ folderName, fileName, file });
                }
            }
        }
        
        // حساب الحجم الإجمالي
        totalBytes = 0;
        for (let item of toUpload) totalBytes += item.file.size || 0;
        for (let item of toDownload) totalBytes += item.file.size || 0;
        
        syncSummary([
            { num: localFolders.length, lbl: 'مجلدات محلية', color: '#0a3d62' },
            { num: githubFolders.length, lbl: 'مجلدات GitHub', color: '#17a2b8' },
            { num: toUpload.length, lbl: '📤 رفع', color: '#28a745' },
            { num: toDownload.length, lbl: '📥 تنزيل', color: '#e67e22' }
        ]);
        
        syncLog(`📤 ملفات للرفع: ${toUpload.length} (${formatBytes(toUpload.reduce((s,i) => s + (i.file.size||0), 0))})`, 'warning');
        syncLog(`📥 ملفات للتنزيل: ${toDownload.length} (${formatBytes(toDownload.reduce((s,i) => s + (i.file.size||0), 0))})`, 'warning');
        syncProgress(25);
        
        if (toUpload.length === 0 && toDownload.length === 0) {
            syncStatus("✅ الأرشيف متزامن تماماً — لا توجد فروقات", 'success');
            syncLog("✅ لا توجد فروقات", 'success');
            clearInterval(timerInterval);
            return;
        }
        
        // تأكيد
        let confirmMsg = `🔄 المزامنة:\n\n`;
        confirmMsg += `📤 رفع: ${toUpload.length} ملف\n`;
        confirmMsg += `📥 تنزيل: ${toDownload.length} ملف\n`;
        confirmMsg += `📊 الحجم الكلي: ${formatBytes(totalBytes)}\n\n`;
        confirmMsg += `هل تريد المتابعة؟`;
        
        if (!win.confirm(confirmMsg)) {
            syncLog("⏹️ تم الإلغاء", 'error');
            syncStatus("⏹️ تم الإلغاء", 'error');
            clearInterval(timerInterval);
            return;
        }
        
        // ============================================================
        // رفع الملفات
        // ============================================================
        let uploadSuccess = 0, uploadFail = 0;
        
        if (toUpload.length > 0) {
            syncStatus(`📤 رفع ${toUpload.length} ملف إلى GitHub...`);
            
            for (let i = 0; i < toUpload.length; i++) {
                let { folderName, fileName, file } = toUpload[i];
                
                try {
                    syncLog(`📤 (${i+1}/${toUpload.length}) ${fileName}`, 'warning');
                    
                    // تحميل من المحلي
                    let arrayBuffer = await downloadWithProgress(file.download_url, fileName, file.size);
                    
                    let bytes = new Uint8Array(arrayBuffer);
                    let binary = '';
                    let chunkSize = 8192;
                    for (let j = 0; j < bytes.length; j += chunkSize) {
                        binary += String.fromCharCode.apply(null, bytes.subarray(j, j + chunkSize));
                    }
                    let base64Data = btoa(binary);
                    
                    // رفع لـ GitHub
                    let cleanName = fileName.replace(/[^\w\u0600-\u06FF.\-]/g, '_');
                    let apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/archive/${folderName}/${cleanName}`;
                    
                    let checkResp = await fetch(`${apiUrl}?ref=${GH_BRANCH}`, {
                        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json" }
                    });
                    let existingSha = null;
                    if (checkResp.ok) {
                        let d = await checkResp.json();
                        existingSha = d.sha;
                    }
                    
                    let body = {
                        message: `Sync: Upload ${cleanName}`,
                        content: base64Data,
                        branch: GH_BRANCH
                    };
                    if (existingSha) body.sha = existingSha;
                    
                    let uploadResp = await uploadWithProgress(apiUrl, {
                        method: 'PUT',
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Accept": "application/vnd.github+json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(body)
                    }, fileName, base64Data.length);
                    
                    if (uploadResp.ok) {
                        uploadSuccess++;
                        syncLog(`  ✅ تم الرفع`, 'success');
                    } else {
                        uploadFail++;
                        let err = await uploadResp.json();
                        syncLog(`  ❌ فشل: ${err.message}`, 'error');
                    }
                    
                } catch (e) {
                    if (e.message === 'Aborted') {
                        syncLog(`  ⏹️ تم الإلغاء`, 'error');
                        clearInterval(timerInterval);
                        return;
                    }
                    uploadFail++;
                    syncLog(`  ❌ ${e.message}`, 'error');
                }
                
                hideCurrentFile();
                let baseProgress = 25 + ((i + 1) / toUpload.length) * 35;
                syncProgress(Math.round(baseProgress));
            }
        }
        
        // ============================================================
        // تنزيل الملفات
        // ============================================================
        let downloadSuccess = 0, downloadFail = 0;
        
        if (toDownload.length > 0) {
            syncStatus(`📥 تنزيل ${toDownload.length} ملف من GitHub...`);
            
            for (let i = 0; i < toDownload.length; i++) {
                let { folderName, fileName, file } = toDownload[i];
                
                try {
                    syncLog(`📥 (${i+1}/${toDownload.length}) ${fileName}`, 'warning');
                    
                    let arrayBuffer = await downloadWithProgress(file.download_url, fileName, file.size);
                    
                    let bytes = new Uint8Array(arrayBuffer);
                    let binary = '';
                    let chunkSize = 8192;
                    for (let j = 0; j < bytes.length; j += chunkSize) {
                        binary += String.fromCharCode.apply(null, bytes.subarray(j, j + chunkSize));
                    }
                    let base64Data = btoa(binary);
                    
                    let result = await uploadToLocalServer(folderName, fileName, base64Data);
                    
                    if (result.success) {
                        downloadSuccess++;
                        syncLog(`  ✅ تم التنزيل`, 'success');
                    } else {
                        downloadFail++;
                        syncLog(`  ❌ ${result.error}`, 'error');
                    }
                    
                } catch (e) {
                    if (e.message === 'Aborted') {
                        syncLog(`  ⏹️ تم الإلغاء`, 'error');
                        clearInterval(timerInterval);
                        return;
                    }
                    downloadFail++;
                    syncLog(`  ❌ ${e.message}`, 'error');
                }
                
                hideCurrentFile();
                let baseProgress = 60 + ((i + 1) / toDownload.length) * 35;
                syncProgress(Math.round(baseProgress));
            }
        }
        
        // ============================================================
        // النتيجة
        // ============================================================
        clearInterval(timerInterval);
        syncProgress(100, '100% ✅');
        
        let totalSuccess = uploadSuccess + downloadSuccess;
        let totalFail = uploadFail + downloadFail;
        let totalElapsed = (Date.now() - startTime) / 1000;
        let avgSpeed = totalBytes > 0 ? totalBytes / totalElapsed : 0;
        
        if (totalFail === 0) {
            syncStatus(`🎉 اكتملت المزامنة بنجاح (${totalSuccess} ملف في ${formatTime(totalElapsed)})`, 'success');
        } else {
            syncStatus(`⚠️ اكتملت مع أخطاء: نجح ${totalSuccess}، فشل ${totalFail}`, 'warning');
        }
        
        syncSummary([
            { num: uploadSuccess, lbl: '✅ رُفع', color: '#28a745' },
            { num: downloadSuccess, lbl: '✅ نُزّل', color: '#17a2b8' },
            { num: uploadFail + downloadFail, lbl: '❌ فشل', color: '#dc3545' }
        ]);
        
        syncLog("═══════════════════════════", 'info');
        syncLog(`⏱️ الوقت: ${formatTime(totalElapsed)}`, 'info');
        syncLog(`📊 الحجم الكلي: ${formatBytes(totalBytes)}`, 'info');
        syncLog(`⚡ متوسط السرعة: ${formatSpeed(avgSpeed)}`, 'info');
        syncLog(`📤 رُفع: ${uploadSuccess} / ${toUpload.length}`, 'info');
        syncLog(`📥 نُزّل: ${downloadSuccess} / ${toDownload.length}`, 'info');
        syncLog(`❌ فشل: ${totalFail}`, 'info');
        
        // تحديث الوقت النهائي
        let remainingEl = doc.getElementById('syncRemaining');
        if (remainingEl) remainingEl.textContent = '00:00';
        
    } catch (error) {
        clearInterval(timerInterval);
        console.error("❌ خطأ في المزامنة:", error);
        syncStatus("❌ فشلت المزامنة: " + error.message, 'error');
        syncLog("❌ " + error.message, 'error');
    }
}; 