let currentData1 = [];
let currentData2 = [];
let currentData3 = [];
let currentData4 = [];
let currentData5 = [];
let currentData6 = [];
let containersMap = new Map();

let currentVesselName = "";

let trshpPeriods1 = JSON.parse(localStorage.getItem("trshpPeriodsTab1")) || [];
let exprtPeriods1 = JSON.parse(localStorage.getItem("exprtPeriodsTab1")) || [];
let excludeLines1 = JSON.parse(localStorage.getItem("excludeLines1")) || [];

let strgePeriods2 = JSON.parse(localStorage.getItem("strgePeriodsTab2")) || [];
let exprtPeriods2 = JSON.parse(localStorage.getItem("exprtPeriodsTab2")) || [];
let excludeLines2 = JSON.parse(localStorage.getItem("excludeLines2")) || [];

let nextIdTrshp1 = trshpPeriods1.length > 0 ? Math.max(...trshpPeriods1.map(p => p.id)) + 1 : 1;
let nextIdExprt1 = exprtPeriods1.length > 0 ? Math.max(...exprtPeriods1.map(p => p.id)) + 1 : 1;
let nextIdStrge2 = strgePeriods2.length > 0 ? Math.max(...strgePeriods2.map(p => p.id)) + 1 : 1;
let nextIdExprt2 = exprtPeriods2.length > 0 ? Math.max(...exprtPeriods2.map(p => p.id)) + 1 : 1;

let exprtOnlyPeriods3 = JSON.parse(localStorage.getItem("exprtOnlyPeriodsTab3")) || [];
let excludeLines3 = JSON.parse(localStorage.getItem("excludeLines3")) || [];
let nextIdExprtOnly3 = exprtOnlyPeriods3.length > 0 ? Math.max(...exprtOnlyPeriods3.map(p => p.id)) + 1 : 1;

let emptyStrgePeriods4 = JSON.parse(localStorage.getItem("emptyStrgePeriodsTab4")) || [];
let excludeLines4 = JSON.parse(localStorage.getItem("excludeLines4")) || [];
let nextIdEmptyStrge4 = emptyStrgePeriods4.length > 0 ? Math.max(...emptyStrgePeriods4.map(p => p.id)) + 1 : 1;

// إعدادات تبويب TRSHP فقط
let trshpOnlyPeriods5 = JSON.parse(localStorage.getItem("trshpOnlyPeriodsTab5")) || [];
let excludeLines5 = JSON.parse(localStorage.getItem("excludeLines5")) || [];
let nextIdTrshpOnly5 = trshpOnlyPeriods5.length > 0 ? Math.max(...trshpOnlyPeriods5.map(p => p.id)) + 1 : 1;


let strgePeriods6 = JSON.parse(localStorage.getItem("strgePeriodsTab6")) || [];
let exprtPeriods6 = JSON.parse(localStorage.getItem("exprtPeriodsTab6")) || [];
let excludeLines6 = JSON.parse(localStorage.getItem("excludeLines6")) || [];

let nextIdStrge6 = strgePeriods6.length > 0 ? Math.max(...strgePeriods6.map(p => p.id)) + 1 : 1;
let nextIdExprt6 = exprtPeriods6.length > 0 ? Math.max(...exprtPeriods6.map(p => p.id)) + 1 : 1;

let selectedColumnsTab6 = JSON.parse(localStorage.getItem("selectedColumns_tab6")) || [];

// ============================================================
// 🛡️ حماية من الرفع المتكرر
// ============================================================
let _isUploadingToGitHub = false;

// قائمة رئيسية موحدة للخطوط (مخزنة في LocalStorage)
// قائمة رئيسية موحدة للخطوط (تحديث تلقائي للقائمة الافتراضية)
let defaultLinesList = ["MSC", "ZIM", "ALP", "YML", "MSK", "CMA", "HLC", "COS", "COE", "ONE", "HMM", "KLN", "UAS", "ARK", "SJK", "HSD", "BMC", "LITC", "PLS", "MSL", "CSL", "OVP", "SID", "SLG", "WEC", "TCS", "TSM", "OOCL", "EMES", "MDK", "MKL", "VUX", "OWV", "NNS", "ARRC", "ADM", "HAI", "BWL", "LOT", "MED", "SLS", "VOL", "REL", "WSHI", "GFS", "UFS", "MGL", "MLN", "MOH", "GCS", "TAR", "HKL", "CSD", "HDS", "HSP", "TRK", "TRL", "CLH", "ESG", "ESL", "SIV", "SFT", "ROD"];
let savedList = localStorage.getItem("masterLinesList");
if (savedList) {
    masterLinesList = JSON.parse(savedList);
    // دمج الخطوط الجديدة مع القديمة (اختياري)
    defaultLinesList.forEach(line => {
        if (!masterLinesList.includes(line)) masterLinesList.push(line);
    });
    saveMasterLinesList();
} else {
    masterLinesList = defaultLinesList;
    saveMasterLinesList();
}

// ========== متغيرات التبويب 7 (IMPRT + FORWARD) ==========
let currentData7 = [];
let imprtForwardPeriods7 = JSON.parse(localStorage.getItem("imprtForwardPeriodsTab7")) || [];
let excludeLines7 = JSON.parse(localStorage.getItem("excludeLines7")) || [];
let nextIdImprtForward7 = imprtForwardPeriods7.length > 0 ? Math.max(...imprtForwardPeriods7.map(p => p.id)) + 1 : 1;


let currentData8 = [];
let storageFinaloutData = [];
// ========== تحميل الإعدادات تلقائياً من GitHub ==========
const SETTINGS_URL = 'https://raw.githubusercontent.com/revenudchc-boop/Storage_Reports/main/settings.json';

async function loadSettingsAutomatically() {
    try {
        console.log('🔄 جاري تحميل الإعدادات من GitHub...');
        const response = await fetch(SETTINGS_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const settings = await response.json();
        applySettings(settings);
        console.log('✅ تم تحميل الإعدادات بنجاح من GitHub');
        document.getElementById("footerMsg").innerHTML = '✅ تم تحميل الإعدادات من GitHub تلقائياً';
        
    } catch (error) {
        console.warn('⚠️ فشل تحميل الإعدادات من GitHub، سيتم استخدام الإعدادات المحفوظة محلياً:', error.message);
        document.getElementById("footerMsg").innerHTML = '⚠️ فشل تحميل الإعدادات من GitHub، يتم استخدام الإعدادات المحفوظة محلياً';
    }
}

function applySettings(settings) {
	    console.log('🔄 تطبيق الإعدادات:', settings); // ← أضف هذا للتشخيص

    // قائمة الخطوط الرئيسية
    if (settings.masterLinesList) {
        masterLinesList = settings.masterLinesList;
        saveMasterLinesList();
        updateAllLineSelects();
    }
    
    // تبويب 1
    if (settings.trshpPeriodsTab1) {
        trshpPeriods1 = settings.trshpPeriodsTab1;
        localStorage.setItem("trshpPeriodsTab1", JSON.stringify(trshpPeriods1));
    }
    if (settings.exprtPeriodsTab1) {
        exprtPeriods1 = settings.exprtPeriodsTab1;
        localStorage.setItem("exprtPeriodsTab1", JSON.stringify(exprtPeriods1));
    }
    if (settings.excludeLines1) {
        excludeLines1 = settings.excludeLines1;
        localStorage.setItem("excludeLines1", JSON.stringify(excludeLines1));
    }
    
    // تبويب 2
    if (settings.strgePeriodsTab2) {
        strgePeriods2 = settings.strgePeriodsTab2;
        localStorage.setItem("strgePeriodsTab2", JSON.stringify(strgePeriods2));
    }
    if (settings.exprtPeriodsTab2) {
        exprtPeriods2 = settings.exprtPeriodsTab2;
        localStorage.setItem("exprtPeriodsTab2", JSON.stringify(exprtPeriods2));
    }
    if (settings.excludeLines2) {
        excludeLines2 = settings.excludeLines2;
        localStorage.setItem("excludeLines2", JSON.stringify(excludeLines2));
    }
    
    // تبويب 3
    if (settings.exprtOnlyPeriodsTab3) {
        exprtOnlyPeriods3 = settings.exprtOnlyPeriodsTab3;
        localStorage.setItem("exprtOnlyPeriodsTab3", JSON.stringify(exprtOnlyPeriods3));
    }
    if (settings.excludeLines3) {
        excludeLines3 = settings.excludeLines3;
        localStorage.setItem("excludeLines3", JSON.stringify(excludeLines3));
    }
    
    // تبويب 4
    if (settings.emptyStrgePeriodsTab4) {
        emptyStrgePeriods4 = settings.emptyStrgePeriodsTab4;
        localStorage.setItem("emptyStrgePeriodsTab4", JSON.stringify(emptyStrgePeriods4));
    }
    if (settings.excludeLines4) {
        excludeLines4 = settings.excludeLines4;
        localStorage.setItem("excludeLines4", JSON.stringify(excludeLines4));
    }
    
    // تبويب 5
    if (settings.trshpOnlyPeriodsTab5) {
        trshpOnlyPeriods5 = settings.trshpOnlyPeriodsTab5;
        localStorage.setItem("trshpOnlyPeriodsTab5", JSON.stringify(trshpOnlyPeriods5));
    }
    if (settings.excludeLines5) {
        excludeLines5 = settings.excludeLines5;
        localStorage.setItem("excludeLines5", JSON.stringify(excludeLines5));
    }
    
    // تبويب 6
    if (settings.strgePeriodsTab6) {
        strgePeriods6 = settings.strgePeriodsTab6;
        localStorage.setItem("strgePeriodsTab6", JSON.stringify(strgePeriods6));
    }
    if (settings.exprtPeriodsTab6) {
        exprtPeriods6 = settings.exprtPeriodsTab6;
        localStorage.setItem("exprtPeriodsTab6", JSON.stringify(exprtPeriods6));
    }
    if (settings.excludeLines6) {
        excludeLines6 = settings.excludeLines6;
        localStorage.setItem("excludeLines6", JSON.stringify(excludeLines6));
    }
    
    // تبويب 7
    if (settings.imprtForwardPeriodsTab7) {
        imprtForwardPeriods7 = settings.imprtForwardPeriodsTab7;
        localStorage.setItem("imprtForwardPeriodsTab7", JSON.stringify(imprtForwardPeriods7));
    }
    if (settings.excludeLines7) {
        excludeLines7 = settings.excludeLines7;
        localStorage.setItem("excludeLines7", JSON.stringify(excludeLines7));
    }
    
    // تفضيلات الأعمدة
    if (settings.selectedColumns) {
        for (let key in settings.selectedColumns) {
            selectedColumns[key] = settings.selectedColumns[key];
            localStorage.setItem(`selectedColumns_${key}`, JSON.stringify(selectedColumns[key]));
        }
    }
    
    // تحديث واجهة المستخدم
    initializeAllSelects();
    refreshPeriodsDisplay('1');
    refreshPeriodsDisplay('2');
    refreshPeriodsDisplay('3');
    refreshPeriodsDisplay('4');
    refreshPeriodsDisplay('5');
    refreshPeriodsDisplay('6');
    refreshPeriodsDisplay('7');
    displayExcludeList('excludeList1', excludeLines1, '1');
    displayExcludeList('excludeList2', excludeLines2, '2');
    displayExcludeList('excludeList3', excludeLines3, '3');
    displayExcludeList('excludeList4', excludeLines4, '4');
    displayExcludeList('excludeList5', excludeLines5, '5');
    displayExcludeList('excludeList6', excludeLines6, '6');
    displayExcludeList('excludeList7', excludeLines7, '7');
    
    console.log('✅ تم تطبيق جميع الإعدادات بنجاح');
}



// دالة لحفظ القائمة الرئيسية
function saveMasterLinesList() {
    localStorage.setItem("masterLinesList", JSON.stringify(masterLinesList));
}

// دالة لإضافة خط جديد إلى القائمة الرئيسية
function addNewLineToMasterList(lineName) {
    if (!lineName || lineName.trim() === "") return false;
    let trimmedName = lineName.trim();
    if (!masterLinesList.includes(trimmedName)) {
        masterLinesList.push(trimmedName);
        saveMasterLinesList();
        updateAllLineSelects();
        return true;
    }
    return false;
}

// دالة لتحديث جميع القوائم المنسدلة
function updateAllLineSelects() {
    for (let i = 1; i <= 6; i++) {
        let excludeSelect = document.getElementById(`excludeLine${i}`);
        if (excludeSelect) {
            let currentValue = excludeSelect.value;
            updateSelectOptions(excludeSelect, masterLinesList);
            excludeSelect.value = currentValue;
        }
        
        let periodSelects = document.querySelectorAll(`.period-line-${i}`);
        periodSelects.forEach(select => {
            let currentValue = select.value;
            updateSelectOptions(select, masterLinesList);
            select.value = currentValue;
        });
    }
}

// دالة لتحديث خيارات الـ Select
function updateSelectOptions(selectElement, optionsList) {
    if (!selectElement) return;
    let currentValue = selectElement.value;
    selectElement.innerHTML = '';
    
    let allOption = document.createElement('option');
    allOption.value = '*';
    allOption.textContent = '* (الكل)';
    selectElement.appendChild(allOption);
    
    optionsList.forEach(line => {
        let option = document.createElement('option');
        option.value = line;
        option.textContent = line;
        selectElement.appendChild(option);
    });
    
    selectElement.value = currentValue;
}

// دالة لتهيئة جميع القوائم المنسدلة
function initializeAllSelects() {
    for (let i = 1; i <= 6; i++) {
        let excludeSelect = document.getElementById(`excludeLine${i}`);
        if (excludeSelect) {
            updateSelectOptions(excludeSelect, masterLinesList);
        }
    }
}
// ========== دوال حفظ وتحميل الملف ==========
function saveFileToLocalStorage(fileData, fileName) {
    try {
        // تقدير حجم البيانات (base64)
        const sizeInMB = fileData.length * 3 / 4 / 1024 / 1024;
        if (sizeInMB > 5) {
            console.warn(`⚠️ الملف كبير جداً (${sizeInMB.toFixed(1)} ميجابايت)، لن يتم حفظه في localStorage.`);
            return; // لا نحفظ، ولكن لا نرمي خطأ
        }
        localStorage.setItem("savedExcelFile", fileData);
        localStorage.setItem("savedExcelFileName", fileName);
        console.log("✅ تم حفظ الملف:", fileName);
    } catch(e) {
        console.warn("⚠️ فشل حفظ الملف في localStorage:", e.message);
        // لا نرمي خطأ، نستمر في التنفيذ
    }
}


// دالة معالجة الملف عند التحميل
function processExcelFile(file) {
    let reader = new FileReader();
reader.onload = function(evt) {
    try {
        // 🧹 تنظيف شامل قبل المعالجة
        resetAllData();
        
        let arrayBuffer = evt.target.result;

            // محاولة حفظ الملف
            try {
                let binary = '';
                let bytes = new Uint8Array(arrayBuffer);
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                let base64Data = btoa(binary);
                saveFileToLocalStorage(base64Data, file.name);
            } catch(e) {
                console.warn("⚠️ فشل حفظ الملف، لكن المتابعة مستمرة:", e.message);
            }

            let workbook = XLSX.read(arrayBuffer, { type: 'array' });
            let sheet = workbook.Sheets[workbook.SheetNames[0]];
            // استخدام range: 4 لتخطي الصفوف غير الضرورية
            let rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 4 });

            console.log(`📄 عدد الصفوف المقروءة: ${rows.length}`);
            if (rows.length === 0) {
                document.getElementById("footerMsg").innerHTML = "⚠️ الملف فارغ أو التنسيق غير صحيح";
                return;
            }

            // ===== التحقق من نوع الملف =====
            let firstRow = rows[0];
            let keys = Object.keys(firstRow);
            console.log("🔍 أسماء الأعمدة في الملف:", keys);
            
            let hasUnitNbr = keys.some(k => k.trim() === "Unit Nbr");
            let hasEquipId = keys.some(k => k.trim() === "Equip ID");
            let isFinalout = hasUnitNbr && !hasEquipId;
			
// ===== 🆕 فحص شامل لجميع الحقول =====
let fieldCheck = checkExcelFields(rows, isFinalout ? "finalout" : "main");
if (!fieldCheck.valid) {
    console.log("❌ فشل التحميل بسبب نقص الحقول");
    return;  // ← إيقاف التحميل تماماً
}
console.log("✅ فحص جميع الحقول نجح، بدء المعالجة...");

            if (isFinalout) {
                console.log("📂 تم التعرف على ملف FINALOUT (تبويب 8)");
                processFinaloutFile(rows);
                document.getElementById("footerMsg").innerHTML = `✅ تم تحميل ملف FINALOUT: ${file.name} | عدد الحاويات: ${currentData8.length}`;
                return;
            }

            // ===== معالجة الملف العادي =====
            console.log("📂 تم التعرف على ملف البيانات الرئيسي (تبويبات 1-7)");

            // تنظيف البيانات القديمة
            currentData1 = [];
            currentData2 = [];
            currentData3 = [];
            currentData4 = [];
            currentData5 = [];
            currentData6 = [];
            currentData7 = [];
            containersMap.clear();
			
			// ===== 🆕 مسح بطاقات الإجمالي والجداول القديمة =====
for (let i = 1; i <= 8; i++) {
    // مسح بطاقات الإجمالي
    let statsDiv = document.getElementById("statsTab" + i);
    if (statsDiv) {
        statsDiv.innerHTML = "";
        statsDiv.style.display = "none";
    }
    
    // مسح الجداول
    let tbody = document.getElementById("bodyTab" + i);
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="30" style="text-align:center; padding:40px;">⏳ جاري تحميل البيانات...</td></tr>`;
    }
    
    // إخفاء الفلاتر
    let filtersDiv = document.getElementById("filtersTab" + i);
    if (filtersDiv) {
        filtersDiv.style.display = "none";
    }
    
    // إخفاء الجداول
    let wrapperDiv = document.getElementById("wrapperTab" + i);
    if (wrapperDiv) {
        wrapperDiv.style.display = "none";
    }
}

console.log("🧹 تم مسح بطاقات الإجمالي والجداول القديمة");

            for (let row of rows) {
                let equipId = row["Equip ID"];
                if (!equipId || equipId === "") continue;

				if (!containersMap.has(equipId)) {
					containersMap.set(equipId, {
						equipId: equipId,
						equipmentType: row["Equipment Type"] || "",
						lineId: row["Line ID"] || "",
						notes: row["Notes"] || "",   // ← السطر الجديد
						trshpList: [],
						exprtList: [],
						strge: null,
						imprt: null,
						trshpReturn: null
					});
				}
                let c = containersMap.get(equipId);
                let cat = row["Category"];
                let drayStatus = row["Dray Status"] || "";

                if (cat === "TRSHP") {
                    c.trshpList.push(row);
                    if (drayStatus === "RETURN") {
                        c.trshpReturn = row;
                    }
                }
                else if (cat === "EXPRT") {
                    if (!c.exprtList) c.exprtList = [];
                    c.exprtList.push(row);
                }
                else if (cat === "STRGE") {
                    c.strge = row;
                }
                else if (cat === "IMPRT") {
                    c.imprt = row;
                }
            }

            console.log(`📦 containersMap.size بعد القراءة: ${containersMap.size}`);

            // معالجة جميع التبويبات
            processAndDisplay1();
            processAndDisplay2();
            processAndDisplay3();
            processAndDisplay4();
            processAndDisplay5();
            processAndDisplay6();
            processAndDisplay7();
            processAndDisplay8();
// 🔐 فلترة البيانات حسب خطوط المستخدم
applyUserLineFilter();

            updateHeaderInfo('1');
			
			            // 🆕 تصحيح الرأس بعد التحميل (بدون ضغط أزرار)
            setTimeout(() => {
                if (currentData2 && currentData2.length > 0) {
                    updateHeaderFromDisplayData('2', currentData2);
                } else if (currentData1 && currentData1.length > 0) {
                    updateHeaderFromDisplayData('1', currentData1);
                } else if (currentData6 && currentData6.length > 0) {
                    updateHeaderFromDisplayData('6', currentData6);
                } else if (currentData3 && currentData3.length > 0) {
                    updateHeaderFromDisplayData('3', currentData3);
                } else if (currentData5 && currentData5.length > 0) {
                    updateHeaderFromDisplayData('5', currentData5);
                } else if (currentData4 && currentData4.length > 0) {
                    updateHeaderFromDisplayData('4', currentData4);
                }
            }, 200);

// 🔐 فلترة البيانات حسب صلاحيات المستخدم
setTimeout(() => {
    if (typeof applyUserLineFilter === 'function') {
        applyUserLineFilter();
    }
}, 300);

            document.getElementById("footerMsg").innerHTML = `✅ تم تحميل: ${file.name} | ...`;

			// ===== 🆕 تطبيق تفضيلات الأعمدة بعد المعالجة =====
			setTimeout(function() {
				if (typeof applySavedColumnPreferences === 'function') {
					console.log("🎨 [File Input] تطبيق تفضيلات الأعمدة...");
					applySavedColumnPreferences();
				}
			}, 400);
            
            // ===== 🆕 رفع الملف إلى GitHub بعد انتهاء المعالجة =====
            setTimeout(async function() {
                if (typeof _downloadingFromGitHub !== 'undefined' && _downloadingFromGitHub) {
                    console.log("⏭️ تم تخطي الرفع (الملف قادم من GitHub)");
                    return;
                }
                
                // انتظر حتى تُحدَّث الرؤوس
                let carrierName = document.getElementById("headerCarrierName")?.innerText?.trim() || "";
                if (!carrierName || carrierName === "—" || carrierName === "UnknownShip") {
                    console.log("⏳ الرؤوس لم تُحدَّث بعد، انتظار 2 ثانية إضافية...");
                    await new Promise(r => setTimeout(r, 2000));
                }
                
                let result = await saveFileToGitHub();
                if (result && result.success) {
                    console.log("✅ الملف مرفوع على GitHub");
                }
            }, 2500);
            
        } catch(err) {
            console.error("❌ خطأ في معالجة الملف:", err);
            document.getElementById("footerMsg").innerHTML = `❌ خطأ: ${err.message}`;
        }
    };
    reader.readAsArrayBuffer(file);
}
	
// ============================================================
// 🆕 دالة معالجة Excel من Uint8Array مباشرة
// ============================================================
function processExcelFromBytes(bytes, fileName) {
    try {
        console.log("📦 استلام bytes:", bytes.length, "بايت");
        console.log("📦 أول 8 بايت:", Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        // ===== 🧹 تنظيف شامل قبل المعالجة =====
        resetAllData();
        
        // ===== قراءة الـ workbook =====
        let workbook = XLSX.read(bytes, { type: 'array' });
        console.log("📋 Sheets:", workbook.SheetNames);
        
        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        let rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 4 });
        
        console.log(`📄 عدد الصفوف المقروءة: ${rows.length}`);
        
        if (rows.length === 0) {
            document.getElementById("footerMsg").innerHTML = "⚠️ الملف فارغ أو التنسيق غير صحيح";
            return;
        }
        
        // ===== التحقق من نوع الملف =====
        let firstRow = rows[0];
        let keys = Object.keys(firstRow);
        console.log("🔍 أسماء الأعمدة في الملف:", keys);
        
        let hasUnitNbr = keys.some(k => k.trim() === "Unit Nbr");
        let hasEquipId = keys.some(k => k.trim() === "Equip ID");
        let isFinalout = hasUnitNbr && !hasEquipId;
        
        // ===== فحص شامل لجميع الحقول =====
        let fieldCheck = checkExcelFields(rows, isFinalout ? "finalout" : "main");
        if (!fieldCheck.valid) {
            console.log("❌ فشل التحميل بسبب نقص الحقول");
            return;
        }
        console.log("✅ فحص جميع الحقول نجح، بدء المعالجة...");
        
        // ===== معالجة FINALOUT =====
        if (isFinalout) {
            console.log("📂 تم التعرف على ملف FINALOUT (تبويب 8)");
            processFinaloutFile(rows);
            document.getElementById("footerMsg").innerHTML = `✅ تم تحميل ملف FINALOUT: ${fileName} | عدد الحاويات: ${currentData8.length}`;
            return;
        }
        
        // ===== معالجة الملف العادي =====
        console.log("📂 تم التعرف على ملف البيانات الرئيسي (تبويبات 1-7)");
        
        // بناء containersMap
        for (let row of rows) {
            let equipId = row["Equip ID"];
            if (!equipId || equipId === "") continue;
            
            if (!containersMap.has(equipId)) {
                containersMap.set(equipId, {
                    equipId: equipId,
                    equipmentType: row["Equipment Type"] || "",
                    lineId: row["Line ID"] || "",
                    notes: row["Notes"] || "",
                    trshpList: [],
                    exprtList: [],
                    strge: null,
                    imprt: null,
                    trshpReturn: null
                });
            }
            let c = containersMap.get(equipId);
            let cat = row["Category"];
            let drayStatus = row["Dray Status"] || "";
            
            if (cat === "TRSHP") {
                c.trshpList.push(row);
                if (drayStatus === "RETURN") {
                    c.trshpReturn = row;
                }
            }
            else if (cat === "EXPRT") {
                if (!c.exprtList) c.exprtList = [];
                c.exprtList.push(row);
            }
            else if (cat === "STRGE") {
                c.strge = row;
            }
            else if (cat === "IMPRT") {
                c.imprt = row;
            }
        }
        
        console.log(`📦 containersMap.size بعد القراءة: ${containersMap.size}`);
        
        // معالجة جميع التبويبات
        processAndDisplay1();
        processAndDisplay2();
        processAndDisplay3();
        processAndDisplay4();
        processAndDisplay5();
        processAndDisplay6();
        processAndDisplay7();
        processAndDisplay8();
        
        updateHeaderInfo('1');
        
        // 🆕 تصحيح الرأس بعد التحميل من GitHub
        setTimeout(() => {
            if (currentData2 && currentData2.length > 0) {
                updateHeaderFromDisplayData('2', currentData2);
            } else if (currentData1 && currentData1.length > 0) {
                updateHeaderFromDisplayData('1', currentData1);
            } else if (currentData6 && currentData6.length > 0) {
                updateHeaderFromDisplayData('6', currentData6);
            } else if (currentData3 && currentData3.length > 0) {
                updateHeaderFromDisplayData('3', currentData3);
            }
        }, 200);
        
        setTimeout(function() {
            applySavedColumnPreferences();
        }, 200);
        
        document.getElementById("footerMsg").innerHTML = `✅ تم تحميل: ${fileName} | TRSHP+EXPRT: ${currentData1.length} | STRGE+EXPRT+IMPRT: ${currentData2.length} | EXPRT فقط: ${currentData3.length} | STRGE فارغ: ${currentData4.length} | TRSHP فقط: ${currentData5.length} | STRGE+EXPRT فقط: ${currentData6.length} | IMPRT+FORWARD: ${currentData7.length} | Storage Finalout: ${currentData8.length}`;
        
    } catch(err) {
        console.error("❌ خطأ في معالجة الملف:", err);
        document.getElementById("footerMsg").innerHTML = `❌ خطأ: ${err.message}`;
    }
}

function processFinaloutFile(rows) {
    console.log("🔄 معالجة ملف FINALOUT...");
    let result = [];

    for (let row of rows) {
        // استخراج البيانات من الأعمدة الصحيحة
        let unitNbr = row["Unit Nbr"] || "";
        if (!unitNbr) continue; // تخطي الصفوف بدون رقم حاوية

        let typeISO = row["Type ISO"] || "";
        let category = row["Category"] || "";
        let orig = row["Orig"] || "";
        let drayStatus = row["Dray Status"] || "";
        let orderNumber = row["Order Number"] || "";
        let timeIn = row["Time In"] || "";
        let timeOut = row["Time Out"] || "";
        let storageDaysTotal = parseInt(row["Storage Days Total"]) || 0;
        let loaded = row["Loaded"] || "";
        let lclPoss = row["LCL-POSS"] || "";
        let lineOp = row["Line Op"] || "";
        let freightKind = row["Frght Kind"] || "";

        // تحويل التواريخ
        let timeInFormatted = convertDate(timeIn);
        let timeOutFormatted = convertDate(timeOut);

        // حساب أيام التخزين الجديدة (حسب القاعدة)
        let newStorageDays = 0;
        if (timeInFormatted && timeOutFormatted) {
            let diff = diffDays(timeInFormatted, timeOutFormatted);
            if (orig === "DPA") {
                newStorageDays = diff - 1;
                if (newStorageDays < 0) newStorageDays = 0;
            } else {
                newStorageDays = diff;
            }
        }

        // ترتيب حسب LCL-POSS
        let sortKey = lclPoss || "zzzz";

        result.push({
            "رقم الحاوية": unitNbr,
            "النوع": typeISO,
            "المنشأ": orig || "—",
            "رقم الأمر": orderNumber,
            "الخط المشغل": lineOp,
            "تاريخ الدخول": timeInFormatted || "—",
            "تاريخ الخروج": timeOutFormatted || "—",
            "أيام التخزين (جديد)": newStorageDays,
            "Storage Days Total": storageDaysTotal,
            "الملاحظات": lclPoss || "—",
            "نوع الشحنة": freightKind || "—",
            "_sortKey": sortKey
        });
    }

    // ترتيب النتائج حسب LCL-POSS
    result.sort((a, b) => a["_sortKey"].localeCompare(b["_sortKey"]));
    result.forEach(item => delete item._sortKey);

    currentData8 = result;
    console.log(`✅ تمت معالجة ${currentData8.length} حاوية في تبويب Storage Finalout`);

    // تحديث الـ Header
    let headerInfo = {
        orderNumber: result.length > 0 ? result[0]["رقم الأمر"] : "",
        lineOp: result.length > 0 ? result[0]["الخط المشغل"] : ""
    };
    updateStorageFinaloutHeader(headerInfo);

    // عرض البيانات في الجدول
    renderTable8("bodyTab8", currentData8, "searchTab8", "typeTab8", "statsTab8");

    // إظهار عناصر التبويب
    let filtersDiv = document.getElementById("filtersTab8");
    let wrapperDiv = document.getElementById("wrapperTab8");
    let statsDiv = document.getElementById("statsTab8");

    if (filtersDiv) filtersDiv.style.display = "flex";
    if (wrapperDiv) wrapperDiv.style.display = "block";
    if (statsDiv && currentData8.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab8(currentData8);
        statsDiv.style.display = "flex";
    }

    // ===== تنشيط تبويب 8 تلقائياً =====
    let tab8Div = document.getElementById("tab8");
    if (tab8Div && !tab8Div.classList.contains("active")) {
        tab8Div.classList.add("active");
        document.querySelectorAll(".tab-content").forEach(c => {
            if (c.id !== "tab8") c.classList.remove("active");
        });
        document.querySelectorAll(".tab-btn").forEach(b => {
            b.classList.remove("active");
            if (b.dataset.tab === "tab8") b.classList.add("active");
        });
    }
}

// ===== دالة جديدة لمعالجة الملفات =====
function handleFileUpload(file) {
    let reader = new FileReader();
    reader.onload = function(evt) {
        try {
            let arrayBuffer = evt.target.result;
            let workbook = XLSX.read(arrayBuffer, { type: 'array' });
            let sheet = workbook.Sheets[workbook.SheetNames[0]];
            let rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 0 });

            console.log(`📄 عدد الصفوف المقروءة: ${rows.length}`);
            if (rows.length === 0) {
                document.getElementById("footerMsg").innerHTML = "⚠️ الملف فارغ";
                return;
            }

            let firstRow = rows[0];
            let keys = Object.keys(firstRow);
            console.log("🔍 أسماء الأعمدة:", keys);

            // إذا كان هناك عمود "Unit Nbr"، نعتبره FINALOUT
            let hasUnitNbr = keys.some(k => k.trim() === "Unit Nbr");
            if (hasUnitNbr) {
                console.log("📂 تم التعرف على FINALOUT");
                processFinaloutFile(rows);
                document.getElementById("footerMsg").innerHTML = `✅ تم تحميل FINALOUT: ${file.name} | عدد الحاويات: ${currentData8.length}`;
                // تنشيط تبويب 8
                let tab8Div = document.getElementById("tab8");
                if (tab8Div) {
                    tab8Div.classList.add("active");
                    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
                    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                    tab8Div.classList.add("active");
                    document.querySelector('.tab-btn[data-tab="tab8"]').classList.add("active");
                }
                return;
            }

            // هنا معالجة الملف العادي...
            console.log("📂 ملف عادي (تبويبات 1-7)");
            // ... (ضع كود المعالجة العادية هنا)
            // لكننا سنستدعي الدالة القديمة للتبويبات 1-7
            // لكن لتجنب التعقيد، سنضيف استدعاء processExcelFile القديم
            // ولكن يجب تجنب التكرار، لذا سننقل كود المعالجة العادية إلى هنا.
            // لكن للاختصار، سأفترض أنك ستستخدم الدالة القديمة بعد التعديل.
            // لكن الأفضل هو استخدام الدالة القديمة المعدلة.

        } catch(err) {
            console.error(err);
            document.getElementById("footerMsg").innerHTML = `❌ خطأ: ${err.message}`;
        }
    };
    reader.readAsArrayBuffer(file);
}

// ========== تفضيلات الأعمدة المحفوظة ==========
let selectedColumns = {
    tab1: JSON.parse(localStorage.getItem("selectedColumns_tab1")) || [],
    tab2: JSON.parse(localStorage.getItem("selectedColumns_tab2")) || [],
    tab3: JSON.parse(localStorage.getItem("selectedColumns_tab3")) || [],
    tab4: JSON.parse(localStorage.getItem("selectedColumns_tab4")) || [],
    tab5: JSON.parse(localStorage.getItem("selectedColumns_tab5")) || [],
    tab6: JSON.parse(localStorage.getItem("selectedColumns_tab6")) || [],
    tab7: JSON.parse(localStorage.getItem("selectedColumns_tab7")) || [],  // ← أضف هذا
	tab8: JSON.parse(localStorage.getItem("selectedColumns_tab8")) || []  // ← أضف هذا
};

// تعريف الأعمدة المتاحة للتبويب 1
const availableColumns = {
    tab1: [
        { name: "Container No.", label: "رقم الحاوية", default: true },
        { name: "Size", label: "الحجم", default: true },
        { name: "Is OOG", label: "OOG", default: false },
		{ name: "Is Refrigerated", label: "ثلاجه", default: false },
		{ name: "flex_04", label: "flex_04", default: false },  // ←←← أضف هذا
		{ name: "Is Bundled", label: "مجمّع", default: false },
        { name: "Is Hazardous", label: "خطر", default: false },
        { name: "IMDG Class", label: "IMDG", default: false },
        { name: "Type", label: "النوع", default: true },
        { name: "Line ID", label: "الخط", default: true },
        { name: "طريقة الحساب", label: "طريقة الحساب", default: false },
        { name: "Flex String 01", label: "Flex String 01", default: false },  // ←←← أضف هذا
        { name: "TRSHP Start", label: "بداية TRSHP", default: true },
        { name: "TRSHP End", label: "نهاية TRSHP", default: true },
        { name: "TRSHP Days", label: "أيام TRSHP", default: true },
        { name: "Overlap", label: "أيام مشتركة", default: false },
        { name: "TRSHP After Overlap", label: "TRSHP بعد الخصم", default: false },
        { name: "TRSHP Free", label: "سماح TRSHP", default: true },
        { name: "TRSHP Net", label: "صافي TRSHP", default: true },
        { name: "EXPRT Start", label: "بداية EXPRT", default: true },
        { name: "EXPRT End", label: "نهاية EXPRT", default: true },
        { name: "EXPRT Days", label: "أيام EXPRT", default: true },
        { name: "EXPRT Free", label: "سماح EXPRT", default: true },
        { name: "EXPRT Net", label: "صافي EXPRT", default: true },
        { name: "Total Net", label: "الإجمالي", default: true },
        { name: "Vessel Name", label: "اسم السفينة", default: false }
    ]
};

// تعريف الأعمدة المتاحة للتبويب 2
const availableColumnsTab2 = {
    tab2: [
        { name: "Container No.", label: "رقم الحاوية", default: true },
        { name: "Size", label: "الحجم", default: true },
        { name: "Is OOG", label: "OOG", default: false },
		{ name: "Is Refrigerated", label: "ثلاجه", default: false },
		{ name: "flex_04", label: "flex_04", default: false },  // ←←← أضف هذا
		{ name: "Is Bundled", label: "مجمّع", default: false },
        { name: "Is Hazardous", label: "خطر", default: false },
        { name: "IMDG Class", label: "IMDG", default: false },
        { name: "Type", label: "النوع", default: true },
        { name: "Line ID", label: "الخط", default: true },
        { name: "طريقة الحساب", label: "طريقة الحساب", default: false },
        { name: "Flex String 01", label: "Flex String 01", default: false },
        { name: "نوع IMPRT", label: "نوع IMPRT", default: false },
        { name: "IMPRT Start", label: "بداية IMPRT", default: true },
        { name: "IMPRT End", label: "نهاية IMPRT", default: true },
        { name: "IMPRT Days", label: "أيام IMPRT", default: true },
        { name: "STRGE Start", label: "بداية STRGE", default: true },
        { name: "STRGE End", label: "نهاية STRGE", default: true },
        { name: "STRGE Days", label: "أيام STRGE", default: true },
        { name: "Overlap Days", label: "أيام مشتركة", default: false },
        { name: "STRGE After Overlap", label: "STRGE بعد الخصم", default: false },
        { name: "STRGE Free", label: "سماح STRGE", default: true },
        { name: "STRGE Net", label: "صافي STRGE", default: true },
        { name: "EXPRT Start", label: "بداية EXPRT", default: true },
        { name: "EXPRT End", label: "نهاية EXPRT", default: true },
        { name: "EXPRT Days", label: "أيام EXPRT", default: true },
        { name: "EXPRT Free", label: "سماح EXPRT", default: true },
        { name: "EXPRT Net", label: "صافي EXPRT", default: true },
        { name: "Total Net", label: "الإجمالي", default: true },
        { name: "Vessel Name", label: "اسم السفينة", default: false }
    ]
};

// تعريف الأعمدة المتاحة للتبويب 3 (EXPRT فقط)
const availableColumnsTab3 = {
    tab3: [
        { name: "Container No.", label: "رقم الحاوية", default: true },
        { name: "Size", label: "الحجم", default: true },
        { name: "Is OOG", label: "OOG", default: false },
		{ name: "Is Refrigerated", label: "ثلاجه", default: false },
		{ name: "flex_04", label: "flex_04", default: false },  // ←←← أضف هذا
		{ name: "Is Bundled", label: "مجمّع", default: false },
        { name: "Is Hazardous", label: "خطر", default: false },
        { name: "IMDG Class", label: "IMDG", default: false },
        { name: "Type", label: "النوع", default: true },
        { name: "Line ID", label: "الخط", default: true },
        { name: "طريقة الحساب", label: "طريقة الحساب", default: false },
        { name: "Flex String 01", label: "Flex String 01", default: false },
        { name: "EXPRT Start", label: "بداية EXPRT", default: true },
        { name: "EXPRT End", label: "نهاية EXPRT", default: true },
        { name: "EXPRT Days", label: "أيام EXPRT", default: true },
        { name: "EXPRT Free", label: "سماح EXPRT", default: true },
        { name: "EXPRT Net", label: "صافي EXPRT", default: true },
        { name: "Total Net", label: "الإجمالي", default: true },
        { name: "Vessel Name", label: "اسم السفينة", default: false }
    ]
};

// تعريف الأعمدة المتاحة للتبويب 4 (STRGE فارغ)
const availableColumnsTab4 = {
    tab4: [
        { name: "Container No.", label: "رقم الحاوية", default: true },
        { name: "Size", label: "الحجم", default: true },
        { name: "Is OOG", label: "OOG", default: false },
		{ name: "Is Refrigerated", label: "ثلاجه", default: false },
		{ name: "flex_04", label: "flex_04", default: false },  // ←←← أضف هذا
		{ name: "Is Bundled", label: "مجمّع", default: false },
        { name: "Is Hazardous", label: "خطر", default: false },
        { name: "IMDG Class", label: "IMDG", default: false },
        { name: "Type", label: "النوع", default: true },
        { name: "Line ID", label: "الخط", default: true },
        { name: "طريقة الحساب", label: "طريقة الحساب", default: false },
        { name: "Flex String 01", label: "Flex String 01", default: false },
		{ name: "Notes", label: "ملاحظات", default: true },  // ← أضف هذا
        { name: "IMPRT Start", label: "بداية IMPRT", default: true },
        { name: "IMPRT End", label: "نهاية IMPRT", default: true },
        { name: "IMPRT Days", label: "أيام IMPRT", default: true },
        { name: "STRGE Start", label: "بداية STRGE فارغ", default: true },
        { name: "STRGE End", label: "نهاية STRGE فارغ", default: true },
        { name: "STRGE Days", label: "أيام STRGE فارغ", default: true },
        { name: "STRGE Free", label: "سماح STRGE", default: true },
        { name: "STRGE Net", label: "صافي STRGE", default: true },
        { name: "Total Net", label: "الإجمالي", default: true },
        { name: "Vessel Name", label: "اسم السفينة", default: false }
    ]
};

const availableColumnsTab5 = {
    tab5: [
        { name: "Container No.", label: "رقم الحاوية", default: true },
        { name: "Size", label: "الحجم", default: true },
		{ name: "Freight Kind", label: "نوع الشحنة", default: true },  // ← أضف هذا
        { name: "Is OOG", label: "OOG", default: false },
        { name: "Is Refrigerated", label: "مبرد", default: false },
        { name: "O/B Loc Type", label: "نوع الموقع", default: true },  // ← تغيير من I/B إلى O/B
        { name: "Is Bundled", label: "مجمّع", default: false },
        { name: "Is Hazardous", label: "خطير", default: false },
        { name: "IMDG Class", label: "IMDG", default: false },
        { name: "Type", label: "النوع", default: true },
        { name: "Line ID", label: "الخط", default: true },
        { name: "طريقة الحساب", label: "طريقة الحساب", default: false },
        { name: "Flex String 01", label: "Flex String 01", default: false },
        { name: "flex_04", label: "flex_04", default: false },
        { name: "TRSHP Start", label: "بداية TRSHP", default: true },
        { name: "TRSHP End", label: "نهاية TRSHP", default: true },
        { name: "TRSHP Days", label: "أيام TRSHP", default: true },
        { name: "TRSHP Free", label: "سماح TRSHP", default: true },
        { name: "TRSHP Net", label: "صافي TRSHP", default: true },
        { name: "Total Net", label: "الإجمالي", default: true },
        { name: "Vessel Name", label: "اسم السفينة", default: false },
        { name: "Period Order", label: "رقم الفترة", default: false }
    ]
};

const availableColumnsTab6 = {
    tab6: [
        { name: "Container No.", label: "رقم الحاوية", default: true },
        { name: "Size", label: "الحجم", default: true },
        { name: "Is OOG", label: "OOG", default: false },
        { name: "Is Refrigerated", label: "مبرد", default: false },
        { name: "Is Bundled", label: "مجمّع", default: false },
        { name: "Is Hazardous", label: "خطير", default: false },
        { name: "IMDG Class", label: "IMDG", default: false },
        { name: "Type", label: "النوع", default: true },
        { name: "Line ID", label: "الخط", default: true },
        { name: "طريقة الحساب", label: "طريقة الحساب", default: false },
        { name: "Flex String 01", label: "Flex String 01", default: false },
		{ name: "flex_04", label: "flex_04", default: false },  // ← أضف هذا
		{ name: "Notes", label: "ملاحظات", default: true },  // ← أضف هذا
        { name: "STRGE Start", label: "بداية STRGE", default: true },
        { name: "STRGE End", label: "نهاية STRGE", default: true },
        { name: "STRGE Days", label: "أيام STRGE", default: true },
        { name: "Overlap Days", label: "أيام مشتركة", default: false },
        { name: "STRGE After Overlap", label: "STRGE بعد الخصم", default: false },
        { name: "STRGE Free", label: "سماح STRGE", default: true },
        { name: "STRGE Net", label: "صافي STRGE", default: true },
        { name: "EXPRT Start", label: "بداية EXPRT", default: true },
        { name: "EXPRT End", label: "نهاية EXPRT", default: true },
        { name: "EXPRT Days", label: "أيام EXPRT", default: true },
        { name: "EXPRT Free", label: "سماح EXPRT", default: true },
        { name: "EXPRT Net", label: "صافي EXPRT", default: true },
        { name: "Total Net", label: "الإجمالي", default: true },
        { name: "Vessel Name", label: "اسم السفينة", default: false }
    ]
};

// ========== دوال اختيار الأعمدة لتبويب 7 ==========

const availableColumnsTab7 = {
    tab7: [
        { name: "رقم الحاوية", label: "رقم الحاوية", default: true },
        { name: "الحجم", label: "الحجم", default: true },
        { name: "OOG", label: "OOG", default: false },
        { name: "مبرد", label: "مبرد", default: false },
        { name: "خطير", label: "خطير", default: false },
        { name: "IMDG", label: "IMDG", default: false },
        { name: "النوع", label: "النوع", default: true },
        { name: "الخط", label: "الخط", default: true },
        { name: "نوع", label: "نوع الحركة", default: true },
        { name: "Start Time", label: "Start Time (الأصلي)", default: true },
        { name: "PaidThruDate", label: "PaidThruDate", default: true },        // ← جديد
        { name: "Start (Paid+1)", label: "Start (Paid+1)", default: true },    // ← جديد
        { name: "End", label: "End", default: true },
        { name: "Days", label: "عدد الأيام", default: true },
        { name: "Free", label: "أيام السماح", default: true },
        { name: "Net", label: "الصافي", default: true },
        { name: "Vessel Name", label: "اسم السفينة", default: true }
    ]
};

const availableColumnsTab8 = {
    tab8: [
        { name: "رقم الحاوية", label: "رقم الحاوية", default: true },
        { name: "النوع", label: "النوع", default: true },
        { name: "المنشأ", label: "المنشأ", default: true },
        { name: "تاريخ الدخول", label: "تاريخ الدخول", default: true },
        { name: "تاريخ الخروج", label: "تاريخ الخروج", default: true },
        { name: "أيام التخزين (جديد)", label: "أيام التخزين (جديد)", default: true },
        { name: "Storage Days Total", label: "Storage Days Total", default: true },
        { name: "الملاحظات", label: "الملاحظات", default: true },
        { name: "نوع الشحنة", label: "نوع الشحنة", default: true }
    ]
};

// دالة فتح نافذة اختيار الأعمدة لتبويب 7
function openColumnModalTab7() {
    let modal = document.getElementById('columnModal');
    let body = document.getElementById('columnModalBody');
    
    // تهيئة selectedColumns.tab7 إذا لم تكن موجودة
    if (!selectedColumns.tab7) {
        selectedColumns.tab7 = availableColumnsTab7.tab7.filter(c => c.default).map(c => c.name);
    }
    
    let html = `<div class="select-all">
        <label style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="selectAllColumns"> <strong>تحديد الكل</strong>
        </label>
    </div>`;
    
    let cols = availableColumnsTab7.tab7;
    if (cols) {
        cols.forEach(col => {
            let isChecked = selectedColumns.tab7.includes(col.name) || 
                           (selectedColumns.tab7.length === 0 && col.default);
            html += `
                <div class="column-option">
                    <input type="checkbox" class="col-checkbox" value="${col.name}" id="col_${col.name.replace(/ /g, '_')}" ${isChecked ? 'checked' : ''}>
                    <label for="col_${col.name.replace(/ /g, '_')}">${col.label}</label>
                </div>
            `;
        });
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
    
    document.getElementById('selectAllColumns').onchange = (e) => {
        document.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = e.target.checked);
    };
    
    document.getElementById('applyColumnSelection').onclick = () => {
        let selected = [];
        document.querySelectorAll('.col-checkbox:checked').forEach(cb => selected.push(cb.value));
        selectedColumns.tab7 = selected;
        localStorage.setItem(`selectedColumns_tab7`, JSON.stringify(selected));
        closeColumnModal();
        
        // إعادة عرض الجدول مع الأعمدة المختارة
        if (currentData7 && currentData7.length > 0) {
            renderTable7WithSelectedColumns('bodyTab7', currentData7, 'searchTab7', 'typeTab7', 'statsTab7');
        }
    };
}

// دالة عرض جدول تبويب 7 مع الأعمدة المختارة
function renderTable7WithSelectedColumns(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["رقم الحاوية"]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["النوع"] === type;
        return matchSearch && matchType;
    });
    
    let selected = selectedColumns.tab7;
    if (!selected || selected.length === 0) {
        selected = availableColumnsTab7.tab7.filter(c => c.default).map(c => c.name);
    }
    
    // تحديث رأس الجدول
    let thead = document.querySelector('#tableTab7 thead tr');
    if (thead) {
        thead.innerHTML = '';
        selected.forEach(colName => {
            let col = availableColumnsTab7.tab7.find(c => c.name === colName);
            let th = document.createElement('th');
            th.textContent = col ? col.label : colName;
            thead.appendChild(th);
        });
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        let colspan = selected.length;
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; padding:40px;">⚠️ لا توجد بيانات</td></tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        selected.forEach(colName => {
            let cell = row.insertCell();
            let value = item[colName];
            
            if (["OOG", "مبرد", "خطير"].includes(colName)) {
                cell.textContent = value || "❌";
            } else if (colName === "نوع") {
                if (value === "IMPRT + FORWARD") {
                    cell.innerHTML = '<span style="background:#ff6b6b; color:white; padding:2px 10px; border-radius:12px;">IMPRT + FORWARD</span>';
                } else if (value === "TRSHP + FORWARD") {
                    cell.innerHTML = '<span style="background:#ffa07a; color:#333; padding:2px 10px; border-radius:12px;">TRSHP + FORWARD</span>';
                } else {
                    cell.innerHTML = '<span style="background:#667eea; color:white; padding:2px 10px; border-radius:12px;">IMPRT (VESSEL)</span>';
                }
            } else if (colName === "رقم الحاوية") {
                cell.textContent = value || "—";
                cell.style.fontWeight = "bold";
            } else if (colName === "النوع") {
                cell.innerHTML = `<strong>${value || "—"}</strong>`;
            } else if (["Days", "Free", "Net"].includes(colName)) {
                cell.textContent = value || "—";
                if (colName === "Days") cell.style.background = "#e3f2fd";
                if (colName === "Free") cell.style.background = "#fff3cd";
                if (colName === "Net") {
                    cell.style.background = "#d4edda";
                    cell.style.fontWeight = "bold";
                }
            } else {
                cell.textContent = value || "—";
            }
        });
    }
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && data.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab7(data);
        statsDiv.style.display = "flex";
    }
}
// ========== دوال حفظ وتحميل الملف ==========
function saveFileToLocalStorage(fileData, fileName) {
    try {
        localStorage.setItem("savedExcelFile", fileData);
        localStorage.setItem("savedExcelFileName", fileName);
        console.log("تم حفظ الملف:", fileName);
    } catch(e) {
        console.error("خطأ في حفظ الملف:", e);
    }
}

function loadLastFileFromStorage() {
    let savedFileData = localStorage.getItem("savedExcelFile");
    let savedFileName = localStorage.getItem("savedExcelFileName");
    
    if (savedFileData && savedFileName) {
        // تنظيف البيانات القديمة
        currentData1 = [];
        currentData2 = [];
        currentData3 = [];
        currentData4 = [];
        currentData5 = [];
        currentData6 = [];
        currentData7 = [];
        currentData8 = [];

        containersMap.clear();
        
        updateFileNameDisplay(savedFileName);
        
        let binaryString = atob(savedFileData);
        let bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        let workbook = XLSX.read(bytes, { type: 'array' });
        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        let rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 4 });
        
        console.log(`📄 عدد الصفوف المقروءة من الملف المحفوظ: ${rows.length}`);
        if (rows.length === 0) {
            document.getElementById("footerMsg").innerHTML = "⚠️ الملف المحفوظ فارغ";
            return;
        }
        
        // ===== 🆕 كشف نوع الملف =====
        let firstRow = rows[0];
        let keys = Object.keys(firstRow);
        console.log("🔍 أسماء الأعمدة في الملف المحفوظ:", keys);
        
        let hasUnitNbr = keys.some(k => k.trim() === "Unit Nbr");
        let hasEquipId = keys.some(k => k.trim() === "Equip ID");
        let isFinalout = hasUnitNbr && !hasEquipId;
        
        // ===== 🆕 فحص الحقول المطلوبة =====
        let fieldCheck = checkExcelFields(rows, isFinalout ? "finalout" : "main");
        if (!fieldCheck.valid) {
            console.log("❌ فشل تحميل الملف المحفوظ بسبب نقص الحقول");
            return;
        }
        
        // ===== 🆕 إذا كان الملف FINALOUT =====
        if (isFinalout) {
            console.log("📂 الملف المحفوظ هو FINALOUT - معالجة كملف finalout");
            processFinaloutFile(rows);
            
            document.getElementById("footerMsg").innerHTML = `✅ تم تحميل الملف المحفوظ (FINALOUT): ${savedFileName} | عدد الحاويات: ${currentData8.length}`;
            
            // تنشيط تبويب 8
            let tab8Div = document.getElementById("tab8");
            if (tab8Div) {
                tab8Div.classList.add("active");
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
                tab8Div.classList.add("active");
                document.querySelectorAll(".tab-btn").forEach(b => {
                    b.classList.remove("active");
                    if (b.dataset.tab === "tab8") b.classList.add("active");
                });
            }
            
            return;  // ← إيقاف المعالجة العادية
        }
        
        // ===== الملف الرئيسي (التبويبات 1-7) - المعالجة العادية =====
        console.log("📂 الملف المحفوظ هو الملف الرئيسي");
        
        for (let row of rows) {
            let equipId = row["Equip ID"];
            if (!equipId || equipId === "") continue;
            
            if (!containersMap.has(equipId)) {
                containersMap.set(equipId, {
                    equipId: equipId,
                    equipmentType: row["Equipment Type"] || "",
                    lineId: row["Line ID"] || "",
                    trshpList: [],
                    exprtList: [],
                    strge: null,
                    imprt: null,
                    trshpReturn: null,
                    notes: row["Notes"] || "",
                });
            }
            let c = containersMap.get(equipId);
            let cat = row["Category"];
            let drayStatus = row["Dray Status"] || "";
            
            if (cat === "TRSHP") {
                c.trshpList.push(row);
                if (drayStatus === "RETURN") {
                    c.trshpReturn = row;
                }
            }
            else if (cat === "EXPRT") {
                if (!c.exprtList) c.exprtList = [];
                c.exprtList.push(row);
            }
            else if (cat === "STRGE") c.strge = row;
            else if (cat === "IMPRT") c.imprt = row;
        }
        
        processAndDisplay1();
        processAndDisplay2();
        processAndDisplay3();
        processAndDisplay4();
        processAndDisplay5();
        processAndDisplay6();
        processAndDisplay7();
        processAndDisplay8();

        updateHeaderInfo('1');
        
        setTimeout(function() {
            if (selectedColumns.tab1 && selectedColumns.tab1.length > 0) {
                renderTable1WithSelectedColumns("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
            }
            if (selectedColumns.tab2 && selectedColumns.tab2.length > 0 && typeof renderTable2WithSelectedColumns === 'function') {
                renderTable2WithSelectedColumns("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2");
            }
            if (selectedColumns.tab3 && selectedColumns.tab3.length > 0 && typeof renderTable3WithSelectedColumns === 'function') {
                renderTable3WithSelectedColumns("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3");
            }
            if (selectedColumns.tab4 && selectedColumns.tab4.length > 0 && typeof renderTable4WithSelectedColumns === 'function') {
                renderTable4WithSelectedColumns("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4");
            }
            if (selectedColumns.tab5 && selectedColumns.tab5.length > 0 && typeof renderTable5WithSelectedColumns === 'function') {
                renderTable5WithSelectedColumns("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
            }
            if (selectedColumns.tab6 && selectedColumns.tab6.length > 0 && typeof renderTable6WithSelectedColumns === 'function') {
                renderTable6WithSelectedColumns("bodyTab6", currentData6, "searchTab6", "typeTab6", "statsTab6");
            }
        }, 200);
        
        document.getElementById("footerMsg").innerHTML = `✅ تم تحميل الملف المحفوظ: ${savedFileName} | TRSHP+EXPRT: ${currentData1.length} | STRGE+EXPRT+IMPRT: ${currentData2.length} | EXPRT فقط: ${currentData3.length} | STRGE فارغ: ${currentData4.length} | TRSHP فقط: ${currentData5.length} | STRGE+EXPRT فقط: ${currentData6.length}`;
    } else {
        console.log("لا يوجد ملف محفوظ سابقاً");
    }
	
}

// ========== دوال تحويل التواريخ والحسابات ==========
function convertDate(dateStr) {
    if (!dateStr || dateStr === "") return "";
    let str = dateStr.toString().trim();
    let yearShort = str.substring(0, 2);
    let month = str.substring(3, 6);
    let day = str.substring(7, 9);
    let year = 2000 + parseInt(yearShort);
    let months = { "Jan":"01","Feb":"02","Mar":"03","Apr":"04","May":"05","Jun":"06","Jul":"07","Aug":"08","Sep":"09","Oct":"10","Nov":"11","Dec":"12" };
    let monthNum = months[month] || "01";
    return `${year}/${monthNum}/${day}`;
}

function diffDays(start, end) {
    if (!start || !end) return 0;
    let s = new Date(start), e = new Date(end);
    if (isNaN(s) || isNaN(e)) return 0;
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

function sortPeriods(periods) {
    return periods.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

function updateEndDates(periods) {
    let groups = {};
    for (let p of periods) {
        // المفتاح يشمل Line ID، Dray Status، Flex String 01، و Hazardous
        let key = `${p.lineId}|${p.drayStatus || ""}|${p.flexString01 || ""}|${p.isHazardous || ""}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
    }
    
    let result = [];
    for (let key in groups) {
        let sorted = sortPeriods([...groups[key]]);
        for (let i = 0; i < sorted.length; i++) {
            if (i < sorted.length - 1) {
                let nextStart = new Date(sorted[i + 1].startDate);
                let prevEnd = new Date(nextStart);
                prevEnd.setDate(prevEnd.getDate() - 1);
                sorted[i].endDate = prevEnd.toISOString().split('T')[0];
            } else {
                sorted[i].endDate = "";
            }
            result.push(sorted[i]);
        }
    }
    return result;
}

function getFreeDays(periods, lineId, periodDate, flexString01, drayStatus, freightKind, isHazardous) {
    let cleanFreightKind = (freightKind || "").trim().toUpperCase();
    let isHazardousBool = (isHazardous === true || String(isHazardous).toLowerCase() === "true");

    let matchingPeriods = periods.filter(p => {
        let lineMatch = (p.lineId === lineId || p.lineId === "*");
        
        let flexMatch = true;
        if (p.flexString01 === "TRUE") flexMatch = (flexString01 === "TRUE");
        else if (p.flexString01 === "FALSE") flexMatch = (flexString01 !== "TRUE");
        
        let drayMatch = true;
        if (p.drayStatus === "RETURN") drayMatch = (drayStatus === "RETURN");
        else if (p.drayStatus === "FORWARD") drayMatch = (drayStatus === "FORWARD");
        else if (p.drayStatus === "EMPTY") drayMatch = (!drayStatus || drayStatus === "");
        
        let freightMatch = true;
        if (p.freightKind && p.freightKind !== "") {
            let periodFreightKind = p.freightKind.trim().toUpperCase();
            freightMatch = (periodFreightKind === cleanFreightKind);
        }
        
        // ===== التعديل هنا: مقارنة غير حساسة لحالة الأحرف =====
        let hazardMatch = true;
        if (p.isHazardous && p.isHazardous.toLowerCase() === "true") {
            hazardMatch = isHazardousBool;
        } else if (p.isHazardous && p.isHazardous.toLowerCase() === "false") {
            hazardMatch = !isHazardousBool;
        }
        
        return lineMatch && flexMatch && drayMatch && freightMatch && hazardMatch;
    });
    
    if (matchingPeriods.length === 0) return 0;
    
    let date = new Date(periodDate);
    let sorted = sortPeriods([...matchingPeriods]);
    
    for (let period of sorted) {
        let start = new Date(period.startDate);
        let end = period.endDate ? new Date(period.endDate) : null;
        if (end) {
            if (date >= start && date <= end) return period.freeDays;
        } else {
            if (date >= start) return period.freeDays;
        }
    }
    return 0;
}

function getEmptyStrgeFreeDays(periods, lineId, periodDate) {
    let matchingPeriods = periods.filter(p => {
        let lineMatch = (p.lineId === lineId || p.lineId === "*");
        return lineMatch;
    });
    
    if (matchingPeriods.length === 0) return 0;
    
    let date = new Date(periodDate);
    let sorted = sortPeriods([...matchingPeriods]);
    
    for (let period of sorted) {
        let start = new Date(period.startDate);
        let end = period.endDate ? new Date(period.endDate) : null;
        if (end) {
            if (date >= start && date <= end) return period.freeDays;
        } else {
            if (date >= start) return period.freeDays;
        }
    }
    return 0;
}

function isExcluded(lineId, excludeList) {
    return excludeList.includes(lineId);
}

function calculateDaysWithOverlapRemoved(start1, end1, start2, end2) {
    if (!start1 || !end1 || !start2 || !end2) return { net1: 0, net2: 0, overlap: 0 };
    let days1 = diffDays(start1, end1);
    let days2 = diffDays(start2, end2);
    let overlapStart = new Date(Math.max(new Date(start1), new Date(start2)));
    let overlapEnd = new Date(Math.min(new Date(end1), new Date(end2)));
    let overlapDays = 0;
    if (overlapStart <= overlapEnd) {
        overlapDays = diffDays(overlapStart.toISOString().split('T')[0], overlapEnd.toISOString().split('T')[0]);
    }
    let netDays1 = days1 - overlapDays;
    if (netDays1 < 0) netDays1 = 0;
    let netDays2 = days2;
    return { net1: netDays1, net2: netDays2, overlap: overlapDays };
}

function calculateWithOverlap(days1, free1, days2, free2) {
    let maxFree = Math.max(free1, free2);
    let deduction2 = Math.min(days2, free2);
    let net2 = days2 - deduction2;
    if (net2 < 0) net2 = 0;
    let remainingFree = maxFree - deduction2;
    if (remainingFree < 0) remainingFree = 0;
    let deduction1 = Math.min(days1, remainingFree);
    let net1 = days1 - deduction1;
    if (net1 < 0) net1 = 0;
    return { net1, net2, total: net1 + net2 };
}

function calculateIndependent(days1, free1, days2, free2) {
    let net1 = days1 - free1;
    if (net1 < 0) net1 = 0;
    let net2 = days2 - free2;
    if (net2 < 0) net2 = 0;
    return { net1, net2, total: net1 + net2 };
}

function renderAdvancedStats(data) {
    // ================================================
    // استبعاد الحالات: O/B Loc Type = TRUCK
    // ================================================
    let validData = data.filter(item => {
        // استبعاد إذا كان O/B Loc Type = TRUCK
        if (item["O/B Loc Type"] === "TRUCK") return false;
        
        let exprNet = item["EXPRT Net"];
        return typeof exprNet === "number" && !isNaN(exprNet);
    });
    
    // إذا لم توجد بيانات صالحة، اعرض رسالة
    if (validData.length === 0) {
        return `<div style="padding:20px; text-align:center;">لا توجد بيانات EXPRT صالحة</div>`;
    }
    
    let totalTrshpNet = validData.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0);
    let totalExprtNet = validData.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    
    // ========== Flex String 01 ==========
    let flexTrueContainers = validData.filter(i => i["Flex String 01"] === "TRUE");
    let flexTrueExprtNet = flexTrueContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexTrueCount = flexTrueContainers.length;
    
    let flexFalseContainers = validData.filter(i => i["Flex String 01"] === "FALSE");
    let flexFalseExprtNet = flexFalseContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexFalseCount = flexFalseContainers.length;
    
    // ========== Dray Status ==========
    let exprtNoDray = validData.filter(i => (i["Dray Status"] || "") === "");
    let exprtNoDrayNet = exprtNoDray.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let exprtNoDrayCount = exprtNoDray.length;
    
    let exprtWithDray = validData.filter(i => (i["Dray Status"] || "") !== "");
    let exprtWithDrayNet = exprtWithDray.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let exprtWithDrayCount = exprtWithDray.length;
    
    // ========== Is OOG ==========
    let oogContainers = validData.filter(i => i["Is OOG"] === "true");
    let oogExprtNet = oogContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let oogCount = oogContainers.length;
    
    // ========== Is Hazardous ==========
    let hazardousContainers = validData.filter(i => i["Is Hazardous"] === "true");
    let hazardousExprtNet = hazardousContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let hazardousCount = hazardousContainers.length;
    
    // ========== إجمالي EXPRT بعد خصم Flex TRUE ==========
    let totalExprtNetAfterDeduction = totalExprtNet - flexTrueExprtNet;
    
    // ========== باقي الإحصائيات ==========
    let refrigeratedContainers = validData.filter(i => i["Is Refrigerated"] === "true");
    let rfExprtDays = refrigeratedContainers.reduce((s, i) => s + (i["EXPRT Days"] || 0), 0);
// ===== 🆕 عدّ الحاويات الفريدة بدلاً من الصفوف =====
let uniqueContainerSet = new Set(validData.map(item => item["Container No."]));
let totalCount = uniqueContainerSet.size;

// احتفظ بالمصفوفات الأصلية (للتوافق مع باقي الكود)
let size20Containers = validData.filter(i => (i["Size"] || "").toString().startsWith("2"));
let size40Containers = validData.filter(i => {
    let s = (i["Size"] || "").toString();
    return s.startsWith("4") || s.startsWith("95");
});

// 🆕 استخدم Sets لحساب الحاويات الفريدة
let size20Unique = new Set(size20Containers.map(i => i["Container No."]));
let size40Unique = new Set(size40Containers.map(i => i["Container No."]));
let size20Count = size20Unique.size;
let size40Count = size40Unique.size;
    let size20TrshpNet = size20Containers.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0);
    let size40TrshpNet = size40Containers.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0);
    
    let refrigerated40 = refrigeratedContainers.filter(i => i["Size"]?.toString().startsWith("4"));
    let refrigerated40Count = refrigerated40.length;
    let refrigerated40Days = refrigerated40.reduce((s, i) => s + (i["EXPRT Days"] || 0), 0);
    
    // تفاصيل Dray Status حسب المقاس
    let size20NoDray = exprtNoDray.filter(i => i["Size"]?.toString().startsWith("2"));
    let size40NoDray = exprtNoDray.filter(i => i["Size"]?.toString().startsWith("4"));
    let size20NoDrayNet = size20NoDray.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let size40NoDrayNet = size40NoDray.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    
    let size20WithDray = exprtWithDray.filter(i => i["Size"]?.toString().startsWith("2"));
    let size40WithDray = exprtWithDray.filter(i => i["Size"]?.toString().startsWith("4"));
    let size20WithDrayNet = size20WithDray.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let size40WithDrayNet = size40WithDray.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    
    // تفاصيل OOG وحسب المقاس
    let oog20 = oogContainers.filter(i => i["Size"]?.toString().startsWith("2"));
    let oog40 = oogContainers.filter(i => i["Size"]?.toString().startsWith("4"));
    let oog20Net = oog20.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let oog40Net = oog40.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    
    // تفاصيل Hazardous حسب المقاس
    let hazardous20 = hazardousContainers.filter(i => i["Size"]?.toString().startsWith("2"));
    let hazardous40 = hazardousContainers.filter(i => i["Size"]?.toString().startsWith("4"));
    let hazardous20Net = hazardous20.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let hazardous40Net = hazardous40.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    
    // تفاصيل Flex حسب المقاس
    let flexTrue20 = flexTrueContainers.filter(i => i["Size"]?.toString().startsWith("2"));
    let flexTrue40 = flexTrueContainers.filter(i => i["Size"]?.toString().startsWith("4"));
    let flexTrue20Net = flexTrue20.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexTrue40Net = flexTrue40.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    
    return `
        <div style="display: flex; gap: 10px; margin: 0 25px 15px 25px; flex-wrap: wrap;">
            
            <!-- بطاقة 1: TRSHP -->
            <div style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; padding: 8px 12px; text-align: center; color: white;">
                <div style="font-size: 11px;">🚛 إجمالي TRSHP</div>
                <div style="font-size: 22px; font-weight: bold;">${totalTrshpNet}</div>
                <div style="font-size: 9px;">صافي أيام الترانزيت</div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 9px;">
                    <div>📦 20 قدم: ${size20TrshpNet} يوم</div>
                    <div>📦 40 قدم: ${size40TrshpNet} يوم</div>
                </div>
            </div>
            
            <!-- بطاقة 2: EXPRT (بعد خصم Flex TRUE) مع إضافة OOG و Hazardous -->
            <div style="flex: 1; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 8px; padding: 8px 12px; text-align: center; color: white;">
                <div style="font-size: 11px;">📤 إجمالي EXPRT (بعد الخصم)</div>
                <div style="font-size: 22px; font-weight: bold;">${totalExprtNetAfterDeduction}</div>
                <div style="font-size: 9px;">صافي أيام التصدير</div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 9px;">
                    <div style="font-weight: bold;">📋 بدون Dray Status:</div>
                    <div>📦 20 قدم: ${size20NoDrayNet} يوم</div>
                    <div>📦 40 قدم: ${size40NoDrayNet} يوم</div>
                    <div style="font-weight: bold; margin-top: 5px;">📐 OOG:</div>
                    <div>📦 20 قدم: ${oog20Net} يوم (${oog20.length} حاوية)</div>
                    <div>📦 40 قدم: ${oog40Net} يوم (${oog40.length} حاوية)</div>
                    <div style="font-weight: bold; margin-top: 5px;">⚠️ Hazardous:</div>
                    <div>📦 20 قدم: ${hazardous20Net} يوم (${hazardous20.length} حاوية)</div>
                    <div>📦 40 قدم: ${hazardous40Net} يوم (${hazardous40.length} حاوية)</div>
                </div>
            </div>
            
            <!-- بطاقة 3: Dray Status & Flex String (منفصلة) -->
            <div style="flex: 1; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
                <div style="background: #ff6b6b; color: white; padding: 6px; text-align: center; font-weight: bold; font-size: 10px;">
                    📊 ReExport_Storage
                </div>
                <div style="padding: 8px;">
                    <div style="margin-bottom: 8px;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 4px; font-size: 10px;">🚚 Dray Status:</div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <div style="flex: 1; background: #fef3c7; border-radius: 6px; padding: 5px; text-align: center;">
                                <div style="font-size: 10px; color: #666;">🚚 مع Dray</div>
                                <div style="font-size: 16px; font-weight: bold; color: #ffc107;">${exprtWithDrayNet}</div>
                                <div style="font-size: 9px;">(${exprtWithDrayCount} حاوية)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-weight: bold; color: #333; margin-bottom: 4px; font-size: 10px;">⭐ Flex String 01:</div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <div style="flex: 1; background: #ffebee; border-radius: 6px; padding: 5px; text-align: center;">
                                <div style="font-size: 10px; color: #666;">⭐ TRUE (خاص)</div>
                                <div style="font-size: 16px; font-weight: bold; color: #ff6b6b;">${flexTrueExprtNet}</div>
                                <div style="font-size: 9px;">${flexTrueCount} حاوية</div>
                                <div style="font-size: 8px; color: #888;">20:${flexTrue20Net} | 40:${flexTrue40Net}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- بطاقة 4: EXPRT ثلاجه -->
            <div style="flex: 1; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 8px; padding: 8px 12px; text-align: center; color: white;">
                <div style="font-size: 11px;">❄️ أيام EXPRT (ثلاجه)</div>
                <div style="font-size: 22px; font-weight: bold;">${rfExprtDays}</div>
                <div style="font-size: 9px;">للحاويات ثلاجه فقط</div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 9px;">
                    <div>📦 إجمالي العدد: ${refrigeratedContainers.length} حاوية</div>
                    <div>📦 40 قدم: ${refrigerated40Count} حاوية (${refrigerated40Days} يوم)</div>
                </div>
            </div>
            
            <!-- بطاقة 5: إجمالي الحاويات -->
            <div style="flex: 1; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 8px; padding: 8px 12px; text-align: center; color: white;">
                <div style="font-size: 11px;">📦 إجمالي الحاويات</div>
                <div style="font-size: 22px; font-weight: bold;">${totalCount}</div>
                <div style="font-size: 9px;">حاوية</div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 9px;">
                    <div>📦 20 قدم: ${size20Count} حاوية</div>
                    <div>📦 40 قدم: ${size40Count} حاوية</div>
                </div>
            </div>
        </div>
    `;
}

// ========== دالة عرض الجدول الرئيسية ==========
function renderTable1WithStats(tbodyId, data, searchId, typeId, statsId) {
    // التحقق من وجود البيانات
    if (!data || data.length === 0) {
        console.log("لا توجد بيانات للتبويب 1");
        return;
    }
    
    // التحقق من وجود العناصر
    let tbody = document.getElementById(tbodyId);
    let statsDiv = document.getElementById(statsId);
    let searchInput = document.getElementById(searchId);
    let typeSelect = document.getElementById(typeId);
    
    if (!tbody) {
        console.error("tbody غير موجود:", tbodyId);
        return;
    }
    
    // فلترة البيانات
    let search = searchInput ? searchInput.value.toLowerCase() : "";
    let type = typeSelect ? typeSelect.value : "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."] ? item["Container No."].toLowerCase().includes(search) : false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    // عرض الإحصائيات
    if (statsDiv) {
        statsDiv.innerHTML = renderAdvancedStats(data);
        statsDiv.style.display = "block";
    }
    
    // تفريغ الجدول
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="26" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات تطابق البحث<\/td><\/tr>`;
        return;
    }
    
    // عرض البيانات
for (let i = 0; i < filtered.length; i++) {
    let item = filtered[i];
    let row = tbody.insertRow();
    
    // ========== إضافة: الرقم التسلسلي ==========
    let cellSerial = row.insertCell();
    cellSerial.textContent = i + 1;
    cellSerial.style.fontWeight = "bold";
    cellSerial.style.backgroundColor = "#f8f9fa";
    cellSerial.style.width = "40px";
    cellSerial.style.textAlign = "center";
    // ========== نهاية الإضافة ==========
    
    // 1. Container No.
    let cell1 = row.insertCell();
    cell1.textContent = item["Container No."] || "—";
        cell1.style.fontWeight = "bold";
        
        // 2. Size
        let cell2 = row.insertCell();
        cell2.textContent = item["Size"] || "—";
        
        // 3. Is OOG
        let cell3 = row.insertCell();
        cell3.textContent = item["Is OOG"] === "true" ? "✅" : "❌";
        
        // 4. Is Refrigerated
        let cell4 = row.insertCell();
        cell4.textContent = item["Is Refrigerated"] === "true" ? "✅" : "❌";
        
		// بعد خلية Is Refrigerated
let cellFlex04 = row.insertCell();
cellFlex04.textContent = item["flex_04"] || "—";
		
        // 5. Is Bundled
        let cell5 = row.insertCell();
        cell5.textContent = item["Is Bundled"] === "true" ? "✅" : "❌";
        
        // 6. Is Hazardous
        let cell6 = row.insertCell();
        cell6.textContent = item["Is Hazardous"] === "true" ? "✅" : "❌";
        
        // 7. IMDG Class
        let cell7 = row.insertCell();
        cell7.textContent = item["IMDG Class"] || "—";
        
        // 8. Type
        let cell8 = row.insertCell();
        cell8.innerHTML = `<strong>${item["Type"] || "—"}</strong>`;
        
        // 9. Line ID
        let cell9 = row.insertCell();
        cell9.textContent = item["Line ID"] || "—";
        
        // 10. طريقة الحساب
        let cell10 = row.insertCell();
        let methodClass = item["طريقة الحساب"] === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
        cell10.innerHTML = `<span class="${methodClass}">${item["طريقة الحساب"] || "—"}</span>`;
        
        // 11. Flex String 01 (جديد)
        let cell11 = row.insertCell();
        let flexValue = item["Flex String 01"] || "—";
        if (flexValue === "TRUE") {
            cell11.innerHTML = `<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>`;
        } else if (flexValue === "FALSE") {
            cell11.innerHTML = `<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>`;
        } else {
            cell11.textContent = "—";
        }
        
// 12. TRSHP Start (انتقلت من 13 إلى 12)
let cell12 = row.insertCell();
cell12.textContent = item["TRSHP Start"] || "—";

// 13. TRSHP End
let cell13 = row.insertCell();
cell13.textContent = item["TRSHP End"] || "—";

// 14. TRSHP Days
let cell14 = row.insertCell();
cell14.textContent = item["TRSHP Days"] || "—";
cell14.style.background = "#e3f2fd";

// 15. Overlap
let cell15 = row.insertCell();
cell15.textContent = item["Overlap"] || "—";
cell15.style.background = "#f8d7da";

// 16. TRSHP After Overlap
let cell16 = row.insertCell();
cell16.textContent = item["TRSHP After Overlap"] || "—";
cell16.style.background = "#fff3cd";

// 17. TRSHP Free
let cell17 = row.insertCell();
cell17.textContent = item["TRSHP Free"] || "—";
cell17.style.background = "#fff3cd";

// 18. TRSHP Net
let cell18 = row.insertCell();
cell18.textContent = item["TRSHP Net"] || "—";
cell18.style.background = "#d4edda";

// 19. EXPRT Start
let cell19 = row.insertCell();
cell19.textContent = item["EXPRT Start"] || "—";

// 20. EXPRT End
let cell20 = row.insertCell();
cell20.textContent = item["EXPRT End"] || "—";

// 21. EXPRT Days
let cell21 = row.insertCell();
cell21.textContent = item["EXPRT Days"] || "—";
cell21.style.background = "#e3f2fd";

// 22. EXPRT Free
let cell22 = row.insertCell();
cell22.textContent = item["EXPRT Free"] || "—";
cell22.style.background = "#fff3cd";

// 23. EXPRT Net
let cell23 = row.insertCell();
cell23.textContent = item["EXPRT Net"] || "—";
cell23.style.background = "#d4edda";

// 24. Total Net
let cell24 = row.insertCell();
cell24.textContent = item["Total Net"] || "—";
cell24.style.background = "#cce5ff";
cell24.style.fontWeight = "bold";

// 25. Vessel Name (آخر عمود)
let cell25 = row.insertCell();
cell25.textContent = item["Vessel Name"] || "—";
    }
    
    // إظهار العناصر
    let filtersDiv = document.getElementById("filtersTab1");
    let wrapperDiv = document.getElementById("wrapperTab1");
    if (filtersDiv) filtersDiv.style.display = "flex";
    if (wrapperDiv) wrapperDiv.style.display = "block";
}

// ========== دالة عرض الجدول مع اختيار الأعمدة ==========
function renderTable1WithSelectedColumns(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."].toLowerCase().includes(search);
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let selected = selectedColumns.tab1;
    if (selected.length === 0) {
        selected = availableColumns.tab1.filter(c => c.default).map(c => c.name);
    }
    
    let thead = document.querySelector('#tableTab1 thead tr');
    if (thead) {
        thead.innerHTML = '';
        selected.forEach(colName => {
            let col = availableColumns.tab1.find(c => c.name === colName);
            let th = document.createElement('th');
            th.textContent = col ? col.label : colName;
            thead.appendChild(th);
        });
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${selected.length}" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td><\/tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        selected.forEach(colName => {
            let cell = row.insertCell();
            let value = item[colName];
            
            if (["Is OOG", "Is Refrigerated", "Is Bundled", "Is Hazardous"].includes(colName)) {
                cell.textContent = value === "true" ? "✅" : "❌";
            } else if (colName === "طريقة الحساب") {
                let methodClass = value === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
                cell.innerHTML = `<span class="${methodClass}">${value || "—"}</span>`;
            } else if (colName === "Container No.") {
                cell.textContent = value || "—";
                cell.style.fontWeight = "bold";
            } else if (colName === "Type") {
                cell.innerHTML = `<strong>${value || "—"}</strong>`;
            } else {
                cell.textContent = value || "—";
            }
            
            if (["TRSHP Days", "EXPRT Days"].includes(colName)) cell.style.background = "#e3f2fd";
            if (colName === "Overlap") cell.style.background = "#f8d7da";
            if (["TRSHP After Overlap", "TRSHP Free", "EXPRT Free"].includes(colName)) cell.style.background = "#fff3cd";
            if (["TRSHP Net", "EXPRT Net"].includes(colName)) cell.style.background = "#d4edda";
            if (colName === "Total Net") {
                cell.style.background = "#cce5ff";
                cell.style.fontWeight = "bold";
            }
        });
    }
    
    // الإحصائيات تبقى كما هي دون تغيير
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && statsDiv.innerHTML === "") {
        statsDiv.innerHTML = renderAdvancedStats(data);
        statsDiv.style.display = "block";
    }
}

// ========== دوال نافذة اختيار الأعمدة ==========
function openColumnModal(tabId) {
    let modal = document.getElementById('columnModal');
    let body = document.getElementById('columnModalBody');
    
    let html = `<div class="select-all">
        <label style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="selectAllColumns"> <strong>تحديد الكل</strong>
        </label>
    </div>`;
    
    let cols = availableColumns[tabId];
    if (cols) {
        cols.forEach(col => {
            let isChecked = selectedColumns[tabId].includes(col.name) || 
                           (selectedColumns[tabId].length === 0 && col.default);
            html += `
                <div class="column-option">
                    <input type="checkbox" class="col-checkbox" value="${col.name}" id="col_${col.name.replace(/ /g, '_')}" ${isChecked ? 'checked' : ''}>
                    <label for="col_${col.name.replace(/ /g, '_')}">${col.label}</label>
                </div>
            `;
        });
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
    
    document.getElementById('selectAllColumns').onchange = (e) => {
        document.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = e.target.checked);
    };
    
    document.getElementById('applyColumnSelection').onclick = () => {
        let selected = [];
        document.querySelectorAll('.col-checkbox:checked').forEach(cb => selected.push(cb.value));
        selectedColumns[tabId] = selected;
        
        localStorage.setItem(`selectedColumns_${tabId}`, JSON.stringify(selected));
        console.log(`تم حفظ تفضيلات التبويب ${tabId}:`, selected);
        
        closeColumnModal();
        renderTable1WithSelectedColumns('bodyTab1', currentData1, 'searchTab1', 'typeTab1', 'statsTab1');
    };
}

function closeColumnModal() {
    document.getElementById('columnModal').classList.remove('active');
}

// ========== دوال معالجة البيانات ==========
document.getElementById("fileInput").addEventListener("change", function(e) {
    let file = e.target.files[0];
    if (!file) return;
    processExcelFile(file); // استدعاء الدالة المعدلة
});

// ============================================================
// 🔧 دالة لحساب أيام TRSHP مع خصم اليوم المشترك بين الفترات المتتالية
// ============================================================
function getAdjustedTrshpDays(period, allPeriods) {
    let start = convertDate(period["Start Time"] || "");
    let end = convertDate(period["End Time"] || "");
    let days = diffDays(start, end);
    
    if (!start || !end) return days;
    
    // هل توجد فترة أخرى تنتهي في نفس يوم بداية هذه الفترة؟
    let sharedWithPrev = allPeriods.some(other => {
        if (other === period) return false;
        let otherEnd = convertDate(other["End Time"] || "");
        // التحقق من أن الفترة الأخرى تختلف عن الحالية
        let otherStart = convertDate(other["Start Time"] || "");
        if (otherStart === start && otherEnd === end) return false;
        return otherEnd === start;
    });
    
    if (sharedWithPrev) {
        days = days - 1;
        if (days < 0) days = 0;
    }
    
    return days;
}

function processAndDisplay1() {
    let result = [];
    
    for (let [id, container] of containersMap.entries()) {
        let trshpArray = container.trshpList || [];
        let exprtList = container.exprtList || [];
        
        if (trshpArray.length === 0 || exprtList.length === 0) continue;
        
        let hasReturnTrshp = trshpArray.some(tr => (tr["Dray Status"] || "") === "RETURN");
        if (hasReturnTrshp) continue;
        
        // ترتيب فترات TRSHP حسب التاريخ
        let sortedTrshp = [...trshpArray].sort((a, b) => 
            new Date(convertDate(a["Start Time"])) - new Date(convertDate(b["Start Time"]))
        );
        
        // حساب السماح الكلي من أول VESSEL
        let totalFreeDays = 0;
        let lineId = container.lineId || "";
        
        // حساب السماح الكلي من أول VESSEL مع مراعاة Flex String 01 من TRSHP أو EXPRT
        let foundVessel = false;
        for (let tr of sortedTrshp) {
            let ibLocType = tr["I/B Loc Type"] || "";
            if (ibLocType === "VESSEL") {
                let flexString01 = tr["Flex String 01"] || "";
                if (flexString01 === "") {
                    for (let ex of exprtList) {
                        let obLocType = (ex["O/B Loc Type"] || "").trim().toUpperCase();
                        if (obLocType !== "TRUCK") {
                            flexString01 = ex["Flex String 01"] || "";
                            break;
                        }
                    }
                }
                let drayStatus = tr["Dray Status"] || "";
                let hazardousFlag = (tr["Is Hazardous"] === "true" || tr["Is Hazardous"] === true);
                totalFreeDays = getFreeDays(trshpPeriods1, lineId, convertDate(tr["Start Time"]), flexString01, drayStatus, "", hazardousFlag);
                foundVessel = true;
                break;
            }
        }
        // إذا لم نجد VESSEL، نأخذ من أول TRSHP
        if (!foundVessel && sortedTrshp.length > 0) {
            let firstTr = sortedTrshp[0];
            let flexString01 = firstTr["Flex String 01"] || "";
            if (flexString01 === "") {
                for (let ex of exprtList) {
                    let obLocType = (ex["O/B Loc Type"] || "").trim().toUpperCase();
                    if (obLocType !== "TRUCK") {
                        flexString01 = ex["Flex String 01"] || "";
                        break;
                    }
                }
            }
            let drayStatus = firstTr["Dray Status"] || "";
            let hazardousFlag = (firstTr["Is Hazardous"] === "true" || firstTr["Is Hazardous"] === true);
            totalFreeDays = getFreeDays(trshpPeriods1, lineId, convertDate(firstTr["Start Time"]), flexString01, drayStatus, "", hazardousFlag);
        }
        
        if (totalFreeDays === 0 && sortedTrshp.length > 0) {
            let firstTr = sortedTrshp[0];
            let flexString01 = firstTr["Flex String 01"] || "";
            let drayStatus = firstTr["Dray Status"] || "";
            let hazardousFlag = (firstTr["Is Hazardous"] === "true" || firstTr["Is Hazardous"] === true);
            totalFreeDays = getFreeDays(trshpPeriods1, lineId, convertDate(firstTr["Start Time"]), flexString01, drayStatus, "", hazardousFlag);
        }

        
        // ترتيب الفترات حسب I/B Loc Type: VESSEL أولاً ثم TRUCK
        let vesselPeriods = [];
        let truckPeriods = [];
        
        for (let tr of sortedTrshp) {
            let ibLocType = tr["I/B Loc Type"] || "";
            if (ibLocType === "VESSEL") {
                vesselPeriods.push(tr);
            } else {
                truckPeriods.push(tr);
            }
        }
        
vesselPeriods.sort((a, b) => 
    new Date(convertDate(a["Start Time"])) - new Date(convertDate(b["Start Time"]))
);
truckPeriods.sort((a, b) => 
    new Date(convertDate(a["Start Time"])) - new Date(convertDate(b["Start Time"]))
);
        
        let orderedForDeduction = [...vesselPeriods, ...truckPeriods];
        
        // ===================================================
        // بناء periodFreeMap لتوزيع السماح على فترات TRSHP
        // ===================================================
let remainingFree = totalFreeDays;
let periodFreeMap = new Map();

for (let tr of orderedForDeduction) {
    let trStart = convertDate(tr["Start Time"]);
    let trEnd = convertDate(tr["End Time"]);
    // 🆕 استخدام الدالة المعدلة لخصم اليوم المشترك
    let trDays = getAdjustedTrshpDays(tr, trshpArray);
    let key = trStart + "|" + trEnd;
    
    let deduction = Math.min(trDays, remainingFree);
    periodFreeMap.set(key, deduction);
    remainingFree -= deduction;
}
        // ===================================================
        
        // ===================================================
        // حساب isExcl (يجب أن يكون قبل استخدامه)
        // ===================================================
        let isExcl = isExcluded(lineId, excludeLines1);
        // ===================================================
        
        // ===================================================
        // حساب EXPRT Free من أول EXPRT (للخصم من السماح الكلي)
        // ===================================================
        let exFreeForDeduction = 0;
        for (let ex of exprtList) {
            let obLocType = (ex["O/B Loc Type"] || "").trim().toUpperCase();
            let isTruck = (obLocType === "TRUCK");
            if (!isTruck) {
                let exStart = convertDate(ex["Rule Start Time"] || "");
                let flexString01 = ex["Flex String 01"] || "";
                let hazardousFlag = (ex["Is Hazardous"] === "true" || ex["Is Hazardous"] === true);
                exFreeForDeduction = getFreeDays(exprtPeriods1, lineId, exStart, flexString01, "", "", hazardousFlag);
                break;
            }
        }
        
        // حساب إجمالي أيام EXPRT
        let totalExprtDays = 0;
        for (let ex of exprtList) {
            let exStart = convertDate(ex["Rule Start Time"] || "");
            let exEnd = convertDate(ex["Rule End Time"] || "");
            totalExprtDays += diffDays(exStart, exEnd);
        }
        
        // ===================================================
        // السماح المتبقي بعد خصم EXPRT (مع مراعاة السماح المستقل)
        // ===================================================
        let remainingFreeForTrshp;
        if (isExcl) {
            // سماح مستقل → لا نخصم EXPRT من سماح TRSHP
            remainingFreeForTrshp = totalFreeDays;
        } else {
            // سماح متداخل → نخصم EXPRT من سماح TRSHP
            remainingFreeForTrshp = totalFreeDays - Math.min(totalExprtDays, exFreeForDeduction);
        }
        // ===================================================
        
        // ===================================================
        // توزيع السماح المتبقي على فترات TRSHP (يبدأ من أول فترة)
        // ===================================================
        let remainingFreeTrshp = remainingFreeForTrshp;
        
// 🆕 ترتيب trshpArray تصاعدياً (الأقدم أولاً) قبل الحلقة
let trshpArraySorted = [...trshpArray].sort((a, b) => {
    let aDate = new Date(convertDate(a["Start Time"] || ""));
    let bDate = new Date(convertDate(b["Start Time"] || ""));
    return aDate - bDate;
});

for (let tr of trshpArraySorted) {
    let drayStatus = tr ? (tr["Dray Status"] || "") : "";
    let isReturn = (drayStatus === "RETURN");
    
    if (isReturn) continue;
            
            // حساب trDaysTotal لهذه الفترة
            let trStart = convertDate(tr["Start Time"] || "");
            let trEnd = convertDate(tr["End Time"] || "");
            // 🆕 استخدام الأيام المعدلة (خصم اليوم المشترك)
let trDaysTotal = getAdjustedTrshpDays(tr, trshpArray);
            
            // خصم السماح المتبقي من هذه الفترة
            let deduction = Math.min(trDaysTotal, remainingFreeTrshp);
            let trNetPeriod = trDaysTotal - deduction;
            remainingFreeTrshp -= deduction;
            
            // ===================================================
            // الحصول على سماح TRSHP (مع مراعاة الاستثناء)
            // ===================================================
            let key = trStart + "|" + trEnd;
            let trFree = totalFreeDays;  // السماح الكلي في جميع الحالات
            // ===================================================
            
            for (let ex of exprtList) {
                let exDrayStatus = ex["Dray Status"] || "";
                let isReturnDray = (exDrayStatus === "RETURN");
                
                let exStart = convertDate(ex["Rule Start Time"] || "");
                let exEnd = convertDate(ex["Rule End Time"] || "");
                
                if (!trStart || !trEnd || !exStart || !exEnd) continue;
                
                let overlapResult = calculateDaysWithOverlapRemoved(trStart, trEnd, exStart, exEnd);
                let trDaysAfterOverlap = overlapResult.net1;
                let exDays = overlapResult.net2;
                let overlapDays = overlapResult.overlap;
                
                let flexString01 = ex["Flex String 01"] || tr["Flex String 01"] || "";
                
                // ===================================================
                // حساب EXPRT Free (مع مراعاة الاستثناء)
                // ===================================================
                let obLocType = (ex["O/B Loc Type"] || "").trim().toUpperCase();
                let isTruck = (obLocType === "TRUCK");

                let hazardousFlag = (ex["Is Hazardous"] === "true" || ex["Is Hazardous"] === true);
                let exFree;
                if (isExcl) {
                    // في حالة السماح المستقل، نعرض سماح EXPRT من الإعدادات
                    exFree = getFreeDays(exprtPeriods1, lineId, exStart, flexString01, drayStatus, "", hazardousFlag);
                } else if (isTruck) {
                    exFree = 0;
                } else {
                    exFree = getFreeDays(exprtPeriods1, lineId, exStart, flexString01, drayStatus, "", hazardousFlag);
                }
                // ===================================================
                
                // ===================================================
                // خصم الأيام المشتركة من TRSHP و EXPRT
                // ===================================================
                let exNet = exDays - Math.min(exDays, exFree);
                if (exNet < 0) exNet = 0;
                // لا نخصم overlapDays من EXPRT

                let trNet = trNetPeriod - overlapDays;
                if (trNet < 0) trNet = 0;
                // ===================================================
                
                let resultCalc = { net1: trNet, net2: exNet, total: trNet + exNet };
                
                let method = isExcl ? "🚫 سماح مستقل" : "🔄 تداخل سماح";
                
                let equipType = container.equipmentType;
                let sizeRaw = equipType.toString().trim();
let size = sizeRaw.match(/^(\d+)/)?.[1] || "";

if (!size) {
    if (sizeRaw.startsWith("L5")) size = "45";
    else if (sizeRaw.startsWith("L4")) size = "40";
    else if (sizeRaw.startsWith("L2")) size = "20";
}
                let vesselName = tr["I/B Carrier Name"] || "";
                let lineName = ex["Line ID"] || "";
                
                let isRefrigerated = ex["Is Refrigerated"] || "";
                let type = (isRefrigerated === "true" || equipType.includes("R1")) ? "RF" : "GP";
                let isOOG = ex["Is OOG"] || "";
                let isBundled = ex["Is Bundled"] || "";
                let isHazardous = ex["Is Hazardous"] || "";
                let imdgClass = ex["IMDG Class"] || "";
                
                let isVessel = (tr["I/B Loc Type"] || "") === "VESSEL";
                
                let hasOtherPeriods = false;
                for (let otherTr of trshpArray) {
                    if (otherTr !== tr) {
                        let otherType = otherTr["I/B Loc Type"] || "";
                        if (otherType === "TRUCK" || otherType === "TRSHP") {
                            hasOtherPeriods = true;
                            break;
                        }
                    }
                }
                
                let hideExprt = isVessel && hasOtherPeriods;
                
                result.push({
                    "Container No.": id,
                    "Size": size,
                    "Is OOG": isOOG,
                    "Is Refrigerated": isRefrigerated,
                    "flex_04": ex["Flex String 04"] || "",
                    "Is Bundled": isBundled,
                    "Is Hazardous": isHazardous,
                    "IMDG Class": imdgClass,
                    "Type": type,
                    "Line ID": lineName,
                    "طريقة الحساب": method,
                    "Flex String 01": flexString01,
                    "O/B Loc Type": ex["O/B Loc Type"] || "",
                    "Vessel Name": isReturnDray ? "RETURN" : vesselName,
                    "TRSHP Start": trStart,
                    "TRSHP End": trEnd,
                    "TRSHP Days": trDaysTotal,
                    "Overlap": overlapDays,
                    "TRSHP After Overlap": trDaysAfterOverlap,
                    "TRSHP Free": trFree,
                    "TRSHP Net": trNet,
                    "EXPRT Start": hideExprt ? "—" : exStart,
                    "EXPRT End": hideExprt ? "—" : exEnd,
                    "EXPRT Days": hideExprt ? 0 : exDays,
                    "EXPRT Free": hideExprt ? 0 : exFree,
                    "EXPRT Net": hideExprt ? 0 : exNet,
                    "Total Net": hideExprt ? trNet : resultCalc.total
                });
            }
        }
        // ===================================================
    }
    
    currentData1 = result;
    renderTable1WithStats("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
    updateHeaderFromDisplayData('1', currentData1);
}

function processAndDisplay2() {
    let result = [];
    
    for (let [id, container] of containersMap.entries()) {
        let imprtData = container.imprt || container.trshpReturn;
        
        // ========== التعديل: تحويل إلى مصفوفة ==========
        let exprtList = container.exprtList || [];
        if (container.exprt && exprtList.length === 0) {
            exprtList = [container.exprt];
        }
        
        if (!imprtData || exprtList.length === 0) continue;
        
        let imStart = convertDate(imprtData["Start Time"] || "");
        let imEnd = convertDate(imprtData["End Time"] || "");
        
        if (!imStart || !imEnd) continue;
        
        let imDays = diffDays(imStart, imEnd);
        let imprtType = container.imprt ? "IMPRT" : "TRSHP-RETURN";
        
        // ========== التعديل: التكرار على كل EXPRT ==========
        for (let ex of exprtList) {
            let exStart = convertDate(ex["Rule Start Time"] || "");
            let exEnd = convertDate(ex["Rule End Time"] || "");
            
            if (!exStart || !exEnd) continue;
            
            let lineId = container.lineId || "";
            let isExcl = isExcluded(lineId, excludeLines2);
            let exDays = diffDays(exStart, exEnd);
            
            let exFlexString01 = ex["Flex String 01"] || "";
            let exDrayStatus = ex["Dray Status"] || "";
			let hazardousFlag = (ex["Is Hazardous"] === "true" || ex["Is Hazardous"] === true);
            
            // التحقق من Dray Status في EXPRT
            let isReturnDray = (exDrayStatus === "RETURN");
            
            let st = container.strge;
            let stStart = "", stEnd = "", stDays = 0, stFree = 0, stDaysAfterOverlap = 0, exDaysAfterOverlap = exDays, overlapDays = 0;
            
            // إذا كان Dray Status = RETURN، لا نحسب STRGE (نتركها فارغة)
            if (!isReturnDray && st) {
                stStart = convertDate(st["Start Time"] || "");
                stEnd = convertDate(st["End Time"] || "");
                if (stStart && stEnd) {
                    stDays = diffDays(stStart, stEnd);
                    
                    // استبعاد اليوم المشترك بين IMPRT و STRGE
                    if (imEnd && stStart && imEnd === stStart) {
                        stDays = stDays - 1;
                        if (stDays < 0) stDays = 0;
                    }
                    
                    let stDrayStatus = st["Dray Status"] || "";
                    let stFlexString01 = st["Flex String 01"] || "";
					let stHazardousFlag = (st["Is Hazardous"] === "true" || st["Is Hazardous"] === true);
                   stFree = getFreeDays(strgePeriods2, lineId, stStart, stFlexString01, stDrayStatus, "", stHazardousFlag);
                    
                    let overlapResult = calculateDaysWithOverlapRemoved(stStart, stEnd, exStart, exEnd);
                    stDaysAfterOverlap = overlapResult.net1;
                    
                    if (imEnd && stStart && imEnd === stStart) {
                        stDaysAfterOverlap = stDaysAfterOverlap - 1;
                        if (stDaysAfterOverlap < 0) stDaysAfterOverlap = 0;
                    }
                    
                    exDaysAfterOverlap = overlapResult.net2;
                    overlapDays = overlapResult.overlap;
                }
            } else if (isReturnDray) {
                // إذا كان Dray Status = RETURN، نترك القيم فارغة
                stStart = "—";
                stEnd = "—";
                stDays = "—";
                stFree = "—";
                stDaysAfterOverlap = "—";
                overlapDays = "—";
            }
            
            // باقي الكود كما هو (exFree, strgeNet, exprtNet, result.push...)
        
        // التحقق من حالة EXPRT مع Dray Status = RETURN

let exFree;
if (isReturnDray) {
    // إذا كان EXPRT و Dray Status = RETURN → لا سماح
    exFree = 0;
} else {
    // الحالات العادية: تطبق إعدادات السماح
    exFree = getFreeDays(exprtPeriods2, lineId, exStart, exFlexString01, exDrayStatus, "", hazardousFlag);
}
        
let strgeNet = 0, exprtNet = 0;

// إذا كان RETURN، اجعل الصافي = 0
if (isReturnDray) {
    strgeNet = 0;
    exprtNet = 0;
} else if (stStart && stEnd && stStart !== "—") {
    if (isExcl) {
        let indResult = calculateIndependent(stDaysAfterOverlap, stFree, exDaysAfterOverlap, exFree);
        strgeNet = indResult.net1;
        exprtNet = indResult.net2;
    } else {
        let overlapResultCalc = calculateWithOverlap(stDaysAfterOverlap, stFree, exDaysAfterOverlap, exFree);
        strgeNet = overlapResultCalc.net1;
        exprtNet = overlapResultCalc.net2;
    }
} else {
    exprtNet = exDaysAfterOverlap - exFree;
    if (exprtNet < 0) exprtNet = 0;
}
        
        let totalNet = strgeNet + exprtNet;
        let imprtType = container.imprt ? "IMPRT" : "TRSHP-RETURN";
        
        let equipType = container.equipmentType;
        let isRefrigerated = st ? st["Is Refrigerated"] : (imprtData ? imprtData["Is Refrigerated"] : "");
        let sizeRaw = equipType.toString().trim();
let size = sizeRaw.match(/^(\d+)/)?.[1] || "";

if (!size) {
    if (sizeRaw.startsWith("L5")) size = "45";
    else if (sizeRaw.startsWith("L4")) size = "40";
    else if (sizeRaw.startsWith("L2")) size = "20";
}
        let type = (isRefrigerated === "true" || equipType.includes("R1")) ? "RF" : "GP";
        // اسم السفينة من IMPRT فقط (حدث الدخول)
		let vesselName = "";
		if (container.imprt) {
			vesselName = container.imprt["I/B Carrier Name"] || "";
		}
		if (!vesselName && imprtData) {
			vesselName = imprtData["I/B Carrier Name"] || "";
		}
		if (!vesselName) {
			vesselName = "—";
		}
        let method = isExcl ? "🚫 سماح مستقل" : "🔄 تداخل سماح";
        
		let isOOG = ex["Is OOG"] || "";
		let isRefrigeratedDisplay = ex["Is Refrigerated"] || "";
		let flexString01 = ex["Flex String 01"] || "";      // ← أضف هذا
		let flexString04 = ex["Flex String 04"] || "";      // ← أضف هذا
		let isBundled = ex["Is Bundled"] || "";
		let isHazardous = ex["Is Hazardous"] || "";
		let imdgClass = ex["IMDG Class"] || "";
        
        result.push({
            "Container No.": id,
            "Size": size,
            "Is OOG": isOOG,
            "Is Refrigerated": isRefrigeratedDisplay,
            "flex_04": ex["Flex String 04"] || "",
            "Is Bundled": isBundled,
            "Is Hazardous": isHazardous,
            "IMDG Class": imdgClass,
            "Type": type,
            "Line ID": lineId,
            "طريقة الحساب": method,
            "Flex String 01": flexString01,
			"_isFlexTrue": flexString01 === "TRUE" || flexString01 === "true" || flexString01 === "1", // ← أضف هذا
            "نوع IMPRT": imprtType,
            "IMPRT Start": imStart,
            "IMPRT End": imEnd,
            "IMPRT Days": imDays,
            "STRGE Start": stStart === "" ? "—" : stStart,
            "STRGE End": stEnd === "" ? "—" : stEnd,
            "STRGE Days": stDays === 0 ? "—" : stDays,
            "Overlap Days": overlapDays === 0 ? "—" : overlapDays,
            "STRGE After Overlap": stDaysAfterOverlap === 0 ? "—" : stDaysAfterOverlap,
            "STRGE Free": stFree === 0 ? "—" : stFree,
            "STRGE Net": strgeNet,
            "EXPRT Start": exStart,
            "EXPRT End": exEnd,
            "EXPRT Days": exDaysAfterOverlap,
            "EXPRT Free": exFree,
            "EXPRT Net": exprtNet,
            "Total Net": totalNet,
            "Vessel Name": isReturnDray ? "RETURN" : vesselName
        });
        } // ← إغلاق حلقة for (of exprtList)
    } // ← إغلاق حلقة for (of containersMap)
    
    currentData2 = result;
    renderTable2("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2");
    updateHeaderFromDisplayData('2', currentData2);
} // ← إغلاق الدالةAndDisplay2


function processAndDisplay3() {
    console.log("=== processAndDisplay3 ===");
    console.log("containersMap size:", containersMap.size);
    
    let result = [];
    
    for (let [id, container] of containersMap.entries()) {
        console.log("فحص حاوية:", id);
        
        let trshpArray = container.trshpList || [];
        let hasTrshp = trshpArray.length > 0;
        console.log("  hasTrshp:", hasTrshp);
        
        // ========== التحقق من exprtList ==========
        let exprtList = container.exprtList || [];
        let hasExprt = exprtList.length > 0;
        console.log("  exprtList.length:", exprtList.length);
        console.log("  hasExprt:", hasExprt);
        
        // التحقق من وجود STRGE أو IMPRT أو TRSHP RETURN
        let hasStrge = (container.strge !== null && container.strge["Category"] === "STRGE");
        let hasImprt = (container.imprt !== null && container.imprt["Category"] === "IMPRT");
        let hasTrshpReturn = (container.trshpReturn !== null && container.trshpReturn["Category"] === "TRSHP" && container.trshpReturn["Dray Status"] === "RETURN");
        
        console.log("  hasStrge:", hasStrge);
        console.log("  hasImprt:", hasImprt);
        console.log("  hasTrshpReturn:", hasTrshpReturn);
        
        // شرط EXPRT فقط (بدون TRSHP وبدون STRGE وبدون IMPRT وبدون RETURN)
        let hasOnlyExprt = hasExprt && !hasTrshp && !hasStrge && !hasImprt && !hasTrshpReturn;
        console.log("  hasOnlyExprt:", hasOnlyExprt);
        
        if (!hasOnlyExprt) {
            console.log(`  ❌ حاوية ${id} غير مؤهلة للتبويب 3`);
            continue;
        }
        
        console.log(`  ✅ حاوية ${id} مؤهلة للتبويب 3`);
        
        // ========== التكرار على كل EXPRT في المصفوفة ==========
        for (let ex of exprtList) {
            console.log("    معالجة EXPRT:", ex["Rule Start Time"], "->", ex["Rule End Time"]);
            
            let lineId = container.lineId || "";
            let isExcl = isExcluded(lineId, excludeLines3);
            
            let exStart = convertDate(ex["Rule Start Time"] || "");
            let exEnd = convertDate(ex["Rule End Time"] || "");
            
            if (!exStart || !exEnd) {
                console.log("    ❌ تخطي: تواريخ غير صالحة");
                continue;
            }
            
            let exDays = diffDays(exStart, exEnd);
            let flexString01 = ex["Flex String 01"] || "";
            let drayStatus = ex["Dray Status"] || "";
            
            // ===== استخراج isHazardous من EXPRT =====
            let hazardousFlag = (ex["Is Hazardous"] === "true" || ex["Is Hazardous"] === true);
            
            // ===== تعديل استدعاء getFreeDays مع إضافة isHazardous =====
            let exFree = getFreeDays(exprtOnlyPeriods3, lineId, exStart, flexString01, drayStatus, "", hazardousFlag);
            
            let exNet = exDays - exFree;
            if (exNet < 0) exNet = 0;
            
            let equipType = container.equipmentType;
            let isRefrigerated = ex["Is Refrigerated"] || "";
            let sizeRaw = equipType.toString().trim();
let size = sizeRaw.match(/^(\d+)/)?.[1] || "";

if (!size) {
    if (sizeRaw.startsWith("L5")) size = "45";
    else if (sizeRaw.startsWith("L4")) size = "40";
    else if (sizeRaw.startsWith("L2")) size = "20";
}
            let type = (isRefrigerated === "true" || equipType.includes("R1")) ? "RF" : "GP";
            let vesselName = ex["O/B Carrier Name"] || ex["I/B Carrier Name"] || "";
            let method = isExcl ? "🚫 سماح مستقل" : "🔄 تداخل سماح";
            
            let isOOG = ex["Is OOG"] || "";
            let isBundled = ex["Is Bundled"] || "";
            let isHazardous = ex["Is Hazardous"] || "";
            let imdgClass = ex["IMDG Class"] || "";
            
            result.push({
                "Container No.": id,
                "Size": size,
                "Is OOG": isOOG,
                "Is Refrigerated": isRefrigerated,
                "flex_04": ex["Flex String 04"] || "",
                "_isFlexTrue": flexString01 === "TRUE" || flexString01 === "true" || flexString01 === "1",
                "Is Bundled": isBundled,
                "Is Hazardous": isHazardous,
                "IMDG Class": imdgClass,
                "Type": type,
                "Line ID": lineId,
                "Flex String 01": flexString01,
				"Dray Status": drayStatus,   // ← 🆕 أضف هذا السطر
                "EXPRT Start": exStart,
                "EXPRT End": exEnd,
                "EXPRT Days": exDays,
                "EXPRT Free": exFree,
                "EXPRT Net": exNet,
                "Total Net": exNet,
                "Vessel Name": vesselName,
                "طريقة الحساب": method
            });
            
            console.log("    ✅ تم إضافة صف للنتائج");
        }
    }
    
    console.log("نتيجة النهائية:", result.length, "صف");
    
    currentData3 = result;
    renderTable3("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3");
    updateHeaderFromDisplayData('3', currentData3);
}

function processAndDisplay4() {
    let result = [];
    let tempMap = new Map();
    
    for (let [id, container] of containersMap.entries()) {
		// ========== التعديل: استبعاد الحاويات التي لها EXPRT (بما فيها exprtList) ==========
        let hasExprt = (container.exprtList && container.exprtList.length > 0) || container.exprt;
        if (hasExprt) continue;
        if (container.strge && container.strge["Freight Kind"] === "MTY") {
            if (container.exprt) continue;
            
			if (!tempMap.has(id)) {
				tempMap.set(id, {
					imprt: null,
					strgeList: [],
					lineId: container.lineId,
					equipmentType: container.equipmentType,
					notes: container.notes || ""   // ← السطر الجديد
				});
			}
            let data = tempMap.get(id);
			data.strgeList.push({
				start: convertDate(container.strge["Start Time"] || ""),
				end: convertDate(container.strge["Rule End Time"] || ""),
				rawData: container.strge
			});
        }
    }
    
for (let [id, container] of containersMap.entries()) {
    if (!tempMap.has(id)) continue;
    
    let data = tempMap.get(id);
    let imprtSource = null;
    
    //優先 استخدام IMPRT، وإذا لم يوجد استخدم TRSHP RETURN
    if (container.imprt) {
        imprtSource = container.imprt;
    } else if (container.trshpReturn) {
        imprtSource = container.trshpReturn;
    }
    
    if (imprtSource) {
        data.imprt = {
            start: convertDate(imprtSource["Start Time"] || ""),
            end: convertDate(imprtSource["End Time"] || ""),
            rawData: imprtSource
        };
    }
}
    
for (let [id, data] of tempMap.entries()) {
    // ←←← تعريف imStart و imEnd أولاً ←←←
    let imStart = data.imprt ? data.imprt.start : "";
    let imEnd = data.imprt ? data.imprt.end : "";
    let imDays = (imStart && imEnd) ? diffDays(imStart, imEnd) : 0;
    
    let totalStrgeDays = 0;
    let strgeStart = "";
    let strgeEnd = "";
    
    // حساب أيام STRGE مع استبعاد اليوم المشترك
// حساب أيام STRGE مع استبعاد اليوم المشترك
for (let st of data.strgeList) {
    if (st.start && st.end) {
        let days = diffDays(st.start, st.end);
        
        // استبعاد اليوم المشترك بين IMPRT و STRGE (مقارنة بالتاريخ)
        if (imEnd && st.start) {
            let imEndDate = new Date(imEnd);
            let stStartDate = new Date(st.start);
            if (imEndDate.getTime() === stStartDate.getTime()) {
                days = days - 1;
                if (days < 0) days = 0;
            }
        }
                // ===== خصم On-Hire =====
        if (data.notes === "On-Hire") {
            days = days - 1;
            if (days < 0) days = 0;
        }

        totalStrgeDays += days;
        if (!strgeStart || st.start < strgeStart) strgeStart = st.start;
        if (!strgeEnd || st.end > strgeEnd) strgeEnd = st.end;
    }
}
    
    let lineId = data.lineId || "";
    let isExcl = isExcluded(lineId, excludeLines4);
    
    let strgeFree = 0;
    if (totalStrgeDays > 0 && strgeStart) {
        strgeFree = getEmptyStrgeFreeDays(emptyStrgePeriods4, lineId, strgeStart);
    }
    
    let strgeNet = totalStrgeDays - strgeFree;
    if (strgeNet < 0) strgeNet = 0;
    
    let totalNet = strgeNet;
        
	let equipType = data.equipmentType;
	let sizeRaw = equipType.toString().trim();
	let size = sizeRaw.match(/^(\d+)/)?.[1] || "";

	// معالجة الأنواع التي تبدأ بحروف
	if (!size) {
		if (sizeRaw.startsWith("L5")) size = "45";
		else if (sizeRaw.startsWith("L4")) size = "40";
		else if (sizeRaw.startsWith("L2")) size = "20";
	}
        let type = "GP";
        let vesselName = data.imprt ? (data.imprt.rawData ? data.imprt.rawData["I/B Carrier Name"] || "" : "") : "";
if (!vesselName) vesselName = "—";
        let method = isExcl ? "🚫 سماح مستقل" : "🔄 سماح عادي";
        
		let sourceData = data.strgeList[0] ? data.strgeList[0].rawData : null;
		let isOOG = sourceData ? (sourceData["Is OOG"] || "") : "";
		let isRefrigeratedDisplay = sourceData ? (sourceData["Is Refrigerated"] || "") : "";
		let flexString04 = sourceData ? (sourceData["Flex String 04"] || "") : "";
		let isBundled = sourceData ? (sourceData["Is Bundled"] || "") : "";
		let isHazardous = sourceData ? (sourceData["Is Hazardous"] || "") : "";
		let imdgClass = sourceData ? (sourceData["IMDG Class"] || "") : "";

		result.push({
			"Container No.": id, "Size": size,
			"Is OOG": isOOG, "Is Refrigerated": isRefrigeratedDisplay,
			"flex_04": flexString04,  // ← تغيير المسمى
			"Is Bundled": isBundled, "Is Hazardous": isHazardous, "IMDG Class": imdgClass,
			"Type": type, "Line ID": lineId,
			"Notes": (data.notes === "On-Hire") ? "On-Hire" : "",
			"IMPRT Start": imStart, "IMPRT End": imEnd, "IMPRT Days": imDays,
			"STRGE Start": strgeStart, "STRGE End": strgeEnd, "STRGE Days": totalStrgeDays,
			"STRGE Free": strgeFree, "STRGE Net": strgeNet, "Total Net": totalNet,
			"Vessel Name": vesselName, "طريقة الحساب": method
		});
    }
    
    currentData4 = result;
renderTable4("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4");
updateHeaderFromDisplayData('4', currentData4);
}

// ========== دوال العرض للتبويبات الأخرى ==========
function renderTable2(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let total = data.length;
    let totalNet = data.reduce((s, i) => s + (i["Total Net"] || 0), 0);
    let avg = total > 0 ? (totalNet / total).toFixed(1) : 0;
    
	let statsDiv = document.getElementById(statsId);
	if (statsDiv) {
		statsDiv.innerHTML = renderAdvancedStatsTab2(data);
		statsDiv.style.display = "block";
	}
    
    let tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="29" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td></tr>`;
    } else {
        for (let item of filtered) {
            let row = tbody.insertRow();
            let methodClass = item["طريقة الحساب"] === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
            let imprtTypeClass = item["نوع IMPRT"] === "TRSHP-RETURN" ? 'style="background:#fef3c7; color:#92400e;"' : 'style="background:#e0f2fe; color:#0369a1;"';
            
            // تعريف flexHtml لعمود Flex String 01
            let flexValue = item["Flex String 01"] || "—";
            let flexHtml = "—";
            if (flexValue === "TRUE") {
                flexHtml = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
            } else if (flexValue === "FALSE") {
                flexHtml = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
            }
            
            row.innerHTML = `
                <td style="font-weight:bold;">${item["Container No."] || "—"}<\/td>
                <td>${item["Size"] || "—"}<\/td>
                <td>${item["Is OOG"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Refrigerated"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Bundled"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Hazardous"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["IMDG Class"] || "—"}<\/td>
                <td><strong>${item["Type"] || "—"}</strong><\/td>
                <td>${item["Line ID"] || "—"}<\/td>
                <td><span class="${methodClass}">${item["طريقة الحساب"] || "—"}</span><\/td>
                <td>${flexHtml}<\/td>
                <td ${imprtTypeClass}>${item["نوع IMPRT"] || "—"}<\/td>
                <td class="imprt-cell">${item["IMPRT Start"] || "—"}<\/td>
                <td class="imprt-cell">${item["IMPRT End"] || "—"}<\/td>
                <td class="imprt-cell">${item["IMPRT Days"] || "—"}<\/td>
                <td>${item["STRGE Start"] || "—"}<\/td>
                <td>${item["STRGE End"] || "—"}<\/td>
                <td style="background:#e3f2fd;">${item["STRGE Days"] || "—"}<\/td>
                <td style="background:#f8d7da;">${item["Overlap Days"] || "—"}<\/td>
                <td style="background:#fff3cd;">${item["STRGE After Overlap"] || "—"}<\/td>
                <td style="background:#fff3cd;">${item["STRGE Free"] || "—"}<\/td>
                <td style="background:#d4edda;">${item["STRGE Net"] || "—"}<\/td>
                <td>${item["EXPRT Start"] || "—"}<\/td>
                <td>${item["EXPRT End"] || "—"}<\/td>
                <td style="background:#e3f2fd;">${item["EXPRT Days"] || "—"}<\/td>
                <td style="background:#fff3cd;">${item["EXPRT Free"] || "—"}<\/td>
                <td style="background:#d4edda;">${item["EXPRT Net"] || "—"}<\/td>
                <td style="background:#cce5ff; font-weight:bold;">${item["Total Net"] || "—"}<\/td>
                <td>${item["Vessel Name"] || "—"}<\/td>
            `;
        }
    }
    
    document.getElementById(statsId).style.display = "flex";
    document.getElementById("filtersTab2").style.display = "flex";
    document.getElementById("wrapperTab2").style.display = "block";
}

function renderTable3(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let total = data.length;
    let totalNet = data.reduce((s, i) => s + (i["Total Net"] || 0), 0);
    let avg = total > 0 ? (totalNet / total).toFixed(1) : 0;
    
let statsDiv = document.getElementById(statsId);
if (statsDiv) {
    statsDiv.innerHTML = renderAdvancedStatsTab3(data);
    statsDiv.style.display = "block";
}
    
    let tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="18" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td></tr>`;
    } else {
        for (let item of filtered) {
            let row = tbody.insertRow();
            let methodClass = item["طريقة الحساب"] === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
            
            // تعريف flexHtml لعمود Flex String 01
            let flexValue = item["Flex String 01"] || "—";
            let flexHtml = "—";
            if (flexValue === "TRUE") {
                flexHtml = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
            } else if (flexValue === "FALSE") {
                flexHtml = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
            }
            
            row.innerHTML = `
                <td style="font-weight:bold;">${item["Container No."] || "—"}<\/td>
                <td>${item["Size"] || "—"}<\/td>
                <td>${item["Is OOG"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Refrigerated"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Bundled"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Hazardous"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["IMDG Class"] || "—"}<\/td>
                <td><strong>${item["Type"] || "—"}</strong><\/td>
                <td>${item["Line ID"] || "—"}<\/td>
                <td><span class="${methodClass}">${item["طريقة الحساب"] || "—"}</span><\/td>
                <td>${flexHtml}<\/td>
                <td>${item["EXPRT Start"] || "—"}<\/td>
                <td>${item["EXPRT End"] || "—"}<\/td>
                <td style="background:#e3f2fd;">${item["EXPRT Days"] || "—"}<\/td>
                <td style="background:#fff3cd;">${item["EXPRT Free"] || "—"}<\/td>
                <td style="background:#d4edda;">${item["EXPRT Net"] || "—"}<\/td>
                <td style="background:#cce5ff; font-weight:bold;">${item["Total Net"] || "—"}<\/td>
                <td>${item["Vessel Name"] || "—"}<\/td>
            `;
        }
    }
    
    document.getElementById(statsId).style.display = "flex";
    document.getElementById("filtersTab3").style.display = "flex";
    document.getElementById("wrapperTab3").style.display = "block";
}

function renderTable4(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let total = data.length;
    let totalNet = data.reduce((s, i) => s + (i["Total Net"] || 0), 0);
    let avg = total > 0 ? (totalNet / total).toFixed(1) : 0;
    
let statsDiv = document.getElementById(statsId);
if (statsDiv) {
    statsDiv.innerHTML = renderAdvancedStatsTab4(data);
    statsDiv.style.display = "block";
}
    
    let tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<td><td colspan="21" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td><\/tr>`;
    } else {
        for (let item of filtered) {
            let row = tbody.insertRow();
            let methodClass = item["طريقة الحساب"] === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
            
            // تعريف flexHtml لعمود Flex String 01
            let flexValue = item["Flex String 01"] || "—";
            let flexHtml = "—";
            if (flexValue === "TRUE") {
                flexHtml = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
            } else if (flexValue === "FALSE") {
                flexHtml = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
            }
            
            row.innerHTML = `
                <td style="font-weight:bold;">${item["Container No."] || "—"}<\/td>
                <td>${item["Size"] || "—"}<\/td>
                <td>${item["Is OOG"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Refrigerated"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Bundled"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Hazardous"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["IMDG Class"] || "—"}<\/td>
                <td><strong>${item["Type"] || "—"}</strong><\/td>
                <td>${item["Line ID"] || "—"}<\/td>
                <td><span class="${methodClass}">${item["طريقة الحساب"] || "—"}</span><\/td>
                <td>${flexHtml}<\/td>
                <td class="imprt-cell">${item["IMPRT Start"] || "—"}<\/td>
                <td class="imprt-cell">${item["IMPRT End"] || "—"}<\/td>
                <td class="imprt-cell">${item["IMPRT Days"] || "—"}<\/td>
                <td>${item["STRGE Start"] || "—"}<\/td>
                <td>${item["STRGE End"] || "—"}<\/td>
                <td style="background:#e3f2fd;">${item["STRGE Days"] || "—"}<\/td>
                <td style="background:#fff3cd;">${item["STRGE Free"] || "—"}<\/td>
                <td style="background:#d4edda;">${item["STRGE Net"] || "—"}<\/td>
                <td style="background:#cce5ff; font-weight:bold;">${item["Total Net"] || "—"}<\/td>
                <td>${item["Vessel Name"] || "—"}<\/td>
            `;
        }
    }
    
    document.getElementById(statsId).style.display = "flex";
    document.getElementById("filtersTab4").style.display = "flex";
    document.getElementById("wrapperTab4").style.display = "block";
}

// ========== دوال إدارة الفترات ==========
function getPeriodsArray(tabId, category) {
    if (tabId === '1') {
        if (category === 'TRSHP') return trshpPeriods1;
        else return exprtPeriods1;
    } else if (tabId === '2') {
        if (category === 'STRGE') return strgePeriods2;
        else return exprtPeriods2;
    } else if (tabId === '3') {
        return exprtOnlyPeriods3;
    } else if (tabId === '4') {
        return emptyStrgePeriods4;
    } else if (tabId === '5') {
        return trshpOnlyPeriods5;
    } else if (tabId === '6') {
        if (category === 'STRGE') return strgePeriods6;
        else return exprtPeriods6;
    }
}  // ← تأكد من وجود هذا القوس

function setPeriodsArray(tabId, category, periods) {
    if (tabId === '1') {
        if (category === 'TRSHP') { trshpPeriods1 = periods; localStorage.setItem("trshpPeriodsTab1", JSON.stringify(trshpPeriods1)); }
        else { exprtPeriods1 = periods; localStorage.setItem("exprtPeriodsTab1", JSON.stringify(exprtPeriods1)); }
    } else if (tabId === '2') {
        if (category === 'STRGE') { strgePeriods2 = periods; localStorage.setItem("strgePeriodsTab2", JSON.stringify(strgePeriods2)); }
        else { exprtPeriods2 = periods; localStorage.setItem("exprtPeriodsTab2", JSON.stringify(exprtPeriods2)); }
    } else if (tabId === '3') {
        exprtOnlyPeriods3 = periods;
        localStorage.setItem("exprtOnlyPeriodsTab3", JSON.stringify(exprtOnlyPeriods3));
    } else if (tabId === '4') {
        emptyStrgePeriods4 = periods;
        localStorage.setItem("emptyStrgePeriodsTab4", JSON.stringify(emptyStrgePeriods4));
    } else if (tabId === '5') {
        trshpOnlyPeriods5 = periods;
        localStorage.setItem("trshpOnlyPeriodsTab5", JSON.stringify(trshpOnlyPeriods5));
    } else if (tabId === '6') {
        if (category === 'STRGE') { strgePeriods6 = periods; localStorage.setItem("strgePeriodsTab6", JSON.stringify(strgePeriods6)); }
        else { exprtPeriods6 = periods; localStorage.setItem("exprtPeriodsTab6", JSON.stringify(exprtPeriods6)); }
    }
}  // ← تأكد من وجود هذا القوس

function displayPeriodsList(containerId, periods, tabId) {
    // دالة مساعدة لتنسيق التاريخ للعرض (DD/MM/YYYY)
    function formatDateToDisplay(dateStr) {
        if (!dateStr) return '';
        // إذا كان التاريخ بصيغة YYYY-MM-DD
        let parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        // إذا كان بصيغة أخرى، اعرضه كما هو
        return dateStr;
    }

    let sorted = sortPeriods([...periods]);
    let html = `<table style="width:100%; font-size:12px; border:1px solid #ddd;">
        <thead>
            <tr style="background:#f1f3f5;">
                <th>Category</th>
                <th>Line ID</th>
                <th>Dray Status</th>
                <th>Flex String 01</th>
                <th>Freight Kind</th>
                <th>Hazardous</th>
                <th>تاريخ البدء</th>
                <th>تاريخ النهاية</th>
                <th>أيام السماح</th>
                <th></th>
            </tr>
        </thead>
        <tbody>`;
    
    sorted.forEach(period => {
        let catClass = period.category === "TRSHP" ? "trshp" : (period.category === "EXPRT" ? "exprt" : "strge");
        let endDisplay = period.endDate || "مفتوحة";
        let hazardVal = (period.isHazardous || "").toLowerCase();
        
        html += `<tr>
            <td><span class="category-badge ${catClass}">${period.category}</span></td>
            <td>
                <select class="period-line-${tabId}" data-id="${period.id}" data-cat="${period.category}" style="padding:6px 10px; border-radius:6px;">
                    <option value="*" ${period.lineId === "*" ? "selected" : ""}>* (الكل)</option>
                    ${masterLinesList.map(line => `<option value="${line}" ${period.lineId === line ? "selected" : ""}>${line}</option>`).join('')}
                </select>
            </td>
            <td>
                <select class="period-dray-${tabId}" data-id="${period.id}" data-cat="${period.category}" style="padding:6px 10px; border-radius:6px;">
                    <option value="">الكل</option>
                    <option value="EMPTY" ${period.drayStatus === "EMPTY" ? "selected" : ""}>فارغ</option>
                    <option value="RETURN" ${period.drayStatus === "RETURN" ? "selected" : ""}>RETURN</option>
                    <option value="FORWARD" ${period.drayStatus === "FORWARD" ? "selected" : ""}>FORWARD</option>
                </select>
            </td>
            <td>
                <select class="period-flex-${tabId}" data-id="${period.id}" data-cat="${period.category}" style="padding:6px 10px; border-radius:6px;">
                    <option value="">الكل</option>
                    <option value="TRUE" ${period.flexString01 === "TRUE" ? "selected" : ""}>TRUE (صادر خاص)</option>
                    <option value="FALSE" ${period.flexString01 === "FALSE" ? "selected" : ""}>FALSE (صادر عادي)</option>
                </select>
            </td>
            <td>
                <select class="period-freight-${tabId}" data-id="${period.id}" data-cat="${period.category}" style="padding:6px 10px; border-radius:6px;">
                    <option value="">الكل</option>
                    <option value="FCL" ${period.freightKind === "FCL" ? "selected" : ""}>FCL (حاوية كاملة)</option>
                    <option value="MTY" ${period.freightKind === "MTY" ? "selected" : ""}>MTY (فارغة)</option>
                </select>
            </td>
            <td>
                <select class="period-hazard-${tabId}" data-id="${period.id}" data-cat="${period.category}" style="padding:6px 10px; border-radius:6px;">
                    <option value="" ${hazardVal === "" ? "selected" : ""}>الكل</option>
                    <option value="true" ${hazardVal === "true" ? "selected" : ""}>نعم (خطر)</option>
                    <option value="false" ${hazardVal === "false" ? "selected" : ""}>لا (غير خطر)</option>
                </select>
            </td>
            <td>
                <input type="date" class="period-start-${tabId}" data-id="${period.id}" data-cat="${period.category}" value="${period.startDate || ''}" style="width:130px;">
                <span style="display:block; font-size:10px; color:#6c757d; margin-top:2px;">
                    ${formatDateToDisplay(period.startDate)}
                </span>
            </td>
            <td style="background:#f8f9fa;">${endDisplay}</td>
            <td><input type="number" class="period-days-${tabId}" data-id="${period.id}" data-cat="${period.category}" value="${period.freeDays}" style="width:80px;"></td>
            <td><button onclick="window.deletePeriod('${tabId}', '${period.category}', ${period.id})" class="delete-btn">✖ حذف</button></td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    document.getElementById(containerId).innerHTML = html;
    
    // ===== إضافة مستمعي الأحداث =====
    setTimeout(() => {
        // مستمع تغيير Line ID
        document.querySelectorAll(`.period-line-${tabId}`).forEach(sel => {
            sel.onchange = e => {
                let id = parseInt(e.target.dataset.id);
                let category = e.target.dataset.cat;
                let periodsArr = getPeriodsArray(tabId, category);
                let p = periodsArr.find(p => p.id === id);
                if (p) {
                    p.lineId = e.target.value;
                    setPeriodsArray(tabId, category, periodsArr);
                    refreshPeriodsDisplay(tabId);
                }
            };
        });
        
        // مستمع تغيير Dray Status
        document.querySelectorAll(`.period-dray-${tabId}`).forEach(sel => {
            sel.onchange = e => {
                let id = parseInt(e.target.dataset.id);
                let category = e.target.dataset.cat;
                let periodsArr = getPeriodsArray(tabId, category);
                let p = periodsArr.find(p => p.id === id);
                if (p) {
                    p.drayStatus = e.target.value;
                    setPeriodsArray(tabId, category, periodsArr);
                    refreshPeriodsDisplay(tabId);
                }
            };
        });
        
        // مستمع تغيير Flex String 01
        document.querySelectorAll(`.period-flex-${tabId}`).forEach(sel => {
            sel.onchange = e => {
                let id = parseInt(e.target.dataset.id);
                let category = e.target.dataset.cat;
                let periodsArr = getPeriodsArray(tabId, category);
                let p = periodsArr.find(p => p.id === id);
                if (p) {
                    p.flexString01 = e.target.value;
                    setPeriodsArray(tabId, category, periodsArr);
                    refreshPeriodsDisplay(tabId);
                }
            };
        });
        
        // مستمع تغيير Freight Kind
        document.querySelectorAll(`.period-freight-${tabId}`).forEach(sel => {
            sel.onchange = e => {
                let id = parseInt(e.target.dataset.id);
                let category = e.target.dataset.cat;
                let periodsArr = getPeriodsArray(tabId, category);
                let p = periodsArr.find(p => p.id === id);
                if (p) {
                    p.freightKind = e.target.value;
                    setPeriodsArray(tabId, category, periodsArr);
                    refreshPeriodsDisplay(tabId);
                }
            };
        });
        
        // ===== مستمع تغيير Hazardous (جديد) =====
        document.querySelectorAll(`.period-hazard-${tabId}`).forEach(sel => {
            sel.onchange = e => {
                let id = parseInt(e.target.dataset.id);
                let category = e.target.dataset.cat;
                let periodsArr = getPeriodsArray(tabId, category);
                let p = periodsArr.find(p => p.id === id);
                if (p) {
                    p.isHazardous = e.target.value;
                    setPeriodsArray(tabId, category, periodsArr);
                    refreshPeriodsDisplay(tabId);
                }
            };
        });
        
        // مستمع تغيير تاريخ البدء
        document.querySelectorAll(`.period-start-${tabId}`).forEach(inp => {
            inp.onchange = e => {
                let id = parseInt(e.target.dataset.id);
                let category = e.target.dataset.cat;
                let periodsArr = getPeriodsArray(tabId, category);
                let p = periodsArr.find(p => p.id === id);
                if (p) {
                    p.startDate = e.target.value;
                    setPeriodsArray(tabId, category, periodsArr);
                    refreshPeriodsDisplay(tabId);
                }
            };
        });
        
        // مستمع تغيير أيام السماح
        document.querySelectorAll(`.period-days-${tabId}`).forEach(inp => {
            inp.onchange = e => {
                let id = parseInt(e.target.dataset.id);
                let category = e.target.dataset.cat;
                let periodsArr = getPeriodsArray(tabId, category);
                let p = periodsArr.find(p => p.id === id);
                if (p) {
                    p.freeDays = parseInt(e.target.value) || 0;
                    setPeriodsArray(tabId, category, periodsArr);
                    e.target.value = p.freeDays;
                }
            };
        });
    }, 100);
}	

function refreshPeriodsDisplay(tabId) {
    if (tabId === '1') {
        displayPeriodsList('trshpPeriodsList1', trshpPeriods1, '1');
        displayPeriodsList('exprtPeriodsList1', exprtPeriods1, '1');
    } else if (tabId === '2') {
        displayPeriodsList('strgePeriodsList2', strgePeriods2, '2');
        displayPeriodsList('exprtPeriodsList2', exprtPeriods2, '2');
    } else if (tabId === '3') {
        displayPeriodsList('exprtOnlyPeriodsList3', exprtOnlyPeriods3, '3');
    } else if (tabId === '4') {
        displayPeriodsList('emptyStrgePeriodsList4', emptyStrgePeriods4, '4');
    } else if (tabId === '5') {
        displayPeriodsList('trshpOnlyPeriodsList5', trshpOnlyPeriods5, '5');
    } else if (tabId === '6') {   // ← أضف هذا الشرط
        displayPeriodsList('strgePeriodsList6', strgePeriods6, '6');
        displayPeriodsList('exprtPeriodsList6', exprtPeriods6, '6');
    }
}

window.deletePeriod = function(tabId, category, periodId) {
    let periodsArray = getPeriodsArray(tabId, category);
    periodsArray = periodsArray.filter(p => p.id !== periodId);
    let updated = updateEndDates(periodsArray);
    setPeriodsArray(tabId, category, updated);
    refreshPeriodsDisplay(tabId);
    if (containersMap.size > 0) { 
        if (tabId === '1') processAndDisplay1(); 
        else if (tabId === '2') processAndDisplay2();
        else if (tabId === '3') processAndDisplay3();
        else if (tabId === '4') processAndDisplay4();
        else if (tabId === '5') processAndDisplay5();
        else if (tabId === '6') processAndDisplay6();
    }
};  // ← تأكد من وجود هذا القوس مع الفاصلة المنقوطة

function addNewPeriod(tabId, category) {
    let periodsArray = getPeriodsArray(tabId, category);
    let newId = 1;
    
    if (tabId === '1') {
        if (category === 'TRSHP') { newId = nextIdTrshp1++; }
        else { newId = nextIdExprt1++; }
    } else if (tabId === '2') {
        if (category === 'STRGE') { newId = nextIdStrge2++; }
        else { newId = nextIdExprt2++; }
    } else if (tabId === '3') {
        newId = nextIdExprtOnly3++;
    } else if (tabId === '4') {
        newId = nextIdEmptyStrge4++;
    } else if (tabId === '5') {
        newId = nextIdTrshpOnly5++;
    } else if (tabId === '6') {
        if (category === 'STRGE') { newId = nextIdStrge6++; }
        else { newId = nextIdExprt6++; }
    }
    
    let defaultLineId = "*";
    let defaultDrayStatus = "";
    let defaultFlex = "";
    
    let sameGroupPeriods = periodsArray.filter(p => 
        p.lineId === defaultLineId && 
        (p.drayStatus || "") === defaultDrayStatus && 
        (p.flexString01 || "") === defaultFlex
    );
    
    let lastStart = null;
    if (sameGroupPeriods.length > 0) {
        let lastPeriod = sameGroupPeriods.reduce((max, p) => 
            new Date(p.startDate) > new Date(max.startDate) ? p : max, sameGroupPeriods[0]
        );
        let lastDate = new Date(lastPeriod.startDate);
        lastDate.setDate(lastDate.getDate() + 1);
        lastStart = lastDate.toISOString().split('T')[0];
    } else {
        lastStart = new Date().toISOString().split('T')[0];
    }
    
    let newPeriod = {
        id: newId,
        category: category,
        lineId: defaultLineId,
        drayStatus: defaultDrayStatus,
        flexString01: defaultFlex,
		freightKind: "",        // ← أضف هذا
        startDate: lastStart,
        endDate: "",
        freeDays: 0
    };
    
    periodsArray.push(newPeriod);
    setPeriodsArray(tabId, category, periodsArray);
    refreshPeriodsDisplay(tabId);
}

// إضافة خط جديد لجميع التبويبات
document.getElementById("addGlobalLineBtn")?.addEventListener("click", () => {
    let newLine = document.getElementById("newGlobalLineName")?.value.trim();
    if (newLine) {
        if (addNewLineToMasterList(newLine)) {
            document.getElementById("newGlobalLineName").value = "";
            alert(`✅ تم إضافة الخط "${newLine}" بنجاح لجميع التبويبات`);
        } else {
            alert(`⚠️ الخط "${newLine}" موجود مسبقاً`);
        }
    } else {
        alert("❌ الرجاء كتابة اسم الخط");
    }
});

// تهيئة القوائم عند تحميل الصفحة
initializeAllSelects();

function displayExcludeList(containerId, excludes, tabId) {
    let html = '<div style="display:flex; flex-wrap:wrap; gap:10px;">';
    excludes.forEach((line, idx) => {
        html += `<span class="exclude-badge">🚫 ${line} <button onclick="window.removeExclude('${tabId}', ${idx})" style="background:none; border:none; color:#721c24; cursor:pointer;">✖</button></span>`;
    });
    html += '</div>';
    if (excludes.length === 0) html = '<span style="color:#6c757d;">لا توجد خطوط مستثناة</span>';
    document.getElementById(containerId).innerHTML = html;
}

window.removeExclude = function(tabId, idx) {
    if (tabId === '1') {
        excludeLines1.splice(idx, 1);
        localStorage.setItem("excludeLines1", JSON.stringify(excludeLines1));
        displayExcludeList('excludeList1', excludeLines1, '1');
        if (containersMap.size > 0) processAndDisplay1();
    } else if (tabId === '2') {
        excludeLines2.splice(idx, 1);
        localStorage.setItem("excludeLines2", JSON.stringify(excludeLines2));
        displayExcludeList('excludeList2', excludeLines2, '2');
        if (containersMap.size > 0) processAndDisplay2();
    } else if (tabId === '3') {
        excludeLines3.splice(idx, 1);
        localStorage.setItem("excludeLines3", JSON.stringify(excludeLines3));
        displayExcludeList('excludeList3', excludeLines3, '3');
        if (containersMap.size > 0) processAndDisplay3();
    } else if (tabId === '4') {
        excludeLines4.splice(idx, 1);
        localStorage.setItem("excludeLines4", JSON.stringify(excludeLines4));
        displayExcludeList('excludeList4', excludeLines4, '4');
        if (containersMap.size > 0) processAndDisplay4();
    }
};

// ========== الأحداث ==========
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        let activeTabId = btn.dataset.tab;
        let tabNumber = activeTabId.replace('tab', '');
        document.getElementById(activeTabId).classList.add("active");
        
        // تحديث الـ Header بناءً على البيانات المعروضة في التبويب النشط
        if (tabNumber === '1') updateHeaderFromDisplayData('1', currentData1);
        else if (tabNumber === '2') updateHeaderFromDisplayData('2', currentData2);
        else if (tabNumber === '3') updateHeaderFromDisplayData('3', currentData3);
        else if (tabNumber === '4') updateHeaderFromDisplayData('4', currentData4);
        else if (tabNumber === '5') updateHeaderFromDisplayData('5', currentData5);
        else if (tabNumber === '6') updateHeaderFromDisplayData('6', currentData6);
		else if (tabNumber === '7') updateHeaderFromDisplayData('7', currentData7);  // ← أضف هذا

    });
});

// تبويب 1
document.getElementById("settingsBtn1").onclick = () => { 
    document.getElementById("settingsPanel1").style.display = "block"; 
    refreshPeriodsDisplay('1'); 
};
document.getElementById("closeSettings1").onclick = () => { document.getElementById("settingsPanel1").style.display = "none"; };
document.getElementById("addTrshpPeriodBtn1").onclick = () => addNewPeriod('1', 'TRSHP');
document.getElementById("addExprtPeriodBtn1").onclick = () => addNewPeriod('1', 'EXPRT');
document.getElementById("savePeriodsBtn1").onclick = () => {
    let updatedTrshp = updateEndDates(trshpPeriods1);
    let updatedExprt = updateEndDates(exprtPeriods1);
    localStorage.setItem("trshpPeriodsTab1", JSON.stringify(updatedTrshp));
    localStorage.setItem("exprtPeriodsTab1", JSON.stringify(updatedExprt));
    localStorage.setItem("excludeLines1", JSON.stringify(excludeLines1));
    trshpPeriods1 = updatedTrshp;
    exprtPeriods1 = updatedExprt;
    document.getElementById("settingsPanel1").style.display = "none";
    if (containersMap.size > 0) processAndDisplay1();
    document.getElementById("footerMsg").innerHTML = `✅ تم حفظ إعدادات TRSHP/EXPRT`;
};
document.getElementById("addExcludeBtn1").onclick = () => {
    let line = document.getElementById("excludeLine1").value;
    if (line && !excludeLines1.includes(line)) {
        excludeLines1.push(line);
        localStorage.setItem("excludeLines1", JSON.stringify(excludeLines1));
        displayExcludeList('excludeList1', excludeLines1, '1');
        if (containersMap.size > 0) processAndDisplay1();
        document.getElementById("excludeLine1").value = "";
    }
};

// تبويب 2
document.getElementById("settingsBtn2").onclick = () => { 
    document.getElementById("settingsPanel2").style.display = "block"; 
    refreshPeriodsDisplay('2'); 
};
document.getElementById("closeSettings2").onclick = () => { document.getElementById("settingsPanel2").style.display = "none"; };
document.getElementById("addStrgePeriodBtn2").onclick = () => addNewPeriod('2', 'STRGE');
document.getElementById("addExprtPeriodBtn2").onclick = () => addNewPeriod('2', 'EXPRT');
document.getElementById("savePeriodsBtn2").onclick = () => {
    let updatedStrge = updateEndDates(strgePeriods2);
    let updatedExprt = updateEndDates(exprtPeriods2);
    localStorage.setItem("strgePeriodsTab2", JSON.stringify(updatedStrge));
    localStorage.setItem("exprtPeriodsTab2", JSON.stringify(updatedExprt));
    localStorage.setItem("excludeLines2", JSON.stringify(excludeLines2));
    strgePeriods2 = updatedStrge;
    exprtPeriods2 = updatedExprt;
    document.getElementById("settingsPanel2").style.display = "none";
    if (containersMap.size > 0) processAndDisplay2();
    document.getElementById("footerMsg").innerHTML = `✅ تم حفظ إعدادات STRGE/EXPRT`;
};
document.getElementById("addExcludeBtn2").onclick = () => {
    let line = document.getElementById("excludeLine2").value;
    if (line && !excludeLines2.includes(line)) {
        excludeLines2.push(line);
        localStorage.setItem("excludeLines2", JSON.stringify(excludeLines2));
        displayExcludeList('excludeList2', excludeLines2, '2');
        if (containersMap.size > 0) processAndDisplay2();
        document.getElementById("excludeLine2").value = "";
    }
};

// تبويب 3
document.getElementById("settingsBtn3").onclick = () => {
    document.getElementById("settingsPanel3").style.display = "block";
    displayPeriodsList('exprtOnlyPeriodsList3', exprtOnlyPeriods3, '3');
};
document.getElementById("closeSettings3").onclick = () => { document.getElementById("settingsPanel3").style.display = "none"; };
document.getElementById("addExprtOnlyPeriodBtn3").onclick = () => addNewPeriod('3', 'EXPRT');
document.getElementById("savePeriodsBtn3").onclick = () => {
    let updated = updateEndDates(exprtOnlyPeriods3);
    localStorage.setItem("exprtOnlyPeriodsTab3", JSON.stringify(updated));
    localStorage.setItem("excludeLines3", JSON.stringify(excludeLines3));
    exprtOnlyPeriods3 = updated;
    document.getElementById("settingsPanel3").style.display = "none";
    if (containersMap.size > 0) processAndDisplay3();
    document.getElementById("footerMsg").innerHTML = `✅ تم حفظ إعدادات EXPRT فقط`;
};
document.getElementById("addExcludeBtn3").onclick = () => {
    let line = document.getElementById("excludeLine3").value;
    if (line && !excludeLines3.includes(line)) {
        excludeLines3.push(line);
        localStorage.setItem("excludeLines3", JSON.stringify(excludeLines3));
        displayExcludeList('excludeList3', excludeLines3, '3');
        if (containersMap.size > 0) processAndDisplay3();
        document.getElementById("excludeLine3").value = "";
    }
};

// تبويب 4
document.getElementById("settingsBtn4").onclick = () => {
    document.getElementById("settingsPanel4").style.display = "block";
    displayPeriodsList('emptyStrgePeriodsList4', emptyStrgePeriods4, '4');
};
document.getElementById("closeSettings4").onclick = () => { document.getElementById("settingsPanel4").style.display = "none"; };
document.getElementById("addEmptyStrgePeriodBtn4").onclick = () => addNewPeriod('4', 'STRGE');
document.getElementById("savePeriodsBtn4").onclick = () => {
    let updated = updateEndDates(emptyStrgePeriods4);
    localStorage.setItem("emptyStrgePeriodsTab4", JSON.stringify(updated));
    localStorage.setItem("excludeLines4", JSON.stringify(excludeLines4));
    emptyStrgePeriods4 = updated;
    document.getElementById("settingsPanel4").style.display = "none";
    if (containersMap.size > 0) processAndDisplay4();
    document.getElementById("footerMsg").innerHTML = `✅ تم حفظ إعدادات STRGE فارغ`;
};
document.getElementById("addExcludeBtn4").onclick = () => {
    let line = document.getElementById("excludeLine4").value;
    if (line && !excludeLines4.includes(line)) {
        excludeLines4.push(line);
        localStorage.setItem("excludeLines4", JSON.stringify(excludeLines4));
        displayExcludeList('excludeList4', excludeLines4, '4');
        if (containersMap.size > 0) processAndDisplay4();
        document.getElementById("excludeLine4").value = "";
    }
};

// عرض قوائم الاستثناءات
displayExcludeList('excludeList1', excludeLines1, '1');
displayExcludeList('excludeList2', excludeLines2, '2');
displayExcludeList('excludeList3', excludeLines3, '3');
displayExcludeList('excludeList4', excludeLines4, '4');

// الفلاتر والبحث
document.getElementById("searchTab1")?.addEventListener("input", () => {
    if (selectedColumns.tab1 && selectedColumns.tab1.length > 0) {
        renderTable1WithSelectedColumns("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
    } else {
        renderTable1WithStats("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
    }
});
document.getElementById("typeTab1")?.addEventListener("change", () => {
    if (selectedColumns.tab1 && selectedColumns.tab1.length > 0) {
        renderTable1WithSelectedColumns("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
    } else {
        renderTable1WithStats("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
    }
});
["searchTab2", "typeTab2"].forEach(id => document.getElementById(id)?.addEventListener("input", () => renderTable2("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2")));
["searchTab3", "typeTab3"].forEach(id => document.getElementById(id)?.addEventListener("input", () => renderTable3("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3")));
["searchTab4", "typeTab4"].forEach(id => document.getElementById(id)?.addEventListener("input", () => renderTable4("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4")));

// أزرار التصدير
document.getElementById("exportBtn1").onclick = () => {
    let ws = XLSX.utils.json_to_sheet(currentData1);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TRSHP_EXPRT");
    XLSX.writeFile(wb, `تقرير_TRSHP_EXPRT_${new Date().toISOString().slice(0,19)}.xlsx`);
};
document.getElementById("exportBtn2").onclick = () => {
    let ws = XLSX.utils.json_to_sheet(currentData2);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "STRGE_EXPRT_IMPRT");
    XLSX.writeFile(wb, `تقرير_STRGE_EXPRT_IMPRT_${new Date().toISOString().slice(0,19)}.xlsx`);
};
document.getElementById("exportBtn3").onclick = () => {
    let ws = XLSX.utils.json_to_sheet(currentData3);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EXPRT_ONLY");
    XLSX.writeFile(wb, `تقرير_EXPRT_ONLY_${new Date().toISOString().slice(0,19)}.xlsx`);
};
document.getElementById("exportBtn4").onclick = () => {
    let ws = XLSX.utils.json_to_sheet(currentData4);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EMPTY_STRGE_IMPRT");
    XLSX.writeFile(wb, `تقرير_EMPTY_STRGE_IMPRT_${new Date().toISOString().slice(0,19)}.xlsx`);
};

// زر تصدير جميع التبويبات
// ========== تصدير جميع التبويبات إلى ملف Excel واحد ==========
document.getElementById("exportAllBtn").onclick = () => {
    try {
        let wb = XLSX.utils.book_new();
        
        // تبويب 1
        if (currentData1 && currentData1.length > 0) {
            let ws1 = XLSX.utils.json_to_sheet(currentData1);
            XLSX.utils.book_append_sheet(wb, ws1, "TRSHP_EXPRT");
        } else {
            let ws1 = XLSX.utils.json_to_sheet([{ "ملاحظة": "لا توجد بيانات في هذا التبويب" }]);
            XLSX.utils.book_append_sheet(wb, ws1, "TRSHP_EXPRT");
        }
        
        // تبويب 2
        if (currentData2 && currentData2.length > 0) {
            let ws2 = XLSX.utils.json_to_sheet(currentData2);
            XLSX.utils.book_append_sheet(wb, ws2, "STRGE_EXPRT_IMPRT");
        } else {
            let ws2 = XLSX.utils.json_to_sheet([{ "ملاحظة": "لا توجد بيانات في هذا التبويب" }]);
            XLSX.utils.book_append_sheet(wb, ws2, "STRGE_EXPRT_IMPRT");
        }
        
        // تبويب 3
        if (currentData3 && currentData3.length > 0) {
            let ws3 = XLSX.utils.json_to_sheet(currentData3);
            XLSX.utils.book_append_sheet(wb, ws3, "EXPRT_ONLY");
        } else {
            let ws3 = XLSX.utils.json_to_sheet([{ "ملاحظة": "لا توجد بيانات في هذا التبويب" }]);
            XLSX.utils.book_append_sheet(wb, ws3, "EXPRT_ONLY");
        }
        
        // تبويب 4
        if (currentData4 && currentData4.length > 0) {
            let ws4 = XLSX.utils.json_to_sheet(currentData4);
            XLSX.utils.book_append_sheet(wb, ws4, "EMPTY_STRGE");
        } else {
            let ws4 = XLSX.utils.json_to_sheet([{ "ملاحظة": "لا توجد بيانات في هذا التبويب" }]);
            XLSX.utils.book_append_sheet(wb, ws4, "EMPTY_STRGE");
        }
        
        // ========== تبويب 5 (مضاف جديد) ==========
        if (currentData5 && currentData5.length > 0) {
            let ws5 = XLSX.utils.json_to_sheet(currentData5);
            XLSX.utils.book_append_sheet(wb, ws5, "TRSHP_ONLY");
        } else {
            let ws5 = XLSX.utils.json_to_sheet([{ "ملاحظة": "لا توجد بيانات في هذا التبويب" }]);
            XLSX.utils.book_append_sheet(wb, ws5, "TRSHP_ONLY");
        }
		// تبويب 6
		if (currentData6 && currentData6.length > 0) {
			let ws6 = XLSX.utils.json_to_sheet(currentData6);
			XLSX.utils.book_append_sheet(wb, ws6, "STRGE_EXPRT_ONLY");
		} else {
			let ws6 = XLSX.utils.json_to_sheet([{ "ملاحظة": "لا توجد بيانات في هذا التبويب" }]);
			XLSX.utils.book_append_sheet(wb, ws6, "STRGE_EXPRT_ONLY");
		}
		// تبويب 7
if (currentData7 && currentData7.length > 0) {
    let ws7 = XLSX.utils.json_to_sheet(currentData7);
    XLSX.utils.book_append_sheet(wb, ws7, "IMPRT_FORWARD");
} else {
    let ws7 = XLSX.utils.json_to_sheet([{ "ملاحظة": "لا توجد بيانات في هذا التبويب" }]);
    XLSX.utils.book_append_sheet(wb, ws7, "IMPRT_FORWARD");
}
        
        // إحصائيات
        let statsData = [];
        if (currentData1.length > 0) {
            let totalTrshpNet = currentData1.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0);
            let totalExprtNet = currentData1.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
            statsData.push({
                "التبويب": "TRSHP + EXPRT",
                "عدد الحاويات": currentData1.length,
                "إجمالي TRSHP": totalTrshpNet,
                "إجمالي EXPRT": totalExprtNet,
                "الإجمالي الكلي": totalTrshpNet + totalExprtNet
            });
        }
        if (currentData2.length > 0) {
            let totalStrgeNet = currentData2.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
            let totalExprtNet = currentData2.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
            statsData.push({
                "التبويب": "STRGE + EXPRT + IMPRT",
                "عدد الحاويات": currentData2.length,
                "إجمالي STRGE": totalStrgeNet,
                "إجمالي EXPRT": totalExprtNet,
                "الإجمالي الكلي": totalStrgeNet + totalExprtNet
            });
        }
        if (currentData3.length > 0) {
            statsData.push({
                "التبويب": "EXPRT فقط",
                "عدد الحاويات": currentData3.length,
                "إجمالي EXPRT": currentData3.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0),
                "الإجمالي الكلي": currentData3.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0)
            });
        }
        if (currentData4.length > 0) {
            statsData.push({
                "التبويب": "STRGE فارغ (MTY)",
                "عدد الحاويات": currentData4.length,
                "إجمالي STRGE": currentData4.reduce((s, i) => s + (i["STRGE Net"] || 0), 0),
                "الإجمالي الكلي": currentData4.reduce((s, i) => s + (i["STRGE Net"] || 0), 0)
            });
        }
        // ========== إحصائيات تبويب 5 (مضاف جديد) ==========
        if (currentData5.length > 0) {
            statsData.push({
                "التبويب": "TRSHP فقط",
                "عدد الحاويات": currentData5.length,
                "إجمالي TRSHP": currentData5.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0),
                "الإجمالي الكلي": currentData5.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0)
            });
        }
		
		if (currentData6.length > 0) {
			statsData.push({
				"التبويب": "STRGE + EXPRT فقط",
				"عدد الحاويات": currentData6.length,
				"إجمالي STRGE": currentData6.reduce((s, i) => s + (i["STRGE Net"] || 0), 0),
				"إجمالي EXPRT": currentData6.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0),
				"الإجمالي الكلي": currentData6.reduce((s, i) => s + (i["Total Net"] || 0), 0)
			});
			
			if (currentData7.length > 0) {
    statsData.push({
        "التبويب": "IMPRT + FORWARD",
        "عدد الحاويات": currentData7.length,
        "إجمالي FORWARD": currentData7.filter(i => i["نوع"] === "FORWARD").reduce((s, i) => s + (i["Net"] || 0), 0),
        "إجمالي IMPRT (VESSEL)": currentData7.filter(i => i["نوع"] === "IMPRT (VESSEL)").reduce((s, i) => s + (i["Net"] || 0), 0),
        "الإجمالي الكلي": currentData7.reduce((s, i) => s + (i["Net"] || 0), 0)
    });
}
}
        
        if (statsData.length > 0) {
            let wsStats = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, wsStats, "الإحصائيات");
        }
        
        let fileName = `تقرير_جميع_التبويبات_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        localStorage.setItem("lastExportFileName", fileName);
        document.getElementById("footerMsg").innerHTML = `✅ تم تصدير جميع التبويبات إلى ملف: ${fileName}`;
        
    } catch(err) {
        console.error(err);
        document.getElementById("footerMsg").innerHTML = `❌ خطأ في التصدير: ${err.message}`;
    }
};

// زر اختيار الأعمدة
document.getElementById("selectColumnsBtn1").onclick = () => openColumnModal('tab1');

// تحميل آخر ملف عند فتح الصفحة
setTimeout(() => {
    loadLastFileFromStorage();
}, 500);



// ===== تطبيق تفضيلات الأعمدة المحفوظة تلقائياً عند تحميل الصفحة =====
function applySavedColumnPreferences() {
    // التبويب 1
    if (selectedColumns.tab1 && selectedColumns.tab1.length > 0 && currentData1.length > 0) {
        renderTable1WithSelectedColumns("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
    } else if (currentData1.length > 0) {
        renderTable1WithStats("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
    }
    
    // التبويب 2
    if (selectedColumns.tab2 && selectedColumns.tab2.length > 0 && currentData2.length > 0) {
        if (typeof renderTable2WithSelectedColumns === 'function') {
            renderTable2WithSelectedColumns("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2");
        }
    } else if (currentData2.length > 0) {
        renderTable2("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2");
    }
    
    // التبويب 3
    if (selectedColumns.tab3 && selectedColumns.tab3.length > 0 && currentData3.length > 0) {
        if (typeof renderTable3WithSelectedColumns === 'function') {
            renderTable3WithSelectedColumns("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3");
        }
    } else if (currentData3.length > 0) {
        renderTable3("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3");
    }
    
    // التبويب 4
    if (selectedColumns.tab4 && selectedColumns.tab4.length > 0 && currentData4.length > 0) {
        if (typeof renderTable4WithSelectedColumns === 'function') {
            renderTable4WithSelectedColumns("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4");
        }
    } else if (currentData4.length > 0) {
        renderTable4("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4");
    }
    
    // التبويب 5
    if (selectedColumns.tab5 && selectedColumns.tab5.length > 0 && currentData5.length > 0) {
        if (typeof renderTable5WithSelectedColumns === 'function') {
            renderTable5WithSelectedColumns("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
        }
    } else if (currentData5.length > 0) {
        renderTable5("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    }
	
    // التبويب 6
    if (selectedColumns.tab6 && selectedColumns.tab6.length > 0 && currentData6.length > 0) {
        renderTable6WithSelectedColumns("bodyTab6", currentData6, "searchTab6", "typeTab6", "statsTab6");
    } else if (currentData6.length > 0) {
        renderTable6("bodyTab6", currentData6, "searchTab6", "typeTab6", "statsTab6");
    }
	
    // ===== 🆕 التبويب 7 (IMPRT + FORWARD) =====
    if (selectedColumns.tab7 && selectedColumns.tab7.length > 0 && currentData7.length > 0) {
        if (typeof renderTable7WithSelectedColumns === 'function') {
            renderTable7WithSelectedColumns("bodyTab7", currentData7, "searchTab7", "typeTab7", "statsTab7");
        }
    } else if (currentData7.length > 0) {
        if (typeof renderTable7 === 'function') {
            renderTable7("bodyTab7", currentData7, "searchTab7", "typeTab7", "statsTab7");
        }
    }
	
    // ===== 🆕 التبويب 8 (Storage Finalout) =====
    if (currentData8.length > 0) {
        if (typeof renderTable8 === 'function') {
            renderTable8("bodyTab8", currentData8, "searchTab8", "typeTab8", "statsTab8");
        }
    }
	
    console.log('🎨 تم تطبيق تفضيلات الأعمدة على جميع التبويبات');
}

// استدعاء الدالة بعد تحميل البيانات
// تعديل دالة معالجة الملف لإضافة تطبيق التفضيلات بعد التحميل
const originalProcessAndDisplay1 = processAndDisplay1;
window.processAndDisplay1 = function() {
    originalProcessAndDisplay1();
    // بعد عرض البيانات، تحقق من التفضيلات المحفوظة
    setTimeout(() => {
        if (selectedColumns.tab1 && selectedColumns.tab1.length > 0) {
            renderTable1WithSelectedColumns("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
        }
    }, 100);
};

// أو بشكل أبسط: استدعاء التفضيلات بعد تحميل الصفحة مباشرة
document.addEventListener("DOMContentLoaded", function() {
    // إذا كانت هناك بيانات بالفعل (مثلاً من تحميل سابق)
    if (currentData1.length > 0 && selectedColumns.tab1 && selectedColumns.tab1.length > 0) {
        renderTable1WithSelectedColumns("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1");
    }
});

// تحميل آخر ملف تم حفظه عند فتح الصفحة
setTimeout(() => {
    loadLastFileFromStorage();
}, 500);

// دالة لحفظ الملف مع اختيار المسار (تظهر نافذة حفظ المتصفح)
function exportAllWithPath() {
    try {
        let wb = XLSX.utils.book_new();
        
        // إضافة Sheets (نفس الكود أعلاه)
        if (currentData1 && currentData1.length > 0) {
            let ws1 = XLSX.utils.json_to_sheet(currentData1);
            XLSX.utils.book_append_sheet(wb, ws1, "TRSHP_EXPRT");
        }
        if (currentData2 && currentData2.length > 0) {
            let ws2 = XLSX.utils.json_to_sheet(currentData2);
            XLSX.utils.book_append_sheet(wb, ws2, "STRGE_EXPRT_IMPRT");
        }
        if (currentData3 && currentData3.length > 0) {
            let ws3 = XLSX.utils.json_to_sheet(currentData3);
            XLSX.utils.book_append_sheet(wb, ws3, "EXPRT_ONLY");
        }
        if (currentData4 && currentData4.length > 0) {
            let ws4 = XLSX.utils.json_to_sheet(currentData4);
            XLSX.utils.book_append_sheet(wb, ws4, "EMPTY_STRGE");
        }
        
        let fileName = `تقرير_جميع_التبويبات_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        localStorage.setItem("lastExportFileName", fileName);
        document.getElementById("footerMsg").innerHTML = `✅ تم التصدير إلى: ${fileName}`;
        
    } catch(err) {
        console.error(err);
        document.getElementById("footerMsg").innerHTML = `❌ خطأ: ${err.message}`;
    }
}

function printReport(tabId, title) {
    // الحصول على محتوى التبويب النشط
    let activeTab = document.getElementById(tabId);
    if (!activeTab) {
        console.error("التبويب غير موجود:", tabId);
        return;
    }
    
    // ===== نسخ الإحصائيات فقط =====
    let statsElement = activeTab.querySelector('.stats');
    let statsClone = statsElement ? statsElement.cloneNode(true) : null;
    
    // ===== الحصول على الجدول من داخل .table-wrapper =====
    let tableWrapper = activeTab.querySelector('.table-wrapper');
    let tableElement = tableWrapper ? tableWrapper.querySelector('table') : null;
    
    // إذا لم يتم العثور على الجدول، حاول البحث مباشرة
    if (!tableElement) {
        tableElement = activeTab.querySelector('table');
    }
    
    let tableClone = tableElement ? tableElement.cloneNode(true) : null;
    
    if (!tableClone) {
        console.error("الجدول غير موجود");
        return;
    }
    
    // نسخ عميق للمحتوى
    let statsContent = statsClone ? statsClone.cloneNode(true) : null;
    let tableContent = tableClone.cloneNode(true);
    
    // ========== إعادة بناء الجدول مع الترقيم ==========
    if (tableContent) {
        // إزالة sticky
        let thead = tableContent.querySelector('thead');
        let allTh = tableContent.querySelectorAll('th');
        if (thead) thead.style.position = 'static';
        allTh.forEach(th => th.style.position = 'static');
        
        // إضافة عمود "م" في الرأس
        let headerRow = tableContent.querySelector('thead tr');
        if (headerRow) {
            let existingSerial = headerRow.querySelector('.serial-header');
            if (existingSerial) existingSerial.remove();
            
            let th = document.createElement('th');
            th.textContent = 'م';
            th.style.width = '35px';
            th.style.backgroundColor = '#0a3d62';
            th.style.color = 'white';
            th.style.textAlign = 'center';
            th.style.fontWeight = 'bold';
            th.style.border = '1px solid #0a3d62';
            th.classList.add('serial-header');
            headerRow.insertBefore(th, headerRow.firstChild);
        }
        
        // إضافة الأرقام التسلسلية
        let rows = tableContent.querySelectorAll('tbody tr');
        rows.forEach((row, idx) => {
            let existingCell = row.querySelector('.serial-cell');
            if (existingCell) existingCell.remove();
            
            let td = document.createElement('td');
            td.textContent = idx + 1;
            td.style.fontWeight = 'bold';
            td.style.backgroundColor = '#f8f9fa';
            td.style.textAlign = 'center';
            td.style.width = '35px';
            td.style.border = '1px solid #dee2e6';
            td.classList.add('serial-cell');
            row.insertBefore(td, row.firstChild);
        });
    }
    
    // الحصول على بيانات الرأس
    let headerCarrierName = document.getElementById("headerCarrierName")?.innerText;
    let headerShippingDate = document.getElementById("headerShippingDate")?.innerText;
    let headerLineId = document.getElementById("headerLineId")?.innerText;

    if (!headerCarrierName || headerCarrierName === "—") {
        headerCarrierName = "MSC JADE";
    }
    if (!headerShippingDate || headerShippingDate === "—") {
        headerShippingDate = "2026/05/05";
    }
    if (!headerLineId || headerLineId === "—") {
        headerLineId = "MSC";
    }

    console.log("Carrier Name:", headerCarrierName);
    console.log("Shipping Date:", headerShippingDate);
    console.log("Line ID:", headerLineId);
    
    let currentDate = new Date().toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
	
	    // ===== معلومات إضافية لتبويب 8 =====
    let extraInfo = "";
    if (tabId === 'tab8') {
        let orderNumber = document.getElementById("headerOrderNumber")?.innerText || "—";
        let lineOp = document.getElementById("headerLineOp")?.innerText || "—";
        let count = document.getElementById("headerCount")?.innerText || "0";
        extraInfo = `
            <div style="text-align: right; margin-bottom: 10px; font-size: 12px; direction: rtl; background: #f8f9fa; padding: 8px; border-radius: 4px;">
                <div>📋 <strong>رقم الأمر:</strong> ${orderNumber}</div>
                <div>🚢 <strong>الخط المشغل:</strong> ${lineOp}</div>
                <div>📦 <strong>عدد الحاويات:</strong> ${count}</div>
            </div>
        `;
    }
    
    let printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
        alert("الرجاء السماح للنوافذ المنبثقة لاستخدام خاصية الطباعة");
        return;
    }
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                * {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    box-sizing: border-box;
                }
                body {
                    padding: 15px;
                    margin: 0;
                    background: white;
                    direction: rtl;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .report-header {
                    text-align: center;
                    margin-bottom: 15px;
                    padding: 5px 0 10px 0;
                    border-bottom: 2px solid #0a3d62;
                    background: white;
                }
                .report-header h1 {
                    color: #0a3d62;
                    margin: 0;
                    font-size: 16px;
                }
                .report-title-line {
                    color: #1e6f5c;
                    font-size: 12px;
                    font-weight: bold;
                    margin: 5px 0 0 0;
                }
                
                .report-date {
                    text-align: left;
                    font-size: 10px;
                    color: #6c757d;
                    margin-bottom: 10px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9px;
                    direction: ltr;
                }
                th {
                    background: #0a3d62;
                    color: white;
                    padding: 6px 4px;
                    border: 1px solid #0a3d62;
                    text-align: center;
                }
                td {
                    padding: 5px 4px;
                    border: 1px solid #dee2e6;
                    text-align: center;
                }
                
                th:first-child, td:first-child {
                    width: 35px;
                }
                td:first-child {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                
                .stats {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }
                .stat-card {
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 6px;
                    text-align: center;
                    flex: 1;
                    background: #f8f9fa;
                }
                .stat-card .number {
                    font-size: 16px;
                    font-weight: bold;
                    color: #0a3d62;
                }
                .stat-card h3 {
                    font-size: 10px;
                    margin: 0;
                }
                
                .signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #0a3d62;
                }
                .signatures > div {
                    text-align: center;
                    flex: 1;
                }
                .signatures > div > div:first-child {
                    height: 35px;
                    border-bottom: 1px solid #000;
                    margin-bottom: 5px;
                }
                
                .footer {
                    margin-top: 15px;
                    text-align: center;
                    font-size: 9px;
                    color: #6c757d;
                    padding-top: 5px;
                }
                
                thead {
                    display: table-header-group;
                }
                tr {
                    break-inside: avoid;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 8px;
                    }
                    
                    .upload-area, .tabs, .settings-btn, .filters, .btn-container,
                    .export-btn, .print-btn, .note, .settings-panel, .modal,
                    .file-label, .export-all-btn, #currentFileName {
                        display: none !important;
                    }
                    
                    @page {
                        size: A4 portrait;
                        margin: 1cm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>📦 تقرير أيام التخزين</h1>
                <div class="report-title-line">
                    ${title}
                </div>
            </div>
         
            <div class="report-date">📅 تاريخ الطباعة: ${currentDate}</div>
            
            ${extraInfo}
            
            <div id="statsPrint"></div>
            <div id="tablePrint"></div>
            
            <div class="signatures">
                <div>
                    <div></div>
                    <strong>Signature</strong>
                    <div style="margin-top:5px;">Head of Operations</div>
                </div>
                <div>
                    <div></div>
                    <strong>Signature</strong>
                    <div style="margin-top:5px;">Document Auditor</div>
                </div>
                <div>
                    <div></div>
                    <strong>Signature</strong>
                    <div style="margin-top:5px;">Line Clerk</div>
                </div>
            </div>
            
            <div class="footer">تم إنشاؤه بواسطة نظام التخزين - تقرير تلقائي</div>
            
            <script>
                if (${!!statsContent}) {
                    document.getElementById('statsPrint').innerHTML = ${JSON.stringify(statsContent ? statsContent.outerHTML : '')};
                }
                document.getElementById('tablePrint').innerHTML = ${JSON.stringify(tableContent.outerHTML)};
                
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            <\/script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// تبويب 1
document.getElementById("printBtn1").onclick = function() {
    let carrier = document.getElementById("headerCarrierName")?.innerText || "—";
    let date = document.getElementById("headerShippingDate")?.innerText || "—";
    let line = document.getElementById("headerLineId")?.innerText || "—";
    printReport('tab1', `تقرير TRSHP + EXPRT | 🚢 ${carrier} | 📅 ${date} | 🏷️ ${line}`);
};

function renderTable2WithSelectedColumns(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let selected = selectedColumns.tab2;
    if (selected.length === 0) {
        selected = availableColumnsTab2.tab2.filter(c => c.default).map(c => c.name);
    }
    
    let thead = document.querySelector('#tableTab2 thead tr');
    if (thead) {
        thead.innerHTML = '';
        selected.forEach(colName => {
            let col = availableColumnsTab2.tab2.find(c => c.name === colName);
            let th = document.createElement('th');
            th.textContent = col ? col.label : colName;
            thead.appendChild(th);
        });
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${selected.length}" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td><\/tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        selected.forEach(colName => {
            let cell = row.insertCell();
            let value = item[colName];
            
            if (["Is OOG", "Is Refrigerated", "Is Bundled", "Is Hazardous"].includes(colName)) {
                cell.textContent = value === "true" ? "✅" : "❌";
            } else if (colName === "نوع IMPRT") {
                if (value === "IMPRT") {
                    cell.innerHTML = '<span style="background:#e0f2fe; padding:2px 8px; border-radius:12px;">📥 IMPRT</span>';
                } else {
                    cell.innerHTML = '<span style="background:#fef3c7; padding:2px 8px; border-radius:12px;">🔄 TRSHP-RETURN</span>';
                }
            } else if (colName === "Flex String 01") {
                if (value === "TRUE") {
                    cell.innerHTML = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
                } else if (value === "FALSE") {
                    cell.innerHTML = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
                } else {
                    cell.textContent = "—";
                }
            } else {
                cell.textContent = value || "—";
            }
        });
    }
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && statsDiv.innerHTML === "") {
        statsDiv.innerHTML = renderAdvancedStatsTab2(data);
        statsDiv.style.display = "block";
    }
}

function openColumnModalTab2() {
    let modal = document.getElementById('columnModal');
    let body = document.getElementById('columnModalBody');
    
    let html = `<div class="select-all">
        <label style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="selectAllColumns"> <strong>تحديد الكل</strong>
        </label>
    </div>`;
    
    let cols = availableColumnsTab2.tab2;
    if (cols) {
        cols.forEach(col => {
            let isChecked = selectedColumns.tab2.includes(col.name) || 
                           (selectedColumns.tab2.length === 0 && col.default);
            html += `
                <div class="column-option">
                    <input type="checkbox" class="col-checkbox" value="${col.name}" id="col_${col.name.replace(/ /g, '_')}" ${isChecked ? 'checked' : ''}>
                    <label for="col_${col.name.replace(/ /g, '_')}">${col.label}</label>
                </div>
            `;
        });
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
    
    document.getElementById('selectAllColumns').onchange = (e) => {
        document.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = e.target.checked);
    };
    
    document.getElementById('applyColumnSelection').onclick = () => {
        let selected = [];
        document.querySelectorAll('.col-checkbox:checked').forEach(cb => selected.push(cb.value));
        selectedColumns.tab2 = selected;
        localStorage.setItem(`selectedColumns_tab2`, JSON.stringify(selected));
        closeColumnModal();
        renderTable2WithSelectedColumns('bodyTab2', currentData2, 'searchTab2', 'typeTab2', 'statsTab2');
    };
}

// تبويب 2
document.getElementById("printBtn2").onclick = () => {
    let carrier = document.getElementById("headerCarrierName")?.innerText || "—";
    let date = document.getElementById("headerShippingDate")?.innerText || "—";
    let line = document.getElementById("headerLineId")?.innerText || "—";
    printReport('tab2', `تقرير STRGE + EXPRT + IMPRT | 🚢 ${carrier} | 📅 ${date} | 🏷️ ${line}`);
};
document.getElementById("selectColumnsBtn2").onclick = () => openColumnModalTab2();

// فلترة التبويب 2 (تعديل لاستخدام الدوال الصحيحة)
document.getElementById("searchTab2")?.addEventListener("input", () => {
    if (selectedColumns.tab2 && selectedColumns.tab2.length > 0) {
        renderTable2WithSelectedColumns("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2");
    } else {
        renderTable2("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2");
    }
});
document.getElementById("typeTab2")?.addEventListener("change", () => {
    if (selectedColumns.tab2 && selectedColumns.tab2.length > 0) {
        renderTable2WithSelectedColumns("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2");
    } else {
        renderTable2("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2");
    }
});

function renderTable3WithSelectedColumns(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let selected = selectedColumns.tab3;
    if (selected.length === 0) {
        selected = availableColumnsTab3.tab3.filter(c => c.default).map(c => c.name);
    }
    
    let thead = document.querySelector('#tableTab3 thead tr');
    if (thead) {
        thead.innerHTML = '';
        selected.forEach(colName => {
            let col = availableColumnsTab3.tab3.find(c => c.name === colName);
            let th = document.createElement('th');
            th.textContent = col ? col.label : colName;
            thead.appendChild(th);
        });
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${selected.length}" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td><\/tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        selected.forEach(colName => {
            let cell = row.insertCell();
            let value = item[colName];
            
            if (["Is OOG", "Is Refrigerated", "Is Bundled", "Is Hazardous"].includes(colName)) {
                cell.textContent = value === "true" ? "✅" : "❌";
            } else if (colName === "Flex String 01") {
                if (value === "TRUE") {
                    cell.innerHTML = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
                } else if (value === "FALSE") {
                    cell.innerHTML = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
                } else {
                    cell.textContent = "—";
                }
            } else if (colName === "طريقة الحساب") {
                let methodClass = value === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
                cell.innerHTML = `<span class="${methodClass}">${value || "—"}</span>`;
            } else {
                cell.textContent = value || "—";
            }
        });
    }
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && statsDiv.innerHTML === "") {
        statsDiv.innerHTML = renderAdvancedStatsTab3(data);
        statsDiv.style.display = "block";
    }
}

function renderTable4WithSelectedColumns(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let selected = selectedColumns.tab4;
    if (selected.length === 0) {
        selected = availableColumnsTab4.tab4.filter(c => c.default).map(c => c.name);
    }
    
    let thead = document.querySelector('#tableTab4 thead tr');
    if (thead) {
        thead.innerHTML = '';
        selected.forEach(colName => {
            let col = availableColumnsTab4.tab4.find(c => c.name === colName);
            let th = document.createElement('th');
            th.textContent = col ? col.label : colName;
            thead.appendChild(th);
        });
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${selected.length}" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td><\/tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        selected.forEach(colName => {
            let cell = row.insertCell();
            let value = item[colName];
            
            if (["Is OOG", "Is Refrigerated", "Is Bundled", "Is Hazardous"].includes(colName)) {
                cell.textContent = value === "true" ? "✅" : "❌";
            } else if (colName === "Flex String 01") {
                if (value === "TRUE") {
                    cell.innerHTML = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
                } else if (value === "FALSE") {
                    cell.innerHTML = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
                } else {
                    cell.textContent = "—";
                }
            } else if (colName === "طريقة الحساب") {
                let methodClass = value === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
                cell.innerHTML = `<span class="${methodClass}">${value || "—"}</span>`;
            } else {
                cell.textContent = value || "—";
            }
        });
    }
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && statsDiv.innerHTML === "") {
        statsDiv.innerHTML = renderAdvancedStatsTab4(data);
        statsDiv.style.display = "block";
    }
}

function openColumnModalTab3() {
    let modal = document.getElementById('columnModal');
    let body = document.getElementById('columnModalBody');
    
    let html = `<div class="select-all">
        <label style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="selectAllColumns"> <strong>تحديد الكل</strong>
        </label>
    </div>`;
    
    let cols = availableColumnsTab3.tab3;
    if (cols) {
        cols.forEach(col => {
            let isChecked = selectedColumns.tab3.includes(col.name) || 
                           (selectedColumns.tab3.length === 0 && col.default);
            html += `
                <div class="column-option">
                    <input type="checkbox" class="col-checkbox" value="${col.name}" id="col_${col.name.replace(/ /g, '_')}" ${isChecked ? 'checked' : ''}>
                    <label for="col_${col.name.replace(/ /g, '_')}">${col.label}</label>
                </div>
            `;
        });
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
    
    document.getElementById('selectAllColumns').onchange = (e) => {
        document.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = e.target.checked);
    };
    
    document.getElementById('applyColumnSelection').onclick = () => {
        let selected = [];
        document.querySelectorAll('.col-checkbox:checked').forEach(cb => selected.push(cb.value));
        selectedColumns.tab3 = selected;
        localStorage.setItem(`selectedColumns_tab3`, JSON.stringify(selected));
        closeColumnModal();
        renderTable3WithSelectedColumns('bodyTab3', currentData3, 'searchTab3', 'typeTab3', 'statsTab3');
    };
}

function openColumnModalTab4() {
    let modal = document.getElementById('columnModal');
    let body = document.getElementById('columnModalBody');
    
    let html = `<div class="select-all">
        <label style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="selectAllColumns"> <strong>تحديد الكل</strong>
        </label>
    </div>`;
    
    let cols = availableColumnsTab4.tab4;
    if (cols) {
        cols.forEach(col => {
            let isChecked = selectedColumns.tab4.includes(col.name) || 
                           (selectedColumns.tab4.length === 0 && col.default);
            html += `
                <div class="column-option">
                    <input type="checkbox" class="col-checkbox" value="${col.name}" id="col_${col.name.replace(/ /g, '_')}" ${isChecked ? 'checked' : ''}>
                    <label for="col_${col.name.replace(/ /g, '_')}">${col.label}</label>
                </div>
            `;
        });
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
    
    document.getElementById('selectAllColumns').onchange = (e) => {
        document.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = e.target.checked);
    };
    
    document.getElementById('applyColumnSelection').onclick = () => {
        let selected = [];
        document.querySelectorAll('.col-checkbox:checked').forEach(cb => selected.push(cb.value));
        selectedColumns.tab4 = selected;
        localStorage.setItem(`selectedColumns_tab4`, JSON.stringify(selected));
        closeColumnModal();
        renderTable4WithSelectedColumns('bodyTab4', currentData4, 'searchTab4', 'typeTab4', 'statsTab4');
    };
}

// تبويب 3
document.getElementById("printBtn3").onclick = () => {
    let carrier = document.getElementById("headerCarrierName")?.innerText || "—";
    let date = document.getElementById("headerShippingDate")?.innerText || "—";
    let line = document.getElementById("headerLineId")?.innerText || "—";
    printReport('tab3', `تقرير EXPRT فقط | 🚢 ${carrier} | 📅 ${date} | 🏷️ ${line}`);
};
document.getElementById("selectColumnsBtn3").onclick = () => openColumnModalTab3();

// فلترة التبويب 3
document.getElementById("searchTab3")?.addEventListener("input", () => {
    if (selectedColumns.tab3 && selectedColumns.tab3.length > 0) {
        renderTable3WithSelectedColumns("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3");
    } else {
        renderTable3("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3");
    }
});
document.getElementById("typeTab3")?.addEventListener("change", () => {
    if (selectedColumns.tab3 && selectedColumns.tab3.length > 0) {
        renderTable3WithSelectedColumns("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3");
    } else {
        renderTable3("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3");
    }
});

// أزرار التبويب 4
document.getElementById("printBtn4").onclick = () => {
    let carrier = document.getElementById("headerCarrierName")?.innerText || "—";
    let date = document.getElementById("headerShippingDate")?.innerText || "—";
    let line = document.getElementById("headerLineId")?.innerText || "—";
    printReport('tab4', `تقرير STRGE فارغ (MTY) + IMPRT | 🚢 ${carrier} | 📅 ${date} | 🏷️ ${line}`);
};
document.getElementById("selectColumnsBtn4").onclick = () => openColumnModalTab4();

// فلترة التبويب 4
document.getElementById("searchTab4")?.addEventListener("input", () => {
    if (selectedColumns.tab4 && selectedColumns.tab4.length > 0) {
        renderTable4WithSelectedColumns("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4");
    } else {
        renderTable4("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4");
    }
});
document.getElementById("typeTab4")?.addEventListener("change", () => {
    if (selectedColumns.tab4 && selectedColumns.tab4.length > 0) {
        renderTable4WithSelectedColumns("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4");
    } else {
        renderTable4("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4");
    }
});

function renderAdvancedStatsTab2(data) {
    if (!data || data.length === 0) {
        return `<div style="padding:20px; text-align:center;">لا توجد بيانات</div>`;
    }

    // ========== تجميع الحاويات الفريدة ==========
    let uniqueContainers = new Map();

    for (let item of data) {
        let containerNo = item["Container No."];
        if (!containerNo) continue;

        if (!uniqueContainers.has(containerNo)) {
            uniqueContainers.set(containerNo, {
                "Container No.": containerNo,
                "Size": item["Size"],
                "Is Refrigerated": item["Is Refrigerated"],
                "Is OOG": item["Is OOG"],
                "Is Hazardous": item["Is Hazardous"],
                "Flex String 01": item["Flex String 01"] || "",
                "Dray Status": item["Dray Status"] || "",
                "STRGE Net": item["STRGE Net"] || 0,
                "EXPRT Net": item["EXPRT Net"] || 0,
                "EXPRT Days": item["EXPRT Days"] || 0,
                "_isFlexTrue": item["_isFlexTrue"] || false
            });
        } else {
            let existing = uniqueContainers.get(containerNo);
            existing["STRGE Net"] += item["STRGE Net"] || 0;
            existing["EXPRT Net"] += item["EXPRT Net"] || 0;
            existing["EXPRT Days"] += item["EXPRT Days"] || 0;
            if (item["_isFlexTrue"] === true) {
                existing["_isFlexTrue"] = true;
                existing["Flex String 01"] = "TRUE";
            }
        }
    }

    let uniqueData = Array.from(uniqueContainers.values());

    // ========== حساب الإحصائيات ==========
    let totalStrgeNet = uniqueData.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    let totalExprtNet = uniqueData.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);

    let flexTrueContainers = uniqueData.filter(i => i["_isFlexTrue"] === true);
    let flexTrueExprtNet = flexTrueContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexTrueCount = flexTrueContainers.length;

    let flexFalseContainers = uniqueData.filter(i => i["_isFlexTrue"] !== true);
    let flexFalseExprtNet = flexFalseContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexFalseCount = flexFalseContainers.length;

    let totalExprtNetAfterDeduction = totalExprtNet - flexTrueExprtNet;

    let refrigeratedContainers = uniqueData.filter(i => i["Is Refrigerated"] === "true");
    let rfExprtDays = refrigeratedContainers.reduce((s, i) => s + (i["EXPRT Days"] || 0), 0);
    let totalCount = uniqueData.length;

	let size20Containers = uniqueData.filter(i => {
		let s = (i["Size"] || "").toString().trim();
		return s.startsWith("2");
	});
	let size40Containers = uniqueData.filter(i => {
		let s = (i["Size"] || "").toString().trim();
		return s.startsWith("4") || s.startsWith("95");
	});
    let size20Count = size20Containers.length;
    let size40Count = size40Containers.length;
    let size20StrgeNet = size20Containers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    let size40StrgeNet = size40Containers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    let size20ExprtNet = size20Containers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let size40ExprtNet = size40Containers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);

	let refrigerated40 = refrigeratedContainers.filter(i => {
		let s = (i["Size"] || "").toString().trim();
		return s.startsWith("4") || s.startsWith("95");
	});
    let refrigerated40Count = refrigerated40.length;
    let refrigerated40Days = refrigerated40.reduce((s, i) => s + (i["EXPRT Days"] || 0), 0);

	let flexTrue20 = flexTrueContainers.filter(i => {
		let s = (i["Size"] || "").toString().trim();
		return s.startsWith("2");
	});
	let flexTrue40 = flexTrueContainers.filter(i => {
		let s = (i["Size"] || "").toString().trim();
		return s.startsWith("4") || s.startsWith("95");
	});
    let flexTrue20Net = flexTrue20.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexTrue40Net = flexTrue40.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);

    // ========== العرض ==========
    return `
        <div style="display: flex; gap: 15px; margin: 0 0 20px 0; flex-wrap: wrap;">

            <!-- STRGE -->
            <div style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي STRGE</div>
                <div style="font-size: 28px; font-weight: bold;">${totalStrgeNet}</div>
                <div style="font-size: 12px;">صافي أيام التخزين</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 20 قدم: ${size20StrgeNet} يوم</div>
                    <div>📦 40 قدم: ${size40StrgeNet} يوم</div>
                </div>
            </div>

            <!-- EXPRT (بعد خصم TRUE) -->
            <div style="flex: 1; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📤 إجمالي EXPRT (بعد الخصم)</div>
                <div style="font-size: 28px; font-weight: bold;">${totalExprtNetAfterDeduction}</div>
                <div style="font-size: 12px;">صافي أيام التصدير</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 20 قدم: ${size20ExprtNet} يوم</div>
                    <div>📦 40 قدم: ${size40ExprtNet} يوم</div>
                    ${flexTrueCount > 0 ? `
                        <div style="margin-top: 5px; background: rgba(255,255,255,0.15); padding: 4px 8px; border-radius: 6px;">
                            ⭐ TRUE (خاص): ${flexTrueExprtNet} يوم (${flexTrueCount} حاوية)
                            <span style="font-size: 10px;">20:${flexTrue20Net} | 40:${flexTrue40Net}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- بطاقة Flex String 01 -->
            <div style="flex: 1; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #ff6b6b; color: white; padding: 12px; text-align: center; font-weight: bold;">
                    ⭐ Re Storage
                </div>
                <div style="padding: 15px;">
                    <div style="display: flex; gap: 10px;">
                        <div style="flex:1; background:#ffebee; border-radius:8px; padding:8px; text-align:center;">
                            <div>⭐ TRUE (خاص)</div>
                            <div style="font-size:20px; font-weight:bold; color:#ff6b6b;">${flexTrueExprtNet}</div>
                            <div>${flexTrueCount} حاوية</div>
                            <div style="font-size:10px;">20:${flexTrue20Net} | 40:${flexTrue40Net}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ثلاجه -->
            <div style="flex: 1; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">❄️ أيام EXPRT (ثلاجه)</div>
                <div style="font-size: 28px; font-weight: bold;">${rfExprtDays}</div>
                <div style="font-size: 12px;">للحاويات ثلاجه فقط</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 العدد: ${refrigeratedContainers.length} حاوية</div>
                    <div>📦 40 قدم: ${refrigerated40Count} (${refrigerated40Days} يوم)</div>
                </div>
            </div>

            <!-- الإجمالي -->
            <div style="flex: 1; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي الحاويات</div>
                <div style="font-size: 28px; font-weight: bold;">${totalCount}</div>
                <div style="font-size: 12px;">حاوية فريدة</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 20 قدم: ${size20Count}</div>
                    <div>📦 40 قدم: ${size40Count}</div>
                    <div>⭐ TRUE: ${flexTrueCount}</div>
                    <div>❄️ مبردة: ${refrigeratedContainers.length}</div>
                </div>
            </div>
        </div>
    `;
}

function renderAdvancedStatsTab3(data) {
    if (!data || data.length === 0) {
        return `<div style="padding:20px; text-align:center;">لا توجد بيانات</div>`;
    }
    
    // ===== 🆕 استبعاد صفوف Dray Status = RETURN من الإحصائيات =====
    data = data.filter(item => (item["Dray Status"] || "") !== "RETURN");
    
    if (data.length === 0) {
        return `<div style="padding:20px; text-align:center;">لا توجد بيانات EXPRT صالحة للحساب</div>`;
    }

    // ========== تجميع الحاويات الفريدة ==========
    let uniqueContainers = new Map();

    for (let item of data) {
        let containerNo = item["Container No."];
        if (!containerNo) continue;

        if (!uniqueContainers.has(containerNo)) {
            uniqueContainers.set(containerNo, {
                "Container No.": containerNo,
                "Size": item["Size"],
                "Is Refrigerated": item["Is Refrigerated"],
                "Is OOG": item["Is OOG"],
                "Is Hazardous": item["Is Hazardous"],
                "Flex String 01": item["Flex String 01"] || "",
                "Dray Status": item["Dray Status"] || "",
                "EXPRT Net": item["EXPRT Net"] || 0,
                "EXPRT Days": item["EXPRT Days"] || 0,
                "_isFlexTrue": item["_isFlexTrue"] || false
            });
        } else {
            let existing = uniqueContainers.get(containerNo);
            existing["EXPRT Net"] += item["EXPRT Net"] || 0;
            existing["EXPRT Days"] += item["EXPRT Days"] || 0;
            if (item["_isFlexTrue"] === true) {
                existing["_isFlexTrue"] = true;
                existing["Flex String 01"] = "TRUE";
            }
        }
    }

    let uniqueData = Array.from(uniqueContainers.values());

    // ========== حساب الإحصائيات ==========
    let totalExprtNet = uniqueData.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);

    let flexTrueContainers = uniqueData.filter(i => i["_isFlexTrue"] === true);
    let flexTrueExprtNet = flexTrueContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexTrueCount = flexTrueContainers.length;

    let flexFalseContainers = uniqueData.filter(i => i["_isFlexTrue"] !== true);
    let flexFalseExprtNet = flexFalseContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexFalseCount = flexFalseContainers.length;

    let totalExprtNetAfterDeduction = totalExprtNet - flexTrueExprtNet;

    let refrigeratedContainers = uniqueData.filter(i => i["Is Refrigerated"] === "true");
    let rfExprtDays = refrigeratedContainers.reduce((s, i) => s + (i["EXPRT Days"] || 0), 0);
    let totalCount = uniqueData.length;

    let size20Containers = uniqueData.filter(i => i["Size"]?.toString().startsWith("2"));
    let size40Containers = uniqueData.filter(i => i["Size"]?.toString().startsWith("4"));
    let size20Count = size20Containers.length;
    let size40Count = size40Containers.length;
    let size20ExprtNet = size20Containers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let size40ExprtNet = size40Containers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);

    let refrigerated40 = refrigeratedContainers.filter(i => i["Size"]?.toString().startsWith("4"));
    let refrigerated40Count = refrigerated40.length;
    let refrigerated40Days = refrigerated40.reduce((s, i) => s + (i["EXPRT Days"] || 0), 0);

    let flexTrue20 = flexTrueContainers.filter(i => i["Size"]?.toString().startsWith("2"));
    let flexTrue40 = flexTrueContainers.filter(i => i["Size"]?.toString().startsWith("4"));
    let flexTrue20Net = flexTrue20.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let flexTrue40Net = flexTrue40.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);

    // ========== العرض ==========
    return `
        <div style="display: flex; gap: 15px; margin: 0 0 20px 0; flex-wrap: wrap;">

            <!-- EXPRT (بعد خصم TRUE) -->
            <div style="flex: 1; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📤 إجمالي EXPRT (بعد الخصم)</div>
                <div style="font-size: 28px; font-weight: bold;">${totalExprtNetAfterDeduction}</div>
                <div style="font-size: 12px;">صافي أيام التصدير</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 20 قدم: ${size20ExprtNet} يوم</div>
                    <div>📦 40 قدم: ${size40ExprtNet} يوم</div>
                    ${flexTrueCount > 0 ? `
                        <div style="margin-top: 5px; background: rgba(255,255,255,0.15); padding: 4px 8px; border-radius: 6px;">
                            ⭐ TRUE (خاص): ${flexTrueExprtNet} يوم (${flexTrueCount} حاوية)
                            <span style="font-size: 10px;">20:${flexTrue20Net} | 40:${flexTrue40Net}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- بطاقة Flex String 01 -->
            <div style="flex: 1; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #ff6b6b; color: white; padding: 12px; text-align: center; font-weight: bold;">
                    ⭐ ReExport_Storage
                </div>
                <div style="padding: 15px;">
                    <div style="display: flex; gap: 10px;">
                        <div style="flex:1; background:#ffebee; border-radius:8px; padding:8px; text-align:center;">
                            <div>⭐ TRUE (خاص)</div>
                            <div style="font-size:20px; font-weight:bold; color:#ff6b6b;">${flexTrueExprtNet}</div>
                            <div>${flexTrueCount} حاوية</div>
                            <div style="font-size:10px;">20:${flexTrue20Net} | 40:${flexTrue40Net}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ثلاجه -->
            <div style="flex: 1; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">❄️ أيام EXPRT (ثلاجه)</div>
                <div style="font-size: 28px; font-weight: bold;">${rfExprtDays}</div>
                <div style="font-size: 12px;">للحاويات ثلاجه فقط</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 العدد: ${refrigeratedContainers.length} حاوية</div>
                    <div>📦 40 قدم: ${refrigerated40Count} (${refrigerated40Days} يوم)</div>
                </div>
            </div>

            <!-- الإجمالي -->
            <div style="flex: 1; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي الحاويات</div>
                <div style="font-size: 28px; font-weight: bold;">${totalCount}</div>
                <div style="font-size: 12px;">حاوية فريدة</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 20 قدم: ${size20Count}</div>
                    <div>📦 40 قدم: ${size40Count}</div>
                    <div>⭐ TRUE: ${flexTrueCount}</div>
                    <div>❄️ مبردة: ${refrigeratedContainers.length}</div>
                </div>
            </div>
        </div>
    `;
}

function renderAdvancedStatsTab4(data) {
    let totalStrgeNet = data.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    
    // 🆕 عدّ الحاويات الفريدة بدلاً من الصفوف
    let uniqueContainerSet = new Set(data.map(item => item["Container No."]));
    let totalCount = uniqueContainerSet.size;
    
    // Flex String 01
    let flexTrueContainers = data.filter(i => i["Flex String 01"] === "TRUE");
    let flexTrueStrgeNet = flexTrueContainers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    // 🆕 العدد الفريد لـ Flex TRUE
    let flexTrueUnique = new Set(flexTrueContainers.map(i => i["Container No."]));
    let flexTrueCount = flexTrueUnique.size;
    
    let flexFalseContainers = data.filter(i => i["Flex String 01"] === "FALSE");
    let flexFalseStrgeNet = flexFalseContainers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    // 🆕 العدد الفريد لـ Flex FALSE
    let flexFalseUnique = new Set(flexFalseContainers.map(i => i["Container No."]));
    let flexFalseCount = flexFalseUnique.size;
    
    // OOG و Hazardous
    let oogContainers = data.filter(i => i["Is OOG"] === "true");
    let oogStrgeNet = oogContainers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    // 🆕 العدد الفريد لـ OOG
    let oogUnique = new Set(oogContainers.map(i => i["Container No."]));
    let oogCount = oogUnique.size;
    
    let hazardousContainers = data.filter(i => i["Is Hazardous"] === "true");
    let hazardousStrgeNet = hazardousContainers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    // 🆕 العدد الفريد لـ Hazardous
    let hazardousUnique = new Set(hazardousContainers.map(i => i["Container No."]));
    let hazardousCount = hazardousUnique.size;
    
    // 🆕 المقاسات مع العدد الفريد
    let size20Containers = data.filter(i => {
        let s = (i["Size"] || "").toString().trim();
        return s.startsWith("2");
    });
    let size40Containers = data.filter(i => {
        let s = (i["Size"] || "").toString().trim();
        return s.startsWith("4") || s.startsWith("95");
    });
    
    let size20Unique = new Set(size20Containers.map(i => i["Container No."]));
    let size40Unique = new Set(size40Containers.map(i => i["Container No."]));
    let size20Count = size20Unique.size;
    let size40Count = size40Unique.size;
    
    let size20StrgeNet = size20Containers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    let size40StrgeNet = size40Containers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    
    // تفاصيل Flex حسب المقاس
    let flexTrue20 = flexTrueContainers.filter(i => {
        let s = (i["Size"] || "").toString().trim();
        return s.startsWith("2");
    });
    let flexTrue40 = flexTrueContainers.filter(i => {
        let s = (i["Size"] || "").toString().trim();
        return s.startsWith("4") || s.startsWith("95");
    });
    let flexTrue20Net = flexTrue20.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    let flexTrue40Net = flexTrue40.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    
    return `
        <div style="display: flex; gap: 15px; margin: 0 25px 20px 25px; flex-wrap: wrap;">
            
            <!-- بطاقة 1: STRGE فارغ -->
            <div style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي STRGE فارغ</div>
                <div style="font-size: 28px; font-weight: bold;">${totalStrgeNet}</div>
                <div style="font-size: 12px;">صافي أيام التخزين</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 20 قدم: ${size20StrgeNet} يوم</div>
                    <div>📦 40 قدم: ${size40StrgeNet} يوم</div>
                    <div style="margin-top: 5px;">📐 OOG: ${oogStrgeNet} يوم (${oogCount})</div>
                    <div>⚠️ Hazardous: ${hazardousStrgeNet} يوم (${hazardousCount})</div>
                </div>
            </div>
            
            <!-- بطاقة 3: إجمالي الحاويات -->
            <div style="flex: 1; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي الحاويات</div>
                <div style="font-size: 28px; font-weight: bold;">${totalCount}</div>
                <div style="font-size: 12px;">حاوية</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 20 قدم: ${size20Count} حاوية</div>
                    <div>📦 40 قدم: ${size40Count} حاوية</div>
                    <div style="margin-top: 5px;">📐 OOG: ${oogCount}</div>
                    <div>⚠️ Hazardous: ${hazardousCount}</div>
                    <div>⭐ Flex TRUE: ${flexTrueCount}</div>
                    <div>📋 Flex FALSE: ${flexFalseCount}</div>
                </div>
            </div>
        </div>
    `;
}

function updateFileNameDisplay(fileName) {
    let fileNameDiv = document.getElementById("currentFileName");
    if (fileNameDiv) {
        if (fileName) {
            fileNameDiv.innerHTML = `📄 ${fileName}`;
            fileNameDiv.style.background = "#d4edda";
            fileNameDiv.style.color = "#155724";
        } else {
            fileNameDiv.innerHTML = `📄 لا يوجد ملف محمل`;
            fileNameDiv.style.background = "#e9ecef";
            fileNameDiv.style.color = "#0a3d62";
        }
    }
}

function processAndDisplay5() {
    console.log("=== بدء processAndDisplay5 (فصل السطور مع سماح واحد - TRUCK أولاً) ===");
    console.log("عدد الحاويات في containersMap:", containersMap.size);
    
    let result = [];
    
    for (let [id, container] of containersMap.entries()) {
        // الحصول على مصفوفة TRSHP
        let trshpArray = container.trshpList || [];
        
        let hasTrshp = trshpArray.length > 0;
        
        // ========== التعديل: التحقق من EXPRT مع Dray Status فارغ فقط ==========
        let hasExprt = false;
        if (container.exprtList && container.exprtList.length > 0) {
            for (let ex of container.exprtList) {
                let drayStatus = ex["Dray Status"] || "";
                // إذا كان Dray Status فارغًا، نعتبر أن الحاوية بها EXPRT غير مسموح (تستبعد)
                if (drayStatus === "") {
                    hasExprt = true;
                    break;
                }
            }
        }
        
        let hasStrge = (container.strge !== null && container.strge["Category"] === "STRGE");
        let hasImprt = (container.imprt !== null && container.imprt["Category"] === "IMPRT");
        let hasTrshpReturn = (container.trshpReturn !== null && container.trshpReturn["Category"] === "TRSHP" && container.trshpReturn["Dray Status"] === "RETURN");
        
        if (!hasTrshp) continue;
        
        // شرط TRSHP نقية (بدون EXPRT/STRGE/IMPRT/RETURN)
        let isPureTrshp = !hasExprt && !hasStrge && !hasImprt && !hasTrshpReturn;
        if (!isPureTrshp) {
            console.log(`❌ حاوية ${id} مستبعدة: لديها أنواع أخرى`);
            continue;
        }
        
        // ========== ترتيب الفترات: TRUCK أولاً ثم VESSEL ==========
        // فصل الفترات حسب النوع
        let truckPeriods = [];
        let vesselPeriods = [];
        
        for (let tr of trshpArray) {
            let drayStatus = tr["Dray Status"] || "";
            if (drayStatus !== "" && drayStatus !== null) continue;
            
            let trStart = convertDate(tr["Rule Start Time"] || "");
            let trEnd = convertDate(tr["Rule End Time"] || "");
            if (!trStart || !trEnd) continue;
            
            let obLocType = tr["O/B Loc Type"] || "";  // نستخدم O/B Loc Type للتصنيف
            
            // ===== قراءة Freight Kind من عدة أسماء أعمدة محتملة =====
            let freightKind = tr["Freight Kind"] || tr["Frght Kind"] || tr["FreightKind"] || tr["Freight_Kind"] || "";
            // إذا كانت القيمة "Empty" أو "EMPTY"، حوّلها إلى "MTY"
            if (freightKind && freightKind.toUpperCase() === "EMPTY") {
                freightKind = "MTY";
            }
            
            let periodData = {
                rawData: tr,
                start: trStart,
                end: trEnd,
                days: diffDays(trStart, trEnd),
                ibLocType: tr["I/B Loc Type"] || "",
                obLocType: obLocType,
                vesselName: tr["I/B Carrier Name"] || tr["O/B Carrier Name"] || "",
                flexString01: tr["Flex String 01"] || "",
                flexString04: tr["Flex String 04"] || "",
                obCarrierName: tr["O/B Carrier Name"] || "",
                obCarrierATD: tr["O/B Carrier ATD"] || tr["O/B Carrier ATA"] || "",
                freightKind: freightKind  // ← تأكد من وجود هذا السطر
            };
            
            if (obLocType === "TRUCK") {
                truckPeriods.push(periodData);
            } else if (obLocType === "VESSEL") {
                vesselPeriods.push(periodData);
            } else {
                // إذا لم نجد تصنيف، نضعه في المصفوفة المناسبة حسب I/B Loc Type
                let ibLocType = tr["I/B Loc Type"] || "";
                if (ibLocType === "TRUCK") {
                    truckPeriods.push(periodData);
                } else {
                    vesselPeriods.push(periodData);
                }
            }
        }
        
        // ترتيب كل مجموعة حسب التاريخ
        truckPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));
        vesselPeriods.sort((a, b) => new Date(a.start) - new Date(b.start));
        
        // دمج الفترات: TRUCK أولاً ثم VESSEL
        let sortedPeriods = [...truckPeriods, ...vesselPeriods];
        
        if (sortedPeriods.length === 0) continue;
        
        // ========== حساب إجمالي الأيام والسماح الكلي ==========
        let totalDays = sortedPeriods.reduce((sum, p) => sum + p.days, 0);
        let lineId = container.lineId || "";
        let isExcl = isExcluded(lineId, excludeLines5);
        
        // ===== حساب أيام السماح الكلي مع تمرير freightKind =====
        let firstPeriod = sortedPeriods[0];
        let freightKind = firstPeriod.freightKind || "";
        
        // ==== تشخيص: طباعة قيمة freightKind للحاوية ====
        console.log(`🔍 حاوية ${id}: Freight Kind = "${freightKind}" (طول النص: ${freightKind.length})`);
        
        let freeDays = getFreeDays(trshpOnlyPeriods5, lineId, firstPeriod.start, firstPeriod.flexString01, "", freightKind);
        
        console.log(`🔍 السماح المحسوب للحاوية ${id}: ${freeDays} يوم`);
        
        // ========== توزيع السماح على الفترات بالتسلسل (TRUCK أولاً ثم VESSEL) ==========
        let remainingFree = freeDays;
        
        for (let i = 0; i < sortedPeriods.length; i++) {
            let period = sortedPeriods[i];
            let days = period.days;
            
            let deduction = Math.min(days, remainingFree);
            let netDays = days - deduction;
            if (netDays < 0) netDays = 0;
            remainingFree -= deduction;
            
            let equipType = container.equipmentType;
            let sizeRaw = equipType.toString().trim();
let size = sizeRaw.match(/^(\d+)/)?.[1] || "";

if (!size) {
    if (sizeRaw.startsWith("L5")) size = "45";
    else if (sizeRaw.startsWith("L4")) size = "40";
    else if (sizeRaw.startsWith("L2")) size = "20";
}
            let isRefrigerated = period.rawData["Is Refrigerated"] || "";
            let type = (isRefrigerated === "true" || equipType.includes("R1")) ? "RF" : "GP";
            let isOOG = period.rawData["Is OOG"] || "";
            let isBundled = period.rawData["Is Bundled"] || "";
            let isHazardous = period.rawData["Is Hazardous"] || "";
            let imdgClass = period.rawData["IMDG Class"] || "";
            let method = isExcl ? "🚫 سماح مستقل" : "🔄 سماح متسلسل";
            let displayType = period.obLocType || period.ibLocType || "—";
            
            let hasMultiplePeriods = (sortedPeriods.length > 1);
            
            // ===== استخدم freightKind من period (بدون إعادة تعريف) =====
            let periodFreightKind = period.freightKind || "";
            let orderNumber = period.rawData["Order Number"] || "";
            
            // إذا كانت RF و Freight Kind = MTY و Is Refrigerated = false و netDays <= 0 → لا تظهر
            let isInvalidRF = (type === "RF" && periodFreightKind === "MTY" && isRefrigerated === "false" && netDays <= 0);
            
            let shouldShow = (type === "RF" && !isInvalidRF) || hasMultiplePeriods || (type === "GP" && netDays > 0) || (netDays === 0 && orderNumber && orderNumber.trim() !== "");
            
            if (shouldShow) {
                result.push({
                    "Container No.": id,
                    "Size": size,
                    "Freight Kind": periodFreightKind,
                    "Is OOG": isOOG,
                    "Is Refrigerated": isRefrigerated,
                    "O/B Loc Type": displayType,
                    "Is Bundled": isBundled,
                    "Is Hazardous": isHazardous,
                    "IMDG Class": imdgClass,
                    "Type": type,
                    "Line ID": lineId,
                    "طريقة الحساب": method,
                    "Flex String 01": period.flexString01,
                    "flex_04": period.flexString04,
                    "Order Number": orderNumber,
                    "TRSHP Start": period.start,
                    "TRSHP End": period.end,
                    "TRSHP Days": days,
                    "TRSHP Free": freeDays,
                    "TRSHP Net": netDays,
                    "Total Net": netDays,
                    "Vessel Name": period.vesselName,
                    "O/B Carrier Name": period.obCarrierName,
                    "O/B Carrier ATD": period.obCarrierATD,
                    "Period Order": i + 1,
                    "Period Type": displayType
                });
            }
        }
    } // <--- قوس إغلاق for (containersMap)
    
    // ترتيب النتائج: حسب رقم الحاوية ثم حسب الترتيب (TRUCK ثم VESSEL)
    result.sort((a, b) => {
        let containerCompare = (a["Container No."] || "").localeCompare(b["Container No."] || "");
        if (containerCompare !== 0) return containerCompare;
        return (a["Period Order"] || 0) - (b["Period Order"] || 0);
    });
    
    currentData5 = result;
    console.log("عدد الفترات المعروضة (TRUCK أولاً ثم VESSEL):", currentData5.length);
    
    // تحديث رسالة الفوتر
    let footerMsg = document.getElementById("footerMsg");
    if (footerMsg) {
        let currentText = footerMsg.innerHTML;
        let cleanText = currentText.replace(/\s*\|\s*TRSHP فقط:\s*\d+/, '');
        footerMsg.innerHTML = cleanText + ` | TRSHP فقط: ${currentData5.length}`;
    }
    
    // التحقق من وجود عناصر الجدول
    let tbody = document.getElementById('bodyTab5');
    if (!tbody) {
        console.error("❌ عنصر bodyTab5 غير موجود في الصفحة!");
        return;
    }
    
    if (currentData5.length === 0) {
        tbody.innerHTML = `<tr><td colspan="19" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات TRSHP نقية (بدون Dray Status وبدون EXPRT/STRGE/IMPRT)<\/td></tr>`;
        
        let filtersDiv = document.getElementById("filtersTab5");
        let wrapperDiv = document.getElementById("wrapperTab5");
        if (filtersDiv) filtersDiv.style.display = "none";
        if (wrapperDiv) wrapperDiv.style.display = "none";
        return;
    }
    
    // عرض البيانات
    if (selectedColumns.tab5 && selectedColumns.tab5.length > 0) {
        renderTable5WithSelectedColumns("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    } else {
        renderTable5("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
        updateHeaderFromDisplayData('5', currentData5);
    }
    
    // إظهار عناصر التبويب
    let filtersDiv = document.getElementById("filtersTab5");
    let wrapperDiv = document.getElementById("wrapperTab5");
    let statsDiv = document.getElementById("statsTab5");
    
    if (filtersDiv) filtersDiv.style.display = "flex";
    if (wrapperDiv) wrapperDiv.style.display = "block";
    if (statsDiv && currentData5.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab5(currentData5);
        statsDiv.style.display = "flex";
    }
    
    console.log(`✅ تمت معالجة وعرض ${currentData5.length} فترة TRSHP`);
}

// ========== دوال التبويب 5 (TRSHP فقط) المصححة ==========

function renderTable5(tbodyId, data, searchId, typeId, statsId) {
    console.log("renderTable5 called with data length:", data.length);
    
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && data.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab5(data);
        statsDiv.style.display = "flex";
    } else if (statsDiv) {
        statsDiv.style.display = "none";
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error("tbody not found:", tbodyId);
        return;
    }
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="19" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات TRSHP بدون Dray Status وبدون IMPRT<\/td></tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        let methodClass = item["طريقة الحساب"] === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
        
        let flexValue = item["Flex String 01"] || "—";
        let flexHtml = "—";
        if (flexValue === "TRUE") {
            flexHtml = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
        } else if (flexValue === "FALSE") {
            flexHtml = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
        }
        
        row.innerHTML = `
            <td style="font-weight:bold;">${item["Container No."] || "—"}<\/td>
            <td>${item["Size"] || "—"}<\/td>
			<td>${item["Freight Kind"] || "—"}</td>  <!-- ← أضف هذا -->
            <td>${item["Is OOG"] === "true" ? "✅" : "❌"}<\/td>
            <td>${item["Is Refrigerated"] === "true" ? "✅" : "❌"}<\/td>
            <td>${item["I/B Loc Type"] || "—"}<\/td>
            <td>${item["Is Bundled"] === "true" ? "✅" : "❌"}<\/td>
            <td>${item["Is Hazardous"] === "true" ? "✅" : "❌"}<\/td>
            <td>${item["IMDG Class"] || "—"}<\/td>
            <td><strong>${item["Type"] || "—"}</strong><\/td>
            <td>${item["Line ID"] || "—"}<\/td>
            <td><span class="${methodClass}">${item["طريقة الحساب"] || "—"}</span><\/td>
            <td>${flexHtml}<\/td>
            <td>${item["flex_04"] || "—"}<\/td>
            <td>${item["TRSHP Start"] || "—"}<\/td>
            <td>${item["TRSHP End"] || "—"}<\/td>
            <td style="background:#e3f2fd;">${item["TRSHP Days"] || "—"}<\/td>
            <td style="background:#fff3cd;">${item["TRSHP Free"] || "—"}<\/td>
            <td style="background:#d4edda;">${item["TRSHP Net"] || "—"}<\/td>
            <td style="background:#cce5ff; font-weight:bold;">${item["Total Net"] || "—"}<\/td>
            <td>${item["Vessel Name"] || "—"}<\/td>
        `;
    }
    
    let filtersDiv = document.getElementById("filtersTab5");
    let wrapperDiv = document.getElementById("wrapperTab5");
    if (filtersDiv) filtersDiv.style.display = "flex";
    if (wrapperDiv) wrapperDiv.style.display = "block";
}

function renderTable5WithSelectedColumns(tbodyId, data, searchId, typeId, statsId) {
    console.log("renderTable5WithSelectedColumns called, data length:", data.length);
    
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let selected = selectedColumns.tab5;
    if (!selected || selected.length === 0) {
        selected = availableColumnsTab5.tab5.filter(c => c.default).map(c => c.name);
    }
    
    let thead = document.querySelector('#tableTab5 thead tr');
    if (thead) {
        thead.innerHTML = '';
        selected.forEach(colName => {
            let col = availableColumnsTab5.tab5.find(c => c.name === colName);
            let th = document.createElement('th');
            th.textContent = col ? col.label : colName;
            thead.appendChild(th);
        });
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error("tbody not found:", tbodyId);
        return;
    }
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        let colspan = selected.length;
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات TRSHP بدون Dray Status وبدون IMPRT</td></tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        selected.forEach(colName => {
            let cell = row.insertCell();
            let value = item[colName];
            
            if (["Is OOG", "Is Refrigerated", "Is Bundled", "Is Hazardous"].includes(colName)) {
                cell.textContent = value === "true" ? "✅" : "❌";
            } else if (colName === "طريقة الحساب") {
                let methodClass = value === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
                cell.innerHTML = `<span class="${methodClass}">${value || "—"}</span>`;
            } else if (colName === "Flex String 01") {
                if (value === "TRUE") {
                    cell.innerHTML = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
                } else if (value === "FALSE") {
                    cell.innerHTML = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
                } else {
                    cell.textContent = "—";
                }
            } else if (colName === "Container No.") {
                cell.textContent = value || "—";
                cell.style.fontWeight = "bold";
            } else if (colName === "Type") {
                cell.innerHTML = `<strong>${value || "—"}</strong>`;
            } else {
                cell.textContent = value || "—";
            }
        });
    }
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && statsDiv.innerHTML === "" && data.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab5(data);
        statsDiv.style.display = "flex";
    }
}

function openColumnModalTab5() {
    let modal = document.getElementById('columnModal');
    let body = document.getElementById('columnModalBody');
    
    let html = `<div class="select-all">
        <label style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="selectAllColumns"> <strong>تحديد الكل</strong>
        </label>
    </div>`;
    
    let cols = availableColumnsTab5.tab5;
    if (cols) {
        cols.forEach(col => {
            let isChecked = selectedColumns.tab5?.includes(col.name) || 
                           (selectedColumns.tab5?.length === 0 && col.default);
            html += `
                <div class="column-option">
                    <input type="checkbox" class="col-checkbox" value="${col.name}" id="col_${col.name.replace(/ /g, '_')}" ${isChecked ? 'checked' : ''}>
                    <label for="col_${col.name.replace(/ /g, '_')}">${col.label}</label>
                </div>
            `;
        });
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
    
    document.getElementById('selectAllColumns').onchange = (e) => {
        document.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = e.target.checked);
    };
    
    document.getElementById('applyColumnSelection').onclick = () => {
        let selected = [];
        document.querySelectorAll('.col-checkbox:checked').forEach(cb => selected.push(cb.value));
        selectedColumns.tab5 = selected;
        localStorage.setItem(`selectedColumns_tab5`, JSON.stringify(selected));
        closeColumnModal();
        if (currentData5.length > 0) {
            renderTable5WithSelectedColumns('bodyTab5', currentData5, 'searchTab5', 'typeTab5', 'statsTab5');
        }
    };
}

// إعادة تعريف أزرار التبويب 5 للتأكد من ربطها
document.getElementById("printBtn5").onclick = () => {
    if (currentData5.length > 0) {
        printReport('tab5', '🚛 تقرير TRSHP فقط (بدون Dray Status وبدون IMPRT)');
    } else {
        alert("لا توجد بيانات للطباعة في تبويب TRSHP فقط");
    }
};

document.getElementById("selectColumnsBtn5").onclick = () => openColumnModalTab5();

// إعدادات السماح للتبويب 5
document.getElementById("settingsBtn5").onclick = () => {
    document.getElementById("settingsPanel5").style.display = "block";
    displayPeriodsList('trshpOnlyPeriodsList5', trshpOnlyPeriods5, '5');
};

document.getElementById("closeSettings5").onclick = () => { 
    document.getElementById("settingsPanel5").style.display = "none"; 
};

document.getElementById("addTrshpOnlyPeriodBtn5").onclick = () => addNewPeriod('5', 'TRSHP');

document.getElementById("savePeriodsBtn5").onclick = () => {
    let updated = updateEndDates(trshpOnlyPeriods5);
    localStorage.setItem("trshpOnlyPeriodsTab5", JSON.stringify(updated));
    localStorage.setItem("excludeLines5", JSON.stringify(excludeLines5));
    trshpOnlyPeriods5 = updated;
    document.getElementById("settingsPanel5").style.display = "none";
    if (containersMap.size > 0) processAndDisplay5();
    document.getElementById("footerMsg").innerHTML = `✅ تم حفظ إعدادات TRSHP فقط`;
};

document.getElementById("addExcludeBtn5").onclick = () => {
    let line = document.getElementById("excludeLine5").value;
    if (line && !excludeLines5.includes(line)) {
        excludeLines5.push(line);
        localStorage.setItem("excludeLines5", JSON.stringify(excludeLines5));
        displayExcludeList('excludeList5', excludeLines5, '5');
        if (containersMap.size > 0) processAndDisplay5();
        document.getElementById("excludeLine5").value = "";
    }
};

// فلترة التبويب 5
document.getElementById("searchTab5")?.addEventListener("input", () => {
    if (selectedColumns.tab5 && selectedColumns.tab5.length > 0 && currentData5.length > 0) {
        renderTable5WithSelectedColumns("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    } else if (currentData5.length > 0) {
        renderTable5("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    }
});

document.getElementById("typeTab5")?.addEventListener("change", () => {
    if (selectedColumns.tab5 && selectedColumns.tab5.length > 0 && currentData5.length > 0) {
        renderTable5WithSelectedColumns("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    } else if (currentData5.length > 0) {
        renderTable5("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    }
});

// زر تصدير التبويب 5
document.getElementById("exportBtn5").onclick = () => {
    if (currentData5.length > 0) {
        let ws = XLSX.utils.json_to_sheet(currentData5);
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TRSHP_ONLY");
        XLSX.writeFile(wb, `تقرير_TRSHP_ONLY_${new Date().toISOString().slice(0,19)}.xlsx`);
    } else {
        alert("لا توجد بيانات للتصدير في تبويب TRSHP فقط");
    }
};

// عرض قائمة الاستثناءات للتبويب 5
displayExcludeList('excludeList5', excludeLines5, '5');

// ========== دوال الإحصائيات للتبويب 5 المصححة ==========

function renderAdvancedStatsTab5(data) {
    if (!data || data.length === 0) {
        return `<div style="padding:20px; text-align:center;">لا توجد بيانات</div>`;
    }
    
    // ========== تجميع الحاويات الفريدة (حسب رقم الحاوية) ==========
    let uniqueContainers = new Map();
    
    for (let item of data) {
        let containerNo = item["Container No."];
        if (!uniqueContainers.has(containerNo)) {
            uniqueContainers.set(containerNo, {
                "Container No.": containerNo,
                "Size": item["Size"],
                "Is Refrigerated": item["Is Refrigerated"],
                "TRSHP Net": item["TRSHP Net"] || 0,
                "TRSHP Days": item["TRSHP Days"] || 0
            });
        } else {
            // دمج القيم إذا وجدت أكثر من فترة لنفس الحاوية
            let existing = uniqueContainers.get(containerNo);
            existing["TRSHP Net"] += item["TRSHP Net"] || 0;
            existing["TRSHP Days"] += item["TRSHP Days"] || 0;
        }
    }
    
    let uniqueData = Array.from(uniqueContainers.values());
    
    let totalTrshpNet = uniqueData.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0);
    let totalCount = uniqueData.length;
    
    // الحاويات المبردة (Is Refrigerated = true)
    let refrigeratedContainers = uniqueData.filter(i => i["Is Refrigerated"] === "true");
    let refrigeratedCount = refrigeratedContainers.length;
    let refrigeratedNet = refrigeratedContainers.reduce((s, i) => s + (i["TRSHP Days"] || 0), 0);
    
    // تفاصيل الحاويات المبردة حسب المقاس
    let refrigerated20 = refrigeratedContainers.filter(i => i["Size"]?.toString().startsWith("2"));
    let refrigerated40 = refrigeratedContainers.filter(i => i["Size"]?.toString().startsWith("4"));
    let refrigerated20Net = refrigerated20.reduce((s, i) => s + (i["TRSHP Days"] || 0), 0);
    let refrigerated40Net = refrigerated40.reduce((s, i) => s + (i["TRSHP Days"] || 0), 0);
    let refrigerated20Count = refrigerated20.length;
    let refrigerated40Count = refrigerated40.length;
    
    // إجمالي الحاويات حسب المقاس
    let size20Containers = uniqueData.filter(i => i["Size"]?.toString().startsWith("2"));
    let size40Containers = uniqueData.filter(i => i["Size"]?.toString().startsWith("4"));
    let size20Count = size20Containers.length;
    let size40Count = size40Containers.length;
    let size20Net = size20Containers.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0);
    let size40Net = size40Containers.reduce((s, i) => s + (i["TRSHP Net"] || 0), 0);
    
    return `
        <div style="display: flex; gap: 15px; margin: 0 25px 20px 25px; flex-wrap: wrap;">
            
            <!-- بطاقة 1: إجمالي TRSHP -->
            <div style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">🚛 إجمالي TRSHP</div>
                <div style="font-size: 28px; font-weight: bold;">${totalTrshpNet}</div>
                <div style="font-size: 12px;">صافي أيام الترانزيت</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 20 قدم: ${size20Net} يوم (${size20Count})</div>
                    <div>📦 40 قدم: ${size40Net} يوم (${size40Count})</div>
                </div>
            </div>
            
            <!-- بطاقة 2: الحاويات المبردة -->
            <div style="flex: 1; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">❄️ الحاويات المبردة (RF)</div>
                <div style="font-size: 28px; font-weight: bold;">${refrigeratedNet}</div>
                <div style="font-size: 12px;">إجمالي أيام TRSHP (قبل الخصم)</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 العدد: ${refrigeratedCount} حاوية</div>
                    <div>📦 إجمالي الأيام: ${refrigeratedNet} يوم</div>
                    <div>📦 20 قدم: ${refrigerated20Net} يوم (${refrigerated20Count})</div>
                    <div>📦 40 قدم: ${refrigerated40Net} يوم (${refrigerated40Count})</div>
                </div>
            </div>
            
            <!-- بطاقة 3: إجمالي الحاويات -->
            <div style="flex: 1; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي الحاويات</div>
                <div style="font-size: 28px; font-weight: bold;">${totalCount}</div>
                <div style="font-size: 12px;">حاوية فريدة</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>❄️ مبردة: ${refrigeratedCount} حاوية</div>
                    <div>📦 20 قدم: ${size20Count}</div>
                    <div>📦 40 قدم: ${size40Count}</div>
                </div>
            </div>
        </div>
    `;
}

// ========== دوال العرض البديلة للتبويب 5 (في حالة احتياجها) ==========

function renderTable5Safe(tbodyId, data, searchId, typeId, statsId) {
    console.log("renderTable5Safe called with data length:", data?.length || 0);
    
    if (!data || data.length === 0) {
        let tbody = document.getElementById(tbodyId);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="19" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات TRSHP بدون Dray Status وبدون IMPRT<\/td></tr>`;
        }
        return;
    }
    
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="19" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات تطابق البحث<\/td></tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        let methodClass = item["طريقة الحساب"] === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
        
        let flexValue = item["Flex String 01"] || "—";
        let flexHtml = "—";
        if (flexValue === "TRUE") {
            flexHtml = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
        } else if (flexValue === "FALSE") {
            flexHtml = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
        }
        
        row.innerHTML = `
            <td style="font-weight:bold;">${item["Container No."] || "—"}<\/td>
            <td>${item["Size"] || "—"}<\/td>
            <td>${item["Is OOG"] === "true" ? "✅" : "❌"}<\/td>
            <td>${item["Is Refrigerated"] === "true" ? "✅" : "❌"}<\/td>
            <td>${item["Is Bundled"] === "true" ? "✅" : "❌"}<\/td>
            <td>${item["Is Hazardous"] === "true" ? "✅" : "❌"}<\/td>
            <td>${item["IMDG Class"] || "—"}<\/td>
            <td><strong>${item["Type"] || "—"}</strong><\/td>
            <td>${item["Line ID"] || "—"}<\/td>
            <td><span class="${methodClass}">${item["طريقة الحساب"] || "—"}</span><\/td>
            <td>${flexHtml}<\/td>
            <td>${item["flex_04"] || "—"}<\/td>
            <td>${item["TRSHP Start"] || "—"}<\/td>
            <td>${item["TRSHP End"] || "—"}<\/td>
            <td style="background:#e3f2fd;">${item["TRSHP Days"] || "—"}<\/td>
            <td style="background:#fff3cd;">${item["TRSHP Free"] || "—"}<\/td>
            <td style="background:#d4edda;">${item["TRSHP Net"] || "—"}<\/td>
            <td style="background:#cce5ff; font-weight:bold;">${item["Total Net"] || "—"}<\/td>
            <td>${item["Vessel Name"] || "—"}<\/td>
        `;
    }
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv) {
        statsDiv.innerHTML = renderAdvancedStatsTab5(filtered);
        statsDiv.style.display = "flex";
    }
}




// تبويب 5
document.getElementById("printBtn5").onclick = () => {
    let carrier = document.getElementById("headerCarrierName")?.innerText || "—";
    let date = document.getElementById("headerShippingDate")?.innerText || "—";
    let line = document.getElementById("headerLineId")?.innerText || "—";
    printReport('tab5', `تقرير TRSHP فقط | 🚢 ${carrier} | 📅 ${date} | 🏷️ ${line}`);
};
document.getElementById("selectColumnsBtn5").onclick = () => openColumnModalTab5();

// إعدادات السماح للتبويب 5
document.getElementById("settingsBtn5").onclick = () => {
    document.getElementById("settingsPanel5").style.display = "block";
    displayPeriodsList('trshpOnlyPeriodsList5', trshpOnlyPeriods5, '5');
};
document.getElementById("closeSettings5").onclick = () => { document.getElementById("settingsPanel5").style.display = "none"; };
document.getElementById("addTrshpOnlyPeriodBtn5").onclick = () => addNewPeriod('5', 'TRSHP');
document.getElementById("savePeriodsBtn5").onclick = () => {
    let updated = updateEndDates(trshpOnlyPeriods5);
    localStorage.setItem("trshpOnlyPeriodsTab5", JSON.stringify(updated));
    localStorage.setItem("excludeLines5", JSON.stringify(excludeLines5));
    trshpOnlyPeriods5 = updated;
    document.getElementById("settingsPanel5").style.display = "none";
    if (containersMap.size > 0) processAndDisplay5();
    document.getElementById("footerMsg").innerHTML = `✅ تم حفظ إعدادات TRSHP فقط`;
};
document.getElementById("addExcludeBtn5").onclick = () => {
    let line = document.getElementById("excludeLine5").value;
    if (line && !excludeLines5.includes(line)) {
        excludeLines5.push(line);
        localStorage.setItem("excludeLines5", JSON.stringify(excludeLines5));
        displayExcludeList('excludeList5', excludeLines5, '5');
        if (containersMap.size > 0) processAndDisplay5();
        document.getElementById("excludeLine5").value = "";
    }
};

// فلترة التبويب 5
document.getElementById("searchTab5")?.addEventListener("input", () => {
    if (selectedColumns.tab5 && selectedColumns.tab5.length > 0) {
        renderTable5WithSelectedColumns("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    } else {
        renderTable5("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    }
});
document.getElementById("typeTab5")?.addEventListener("change", () => {
    if (selectedColumns.tab5 && selectedColumns.tab5.length > 0) {
        renderTable5WithSelectedColumns("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    } else {
        renderTable5("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5");
    }
});

// زر تصدير التبويب 5
document.getElementById("exportBtn5").onclick = () => {
    let ws = XLSX.utils.json_to_sheet(currentData5);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TRSHP_ONLY");
    XLSX.writeFile(wb, `تقرير_TRSHP_ONLY_${new Date().toISOString().slice(0,19)}.xlsx`);
};

function processAndDisplay6() {
    console.log("=== processAndDisplay6 started, containersMap size:", containersMap.size);
    console.log("=== بدء processAndDisplay6 ===");
    console.log("عدد الحاويات في containersMap:", containersMap.size);
    
    let result = [];
    
    for (let [id, container] of containersMap.entries()) {
        // ===================================================
        // التعديل: استخدام exprtList بدلاً من container.exprt
        // ===================================================
        let trshpArray = container.trshpList || [];
        let exprtList = container.exprtList || [];
        
        let hasStrge = (container.strge !== null);
        let hasExprt = exprtList.length > 0;  // ← استخدم exprtList
        let hasTrshp = trshpArray.length > 0;
        let hasImprt = (container.imprt !== null);
        let hasTrshpReturn = (container.trshpReturn !== null);
        
        // الحاوية مؤهلة فقط إذا كان لديها STRGE و EXPRT وليس لديها TRSHP أو IMPRT
        let isValid = hasStrge && hasExprt && !hasTrshp && !hasImprt && !hasTrshpReturn;
        
        if (!isValid) continue;
        
        let st = container.strge;
        let lineId = container.lineId || "";
        let isExcl = isExcluded(lineId, excludeLines6);
        
        // تواريخ STRGE
        let stStart = convertDate(st["Start Time"] || "");
        let stEnd = convertDate(st["End Time"] || "");
        
        if (!stStart || !stEnd) continue;
        
        // ===================================================
        // التعديل: التكرار على كل EXPRT في exprtList
        // ===================================================
        for (let ex of exprtList) {
            // تواريخ EXPRT (باستخدام Rule Start/End Time)
            let exStart = convertDate(ex["Rule Start Time"] || "");
            let exEnd = convertDate(ex["Rule End Time"] || "");
            
            if (!exStart || !exEnd) continue;
            
            // حساب الأيام والتداخل
            let stDays = diffDays(stStart, stEnd);
			// ===== خصم On-Hire (يوم واحد) =====
			if (container.notes === "On-Hire") {
				stDays = stDays - 1;
				if (stDays < 0) stDays = 0;
			}
            let exDays = diffDays(exStart, exEnd);
            
            // حساب الأيام المشتركة
            let overlapResult = calculateDaysWithOverlapRemoved(stStart, stEnd, exStart, exEnd);
            let stDaysAfterOverlap = overlapResult.net1;
            let exDaysAfterOverlap = overlapResult.net2;
            let overlapDays = overlapResult.overlap;
            
            // الحصول على أيام السماح
            let stFlexString01 = st["Flex String 01"] || "";
            let stDrayStatus = st["Dray Status"] || "";
            let exFlexString01 = ex["Flex String 01"] || "";
            let exDrayStatus = ex["Dray Status"] || "";
            
            // ===================================================
            // استخراج isHazardous من STRGE
            // ===================================================
            let stHazardousFlag = (st["Is Hazardous"] === "true" || st["Is Hazardous"] === true);
            
            // ===================================================
            // استخراج isHazardous من EXPRT
            // ===================================================
            let exHazardousFlag = (ex["Is Hazardous"] === "true" || ex["Is Hazardous"] === true);
            
            // ===================================================
            // استدعاء getFreeDays مع إضافة isHazardous لـ STRGE
            // ===================================================
            let stFree = getFreeDays(strgePeriods6, lineId, stStart, stFlexString01, stDrayStatus, "", stHazardousFlag);
            
            // ===================================================
            // استدعاء getFreeDays مع إضافة isHazardous لـ EXPRT
            // ===================================================
            let exFree = getFreeDays(exprtPeriods6, lineId, exStart, exFlexString01, exDrayStatus, "", exHazardousFlag);
            
            let strgeNet = 0, exprtNet = 0;
            
            if (isExcl) {
                let indResult = calculateIndependent(stDaysAfterOverlap, stFree, exDaysAfterOverlap, exFree);
                strgeNet = indResult.net1;
                exprtNet = indResult.net2;
            } else {
                let overlapResultCalc = calculateWithOverlap(stDaysAfterOverlap, stFree, exDaysAfterOverlap, exFree);
                strgeNet = overlapResultCalc.net1;
                exprtNet = overlapResultCalc.net2;
            }
            
            let totalNet = strgeNet + exprtNet;
            let method = isExcl ? "🚫 سماح مستقل" : "🔄 تداخل سماح";
            
            // معلومات الحاوية
            let equipType = container.equipmentType;
            let sizeRaw = equipType.toString().trim();
let size = sizeRaw.match(/^(\d+)/)?.[1] || "";

if (!size) {
    if (sizeRaw.startsWith("L5")) size = "45";
    else if (sizeRaw.startsWith("L4")) size = "40";
    else if (sizeRaw.startsWith("L2")) size = "20";
}
            let isRefrigerated = ex["Is Refrigerated"] || "";
            let type = (isRefrigerated === "true" || equipType.includes("R1")) ? "RF" : "GP";
            let isOOG = ex["Is OOG"] || "";
            let isBundled = ex["Is Bundled"] || "";
            let isHazardous = ex["Is Hazardous"] || "";
            let imdgClass = ex["IMDG Class"] || "";
            let flexString01 = ex["Flex String 01"] || "";
            let vesselName = st["I/B Carrier Name"] || "";
            if (!vesselName) vesselName = ex["I/B Carrier Name"] || "—";
            
            result.push({
                "Container No.": id,
                "Size": size,
                "Is OOG": isOOG,
                "Is Refrigerated": isRefrigerated,
                "Is Bundled": isBundled,
                "Is Hazardous": isHazardous,
                "IMDG Class": imdgClass,
				"Notes": (container.notes === "On-Hire") ? "On-Hire" : "",
                "Type": type,
                "Line ID": lineId,
                "طريقة الحساب": method,
                "Flex String 01": flexString01,
                "flex_04": ex["Flex String 04"] || "",
                "STRGE Start": stStart,
                "STRGE End": stEnd,
                "STRGE Days": stDays,
                "Overlap Days": overlapDays,
                "STRGE After Overlap": stDaysAfterOverlap,
                "STRGE Free": stFree,
                "STRGE Net": strgeNet,
                "EXPRT Start": exStart,
                "EXPRT End": exEnd,
                "EXPRT Days": exDaysAfterOverlap,
                "EXPRT Free": exFree,
                "EXPRT Net": exprtNet,
                "Total Net": totalNet,
                "Vessel Name": vesselName
            });
        }
        // ===================================================
    }
    
    currentData6 = result;
    console.log("عدد الحاويات في تبويب 6 (STRGE+EXPRT فقط):", currentData6.length);
    
    // تحديث رسالة الفوتر
    let footerMsg = document.getElementById("footerMsg");
    if (footerMsg) {
        let currentText = footerMsg.innerHTML;
        let cleanText = currentText.replace(/\s*\|\s*STRGE\+EXPRT فقط:\s*\d+/, '');
        footerMsg.innerHTML = cleanText + ` | STRGE+EXPRT فقط: ${currentData6.length}`;
    }
    
    // عرض البيانات
    renderTable6("bodyTab6", currentData6, "searchTab6", "typeTab6", "statsTab6");
    updateHeaderFromDisplayData('6', currentData6);
}

// ========== دالة معالجة تبويب 7 (IMPRT + FORWARD) ==========
function processAndDisplay7() {
    console.log("=== processAndDisplay7 (التشخيص الكامل) ===");
    console.log("عدد الحاويات في containersMap:", containersMap.size);
    
    let result = [];
    
    for (let [id, container] of containersMap.entries()) {
        let lineId = container.lineId || "";
        let equipType = container.equipmentType || "";
        let sizeRaw = equipType.toString().trim();
let size = sizeRaw.match(/^(\d+)/)?.[1] || "";

if (!size) {
    if (sizeRaw.startsWith("L5")) size = "45";
    else if (sizeRaw.startsWith("L4")) size = "40";
    else if (sizeRaw.startsWith("L2")) size = "20";
}
        
        // ===== التحقق من وجود حالات أخرى =====
        let hasImprt = container.imprt !== null;
        let hasTrshp = (container.trshpList && container.trshpList.length > 0);
        let hasExprt = (container.exprtList && container.exprtList.length > 0) || container.exprt;
        let hasStrge = container.strge !== null;
        let hasTrshpReturn = container.trshpReturn !== null;
        
        // ================================================
        // المسار 1: IMPRT فقط (بدون حالات أخرى)
        // مع Dray Status = FORWARD أو RETURN أو فارغ
        // ================================================
        if (hasImprt && !hasTrshp && !hasExprt && !hasStrge && !hasTrshpReturn) {
            let drayStatus = container.imprt["Dray Status"] || "";
            let obLocType = container.imprt["O/B Loc Type"] || "";
            
            // فقط FORWARD أو RETURN أو فارغ
            if (drayStatus === "FORWARD" || drayStatus === "RETURN") {
                let startTime = container.imprt["Start Time"] || "";
                let endTime = container.imprt["Rule End Time"] || "";
                let paidThruDate = container.imprt["PaidThruDate"] || "";
                
                if (startTime && endTime) {
                    let startTimeFormatted = convertDate(startTime);
                    let endDate = convertDate(endTime);
                    
                    if (startTimeFormatted && endDate) {
                        let startFormatted;
                        let paidDateFormatted = null;
                        let hasPaidThruDate = false;
                        
                        if (paidThruDate && paidThruDate !== "") {
                            hasPaidThruDate = true;
                            let paidDate = convertDate(paidThruDate);
                            paidDateFormatted = paidDate;
                            let start = new Date(paidDate);
                            start.setDate(start.getDate() + 1);
                            startFormatted = start.toLocaleDateString('en-CA');
                        } else {
                            hasPaidThruDate = false;
                            paidDateFormatted = "—";
                            let start = new Date(startTimeFormatted);
                            startFormatted = start.toLocaleDateString('en-CA');
                        }
                        
                        let days = diffDays(startFormatted, endDate);
                        if (days < 0) days = 0;
                        
                        let isExcl = isExcluded(lineId, excludeLines7);
                        let flexString01 = container.imprt["Flex String 01"] || "";
                        
                        let freeDays;
                        if (hasPaidThruDate) {
                            freeDays = 0;
                        } else {
                            freeDays = getFreeDays(imprtForwardPeriods7, lineId, startFormatted, flexString01, drayStatus);
                        }
                        
                        let net = days - freeDays;
                        if (net < 0) net = 0;
                        
                        let isRefrigerated = container.imprt["Is Refrigerated"] || "";
                        let isOOG = container.imprt["Is OOG"] || "";
                        let isHazardous = container.imprt["Is Hazardous"] || "";
                        let imdgClass = container.imprt["IMDG Class"] || "";
                        let type = (isRefrigerated === "true" || equipType.includes("R1")) ? "RF" : "GP";
                        let vesselName = container.imprt["I/B Carrier Name"] || container.imprt["O/B Carrier Name"] || "";
                        let method = isExcl ? "🚫 سماح مستقل" : "🔄 سماح عادي";
                        
                        let typeLabel = "IMPRT (VESSEL)";
                        if (drayStatus === "FORWARD") typeLabel = "IMPRT + FORWARD";
                        if (drayStatus === "RETURN") typeLabel = "IMPRT + RETURN";
                        
                        result.push({
                            "رقم الحاوية": id,
                            "الحجم": size,
                            "OOG": isOOG && isOOG.toLowerCase() === "true" ? "✅" : "❌",
                            "مبرد": isRefrigerated && isRefrigerated.toLowerCase() === "true" ? "✅" : "❌",
                            "خطير": isHazardous && isHazardous.toLowerCase() === "true" ? "✅" : "❌",
                            "IMDG": imdgClass || "—",
                            "النوع": type,
                            "الخط": lineId,
                            "نوع": typeLabel,
                            "Start Time": startTimeFormatted,
                            "PaidThruDate": paidDateFormatted,
                            "Start (Paid+1)": startFormatted,
                            "End": endDate,
                            "Days": days,
                            "Free": freeDays,
                            "Net": net,
                            "Vessel Name": vesselName || "—",
                            "طريقة الحساب": method
                        });
                    }
                }
            }
        }
        
        // ================================================
        // المسار 2: TRSHP فقط (بدون حالات أخرى)
        // مع Dray Status = FORWARD أو RETURN
        // ================================================
        if (hasTrshp && !hasImprt && !hasExprt && !hasStrge) {
            let trshpArray = container.trshpList || [];
            for (let tr of trshpArray) {
                let drayStatus = tr["Dray Status"] || "";
                
                // ← هنا التعديل: إضافة RETURN
                if (drayStatus === "FORWARD" || drayStatus === "RETURN") {
                    let startTime = tr["Start Time"] || "";
                    let endTime = tr["End Time"] || "";
                    let paidThruDate = tr["PaidThruDate"] || "";
                    
                    if (startTime && endTime) {
                        let startTimeFormatted = convertDate(startTime);
                        let endDate = convertDate(endTime);
                        
                        if (startTimeFormatted && endDate) {
                            let startFormatted;
                            let paidDateFormatted = null;
                            let hasPaidThruDate = false;
                            
                            if (paidThruDate && paidThruDate !== "") {
                                hasPaidThruDate = true;
                                let paidDate = convertDate(paidThruDate);
                                paidDateFormatted = paidDate;
                                let start = new Date(paidDate);
                                start.setDate(start.getDate() + 1);
                                startFormatted = start.toLocaleDateString('en-CA');
                            } else {
                                hasPaidThruDate = false;
                                paidDateFormatted = "—";
                                let start = new Date(startTimeFormatted);
                                startFormatted = start.toLocaleDateString('en-CA');
                            }
                            
                            let days = diffDays(startFormatted, endDate);
                            if (days < 0) days = 0;
                            
                            let isExcl = isExcluded(lineId, excludeLines7);
                            let flexString01 = tr["Flex String 01"] || "";
                            
                            let freeDays;
                            if (hasPaidThruDate) {
                                freeDays = 0;
                            } else {
                                freeDays = getFreeDays(imprtForwardPeriods7, lineId, startFormatted, flexString01, drayStatus);
                            }
                            
                            let net = days - freeDays;
                            if (net < 0) net = 0;
                            
                            let isRefrigerated = tr["Is Refrigerated"] || "";
                            let isOOG = tr["Is OOG"] || "";
                            let isHazardous = tr["Is Hazardous"] || "";
                            let imdgClass = tr["IMDG Class"] || "";
                            let type = (isRefrigerated === "true" || equipType.includes("R1")) ? "RF" : "GP";
                            let vesselName = tr["I/B Carrier Name"] || tr["O/B Carrier Name"] || "";
                            let method = isExcl ? "🚫 سماح مستقل" : "🔄 سماح عادي";
                            
                            let typeLabel = drayStatus === "FORWARD" ? "TRSHP + FORWARD" : "TRSHP + RETURN";
                            
                            result.push({
                                "رقم الحاوية": id,
                                "الحجم": size,
                                "OOG": isOOG && isOOG.toLowerCase() === "true" ? "✅" : "❌",
                                "مبرد": isRefrigerated && isRefrigerated.toLowerCase() === "true" ? "✅" : "❌",
                                "خطير": isHazardous && isHazardous.toLowerCase() === "true" ? "✅" : "❌",
                                "IMDG": imdgClass || "—",
                                "النوع": type,
                                "الخط": lineId,
                                "نوع": typeLabel,
                                "Start Time": startTimeFormatted,
                                "PaidThruDate": paidDateFormatted,
                                "Start (Paid+1)": startFormatted,
                                "End": endDate,
                                "Days": days,
                                "Free": freeDays,
                                "Net": net,
                                "Vessel Name": vesselName || "—",
                                "طريقة الحساب": method
                            });
                        }
                    }
                }
            }
        }
    }
    
    console.log("نتيجة تبويب 7:", result.length, "صف");
    currentData7 = result;
    
    // ================================================
    // إظهار التبويب 7 بالقوة
    // ================================================
    console.log("🔄 محاولة إظهار تبويب 7...");
    
    let statsDiv = document.getElementById("statsTab7");
    if (statsDiv) {
        if (currentData7.length > 0) {
            statsDiv.innerHTML = renderAdvancedStatsTab7(currentData7);
            statsDiv.style.display = "flex";
            statsDiv.style.visibility = "visible";
        }
    }
    
    let filtersDiv = document.getElementById("filtersTab7");
    if (filtersDiv) {
        filtersDiv.style.display = "flex";
        filtersDiv.style.visibility = "visible";
    }
    
    let wrapperDiv = document.getElementById("wrapperTab7");
    if (wrapperDiv) {
        wrapperDiv.style.display = "block";
        wrapperDiv.style.visibility = "visible";
    }
    
    let tbody = document.getElementById("bodyTab7");
    if (tbody) {
        if (currentData7.length === 0) {
            tbody.innerHTML = `<tr><td colspan="17" style="text-align:center; padding:40px;">⚠️ لا توجد بيانات</td></tr>`;
        } else {
            tbody.innerHTML = "";
            for (let item of currentData7) {
                let row = tbody.insertRow();
                
                let typeBadge = "";
                if (item["نوع"] === "IMPRT + FORWARD") {
                    typeBadge = '<span style="background:#ff6b6b; color:white; padding:2px 10px; border-radius:12px;">IMPRT + FORWARD</span>';
                } else if (item["نوع"] === "IMPRT + RETURN") {
                    typeBadge = '<span style="background:#ffc107; color:#333; padding:2px 10px; border-radius:12px;">IMPRT + RETURN</span>';
                } else if (item["نوع"] === "IMPRT (VESSEL)") {
                    typeBadge = '<span style="background:#667eea; color:white; padding:2px 10px; border-radius:12px;">IMPRT (VESSEL)</span>';
                } else if (item["نوع"] === "TRSHP + FORWARD") {
                    typeBadge = '<span style="background:#ffa07a; color:#333; padding:2px 10px; border-radius:12px;">TRSHP + FORWARD</span>';
                } else if (item["نوع"] === "TRSHP + RETURN") {
                    typeBadge = '<span style="background:#ff9800; color:#333; padding:2px 10px; border-radius:12px;">TRSHP + RETURN</span>';
                } else {
                    typeBadge = '<span style="background:#667eea; color:white; padding:2px 10px; border-radius:12px;">IMPRT (VESSEL)</span>';
                }
                
                row.innerHTML = `
                    <td style="font-weight:bold;">${item["رقم الحاوية"] || "—"}</td>
                    <td>${item["الحجم"] || "—"}</td>
                    <td>${item["OOG"] || "❌"}</td>
                    <td>${item["مبرد"] || "❌"}</td>
                    <td>${item["خطير"] || "❌"}</td>
                    <td>${item["IMDG"] || "—"}</td>
                    <td><strong>${item["النوع"] || "—"}</strong></td>
                    <td>${item["الخط"] || "—"}</td>
                    <td>${typeBadge}</td>
                    <td>${item["Start Time"] || "—"}</td>
                    <td>${item["PaidThruDate"] || "—"}</td>
                    <td>${item["Start (Paid+1)"] || "—"}</td>
                    <td>${item["End"] || "—"}</td>
                    <td style="background:#e3f2fd;">${item["Days"] || "—"}</td>
                    <td style="background:#fff3cd;">${item["Free"] || "—"}</td>
                    <td style="background:#d4edda; font-weight:bold;">${item["Net"] || "—"}</td>
                    <td>${item["Vessel Name"] || "—"}</td>
                `;
            }
        }
    }
    
    let tab7Div = document.getElementById("tab7");
    if (tab7Div) {
        if (!tab7Div.classList.contains("active")) {
            tab7Div.classList.add("active");
            document.querySelectorAll(".tab-content").forEach(c => {
                if (c.id !== "tab7") c.classList.remove("active");
            });
            document.querySelectorAll(".tab-btn").forEach(b => {
                b.classList.remove("active");
                if (b.dataset.tab === "tab7") b.classList.add("active");
            });
        }
    }
    
    let footerMsg = document.getElementById("footerMsg");
    if (footerMsg) {
        let currentText = footerMsg.innerHTML;
        let cleanText = currentText.replace(/\s*\|\s*IMPRT\+FORWARD:\s*\d+/, '');
        footerMsg.innerHTML = cleanText + ` | IMPRT+FORWARD: ${currentData7.length}`;
    }
    
    console.log("✅ processAndDisplay7 اكتمل");
}

// ========== دالة معالجة تبويب 8 (Storage Finalout) ==========
function processAndDisplay8() {
    console.log("=== بدء processAndDisplay8 (Storage Finalout) ===");
    
    let result = [];
    let headerInfo = {
        orderNumber: "",
        lineOp: ""
    };
    
    // ===== تجميع البيانات من containersMap =====
    for (let [id, container] of containersMap.entries()) {
        // البحث عن أي سجل يحتوي على Order Number (من أي فئة)
        let storageData = null;
        let orderNumber = "";
        let lineOp = "";
        let unitNbr = id;
        let typeISO = "";
        let orig = "";
        let timeIn = "";
        let timeOut = "";
        let storageDaysTotal = 0;
        let lclPoss = "";
        let freightKind = "";
        
        // البحث في trshpList أولاً (قد تحتوي على Order Number)
        if (container.trshpList && container.trshpList.length > 0) {
            for (let tr of container.trshpList) {
                let orderNum = tr["Order Number"] || "";
                if (orderNum && orderNum.trim() !== "") {
                    storageData = tr;
                    break;
                }
            }
        }
        
        // إذا لم نجد، نبحث في exprtList
        if (!storageData && container.exprtList && container.exprtList.length > 0) {
            for (let ex of container.exprtList) {
                let orderNum = ex["Order Number"] || "";
                if (orderNum && orderNum.trim() !== "") {
                    storageData = ex;
                    break;
                }
            }
        }
        
        // إذا لم نجد، نبحث في strge
        if (!storageData && container.strge) {
            let orderNum = container.strge["Order Number"] || "";
            if (orderNum && orderNum.trim() !== "") {
                storageData = container.strge;
            }
        }
        
        // إذا لم نجد، نبحث في imprt
        if (!storageData && container.imprt) {
            let orderNum = container.imprt["Order Number"] || "";
            if (orderNum && orderNum.trim() !== "") {
                storageData = container.imprt;
            }
        }
        
        // إذا لم نجد أي سجل به Order Number، نتخطى
        if (!storageData) continue;
        
        // استخراج البيانات باستخدام الأعمدة الصحيحة
        unitNbr = storageData["Unit Nbr"] || storageData["Equip ID"] || id;
        typeISO = storageData["Type ISO"] || storageData["Equipment Type"] || "";
        orig = storageData["Orig"] || "";
        orderNumber = storageData["Order Number"] || "";
        lineOp = storageData["Line Op"] || storageData["Line ID"] || "";
        timeIn = storageData["Time In"] || storageData["Start Time"] || "";
        timeOut = storageData["Time Out"] || storageData["End Time"] || "";
        storageDaysTotal = parseInt(storageData["Storage Days Total"]) || 0;
        lclPoss = storageData["LCL-POSS"] || "";
        freightKind = storageData["Frght Kind"] || storageData["Freight Kind"] || "";
        
        // حفظ معلومات الرأس (أول حاوية فقط)
        if (!headerInfo.orderNumber) {
            headerInfo.orderNumber = orderNumber;
            headerInfo.lineOp = lineOp;
        }
        
        // تحويل التواريخ
        let timeInFormatted = convertDate(timeIn);
        let timeOutFormatted = convertDate(timeOut);
        
        // ===== حساب أيام التخزين الجديدة =====
        let newStorageDays = 0;
        if (timeInFormatted && timeOutFormatted) {
            let diff = diffDays(timeInFormatted, timeOutFormatted);
            if (orig === "DPA") {
                newStorageDays = diff - 1;
                if (newStorageDays < 0) newStorageDays = 0;
            } else {
                newStorageDays = diff;
            }
        }
        
        // ترتيب حسب LCL-POSS
        let sortKey = lclPoss || "zzzz";
        
        result.push({
            "رقم الحاوية": unitNbr,
            "النوع": typeISO,
            "المنشأ": orig || "—",
            "رقم الأمر": orderNumber,
            "الخط المشغل": lineOp,
            "تاريخ الدخول": timeInFormatted || "—",
            "تاريخ الخروج": timeOutFormatted || "—",
            "أيام التخزين (جديد)": newStorageDays,
            "Storage Days Total": storageDaysTotal,
            "الملاحظات": lclPoss || "—",
            "نوع الشحنة": freightKind || "—",
            "_sortKey": sortKey
        });
    }
    
    // ===== ترتيب النتائج حسب LCL-POSS =====
    result.sort((a, b) => a["_sortKey"].localeCompare(b["_sortKey"]));
    result.forEach(item => delete item._sortKey);
    
    currentData8 = result;
    storageFinaloutHeader = headerInfo;
    
    console.log(`✅ تمت معالجة ${currentData8.length} حاوية في تبويب Storage Finalout`);
    console.log("📋 معلومات الرأس:", headerInfo);
    
    // تحديث الـ Header
    updateStorageFinaloutHeader(headerInfo);
    
    // عرض البيانات
    renderTable8("bodyTab8", currentData8, "searchTab8", "typeTab8", "statsTab8");
    
    // إظهار عناصر التبويب
    let filtersDiv = document.getElementById("filtersTab8");
    let wrapperDiv = document.getElementById("wrapperTab8");
    let statsDiv = document.getElementById("statsTab8");
    
    if (filtersDiv) filtersDiv.style.display = "flex";
    if (wrapperDiv) wrapperDiv.style.display = "block";
    if (statsDiv && currentData8.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab8(currentData8);
        statsDiv.style.display = "flex";
    }
}

// ========== دالة عرض جدول تبويب 7 ==========
function renderTable7(tbodyId, data, searchId, typeId, statsId) {
    console.log("=== renderTable7 ===");
    console.log("data length:", data?.length || 0);
    console.log("data sample:", data?.[0]);
    
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["رقم الحاوية"]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["النوع"] === type;
        return matchSearch && matchType;
    });
    
    console.log("filtered length:", filtered.length);
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && data.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab7(data);
        statsDiv.style.display = "flex";
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error("❌ tbody غير موجود:", tbodyId);
        return;
    }
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="17" style="text-align:center; padding:40px;">⚠️ لا توجد بيانات</td></tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        let methodClass = item["طريقة الحساب"] === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
        
        let typeBadge = "";
        if (item["نوع"] === "IMPRT + FORWARD") {
            typeBadge = '<span style="background:#ff6b6b; color:white; padding:2px 10px; border-radius:12px;">IMPRT + FORWARD</span>';
        } else if (item["نوع"] === "TRSHP + FORWARD") {
            typeBadge = '<span style="background:#ffa07a; color:#333; padding:2px 10px; border-radius:12px;">TRSHP + FORWARD</span>';
        } else {
            typeBadge = '<span style="background:#667eea; color:white; padding:2px 10px; border-radius:12px;">IMPRT (VESSEL)</span>';
        }
        
        row.innerHTML = `
            <td style="font-weight:bold;">${item["رقم الحاوية"] || "—"}</td>
            <td>${item["الحجم"] || "—"}</td>
            <td>${item["OOG"] || "❌"}</td>
            <td>${item["مبرد"] || "❌"}</td>
            <td>${item["خطير"] || "❌"}</td>
            <td>${item["IMDG"] || "—"}</td>
            <td><strong>${item["النوع"] || "—"}</strong></td>
            <td>${item["الخط"] || "—"}</td>
            <td>${typeBadge}</td>
            <td>${item["Start Time"] || "—"}</td>
            <td>${item["PaidThruDate"] || "—"}</td>
            <td>${item["Start (Paid+1)"] || "—"}</td>
            <td>${item["End"] || "—"}</td>
            <td style="background:#e3f2fd;">${item["Days"] || "—"}</td>
            <td style="background:#fff3cd;">${item["Free"] || "—"}</td>
            <td style="background:#d4edda; font-weight:bold;">${item["Net"] || "—"}</td>
            <td>${item["Vessel Name"] || "—"}</td>
        `;
    }
    
    // إظهار العناصر
    let filtersDiv = document.getElementById("filtersTab7");
    let wrapperDiv = document.getElementById("wrapperTab7");
    if (filtersDiv) filtersDiv.style.display = "flex";
    if (wrapperDiv) wrapperDiv.style.display = "block";
    
    console.log("✅ renderTable7 completed, displayed:", filtered.length, "rows");
}

// ========== عرض جدول تبويب 8 ==========
function renderTable8(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["رقم الحاوية"]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["النوع"] === type;
        return matchSearch && matchType;
    });
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات</td></tr>`;
        return;
    }
    
    for (let i = 0; i < filtered.length; i++) {
        let item = filtered[i];
        let row = tbody.insertRow();
        
        // تم إزالة عمود "المسلسل" ← هنا التعديل
        
        // الأعمدة المتبقية بنفس الترتيب
        let cell1 = row.insertCell();
        cell1.textContent = item["رقم الحاوية"] || "—";
        cell1.style.fontWeight = "bold";
        
        let cell2 = row.insertCell();
        cell2.textContent = item["النوع"] || "—";
        
        let cell3 = row.insertCell();
        cell3.textContent = item["المنشأ"] || "—";
        
        let cell4 = row.insertCell();
        cell4.textContent = item["تاريخ الدخول"] || "—";
        
        let cell5 = row.insertCell();
        cell5.textContent = item["تاريخ الخروج"] || "—";
        
        let cell6 = row.insertCell();
        cell6.textContent = item["أيام التخزين (جديد)"] !== undefined ? item["أيام التخزين (جديد)"] : "—";
        cell6.style.background = "#e3f2fd";
        cell6.style.fontWeight = "bold";
        
        let cell7 = row.insertCell();
        cell7.textContent = item["Storage Days Total"] !== undefined ? item["Storage Days Total"] : "—";
        cell7.style.background = "#fff3cd";
        
        let cell8 = row.insertCell();
        cell8.textContent = item["الملاحظات"] || "—";
        
        let cell9 = row.insertCell();
        cell9.textContent = item["نوع الشحنة"] || "—";
    }
    
    // تحديث الإحصائيات
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && data.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab8(data);
        statsDiv.style.display = "flex";
    }
}
// ========== دالة إحصائيات تبويب 7 ==========
function renderAdvancedStatsTab7(data) {
    if (!data || data.length === 0) {
        return `<div style="padding:20px; text-align:center;">لا توجد بيانات</div>`;
    }
    
    // ===== إحصائيات حسب النوع =====
    let totalImprtForward = data.filter(i => i["نوع"] === "IMPRT + FORWARD");
    let totalImprtVessel = data.filter(i => i["نوع"] === "IMPRT (VESSEL)");
    let totalTrshpForward = data.filter(i => i["نوع"] === "TRSHP + FORWARD");
    
    let imprtForwardNet = totalImprtForward.reduce((s, i) => s + (i["Net"] || 0), 0);
    let imprtVesselNet = totalImprtVessel.reduce((s, i) => s + (i["Net"] || 0), 0);
    let trshpForwardNet = totalTrshpForward.reduce((s, i) => s + (i["Net"] || 0), 0);
    let totalNet = data.reduce((s, i) => s + (i["Net"] || 0), 0);
    let totalCount = data.length;
    
    // ===== إحصائيات حسب النوع (RF / GP) =====
    let rfContainers = data.filter(i => i["النوع"] === "RF");
    let gpContainers = data.filter(i => i["النوع"] === "GP");
    let rfNet = rfContainers.reduce((s, i) => s + (i["Net"] || 0), 0);
    let gpNet = gpContainers.reduce((s, i) => s + (i["Net"] || 0), 0);
    let rfCount = rfContainers.length;
    let gpCount = gpContainers.length;
    
    // ===== إحصائيات OOG =====
    let oogContainers = data.filter(i => i["OOG"] === "✅");
    let oogNet = oogContainers.reduce((s, i) => s + (i["Net"] || 0), 0);
    let oogCount = oogContainers.length;
    
    // ===== إحصائيات Hazardous =====
    let hazardousContainers = data.filter(i => i["خطير"] === "✅");
    let hazardousNet = hazardousContainers.reduce((s, i) => s + (i["Net"] || 0), 0);
    let hazardousCount = hazardousContainers.length;
    
    // ===== إحصائيات Refrigerated =====
    let refrigeratedContainers = data.filter(i => i["مبرد"] === "✅");
    let refrigeratedNet = refrigeratedContainers.reduce((s, i) => s + (i["Net"] || 0), 0);
    let refrigeratedCount = refrigeratedContainers.length;
    
    // ===== تفاصيل الحجم =====
    let size20Containers = data.filter(i => i["الحجم"]?.toString().startsWith("2"));
    let size40Containers = data.filter(i => i["الحجم"]?.toString().startsWith("4"));
    let size20Count = size20Containers.length;
    let size40Count = size40Containers.length;
    let size20Net = size20Containers.reduce((s, i) => s + (i["Net"] || 0), 0);
    let size40Net = size40Containers.reduce((s, i) => s + (i["Net"] || 0), 0);
    
    return `
        <div style="display: flex; gap: 15px; margin: 0 25px 20px 25px; flex-wrap: wrap;">
            
            <!-- بطاقة 1: الإجمالي الكلي -->
            <div style="flex: 1; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 الإجمالي الكلي</div>
                <div style="font-size: 28px; font-weight: bold;">${totalNet}</div>
                <div style="font-size: 12px;">صافي أيام</div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 11px;">
                    ${totalCount} حاوية
                </div>
            </div>
            
            <!-- بطاقة 2: IMPRT + FORWARD -->
            <div style="flex: 1; background: linear-gradient(135deg, #ff6b6b, #ee5a24); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📥 IMPRT + FORWARD</div>
                <div style="font-size: 28px; font-weight: bold;">${imprtForwardNet}</div>
                <div style="font-size: 12px;">صافي أيام</div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 11px;">
                    ${totalImprtForward.length} حاوية
                </div>
            </div>
            
            <!-- بطاقة 3: IMPRT (VESSEL) -->
            <div style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📥 IMPRT (VESSEL)</div>
                <div style="font-size: 28px; font-weight: bold;">${imprtVesselNet}</div>
                <div style="font-size: 12px;">صافي أيام</div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 11px;">
                    ${totalImprtVessel.length} حاوية
                </div>
            </div>
            
            <!-- بطاقة 4: TRSHP + FORWARD -->
            <div style="flex: 1; background: linear-gradient(135deg, #ffa07a, #ff6b6b); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">🚛 TRSHP + FORWARD</div>
                <div style="font-size: 28px; font-weight: bold;">${trshpForwardNet}</div>
                <div style="font-size: 12px;">صافي أيام</div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 11px;">
                    ${totalTrshpForward.length} حاوية
                </div>
            </div>
            
            <!-- بطاقة 5: تفاصيل إضافية -->
            <div style="flex: 1; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #0a3d62; color: white; padding: 8px; text-align: center; font-weight: bold; font-size: 12px;">
                    📊 تفاصيل إضافية
                </div>
                <div style="padding: 10px; font-size: 11px;">

                    <div style="display: flex; justify-content: space-between; padding: 3px 0;">
                        <span>📦 20 قدم / 40 قدم</span>
                        <span><strong>${size20Count}</strong> / <strong>${size40Count}</strong> حاوية</span>
                    </div>

                </div>
            </div>
        </div>
    `;
}

// ========== إحصائيات تبويب 8 ==========
function renderAdvancedStatsTab8(data) {
    if (!data || data.length === 0) {
        return `<div style="padding:20px; text-align:center;">لا توجد بيانات</div>`;
    }
    
    let totalContainers = data.length;
    let totalNewDays = data.reduce((s, i) => s + (i["أيام التخزين (جديد)"] || 0), 0);
    let totalOldDays = data.reduce((s, i) => s + (i["Storage Days Total"] || 0), 0);
    let avgNewDays = (totalNewDays / totalContainers).toFixed(1);
    
    let dpaContainers = data.filter(i => i["المنشأ"] === "DPA");
    let dpaCount = dpaContainers.length;
    let dpaDays = dpaContainers.reduce((s, i) => s + (i["أيام التخزين (جديد)"] || 0), 0);
    
    let emptyContainers = data.filter(i => i["نوع الشحنة"] === "Empty");
    let emptyCount = emptyContainers.length;
    
    return `
        <div style="display: flex; gap: 15px; margin: 0 25px 20px 25px; flex-wrap: wrap;">
            <div style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي الحاويات</div>
                <div style="font-size: 28px; font-weight: bold;">${totalContainers}</div>
                <div style="font-size: 12px;">حاوية</div>
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📅 إجمالي أيام التخزين (جديد)</div>
                <div style="font-size: 28px; font-weight: bold;">${totalNewDays}</div>
                <div style="font-size: 12px;">متوسط ${avgNewDays} يوم</div>
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📅 Storage Days Total</div>
                <div style="font-size: 28px; font-weight: bold;">${totalOldDays}</div>
                <div style="font-size: 12px;">من البيانات الأصلية</div>
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📍 DPA</div>
                <div style="font-size: 28px; font-weight: bold;">${dpaCount}</div>
                <div style="font-size: 12px;">حاوية (${dpaDays} يوم)</div>
            </div>
        </div>
    `;
}
// ========== دوال إدارة فترات السماح للتبويب 7 ==========
function getPeriodsArray7() {
    return imprtForwardPeriods7;
}

function setPeriodsArray7(periods) {
    imprtForwardPeriods7 = periods;
    localStorage.setItem("imprtForwardPeriodsTab7", JSON.stringify(imprtForwardPeriods7));
}

// ========== عرض قائمة الفترات للتبويب 7 ==========
function displayPeriodsList7(containerId) {
    let sorted = sortPeriods([...imprtForwardPeriods7]);
    let html = `<table style="width:100%; font-size:12px; border:1px solid #ddd;">
        <thead>
            <tr style="background:#f1f3f5;">
                <th>Line ID</th>
                <th>تاريخ البدء</th>
                <th>تاريخ النهاية</th>
                <th>أيام السماح</th>
                <th></th>
            </tr>
        </thead>
        <tbody>`;
    
    sorted.forEach(period => {
        let endDisplay = period.endDate || "مفتوحة";
        
        html += `<tr>
            <td>
                <select class="period-line-7" data-id="${period.id}" style="padding:6px 10px; border-radius:6px;">
                    <option value="*" ${period.lineId === "*" ? "selected" : ""}>* (الكل)</option>
                    ${masterLinesList.map(line => `<option value="${line}" ${period.lineId === line ? "selected" : ""}>${line}</option>`).join('')}
                </select>
            </td>
            <td><input type="date" class="period-start-7" data-id="${period.id}" value="${period.startDate || ''}" style="width:130px;"></td>
            <td style="background:#f8f9fa;">${endDisplay}</td>
            <td><input type="number" class="period-days-7" data-id="${period.id}" value="${period.freeDays}" style="width:80px;"></td>
            <td><button onclick="window.deletePeriod7(${period.id})" class="delete-btn">✖ حذف</button></td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    document.getElementById(containerId).innerHTML = html;
    
    setTimeout(() => {
        document.querySelectorAll('.period-line-7').forEach(sel => {
            sel.onchange = function() {
                let id = parseInt(this.dataset.id);
                let p = imprtForwardPeriods7.find(p => p.id === id);
                if (p) {
                    p.lineId = this.value;
                    setPeriodsArray7(imprtForwardPeriods7);
                    displayPeriodsList7('imprtForwardPeriodsList7');
                }
            };
        });
        
        document.querySelectorAll('.period-start-7').forEach(inp => {
            inp.onchange = function() {
                let id = parseInt(this.dataset.id);
                let p = imprtForwardPeriods7.find(p => p.id === id);
                if (p) {
                    p.startDate = this.value;
                    setPeriodsArray7(imprtForwardPeriods7);
                    displayPeriodsList7('imprtForwardPeriodsList7');
                }
            };
        });
        
        document.querySelectorAll('.period-days-7').forEach(inp => {
            inp.onchange = function() {
                let id = parseInt(this.dataset.id);
                let p = imprtForwardPeriods7.find(p => p.id === id);
                if (p) {
                    p.freeDays = parseInt(this.value) || 0;
                    setPeriodsArray7(imprtForwardPeriods7);
                    this.value = p.freeDays;
                }
            };
        });
    }, 100);
}

// ========== حذف فترة للتبويب 7 ==========
window.deletePeriod7 = function(periodId) {
    imprtForwardPeriods7 = imprtForwardPeriods7.filter(p => p.id !== periodId);
    let updated = updateEndDates(imprtForwardPeriods7);
    setPeriodsArray7(updated);
    displayPeriodsList7('imprtForwardPeriodsList7');
    if (containersMap.size > 0) processAndDisplay7();
};

// ========== إضافة فترة جديدة للتبويب 7 ==========
function addNewPeriod7() {
    let newId = nextIdImprtForward7++;
    let lastStart = new Date().toISOString().split('T')[0];
    
    let newPeriod = {
        id: newId,
        lineId: "*",
        startDate: lastStart,
        endDate: "",
        freeDays: 0
    };
    
    imprtForwardPeriods7.push(newPeriod);
    setPeriodsArray7(imprtForwardPeriods7);
    displayPeriodsList7('imprtForwardPeriodsList7');
}

// ========== عرض قائمة الاستثناءات للتبويب 7 ==========
function displayExcludeList7() {
    let html = '<div style="display:flex; flex-wrap:wrap; gap:10px;">';
    excludeLines7.forEach((line, idx) => {
        html += `<span class="exclude-badge">🚫 ${line} <button onclick="window.removeExclude7(${idx})" style="background:none; border:none; color:#721c24; cursor:pointer;">✖</button></span>`;
    });
    html += '</div>';
    if (excludeLines7.length === 0) html = '<span style="color:#6c757d;">لا توجد خطوط مستثناة</span>';
    document.getElementById('excludeList7').innerHTML = html;
}

// ========== حذف استثناء للتبويب 7 ==========
window.removeExclude7 = function(idx) {
    excludeLines7.splice(idx, 1);
    localStorage.setItem("excludeLines7", JSON.stringify(excludeLines7));
    displayExcludeList7();
    if (containersMap.size > 0) processAndDisplay7();
};

// ========== أحداث تبويب 7 ==========

// زر إعدادات السماح
document.getElementById("settingsBtn7").onclick = function() {
    document.getElementById("settingsPanel7").style.display = "block";
    displayPeriodsList7('imprtForwardPeriodsList7');
};

// زر إغلاق الإعدادات
document.getElementById("closeSettings7").onclick = function() {
    document.getElementById("settingsPanel7").style.display = "none";
};

// زر إضافة فترة جديدة
document.getElementById("addImprtForwardPeriodBtn7").onclick = function() {
    addNewPeriod7();
};

// زر حفظ الإعدادات
document.getElementById("savePeriodsBtn7").onclick = function() {
    let updated = updateEndDates(imprtForwardPeriods7);
    setPeriodsArray7(updated);
    localStorage.setItem("excludeLines7", JSON.stringify(excludeLines7));
    document.getElementById("settingsPanel7").style.display = "none";
    if (containersMap.size > 0) processAndDisplay7();
    document.getElementById("footerMsg").innerHTML = `✅ تم حفظ إعدادات IMPRT + FORWARD`;
};

// زر إضافة خط للاستثناء
document.getElementById("addExcludeBtn7").onclick = function() {
    let line = document.getElementById("excludeLine7").value;
    if (line && !excludeLines7.includes(line)) {
        excludeLines7.push(line);
        localStorage.setItem("excludeLines7", JSON.stringify(excludeLines7));
        displayExcludeList7();
        if (containersMap.size > 0) processAndDisplay7();
        document.getElementById("excludeLine7").value = "";
    }
};

// زر الطباعة
// طباعة تبويب 7
document.getElementById("printBtn7").onclick = function() {
    if (currentData7.length > 0) {
        let carrier = document.getElementById("headerCarrierName")?.innerText || "—";
        let date = document.getElementById("headerShippingDate")?.innerText || "—";
        let line = document.getElementById("headerLineId")?.innerText || "—";
        printReport('tab7', `📥 تقرير IMPRT + FORWARD | 🚢 ${carrier} | 📅 ${date} | 🏷️ ${line}`);
    } else {
        alert("لا توجد بيانات للطباعة");
    }
};

// زر تصدير Excel
document.getElementById("exportBtn7").onclick = function() {
    if (currentData7.length > 0) {
        let ws = XLSX.utils.json_to_sheet(currentData7);
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "IMPRT_FORWARD");
        XLSX.writeFile(wb, `تقرير_IMPRT_FORWARD_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`);
    } else {
        alert("لا توجد بيانات للتصدير");
    }
};

// زر اختيار الأعمدة
// ربط زر اختيار الأعمدة لتبويب 7
document.getElementById("selectColumnsBtn7").onclick = function() {
    openColumnModalTab7();
};

// البحث والفلترة
document.getElementById("searchTab7")?.addEventListener("input", function() {
    renderTable7("bodyTab7", currentData7, "searchTab7", "typeTab7", "statsTab7");
});

document.getElementById("typeTab7")?.addEventListener("change", function() {
    renderTable7("bodyTab7", currentData7, "searchTab7", "typeTab7", "statsTab7");
});

// عرض قائمة الاستثناءات عند التحميل
displayExcludeList7();

function renderTable6(tbodyId, data, searchId, typeId, statsId) {
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    // 🆕 عرض الإحصائيات دائماً (قبل أي شرط)
    let statsDivInitial = document.getElementById(statsId);
    if (statsDivInitial && data.length > 0) {
        statsDivInitial.innerHTML = renderAdvancedStatsTab6(data);
        statsDivInitial.style.display = "flex";
    }
    
    // تطبيق تفضيلات الأعمدة المحفوظة
    let selected = selectedColumns.tab6;
    if (selected && selected.length > 0) {
        let thead = document.querySelector('#tableTab6 thead tr');
        if (thead) {
            thead.innerHTML = '';
            selected.forEach(colName => {
                let col = availableColumnsTab6.tab6.find(c => c.name === colName);
                let th = document.createElement('th');
                th.textContent = col ? col.label : colName;
                thead.appendChild(th);
            });
        }
        
        let tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${selected.length}" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td></tr>`;
            return;
        }
        
        for (let item of filtered) {
            let row = tbody.insertRow();
            selected.forEach(colName => {
                let cell = row.insertCell();
                let value = item[colName];
                
                if (["Is OOG", "Is Refrigerated", "Is Bundled", "Is Hazardous"].includes(colName)) {
                    cell.textContent = value === "true" ? "✅" : "❌";
                } else if (colName === "طريقة الحساب") {
                    let methodClass = value === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
                    cell.innerHTML = `<span class="${methodClass}">${value || "—"}</span>`;
                } else if (colName === "Flex String 01") {
                    if (value === "TRUE") {
                        cell.innerHTML = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
                    } else if (value === "FALSE") {
                        cell.innerHTML = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
                    } else {
                        cell.textContent = "—";
                    }
                } else if (colName === "Container No.") {
                    cell.textContent = value || "—";
                    cell.style.fontWeight = "bold";
                } else if (colName === "Type") {
                    cell.innerHTML = `<strong>${value || "—"}</strong>`;
                } else {
                    cell.textContent = value || "—";
                }
            });
        }
    } else {
        // العرض العادي بدون تفضيلات
        let tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.innerHTML = "";
        
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="25" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات<\/td></tr>`;
            return;
        }
        
        for (let item of filtered) {
            let row = tbody.insertRow();
            let methodClass = item["طريقة الحساب"] === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
            
            let flexValue = item["Flex String 01"] || "—";
            let flexHtml = "—";
            if (flexValue === "TRUE") {
                flexHtml = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
            } else if (flexValue === "FALSE") {
                flexHtml = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
            }
            
            row.innerHTML = `
                <td style="font-weight:bold;">${item["Container No."] || "—"}<\/td>
                <td>${item["Size"] || "—"}<\/td>
                <td>${item["Is OOG"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Refrigerated"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Bundled"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["Is Hazardous"] === "true" ? "✅" : "❌"}<\/td>
                <td>${item["IMDG Class"] || "—"}<\/td>
                <td><strong>${item["Type"] || "—"}</strong><\/td>
                <td>${item["Line ID"] || "—"}<\/td>
                <td><span class="${methodClass}">${item["طريقة الحساب"] || "—"}</span><\/td>
                <td>${flexHtml}<\/td>
                <td>${item["flex_04"] || "—"}</td>
                <td>${item["STRGE Start"] || "—"}<\/td>
                <td>${item["STRGE End"] || "—"}<\/td>
                <td style="background:#e3f2fd;">${item["STRGE Days"] || "—"}<\/td>
                <td style="background:#f8d7da;">${item["Overlap Days"] || "—"}<\/td>
                <td style="background:#fff3cd;">${item["STRGE After Overlap"] || "—"}<\/td>
                <td style="background:#fff3cd;">${item["STRGE Free"] || "—"}<\/td>
                <td style="background:#d4edda;">${item["STRGE Net"] || "—"}<\/td>
                <td>${item["EXPRT Start"] || "—"}<\/td>
                <td>${item["EXPRT End"] || "—"}<\/td>
                <td style="background:#e3f2fd;">${item["EXPRT Days"] || "—"}<\/td>
                <td style="background:#fff3cd;">${item["EXPRT Free"] || "—"}<\/td>
                <td style="background:#d4edda;">${item["EXPRT Net"] || "—"}<\/td>
                <td style="background:#cce5ff; font-weight:bold;">${item["Total Net"] || "—"}<\/td>
                <td>${item["Vessel Name"] || "—"}<\/td>
            `;
        }
    }
    
    document.getElementById(statsId).style.display = "flex";
    document.getElementById("filtersTab6").style.display = "flex";
    document.getElementById("wrapperTab6").style.display = "block";
}

function renderAdvancedStatsTab6(data) {
    if (!data || data.length === 0) {
        return `<div style="padding:20px; text-align:center;">لا توجد بيانات</div>`;
    }
    
    let totalStrgeNet = data.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    let totalExprtNet = data.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    
    // 🆕 عدّ الحاويات الفريدة بدلاً من الصفوف
    let uniqueContainerSet = new Set(data.map(item => item["Container No."]));
    let totalCount = uniqueContainerSet.size;
    
    let refrigeratedContainers = data.filter(i => i["Is Refrigerated"] === "true");
    
    // 🆕 العدد الفريد للمبردة
    let refrigeratedUnique = new Set(refrigeratedContainers.map(i => i["Container No."]));
    let refrigeratedCount = refrigeratedUnique.size;
    
    let refrigeratedStrgeNet = refrigeratedContainers.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    let refrigeratedExprtNet = refrigeratedContainers.reduce((s, i) => s + (i["EXPRT Net"] || 0), 0);
    let refrigeratedDays = refrigeratedContainers.reduce((s, i) => s + (i["EXPRT Days"] || 0), 0);
    
    // 🆕 المبردة 20 و 40 قدم مع عدد فريد
    let refrigerated20 = refrigeratedContainers.filter(i => {
        let s = (i["Size"] || "").toString().trim();
        return s.startsWith("2");
    });
    let refrigerated40 = refrigeratedContainers.filter(i => {
        let s = (i["Size"] || "").toString().trim();
        return s.startsWith("4") || s.startsWith("95");
    });
    let refrigerated20Unique = new Set(refrigerated20.map(i => i["Container No."]));
    let refrigerated40Unique = new Set(refrigerated40.map(i => i["Container No."]));
    let refrigerated20Count = refrigerated20Unique.size;
    let refrigerated40Count = refrigerated40Unique.size;
    
    let refrigerated20StrgeNet = refrigerated20.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    let refrigerated40StrgeNet = refrigerated40.reduce((s, i) => s + (i["STRGE Net"] || 0), 0);
    
    // 🆕 المقاسات العامة مع عدد فريد
    let size20Containers = data.filter(i => {
        let s = (i["Size"] || "").toString().trim();
        return s.startsWith("2");
    });
    let size40Containers = data.filter(i => {
        let s = (i["Size"] || "").toString().trim();
        return s.startsWith("4") || s.startsWith("95");
    });
    
    let size20Unique = new Set(size20Containers.map(i => i["Container No."]));
    let size40Unique = new Set(size40Containers.map(i => i["Container No."]));
    let size20Count = size20Unique.size;
    let size40Count = size40Unique.size;
    
    return `
        <div style="display: flex; gap: 15px; margin: 0 25px 20px 25px; flex-wrap: wrap;">
            <div style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي STRGE</div>
                <div style="font-size: 28px; font-weight: bold;">${totalStrgeNet}</div>
                <div style="font-size: 12px;">صافي أيام التخزين</div>
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">❄️ الحاويات المبردة (RF)</div>
                <div style="font-size: 28px; font-weight: bold;">${refrigeratedDays}</div>
                <div style="font-size: 12px;">إجمالي أيام EXPRT للمبردة</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>📦 إجمالي STRGE: ${refrigeratedStrgeNet} يوم</div>
                    <div>📤 إجمالي EXPRT: ${refrigeratedExprtNet} يوم</div>
                    <div>📦 20 قدم: ${refrigerated20Count} حاوية (${refrigerated20StrgeNet} يوم)</div>
                    <div>📦 40 قدم: ${refrigerated40Count} حاوية (${refrigerated40StrgeNet} يوم)</div>
                </div>
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📤 إجمالي EXPRT</div>
                <div style="font-size: 28px; font-weight: bold;">${totalExprtNet}</div>
                <div style="font-size: 12px;">صافي أيام التصدير</div>
            </div>
            <div style="flex: 1; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 12px; padding: 15px; text-align: center; color: white;">
                <div style="font-size: 14px;">📦 إجمالي الحاويات</div>
                <div style="font-size: 28px; font-weight: bold;">${totalCount}</div>
                <div style="font-size: 12px;">حاوية</div>
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
                    <div>❄️ مبردة: ${refrigeratedCount}</div>
                    <div>📦 20 قدم: ${size20Count}</div>
                    <div>📦 40 قدم: ${size40Count}</div>
                </div>
            </div>
        </div>
    `;
}

// تبويب 6
document.getElementById("settingsBtn6").onclick = () => {
    document.getElementById("settingsPanel6").style.display = "block";
    displayPeriodsList('strgePeriodsList6', strgePeriods6, '6');
    displayPeriodsList('exprtPeriodsList6', exprtPeriods6, '6');
};
document.getElementById("closeSettings6").onclick = () => { document.getElementById("settingsPanel6").style.display = "none"; };
document.getElementById("addStrgePeriodBtn6").onclick = () => addNewPeriod('6', 'STRGE');
document.getElementById("addExprtPeriodBtn6").onclick = () => addNewPeriod('6', 'EXPRT');
document.getElementById("savePeriodsBtn6").onclick = () => {
    let updatedStrge = updateEndDates(strgePeriods6);
    let updatedExprt = updateEndDates(exprtPeriods6);
    localStorage.setItem("strgePeriodsTab6", JSON.stringify(updatedStrge));
    localStorage.setItem("exprtPeriodsTab6", JSON.stringify(updatedExprt));
    localStorage.setItem("excludeLines6", JSON.stringify(excludeLines6));
    strgePeriods6 = updatedStrge;
    exprtPeriods6 = updatedExprt;
    document.getElementById("settingsPanel6").style.display = "none";
    if (containersMap.size > 0) processAndDisplay6();
    document.getElementById("footerMsg").innerHTML = `✅ تم حفظ إعدادات STRGE/EXPRT للتبويب 6`;
};
document.getElementById("addExcludeBtn6").onclick = () => {
    let line = document.getElementById("excludeLine6").value;
    if (line && !excludeLines6.includes(line)) {
        excludeLines6.push(line);
        localStorage.setItem("excludeLines6", JSON.stringify(excludeLines6));
        displayExcludeList('excludeList6', excludeLines6, '6');
        if (containersMap.size > 0) processAndDisplay6();
        document.getElementById("excludeLine6").value = "";
    }
};

// فلترة التبويب 6
document.getElementById("searchTab6")?.addEventListener("input", () => renderTable6("bodyTab6", currentData6, "searchTab6", "typeTab6", "statsTab6"));
document.getElementById("typeTab6")?.addEventListener("change", () => renderTable6("bodyTab6", currentData6, "searchTab6", "typeTab6", "statsTab6"));

// تبويب 6
document.getElementById("printBtn6").onclick = () => {
    let carrier = document.getElementById("headerCarrierName")?.innerText || "—";
    let date = document.getElementById("headerShippingDate")?.innerText || "—";
    let line = document.getElementById("headerLineId")?.innerText || "—";
    printReport('tab6', `تقرير STRGE + EXPRT فقط | 🚢 ${carrier} | 📅 ${date} | 🏷️ ${line}`);
};	

// تصدير التبويب 6
document.getElementById("exportBtn6").onclick = () => {
    let ws = XLSX.utils.json_to_sheet(currentData6);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "STRGE_EXPRT_ONLY");
    XLSX.writeFile(wb, `تقرير_STRGE_EXPRT_ONLY_${new Date().toISOString().slice(0,19)}.xlsx`);
};

function openColumnModalTab6() {
    let modal = document.getElementById('columnModal');
    let body = document.getElementById('columnModalBody');
    
    let html = `<div class="select-all">
        <label style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="selectAllColumns"> <strong>تحديد الكل</strong>
        </label>
    </div>`;
    
    let cols = availableColumnsTab6.tab6;
    if (cols) {
        cols.forEach(col => {
            let isChecked = selectedColumns.tab6?.includes(col.name) || 
                           (selectedColumns.tab6?.length === 0 && col.default);
            html += `
                <div class="column-option">
                    <input type="checkbox" class="col-checkbox" value="${col.name}" id="col_${col.name.replace(/ /g, '_')}" ${isChecked ? 'checked' : ''}>
                    <label for="col_${col.name.replace(/ /g, '_')}">${col.label}</label>
                </div>
            `;
        });
    }
    
    body.innerHTML = html;
    modal.classList.add('active');
    
    document.getElementById('selectAllColumns').onchange = (e) => {
        document.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = e.target.checked);
    };
    
    document.getElementById('applyColumnSelection').onclick = () => {
        let selected = [];
        document.querySelectorAll('.col-checkbox:checked').forEach(cb => selected.push(cb.value));
        selectedColumns.tab6 = selected;
        localStorage.setItem(`selectedColumns_tab6`, JSON.stringify(selected));
        closeColumnModal();
        if (currentData6.length > 0) {
            renderTable6WithSelectedColumns('bodyTab6', currentData6, 'searchTab6', 'typeTab6', 'statsTab6');
        }
    };
}

// ========== دوال اختيار الأعمدة للتبويب 6 ==========

function renderTable6WithSelectedColumns(tbodyId, data, searchId, typeId, statsId) {
    console.log("renderTable6WithSelectedColumns called, data length:", data?.length || 0);
    
    if (!data || data.length === 0) {
        let tbody = document.getElementById(tbodyId);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="25" style="text-align:center; padding:40px;">⚠️ لا توجد بيانات<\/td></tr>`;
        }
        return;
    }
    
    let search = document.getElementById(searchId)?.value.toLowerCase() || "";
    let type = document.getElementById(typeId)?.value || "";
    
    let filtered = data.filter(item => {
        let matchSearch = item["Container No."]?.toLowerCase().includes(search) || false;
        let matchType = !type || item["Type"] === type;
        return matchSearch && matchType;
    });
    
    let selected = selectedColumns.tab6;
    if (!selected || selected.length === 0) {
        selected = availableColumnsTab6.tab6.filter(c => c.default).map(c => c.name);
    }
    
    let thead = document.querySelector('#tableTab6 thead tr');
    if (thead) {
        thead.innerHTML = '';
        selected.forEach(colName => {
            let col = availableColumnsTab6.tab6.find(c => c.name === colName);
            let th = document.createElement('th');
            th.textContent = col ? col.label : colName;
            thead.appendChild(th);
        });
    }
    
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        let colspan = selected.length;
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center; padding:40px;">⚠️ لا توجد حاويات تطابق البحث<\/td></tr>`;
        return;
    }
    
    for (let item of filtered) {
        let row = tbody.insertRow();
        selected.forEach(colName => {
            let cell = row.insertCell();
            let value = item[colName];
            
			if (["Is OOG", "Is Refrigerated", "Is Bundled", "Is Hazardous"].includes(colName)) {
				cell.textContent = value === "true" ? "✅" : "❌";
			} else if (colName === "طريقة الحساب") {
				let methodClass = value === "🚫 سماح مستقل" ? "exclude-badge" : "method-badge";
				cell.innerHTML = `<span class="${methodClass}">${value || "—"}</span>`;
			} else if (colName === "Flex String 01") {
				if (value === "TRUE") {
					cell.innerHTML = '<span style="background:#ff6b6b; color:white; padding:2px 8px; border-radius:12px;">⭐ خاص</span>';
				} else if (value === "FALSE") {
					cell.innerHTML = '<span style="background:#4facfe; color:white; padding:2px 8px; border-radius:12px;">📋 عادي</span>';
				} else {
					cell.textContent = "—";
				}
			} else if (colName === "flex_04") {  // ← أضف هذا الشرط
				cell.textContent = value || "—";
			} else if (colName === "Container No.") {
				cell.textContent = value || "—";
				cell.style.fontWeight = "bold";
			} else if (colName === "Type") {
				cell.innerHTML = `<strong>${value || "—"}</strong>`;
			} else {
				cell.textContent = value || "—";
			}
        });
    }
    
    let statsDiv = document.getElementById(statsId);
    if (statsDiv && statsDiv.innerHTML === "" && data.length > 0) {
        statsDiv.innerHTML = renderAdvancedStatsTab6(data);
        statsDiv.style.display = "flex";
    }
}

function updateHeaderInfo(tabId) {
    let carrierName = "—";
    let maxDate = "—";
    let lineIds = new Set();
    
    for (let [id, container] of containersMap.entries()) {
        let sourceData = null;
        
        // تحديد مصدر البيانات حسب التبويب
        if (tabId === '1' || tabId === '2' || tabId === '3' || tabId === '6' || tabId === '7') {
            // ========== التعديل: استخدام exprtList (المصفوفة) أولاً ==========
            if (container.exprtList && container.exprtList.length > 0) {
                sourceData = container.exprtList[0];
            } else if (container.exprt) {
                sourceData = container.exprt;
            }
        } 
        else if (tabId === '4') {
            sourceData = container.strge;
        }
        else if (tabId === '5') {
            // ========== التعديل: استخدام trshpList (المصفوفة) أولاً ==========
            if (container.trshpList && container.trshpList.length > 0) {
                sourceData = container.trshpList[0];
            } else if (container.trshp) {
                sourceData = container.trshp;
            }
        }
        
        if (sourceData) {
            // O/B Carrier Name
            if (carrierName === "—") {
                carrierName = sourceData["O/B Carrier Name"] || "—";
                if (carrierName === "—") {
                    carrierName = sourceData["I/B Carrier Name"] || "—";
                }
            }
            
            // O/B Carrier ATD (تاريخ الشحن)
            let ata = sourceData["O/B Carrier ATD"] || sourceData["O/B Carrier ATA"] || sourceData["I/B Carrier ATA"];
            if (ata && ata !== "") {
                let convertedDate = convertDate(ata);
                if (convertedDate) {
                    if (maxDate === "—" || convertedDate > maxDate) {
                        maxDate = convertedDate;
                    }
                }
            }
            
            // Line ID
            let lineId = sourceData["Line ID"];
            if (lineId && lineId !== "") {
                lineIds.add(lineId);
            }
        }
    }
    
    // تحديث الـ Header
    let carrierNameSpan = document.getElementById("headerCarrierName");
    let shippingDateSpan = document.getElementById("headerShippingDate");
    let lineIdSpan = document.getElementById("headerLineId");
    
    if (carrierNameSpan) {
        carrierNameSpan.textContent = carrierName;
    }
    if (shippingDateSpan) {
        shippingDateSpan.textContent = maxDate;
    }
    if (lineIdSpan) {
        lineIdSpan.textContent = lineIds.size > 0 ? Array.from(lineIds).join(", ") : "—";
    }
}

function updateHeaderFromDisplayData(tabId, displayData) {
    let carrierName = "—";
    let maxDate = "—";
    let lineIds = new Set();
    
    if (!displayData || displayData.length === 0) {
        // إذا لا توجد بيانات، استخدم القيم الافتراضية
        updateHeaderUI(carrierName, maxDate, lineIds);
        return;
    }
    
// تبويب 5 (TRSHP فقط) - المصدر هو TRSHP
if (tabId === '5') {
    let displayedContainerIds = new Set(displayData.map(item => item["Container No."]));
    
    for (let [id, container] of containersMap.entries()) {
        if (!displayedContainerIds.has(id)) continue;
        
        // الحصول على جميع فترات TRSHP
        let trshpArray = container.trshpList || [];
        if (container.trshp && trshpArray.length === 0) {
            trshpArray = [container.trshp];
        }
        
        // البحث عن فترة O/B Loc Type = VESSEL (السفينة)
        let vesselData = null;
        let orderNumber = "";
        
        for (let tr of trshpArray) {
            let locType = tr["O/B Loc Type"] || "";  // ← التصحيح هنا: O/B Loc Type
            if (locType === "VESSEL") {
                vesselData = tr;
                orderNumber = tr["Order Number"] || "";  // ← الحصول على Order Number
                break;
            }
        }
        
        // نأخذ بيانات VESSEL فقط
        if (vesselData) {
            // O/B Carrier Name (اسم السفينة)
            if (carrierName === "—") {
                // ===== التعديل: إذا كان Order Number موجود، استخدمه بدلاً من اسم السفينة =====
                if (orderNumber && orderNumber.trim() !== "") {
                    carrierName = orderNumber;
                } else {
                    carrierName = vesselData["O/B Carrier Name"] || vesselData["I/B Carrier Name"] || "—";
                }
            }
            
            // O/B Carrier ATD (تاريخ الشحن) - من سطر VESSEL فقط
            let atd = vesselData["O/B Carrier ATD"] || vesselData["O/B Carrier ATA"] || "";
            if (atd && atd !== "") {
                let convertedDate = convertDate(atd);
                if (convertedDate) {
                    if (maxDate === "—" || convertedDate > maxDate) {
                        maxDate = convertedDate;
                    }
                }
            }
            
            // Line ID
            let lineId = vesselData["Line ID"];
            if (lineId && lineId !== "") {
                lineIds.add(lineId);
            }
        }
    }
    
    // إذا لم نجد بيانات VESSEL، نأخذ من displayData
    if (carrierName === "—") {
        for (let item of displayData) {
            if (carrierName === "—") {
                // ===== التعديل: إذا كان Order Number موجود، استخدمه =====
                let orderNum = item["Order Number"] || "";
                if (orderNum && orderNum.trim() !== "") {
                    carrierName = orderNum;
                } else {
                    carrierName = item["Vessel Name"] || "—";
                }
            }
            let lineId = item["Line ID"];
            if (lineId && lineId !== "") {
                lineIds.add(lineId);
            }
        }
    }
}
// التبويب 4 (STRGE فارغ + IMPRT) - المصدر الأساسي هو STRGE
else if (tabId === '4') {
    let displayedContainerIds = new Set(displayData.map(item => item["Container No."]));
    
    for (let [id, container] of containersMap.entries()) {
        if (!displayedContainerIds.has(id)) continue;
        
        // المصدر الأساسي هو STRGE (التخزين)
        let sourceData = container.strge;
        
        if (sourceData) {
            // اسم سفينة الشحن من STRGE
            if (carrierName === "—") {
                carrierName = sourceData["O/B Carrier Name"] || "";
                if (carrierName === "") {
                    carrierName = sourceData["I/B Carrier Name"] || "—";
                }
            }
            
            // تاريخ الشحن من STRGE
            let atd = sourceData["O/B Carrier ATD"] || sourceData["O/B Carrier ATA"];
            if (atd && atd !== "") {
                let convertedDate = convertDate(atd);
                if (convertedDate) {
                    if (maxDate === "—" || convertedDate > maxDate) {
                        maxDate = convertedDate;
                    }
                }
            }
            
            // Line ID
            let lineId = sourceData["Line ID"];
            if (lineId && lineId !== "") {
                lineIds.add(lineId);
            }
        }
    }
    
    // إذا لم نجد بيانات من STRGE، استخدم القيم من displayData كاحتياطي
    if (carrierName === "—") {
        for (let item of displayData) {
            if (carrierName === "—") {
                carrierName = item["Vessel Name"] || "—";
            }
            let lineId = item["Line ID"];
            if (lineId && lineId !== "") {
                lineIds.add(lineId);
            }
        }
    }
}
    // التبويبات 1,2,3,6: خذ من بيانات EXPRT (O/B Carrier Name) - معدل لاستخدام exprtList
    else {
        // نبحث في containersMap عن EXPRT المرتبطة بالحاويات المعروضة
        let displayedContainerIds = new Set(displayData.map(item => item["Container No."]));
        
        for (let [id, container] of containersMap.entries()) {
            if (!displayedContainerIds.has(id)) continue;
            
            // ========== التعديل: استخدام exprtList (المصفوفة) أولاً ==========
            let sourceData = null;
            // 🆕 استبعاد سجلات EXPRT التي لها Dray Status = RETURN
            if (container.exprtList && container.exprtList.length > 0) {
                sourceData = container.exprtList.find(ex => 
                    (ex["Dray Status"] || "").trim() !== "RETURN"
                ) || null;
            } else if (container.exprt) {
                let ex = container.exprt;
                if ((ex["Dray Status"] || "").trim() !== "RETURN") {
                    sourceData = ex;
                }
            }
            
            if (sourceData) {
                if (carrierName === "—") {
                    carrierName = sourceData["O/B Carrier Name"] || "—";
                    if (carrierName === "—") {
                        carrierName = sourceData["I/B Carrier Name"] || "—";
                    }
                }
                
                let atd = sourceData["O/B Carrier ATD"] || sourceData["O/B Carrier ATA"];
                if (atd && atd !== "") {
                    let convertedDate = convertDate(atd);
                    if (convertedDate) {
                        if (maxDate === "—" || convertedDate > maxDate) {
                            maxDate = convertedDate;
                        }
                    }
                }
                
                let lineId = sourceData["Line ID"];
                if (lineId && lineId !== "") {
                    lineIds.add(lineId);
                }
            }
        }
    }
    
    updateHeaderUI(carrierName, maxDate, lineIds);
}

// ========== أزرار تبويب 8 ==========

// زر طباعة تبويب 8
document.getElementById("printBtn8").addEventListener("click", function() {
    if (currentData8 && currentData8.length > 0) {
        printReport('tab8', '📋 تقرير Storage Finalout');
    } else {
        alert("⚠️ لا توجد بيانات للطباعة في تبويب Storage Finalout");
    }
});

// زر تصدير تبويب 8 إلى Excel
document.getElementById("exportBtn8").addEventListener("click", function() {
    if (currentData8 && currentData8.length > 0) {
        let ws = XLSX.utils.json_to_sheet(currentData8);
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "STORAGE_FINALOUT");
        XLSX.writeFile(wb, `تقرير_Storage_Finalout_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`);
    } else {
        alert("⚠️ لا توجد بيانات للتصدير في تبويب Storage Finalout");
    }
});

// زر اختيار الأعمدة لتبويب 8
document.getElementById("selectColumnsBtn8").addEventListener("click", function() {
    // يمكنك استخدام دالة عامة لاختيار الأعمدة
    // إذا كانت الأعمدة معرفة مسبقاً في availableColumnsTab8
    openColumnModal('tab8'); // أو أنشئ دالة خاصة
});

// ========== البحث والفلترة لتبويب 8 ==========
document.getElementById("searchTab8")?.addEventListener("input", function() {
    renderTable8("bodyTab8", currentData8, "searchTab8", "typeTab8", "statsTab8");
});

document.getElementById("typeTab8")?.addEventListener("change", function() {
    renderTable8("bodyTab8", currentData8, "searchTab8", "typeTab8", "statsTab8");
});

function updateHeaderUI(carrierName, maxDate, lineIds) {
    // تحديث اسم السفينة في عنوان الصفحة و h1
    if (carrierName !== "—" && carrierName !== currentVesselName) {
        currentVesselName = carrierName;
        document.title = `📦 تقرير أيام التخزين - ${currentVesselName}`;
        let h1Element = document.querySelector('.header h1');
        if (h1Element) {
            h1Element.innerHTML = `📦 تقرير أيام التخزين - ${currentVesselName}`;
        }
        let vesselNameSpan = document.getElementById("vesselNameTitle");
        if (vesselNameSpan) {
            vesselNameSpan.textContent = currentVesselName;
        }
    }
    
    let carrierNameSpan = document.getElementById("headerCarrierName");
    let shippingDateSpan = document.getElementById("headerShippingDate");
    let lineIdSpan = document.getElementById("headerLineId");
    
    if (carrierNameSpan) {
        carrierNameSpan.textContent = carrierName;
    }
    if (shippingDateSpan) {
        shippingDateSpan.textContent = maxDate;
    }
    if (lineIdSpan) {
        lineIdSpan.textContent = lineIds.size > 0 ? Array.from(lineIds).join(", ") : "—";
    }
}
// ربط زر اختيار الأعمدة للتبويب 6
document.getElementById("selectColumnsBtn6").onclick = () => openColumnModalTab6();
// عرض قائمة الاستثناءات
displayExcludeList('excludeList6', excludeLines6, '6');

// ربط زر اختيار الأعمدة للتبويب 5
document.getElementById("selectColumnsBtn5").onclick = () => openColumnModalTab5();

/// ========== تحميل الإعدادات تلقائياً عند فتح الصفحة ==========
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        loadSettingsAutomatically();
    }, 500);
});

// ============================================================
// تقرير شامل - حسب حالات الحاويات والحالة (EXPRT/TRSHP/STRGE)
// ============================================================

function generateAdvancedReport() {
    console.log("🔍 بدء إنشاء التقرير التفصيلي...");

    // ===== تجميع البيانات من جميع التبويبات =====
    let tabs = [
        { id: 'tab1', data: currentData1 || [], label: 'TRSHP + EXPRT' },
        { id: 'tab2', data: currentData2 || [], label: 'STRGE + EXPRT + IMPRT' },
        { id: 'tab3', data: currentData3 || [], label: 'EXPRT فقط' },
        { id: 'tab4', data: currentData4 || [], label: 'STRGE فارغ (MTY) + IMPRT' },
        { id: 'tab5', data: currentData5 || [], label: 'TRSHP فقط' },
        { id: 'tab6', data: currentData6 || [], label: 'STRGE + EXPRT فقط' },
        { id: 'tab7', data: currentData7 || [], label: 'IMPRT + FORWARD' },
        { id: 'tab8', data: currentData8 || [], label: 'Storage Finalout' }
    ];

    // ===== استخراج معلومات السفينة =====
    let vesselInfo = {
        carrierName: "—",
        shippingDate: "—",
        lineId: "—"
    };

    for (let [id, container] of containersMap.entries()) {
        let sourceData = null;
        let found = false;

        for (let tab of tabs) {
            if (tab.id === 'tab1' || tab.id === 'tab2' || tab.id === 'tab3' || tab.id === 'tab6' || tab.id === 'tab7') {
                if (container.exprtList && container.exprtList.length > 0) {
                    sourceData = container.exprtList[0];
                    found = true;
                    break;
                } else if (container.exprt) {
                    sourceData = container.exprt;
                    found = true;
                    break;
                }
            } else if (tab.id === 'tab4') {
                if (container.strge) {
                    sourceData = container.strge;
                    found = true;
                    break;
                }
            } else if (tab.id === 'tab5') {
                if (container.trshpList && container.trshpList.length > 0) {
                    sourceData = container.trshpList[0];
                    found = true;
                    break;
                } else if (container.trshp) {
                    sourceData = container.trshp;
                    found = true;
                    break;
                }
            }
        }

        if (found && sourceData) {
            let carrierName = sourceData["O/B Carrier Name"] || sourceData["I/B Carrier Name"] || "";
            if (carrierName && carrierName !== "" && vesselInfo.carrierName === "—") {
                vesselInfo.carrierName = carrierName;
            }
            let shippingDate = sourceData["O/B Carrier ATD"] || sourceData["O/B Carrier ATA"] || sourceData["I/B Carrier ATD"] || "";
            if (shippingDate && shippingDate !== "" && vesselInfo.shippingDate === "—") {
                vesselInfo.shippingDate = shippingDate;
            }
            let lineId = sourceData["Line ID"] || "";
            if (lineId && lineId !== "" && vesselInfo.lineId === "—") {
                vesselInfo.lineId = lineId;
            }
            if (vesselInfo.carrierName !== "—" && vesselInfo.shippingDate !== "—" && vesselInfo.lineId !== "—") {
                break;
            }
        }
    }

    // ===== تعريف أنواع الحاويات مع المقاس =====
    let sizeTypes = [
        { size: '20', label: '20\'', check: (item) => {
            let size = item["Size"] || "";
            return size.toString().startsWith("2") || size.toString().startsWith("20");
        }},
        { size: '40', label: '40\'', check: (item) => {
            let size = item["Size"] || "";
            return size.toString().startsWith("4") || size.toString().startsWith("40") || size.toString().startsWith("45");
        }}
    ];

    let containerTypes = [
        { key: 'GP', label: 'GP', check: (item) => {
            let type = item["Type"] || "";
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return type === "GP" && !isOOG && !isHazard && !isRef;
        }},
        { key: 'RF', label: 'RF', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && !isOOG && !isHazard;
        }},
        { key: 'OOG', label: 'OOG', check: (item) => {
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isOOG && !isRef && !isHazard;
        }},
        { key: 'Hazard', label: 'Hazard', check: (item) => {
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return isHazard && !isOOG && !isRef;
        }},
        { key: 'RF_OOG', label: 'RF+OOG', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && isOOG && !isHazard;
        }},
        { key: 'RF_Hazard', label: 'RF+Hazard', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            return isRef && isHazard && !isOOG;
        }},
        { key: 'OOG_Hazard', label: 'OOG+Hazard', check: (item) => {
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return isOOG && isHazard && !isRef;
        }},
        { key: 'RF_OOG_Hazard', label: 'RF+OOG+Hazard', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && isOOG && isHazard;
        }}
    ];

    let columns = [];
    for (let type of containerTypes) {
        for (let size of sizeTypes) {
            let colKey = size.size + '_' + type.key;
            columns.push({
                key: colKey,
                label: size.label + ' ' + type.label,
                check: (item) => {
                    return type.check(item) && size.check(item);
                }
            });
        }
    }

    // ===== دالة لتحديد الحالات المنطبقة على الحاوية =====
    function getCategoriesForItem(item, source) {
        let cats = [];

        function hasCategory(prefix) {
            let net = parseFloat(item[prefix + " Net"]) || 0;
            let days = parseFloat(item[prefix + " Days"]) || 0;
            let start = item[prefix + " Start"] || "";
            let end = item[prefix + " End"] || "";
            return (net > 0 || days > 0 || start !== "" || end !== "");
        }

        function getNet(prefix) {
            return parseFloat(item[prefix + " Net"]) || 0;
        }

        function getDays(prefix) {
            return parseFloat(item[prefix + " Days"]) || 0;
        }

        function isRefrigerated(item) {
            let ref = item["Is Refrigerated"];
            if (typeof ref === "boolean") return ref;
            if (typeof ref === "string") return ref.trim().toLowerCase() === "true";
            if (typeof ref === "number") return ref === 1;
            return false;
        }

        let flexString01 = item["Flex String 01"] || "";
        let drayStatus = item["Dray Status"] || "";

        function addCategory(cat, days, refDays, isRef) {
            cats.push({
                cat: cat,
                days: days,
                refDays: refDays || 0,
                isRef: isRef || false,
                flexString01: flexString01,
                drayStatus: drayStatus
            });
        }

        let isSpecial = (flexString01 === "TRUE" || drayStatus === "FORWARD" || drayStatus === "RETURN");

        if (source === 'tab1' || source === 'tab2' || source === 'tab3' || source === 'tab6') {
            if (hasCategory("EXPRT")) {
                let days = getNet("EXPRT");
                let refDays = getDays("EXPRT");
                let isRef = isRefrigerated(item);
                addCategory('EXPRT', days, refDays, isRef);
                if (isSpecial) {
                    addCategory('EXPRT_SPECIAL', days, refDays, isRef);
                }
            }
            if (source === 'tab1' && hasCategory("TRSHP")) {
                addCategory('TRSHP', getNet("TRSHP"), 0, false);
            }
            if (source === 'tab2' && hasCategory("STRGE")) {
                addCategory('STRGE', getNet("STRGE"), 0, false);
            }
            if (source === 'tab6' && hasCategory("STRGE")) {
                addCategory('STRGE', getNet("STRGE"), 0, false);
            }
        } else if (source === 'tab4') {
            if (hasCategory("STRGE")) {
                addCategory('STRGE', getNet("STRGE"), getDays("STRGE"), isRefrigerated(item));
            }
        } else if (source === 'tab5') {
            if (hasCategory("TRSHP")) {
                addCategory('TRSHP', getNet("TRSHP"), getDays("TRSHP"), isRefrigerated(item));
            }
        } else if (source === 'tab7') {
            let net = parseFloat(item["Net"]) || 0;
            if (net > 0) {
                addCategory('IMPRT', net, 0, false);
            }
        } else if (source === 'tab8') {
            let days = parseFloat(item["أيام التخزين (جديد)"]) || 0;
            if (days > 0) {
                addCategory('STRGE', days, 0, false);
            }
        }

        return cats;
    }

    // ===== بناء بيانات التقرير =====
    let reportData = [];

    for (let tab of tabs) {
        let tabEntry = {
            label: tab.label,
            source: tab.id,
            categories: {},
            containerSets: {}
        };

        let containerSets = {};

        for (let item of tab.data) {
            let cats = getCategoriesForItem(item, tab.id);

            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(item)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) {
                matchedCol = columns.find(c => c.key === '20_GP') || columns[0];
            }

            let containerNo = item["Container No."] || "";

            for (let catObj of cats) {
                let cat = catObj.cat;
                let days = catObj.days;
                let refDays = catObj.refDays || 0;
                let isRef = catObj.isRef || false;
                let flexString01 = catObj.flexString01 || "";
                let drayStatus = catObj.drayStatus || "";

                if (!tabEntry.categories[cat]) {
                    tabEntry.categories[cat] = {};
                    for (let col of columns) {
                        tabEntry.categories[cat][col.key] = {
                            total: 0,
                            refrigerated: 0,
                            flexSet: new Set(),
                            draySet: new Set()
                        };
                    }
                }

                let cellData = tabEntry.categories[cat][matchedCol.key];
                cellData.total += days;
                if (isRef && refDays > 0) {
                    cellData.refrigerated += refDays;
                }

                // ===== العلامات تضاف فقط للفئة EXPRT_SPECIAL =====
                if (cat === 'EXPRT_SPECIAL') {
                    if (flexString01 === "TRUE" || flexString01 === true) {
                        cellData.flexSet.add("TRUE");
                    }
                    if (drayStatus === "FORWARD") {
                        cellData.draySet.add("FORWARD");
                    } else if (drayStatus === "RETURN") {
                        cellData.draySet.add("RETURN");
                    } else if (drayStatus === "EMPTY") {
                        cellData.draySet.add("EMPTY");
                    }
                }

                if (!containerSets[cat]) {
                    containerSets[cat] = {};
                    for (let col of columns) {
                        containerSets[cat][col.key] = new Set();
                    }
                }
                if (containerNo) {
                    containerSets[cat][matchedCol.key].add(containerNo);
                }
            }
        }

        // خصم EXPRT_SPECIAL من EXPRT
        if (tabEntry.categories['EXPRT'] && tabEntry.categories['EXPRT_SPECIAL']) {
            for (let col of columns) {
                let totalData = tabEntry.categories['EXPRT'][col.key];
                let specialData = tabEntry.categories['EXPRT_SPECIAL'][col.key];
                totalData.total = Math.max(0, totalData.total - specialData.total);
                totalData.refrigerated = Math.max(0, totalData.refrigerated - specialData.refrigerated);
                // إزالة أي علامات قد تكون أُضيفت بالخطأ
                totalData.flexSet = new Set();
                totalData.draySet = new Set();
            }
        }

        // إزالة العلامات من جميع الفئات الأخرى (ضمان عدم ظهورها)
        for (let cat in tabEntry.categories) {
            if (cat !== 'EXPRT_SPECIAL') {
                for (let col of columns) {
                    let data = tabEntry.categories[cat][col.key];
                    data.flexSet = new Set();
                    data.draySet = new Set();
                }
            }
        }

        tabEntry.containerSets = {};
        for (let cat in containerSets) {
            tabEntry.containerSets[cat] = {};
            for (let col of columns) {
                tabEntry.containerSets[cat][col.key] = containerSets[cat][col.key] ? containerSets[cat][col.key].size : 0;
            }
        }

        reportData.push(tabEntry);
    }

    // ===== إنشاء نافذة التقرير =====
    let reportWindow = window.open('', '_blank', 'width=1600,height=900,scrollbars=yes');
    if (!reportWindow) {
        alert("الرجاء السماح للنوافذ المنبثقة لعرض التقرير");
        return;
    }

    let currentDate = new Date().toLocaleString('ar-EG', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    let shippingDateDisplay = vesselInfo.shippingDate;
    if (shippingDateDisplay && shippingDateDisplay !== "—") {
        let converted = convertDate(shippingDateDisplay);
        if (converted) shippingDateDisplay = converted;
    }

    function renderDaysCell(cellData) {
        let total = cellData?.total || 0;
        let ref = cellData?.refrigerated || 0;
        let flexSet = cellData?.flexSet || new Set();
        let draySet = cellData?.draySet || new Set();

        if (total === 0 && ref === 0 && flexSet.size === 0 && draySet.size === 0) {
            return `<td class="empty-cell">—</td>`;
        }

        let markers = [];
        if (flexSet.has("TRUE")) markers.push('⭐');
        if (draySet.has("FORWARD")) markers.push('➡️');
        if (draySet.has("RETURN")) markers.push('🔄');
        if (draySet.has("EMPTY")) markers.push('⬜');

        let powerText = ref > 0 ? ` (power: ${ref} day)` : '';
        let markerText = markers.length > 0 ? ` ${markers.join(' ')}` : '';

        return `<td class="num-days">${total} day${powerText}${markerText}</td>`;
    }

    function renderCountCell(count) {
        let c = count || 0;
        if (c === 0) {
            return `<td class="empty-cell" style="font-size:10px;color:#999;">0 cont</td>`;
        }
        return `<td class="num-containers" style="font-size:10px;color:#0a3d62;">${c} cont</td>`;
    }

    let html = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير تفصيلي - حالات الحاويات</title>
            <style>
                * { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-sizing: border-box; }
                body { background: #f0f2f5; padding: 20px; direction: rtl; }
                .report-container {
                    max-width: 100%;
                    margin: auto;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                    padding: 25px;
                    overflow-x: auto;
                }
                .report-header {
                    text-align: center;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #0a3d62;
                    margin-bottom: 20px;
                }
                .report-header h1 {
                    color: #0a3d62;
                    font-size: 24px;
                    margin: 0;
                }
                .report-header .subtitle {
                    color: #6c757d;
                    font-size: 14px;
                    margin-top: 5px;
                }
                .report-header .vessel-info {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-top: 10px;
                    font-size: 14px;
                    color: #0a3d62;
                    background: #f0f8ff;
                    padding: 8px 20px;
                    border-radius: 8px;
                    border: 1px solid #cce5ff;
                }
                .report-header .vessel-info span {
                    font-weight: bold;
                }
                .report-date {
                    text-align: left;
                    font-size: 12px;
                    color: #6c757d;
                    margin-bottom: 15px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                    border: 2px solid #0a3d62;
                }
                th, td {
                    border: 1px solid #dee2e6;
                    padding: 4px 3px;
                    text-align: center;
                    vertical-align: middle;
                }

                .col-header { background: #0a3d62; color: white; font-weight: bold; font-size: 10px; }
                .col-sub-header { background: #1a5a7a; color: white; font-size: 9px; }
                .col-sub-header-small { background: #2a7a9a; color: white; font-size: 8px; }

                .tab-row { background: #e9ecef; font-weight: bold; text-align: center; }
                .tab-row td { text-align: center !important; }

                .category-row { background: #d1ecf1; }
                .category-row td:first-child { background: #b8d4de; padding-right: 10px; font-weight: bold; }

                .special-row { background: #fce4ec; }
                .special-row td:first-child { background: #f8bbd0; padding-right: 20px; font-weight: bold; color: #880e4f; }

                .count-row { background: #fff3cd; }
                .count-row td:first-child { background: #f8e8a0; padding-right: 10px; font-weight: bold; }

                .num-days { color: #1e6f5c; font-weight: bold; }
                .num-containers { color: #0a3d62; font-weight: bold; }
                .empty-cell { color: #adb5bd; font-style: italic; }

                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #6c757d;
                    padding-top: 15px;
                    border-top: 1px solid #dee2e6;
                }

                .print-btn {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 10px 24px;
                    background: #0a3d62;
                    color: white;
                    border: none;
                    border-radius: 30px;
                    font-weight: bold;
                    cursor: pointer;
                    z-index: 1000;
                }
                .print-btn:hover { background: #1a5a7a; }
                .close-btn {
                    position: fixed;
                    top: 20px;
                    right: 160px;
                    padding: 10px 24px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 30px;
                    font-weight: bold;
                    cursor: pointer;
                    z-index: 1000;
                }
                .close-btn:hover { background: #c82333; }

                @media print {
                    body { background: white; padding: 10px; }
                    .report-container { box-shadow: none; border-radius: 0; padding: 10px; }
                    .print-btn, .close-btn { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="report-header">
                    <h1>📊 تقرير أيام التخزين حسب نوع ومقاس الحاوية</h1>
                    <div class="vessel-info">
                        <div>🚢 <span>السفينة:</span> ${vesselInfo.carrierName}</div>
                        <div>📅 <span>تاريخ الرحلة:</span> ${shippingDateDisplay}</div>
                        <div>🏷️ <span>الخط:</span> ${vesselInfo.lineId}</div>
						<div class="report-date">📅 تاريخ التقرير: ${currentDate}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="3" style="background:#0a3d62; color:white; width:160px; min-width:130px; vertical-align:middle;">
                                التبويب / الحالة
                            </th>
                            <th colspan="${columns.length}" style="background:#0a3d62; color:white; font-size:12px;">
                                أنواع ومقاسات الحاويات
                            </th>
                        </tr>
                        <tr>
                            ${columns.map(col => `
                                <th colspan="1" class="col-sub-header">${col.label}</th>
                            `).join('')}
                        </tr>
                        <tr>
                            ${columns.map(col => `
                                <th class="col-sub-header-small">أيام</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>`;

    for (let tabIdx = 0; tabIdx < reportData.length; tabIdx++) {
        let tab = reportData[tabIdx];
        let tabLabel = tabs[tabIdx].label;
        let isTab4 = tab.source === 'tab4';
        let isTab5 = tab.source === 'tab5';
        let isTab7 = tab.source === 'tab7';
        let totalCols = columns.length + 1;

        html += `
            <tr class="tab-row">
                <td colspan="${totalCols}" style="font-weight:bold; color:#0a3d62; font-size:13px; text-align:center; background:#dee2e6;">
                    ${tabLabel}
                </td>
            </tr>`;

        let categories = Object.keys(tab.categories).sort((a, b) => {
            if (a === 'EXPRT') return -1;
            if (b === 'EXPRT') return 1;
            if (a === 'EXPRT_SPECIAL') return -1;
            if (b === 'EXPRT_SPECIAL') return 1;
            return a.localeCompare(b);
        });

        if (categories.length === 0) {
            html += `
                <tr><td colspan="${totalCols}" style="text-align:center; color:#6c757d; padding:10px;">
                    لا توجد بيانات في هذا التبويب
                </td></tr>`;
            if (isTab4) {
                html += `
                    <tr class="count-row">
                        <td style="padding-right:10px; font-weight:bold;">إجمالي عدد حاويات STRGE</td>
                        ${columns.map(col => `<td style="text-align:center; font-weight:bold; background:#f8e8a0;">0 cont</td>`).join('')}
                    </tr>`;
            } else if (isTab5) {
                html += `
                    <tr class="count-row">
                        <td style="padding-right:10px; font-weight:bold;">إجمالي عدد حاويات TRSHP</td>
                        ${columns.map(col => `<td style="text-align:center; font-weight:bold; background:#f8e8a0;">0 cont</td>`).join('')}
                    </tr>`;
            } else if (isTab7) {
                html += `
                    <tr class="count-row">
                        <td style="padding-right:10px; font-weight:bold;">إجمالي عدد حاويات IMPRT</td>
                        ${columns.map(col => `<td style="text-align:center; font-weight:bold; background:#f8e8a0;">0 cont</td>`).join('')}
                    </tr>`;
            } else {
                let tabsWithTotal = ['tab1', 'tab2', 'tab3', 'tab6'];
                if (tabsWithTotal.includes(tab.source)) {
                    html += `
                        <tr class="count-row">
                            <td style="padding-right:10px; font-weight:bold;">إجمالي عدد حاويات EXPRT</td>
                            ${columns.map(col => `<td style="text-align:center; font-weight:bold; background:#f8e8a0;">0 cont</td>`).join('')}
                        </tr>`;
                }
            }
            continue;
        }

        for (let cat of categories) {
            let catData = tab.categories[cat];
            let catLabel = cat;
            let rowClass = (cat === 'EXPRT_SPECIAL') ? 'special-row' : 'category-row';
            let displayLabel = (cat === 'EXPRT_SPECIAL') ? 'EXPRT (خاص) ⭐➡️🔄' : catLabel;

            html += `<tr class="${rowClass}"><td style="padding-right:10px; font-weight:bold;">${displayLabel}</td>`;
            for (let col of columns) {
                html += renderDaysCell(catData[col.key]);
            }
            html += `</tr>`;
        }

        // صفوف الإجمالي
        if (isTab4) {
            html += `
                <tr class="count-row">
                    <td style="padding-right:10px; font-weight:bold;">إجمالي عدد حاويات STRGE</td>`;
            for (let col of columns) {
                let count = tab.containerSets?.['STRGE']?.[col.key] || 0;
                html += renderCountCell(count);
            }
            html += `</tr>`;
        } else if (isTab5) {
            html += `
                <tr class="count-row">
                    <td style="padding-right:10px; font-weight:bold;">إجمالي عدد حاويات TRSHP</td>`;
            for (let col of columns) {
                let count = tab.containerSets?.['TRSHP']?.[col.key] || 0;
                html += renderCountCell(count);
            }
            html += `</tr>`;
        } else if (isTab7) {
            html += `
                <tr class="count-row">
                    <td style="padding-right:10px; font-weight:bold;">إجمالي عدد حاويات IMPRT</td>`;
            for (let col of columns) {
                let count = tab.containerSets?.['IMPRT']?.[col.key] || 0;
                html += renderCountCell(count);
            }
            html += `</tr>`;
        } else {
            let tabsWithTotal = ['tab1', 'tab2', 'tab3', 'tab6'];
            if (tabsWithTotal.includes(tab.source)) {
                html += `
                    <tr class="count-row">
                        <td style="padding-right:10px; font-weight:bold;">إجمالي عدد حاويات EXPRT</td>`;
                for (let col of columns) {
                    let count = tab.containerSets?.['EXPRT']?.[col.key] || 0;
                    html += renderCountCell(count);
                }
                html += `</tr>`;
            }
        }
    }

    html += `
                    </tbody>
                </table>

                <div class="footer">
                    تم إنشاؤه بواسطة نظام التخزين - تقرير تلقائي
                </div>
            </div>

            <script>
                let printBtn = document.createElement('button');
                printBtn.className = 'print-btn';
                printBtn.textContent = '🖨️ طباعة التقرير';
                printBtn.onclick = function() { window.print(); };
                document.body.appendChild(printBtn);

                let closeBtn = document.createElement('button');
                closeBtn.className = 'close-btn';
                closeBtn.textContent = '✖ إغلاق';
                closeBtn.onclick = function() { window.close(); };
                document.body.appendChild(closeBtn);
            <\/script>
        </body>
        </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();

    console.log("✅ تم إنشاء التقرير بنجاح");
}

// ===== إضافة زر التقرير =====
// ===== إضافة أزرار التقارير =====
document.addEventListener("DOMContentLoaded", function() {
    let toolbar = document.querySelector('.upload-area');
    if (toolbar) {
        // زر التقرير التفصيلي (الموجود)
        if (!document.getElementById('advancedReportBtn')) {
            let reportBtn = document.createElement('button');
            reportBtn.id = 'advancedReportBtn';
            reportBtn.innerHTML = '📊 تقرير تفصيلي';
            reportBtn.style.cssText = 'background: #8b5cf6; color: white; padding: 10px 24px; border-radius: 40px; border: none; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.3s; margin: 5px;';
            reportBtn.onmouseover = function() { this.style.transform = 'translateY(-2px)'; };
            reportBtn.onmouseout = function() { this.style.transform = 'translateY(0)'; };
            reportBtn.onclick = generateAdvancedReport;
            toolbar.appendChild(reportBtn);
        }

        // زر التقرير المجمع (الجديد)
        if (!document.getElementById('consolidatedReportBtn')) {
            let consBtn = document.createElement('button');
            consBtn.id = 'consolidatedReportBtn';
            consBtn.innerHTML = '📊 تقرير مجمع';
            consBtn.style.cssText = 'background: #6c5ce7; color: white; padding: 10px 24px; border-radius: 40px; border: none; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.3s; margin: 5px;';
            consBtn.onmouseover = function() { this.style.transform = 'translateY(-2px)'; };
            consBtn.onmouseout = function() { this.style.transform = 'translateY(0)'; };
            consBtn.onclick = generateConsolidatedReport;
            toolbar.appendChild(consBtn);
        }
    }
});


// ============================================================
// تقرير مجمع - تجميع EXPRT من 1,2,6 و STRGE من 2,6 و خاص من 1,2,3,6
// ============================================================

function generateConsolidatedReport() {
    console.log("🔍 بدء إنشاء التقرير المجمع (النسخة النهائية)...");

    // ===== 1. تجهيز البيانات من التبويبات المطلوبة =====
    const dataSources = {
        tab1: currentData1 || [],
        tab2: currentData2 || [],
        tab3: currentData3 || [],
        tab4: currentData4 || [],
        tab5: currentData5 || [],
        tab6: currentData6 || [],
        tab7: currentData7 || [],
        tab8: currentData8 || []
    };

    const totalRows = Object.values(dataSources).reduce((sum, arr) => sum + arr.length, 0);
    if (totalRows === 0) {
        alert("⚠️ لا توجد بيانات لعرض التقرير. يرجى تحميل ملف Excel أولاً.");
        return;
    }

    // ===== 2. تعريف أنواع ومقاسات الحاويات (نفس التقرير التفصيلي) =====
    const sizeTypes = [
        { size: '20', label: '20\'', check: (item) => {
            let s = (item["Size"] || "").toString();
            // 20 قدم: يبدأ بـ 2 (مثل 20, 22, 2200, 22G1)
            return s.startsWith("2") || s === "20";
        }},
        { size: '40', label: '40\'', check: (item) => {
            let s = (item["Size"] || "").toString();
            // 40 قدم: يبدأ بـ 4 (40, 42, 45) أو 95 (9500 = 45 قدم)
            return s.startsWith("4") || s.startsWith("95") || s.startsWith("42") || s.startsWith("45");
        }}
    ];

    const containerTypes = [
        { key: 'GP', label: 'GP', check: (item) => {
            let type = item["Type"] || "";
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return type === "GP" && !isOOG && !isHazard && !isRef;
        }},
        { key: 'RF', label: 'RF', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && !isOOG && !isHazard;
        }},
        { key: 'OOG', label: 'OOG', check: (item) => {
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isOOG && !isRef && !isHazard;
        }},
        { key: 'Hazard', label: 'Hazard', check: (item) => {
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return isHazard && !isOOG && !isRef;
        }},
        { key: 'RF_OOG', label: 'RF+OOG', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && isOOG && !isHazard;
        }},
        { key: 'RF_Hazard', label: 'RF+Hazard', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            return isRef && isHazard && !isOOG;
        }},
        { key: 'OOG_Hazard', label: 'OOG+Hazard', check: (item) => {
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return isOOG && isHazard && !isRef;
        }},
        { key: 'RF_OOG_Hazard', label: 'RF+OOG+Hazard', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && isOOG && isHazard;
        }}
    ];

    let columns = [];
    for (let type of containerTypes) {
        for (let size of sizeTypes) {
            let colKey = size.size + '_' + type.key;
            columns.push({
                key: colKey,
                label: size.label + ' ' + type.label,
                check: (item) => type.check(item) && size.check(item)
            });
        }
    }

    // ===== 3. دالة مساعدة لتجميع البيانات (لـ EXPRT, TRSHP, STRGE) =====
    function aggregateItems(dataArray, categoryKey, filterFn = null) {
        let totals = {};
        let containerSet = new Set();
        columns.forEach(col => { totals[col.key] = 0; });

        for (let item of dataArray) {
            if (filterFn && !filterFn(item)) continue;

            let containerNo = item["Container No."] || "";
            if (!containerNo) continue;

            let net = parseFloat(item[categoryKey + " Net"]) || 0;

            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(item)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) matchedCol = columns.find(c => c.key === '20_GP') || columns[0];

            containerSet.add(containerNo + "|" + matchedCol.key);

            if (net > 0) {
                totals[matchedCol.key] += net;
            }
        }

        let countContainers = {};
        columns.forEach(col => { countContainers[col.key] = 0; });
        containerSet.forEach(key => {
            let parts = key.split("|");
            let colKey = parts[1];
            if (countContainers[colKey] !== undefined) {
                countContainers[colKey] += 1;
            }
        });

        return { totals, countContainers };
    }

    // ===== 4. دالة لتجميع بيانات تبويب 7 (IMPRT + FORWARD) =====
    function aggregateTab7(dataArray) {
        let totals = {};
        let containerSet = new Set();
        columns.forEach(col => { totals[col.key] = 0; });

        for (let item of dataArray) {
            let containerNo = item["رقم الحاوية"] || "";
            if (!containerNo) continue;

            let net = parseFloat(item["Net"]) || 0;

            let tempItem = {
                "Type": item["النوع"] || "GP",
                "Size": item["الحجم"] || "",
                "Is Refrigerated": item["مبرد"] === "✅",
                "Is OOG": item["OOG"] === "✅",
                "Is Hazardous": item["خطر"] === "✅"
            };

            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(tempItem)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) matchedCol = columns.find(c => c.key === '20_GP') || columns[0];

            containerSet.add(containerNo + "|" + matchedCol.key);

            if (net > 0) {
                totals[matchedCol.key] += net;
            }
        }

        let countContainers = {};
        columns.forEach(col => { countContainers[col.key] = 0; });
        containerSet.forEach(key => {
            let parts = key.split("|");
            let colKey = parts[1];
            if (countContainers[colKey] !== undefined) {
                countContainers[colKey] += 1;
            }
        });

        return { totals, countContainers };
    }

    // ===== 5. دالة لتجميع بيانات تبويب 8 (Storage Finalout) =====
    function aggregateTab8(dataArray) {
        let totals = {};
        let containerSet = new Set();
        columns.forEach(col => { totals[col.key] = 0; });

        for (let item of dataArray) {
            let containerNo = item["رقم الحاوية"] || "";
            if (!containerNo) continue;

            let days = parseFloat(item["أيام التخزين (جديد)"]) || 0;

            let type = item["النوع"] || "";
            let size = item["الحجم"] || "";
            let isRef = type.includes("R") || type.includes("RF");
            let isOOG = type.includes("OOG");
            let isHazard = type.includes("Hazard") || type.includes("DG");

            let tempItem = {
                "Type": type,
                "Size": size,
                "Is Refrigerated": isRef,
                "Is OOG": isOOG,
                "Is Hazardous": isHazard
            };

            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(tempItem)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) matchedCol = columns.find(c => c.key === '20_GP') || columns[0];

            containerSet.add(containerNo + "|" + matchedCol.key);

            if (days > 0) {
                totals[matchedCol.key] += days;
            }
        }

        let countContainers = {};
        columns.forEach(col => { countContainers[col.key] = 0; });
        containerSet.forEach(key => {
            let parts = key.split("|");
            let colKey = parts[1];
            if (countContainers[colKey] !== undefined) {
                countContainers[colKey] += 1;
            }
        });

        return { totals, countContainers };
    }

    // ===== 6. تجميع الفئات المطلوبة =====

	// 6.1 EXPRT عادي (من 1,2,3,6 مع استبعاد TRUE)
	let exprNormalData = [];
	[1, 2, 3, 6].forEach(tabKey => {
		let data = dataSources['tab' + tabKey];
		let filtered = data.filter(item => {
			let flex = item["Flex String 01"] || "";
			// 🆕 استبعاد RETURN
			let drayStatus = item["Dray Status"] || "";
			return flex !== "TRUE" && drayStatus !== "RETURN";
		});
		exprNormalData = exprNormalData.concat(filtered);
	});
	let exprNormalAgg = aggregateItems(exprNormalData, 'EXPRT', null);

    // 6.2 EXPRT خاص (من 1,2,3,6 مع TRUE فقط)
// 6.2 EXPRT خاص (من 1,2,3,6 مع TRUE فقط)
let exprSpecialData = [];
[1, 2, 3, 6].forEach(tabKey => {
    let data = dataSources['tab' + tabKey];
    let filtered = data.filter(item => {
        let flex = item["Flex String 01"] || "";
        // 🆕 استبعاد RETURN
        let drayStatus = item["Dray Status"] || "";
        return flex === "TRUE" && drayStatus !== "RETURN";
    });
    exprSpecialData = exprSpecialData.concat(filtered);
});
let exprSpecialAgg = aggregateItems(exprSpecialData, 'EXPRT', null);

    // 6.3 TRSHP من تبويب 1 فقط
    let trshpTab1Agg = aggregateItems(dataSources.tab1, 'TRSHP', null);

    // 6.4 STRGE مجمع (من 2 و 6)
    let strge26Data = [];
    [2, 6].forEach(tabKey => {
        strge26Data = strge26Data.concat(dataSources['tab' + tabKey]);
    });
    let strge26Agg = aggregateItems(strge26Data, 'STRGE', null);

    // 6.5 STRGE من تبويب 4 فقط
    let strgeTab4Agg = aggregateItems(dataSources.tab4, 'STRGE', null);

    // 6.6 تبويب 5 (TRSHP فقط)
    let tab5Agg = aggregateItems(dataSources.tab5, 'TRSHP', null);

    // 6.7 تبويب 7 (IMPRT + FORWARD)
    let tab7Agg = aggregateTab7(dataSources.tab7);

    // 6.8 تبويب 8 (Storage Finalout)
    let tab8Agg = aggregateTab8(dataSources.tab8);

    // ===== 6.9 Power Export (RF من EXPRT عادي) =====
    function calculatePowerExport(dataArray) {
        let totals = {};
        let containerSet = new Set();
        columns.forEach(col => { totals[col.key] = 0; });

        for (let item of dataArray) {
            // 1. بس الحاويات المبردة
            let isRefrigerated = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            if (!isRefrigerated) continue;

            let containerNo = item["Container No."] || "";
            if (!containerNo) continue;

            // 2. أيام الطاقة = EXPRT Days (قبل الخصم)
            let days = parseFloat(item["EXPRT Days"]) || 0;

            // 3. نوع الحاوية
            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(item)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) matchedCol = columns.find(c => c.key === '20_GP') || columns[0];

            containerSet.add(containerNo + "|" + matchedCol.key);
            if (days > 0) {
                totals[matchedCol.key] += days;
            }
        }

        // عدد الحاويات الفريدة
        let countContainers = {};
        columns.forEach(col => { countContainers[col.key] = 0; });
        containerSet.forEach(key => {
            let parts = key.split("|");
            let colKey = parts[1];
            if (countContainers[colKey] !== undefined) {
                countContainers[colKey] += 1;
            }
        });

        return { totals, countContainers };
    }

    // ===== حساب Power Export =====
    let powerExportAgg = calculatePowerExport(exprNormalData);        // العادي
    let powerExportSpecialAgg = calculatePowerExport(exprSpecialData); // الخاص

    // ===== 6.11 RF من تبويب 5 (TRSHP فقط) =====
    function calculateTab5RF(dataArray) {
        let totals = {};
        let containerSet = new Set();
        columns.forEach(col => { totals[col.key] = 0; });

        for (let item of dataArray) {
            // التحقق من Is Refrigerated بمرونة
            let isRefrigerated = false;
            let refValue = item["Is Refrigerated"];
            if (refValue === "true" || refValue === true || refValue === "TRUE" || 
                refValue === 1 || refValue === "1" || refValue === "Yes" || refValue === "yes") {
                isRefrigerated = true;
            }
            
            if (!isRefrigerated) continue;

            let containerNo = item["Container No."] || "";
            if (!containerNo) continue;

            // استخدام TRSHP Days (قبل الخصم)
            let days = parseFloat(item["TRSHP Days"]) || 0;

            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(item)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) matchedCol = columns.find(c => c.key === '20_GP') || columns[0];

            containerSet.add(containerNo + "|" + matchedCol.key);

            if (days > 0) {
                totals[matchedCol.key] += days;
            }
        }

        let countContainers = {};
        columns.forEach(col => { countContainers[col.key] = 0; });
        containerSet.forEach(key => {
            let parts = key.split("|");
            let colKey = parts[1];
            if (countContainers[colKey] !== undefined) {
                countContainers[colKey] += 1;
            }
        });

        return { totals, countContainers };
    }

    let tab5RFAgg = calculateTab5RF(dataSources.tab5);

    // ===== 7. معلومات السفينة =====
    let vesselInfo = {
        carrierName: "—",
        shippingDate: "—",
        lineId: "—"
    };

    for (let [id, container] of containersMap.entries()) {
        let sourceData = null;
        
        if (container.exprtList && container.exprtList.length > 0) {
            sourceData = container.exprtList[0];
        } else if (container.exprt) {
            sourceData = container.exprt;
        } else if (container.trshpList && container.trshpList.length > 0) {
            sourceData = container.trshpList[0];
        } else if (container.trshp) {
            sourceData = container.trshp;
        } else if (container.strge) {
            sourceData = container.strge;
        } else if (container.imprt) {
            sourceData = container.imprt;
        } else if (container.trshpReturn) {
            sourceData = container.trshpReturn;
        }
        
        if (sourceData) {
            if (vesselInfo.carrierName === "—") {
                vesselInfo.carrierName = sourceData["O/B Carrier Name"] || sourceData["I/B Carrier Name"] || "—";
            }
            
            let atd = sourceData["O/B Carrier ATD"] || sourceData["O/B Carrier ATA"] || sourceData["I/B Carrier ATD"] || "";
            if (atd && atd !== "") {
                if (vesselInfo.shippingDate === "—") {
                    vesselInfo.shippingDate = atd;
                }
            }
            
            let lineId = sourceData["Line ID"];
            if (lineId && lineId !== "" && vesselInfo.lineId === "—") {
                vesselInfo.lineId = lineId;
            }
        }
        
        if (vesselInfo.carrierName !== "—" && vesselInfo.shippingDate !== "—" && vesselInfo.lineId !== "—") {
            break;
        }
    }
    
    if (vesselInfo.carrierName === "—" && currentData1.length > 0) {
        vesselInfo.carrierName = currentData1[0]["Vessel Name"] || currentData1[0]["O/B Carrier Name"] || currentData1[0]["I/B Carrier Name"] || "—";
    }
    
    if (vesselInfo.shippingDate === "—" && currentData1.length > 0) {
        vesselInfo.shippingDate = currentData1[0]["O/B Carrier ATD"] || currentData1[0]["O/B Carrier ATA"] || currentData1[0]["I/B Carrier ATD"] || "—";
    }

    let shippingDateDisplay = vesselInfo.shippingDate;
    if (shippingDateDisplay && shippingDateDisplay !== "—") {
        let converted = convertDate(shippingDateDisplay);
        if (converted) shippingDateDisplay = converted;
    }

    let currentDate = new Date().toLocaleString('ar-EG', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // دوال عرض الخلايا
    function renderDaysCell(total) {
        if (total === 0) return `<td class="empty-cell">—</td>`;
        return `<td class="num-days">${total} Day</td>`;
    }

    function renderCountCell(count) {
        if (count === 0) return `<td class="empty-cell" style="font-size:10px;color:#999;">0</td>`;
        let label = count === 1 ? "Cont" : "Cont";
        return `<td class="num-containers" style="font-size:10px;color:#0a3d62;">${label}: ${count}</td>`;
    }

    // ===== 8. بناء HTML =====
    let html = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير مجمع - أيام التخزين</title>
            <style>
                * { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-sizing: border-box; }
                body { background: #f0f2f5; padding: 20px; direction: rtl; }
                .report-container {
                    max-width: 100%;
                    margin: auto;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                    padding: 25px;
                    overflow-x: auto;
                }
                .report-header {
                    text-align: center;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #0a3d62;
                    margin-bottom: 20px;
                }
                .report-header h1 {
                    color: #0a3d62;
                    font-size: 24px;
                    margin: 0;
                }
                .report-header .vessel-info {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-top: 10px;
                    font-size: 14px;
                    color: #0a3d62;
                    background: #f0f8ff;
                    padding: 8px 20px;
                    border-radius: 8px;
                    border: 1px solid #cce5ff;
                }
                .report-header .vessel-info span { font-weight: bold; }
                .report-date {
                    text-align: left;
                    font-size: 12px;
                    color: #6c757d;
                    margin-bottom: 15px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                    border: 2px solid #0a3d62;
                }
                th, td {
                    border: 1px solid #dee2e6;
                    padding: 4px 3px;
                    text-align: center;
                    vertical-align: middle;
                }
                .col-header { background: #0a3d62; color: white; font-weight: bold; font-size: 10px; }
                .col-sub-header { background: #1a5a7a; color: white; font-size: 9px; }
                .col-sub-header-small { background: #2a7a9a; color: white; font-size: 8px; }

                .category-row { background: #d1ecf1; }
                .category-row td:first-child { background: #b8d4de; padding-right: 10px; font-weight: bold; }
                .special-row { background: #fce4ec; }
                .special-row td:first-child { background: #f8bbd0; padding-right: 10px; font-weight: bold; color: #880e4f; }
                .trshp-row { background: #d4edda; }
                .trshp-row td:first-child { background: #b7d7c8; padding-right: 10px; font-weight: bold; }
                .strge-row { background: #cce5ff; }
                .strge-row td:first-child { background: #b0d4ee; padding-right: 10px; font-weight: bold; }
                .strge-tab4-row { background: #fff3cd; }
                .strge-tab4-row td:first-child { background: #f8e8a0; padding-right: 10px; font-weight: bold; }
                .count-row { background: #f8f9fa; }
                .count-row td:first-child { background: #e9ecef; padding-right: 10px; font-weight: bold; }
                .tab5-row { background: #d5f5e3; }
                .tab5-row td:first-child { background: #a9dfbf; padding-right: 10px; font-weight: bold; }
                .tab7-row { background: #fadbd8; }
                .tab7-row td:first-child { background: #f5b7b1; padding-right: 10px; font-weight: bold; }
                .tab8-row { background: #e8daef; }
                .tab8-row td:first-child { background: #d2b4de; padding-right: 10px; font-weight: bold; }
                .power-row { background: #e3f2fd; }
                .power-row td:first-child { background: #bbdefb; padding-right: 10px; font-weight: bold; color: #0d47a1; }
                .power-special-row { background: #fce4ec; }
                .power-special-row td:first-child { background: #f8bbd0; padding-right: 10px; font-weight: bold; color: #880e4f; }
                .rf-tab5-row { background: #d5f5e3; }
                .rf-tab5-row td:first-child { background: #a9dfbf; padding-right: 10px; font-weight: bold; color: #1a6e3a; }

                .num-days { color: #1e6f5c; font-weight: bold; }
                .num-containers { color: #0a3d62; font-weight: bold; }
                .empty-cell { color: #adb5bd; font-style: italic; }

                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #6c757d;
                    padding-top: 15px;
                    border-top: 1px solid #dee2e6;
                }

                .print-btn {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 10px 24px;
                    background: #0a3d62;
                    color: white;
                    border: none;
                    border-radius: 30px;
                    font-weight: bold;
                    cursor: pointer;
                    z-index: 1000;
                }
                .print-btn:hover { background: #1a5a7a; }
                .close-btn {
                    position: fixed;
                    top: 20px;
                    right: 160px;
                    padding: 10px 24px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 30px;
                    font-weight: bold;
                    cursor: pointer;
                    z-index: 1000;
                }
                .close-btn:hover { background: #c82333; }

                @media print {
                    body { background: white; padding: 10px; }
                    .report-container { box-shadow: none; border-radius: 0; padding: 10px; }
                    .print-btn, .close-btn { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="report-header">
                    <div class="vessel-info">
                        <div>🚢 <span>السفينة:</span> ${vesselInfo.carrierName}</div>
                        <div>📅 <span>تاريخ الرحلة:</span> ${shippingDateDisplay}</div>
                        <div>🏷️ <span>الخط:</span> ${vesselInfo.lineId}</div>
                        <div>📅 <span>تاريخ التقرير:</span> ${currentDate}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="3" style="background:#0a3d62; color:white; width:180px; min-width:150px; vertical-align:middle;">
                                الفئة
                            </th>
                            <th colspan="${columns.length}" style="background:#0a3d62; color:white; font-size:12px;">
                                أنواع ومقاسات الحاويات
                            </th>
                        </tr>
                        <tr>
                            ${columns.map(col => `<th colspan="1" class="col-sub-header">${col.label}</th>`).join('')}
                        </tr>
                        <tr>
                            ${columns.map(col => `<th class="col-sub-header-small">أيام</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <!-- 1. EXPRT عادي -->
                        <tr class="category-row">
                            <td style="padding-right:10px; font-weight:bold;">📤 Full Export Storage Days</td>
                            ${columns.map(col => renderDaysCell(exprNormalAgg.totals[col.key] || 0)).join('')}
                        </tr>
                        <!-- Power Export (RF) بعد EXPRT عادي مباشرة -->
                        <tr class="power-row">
                            <td style="padding-right:10px; font-weight:bold;">⚡ Full Export Power Days</td>
                            ${columns.map(col => renderDaysCell(powerExportAgg.totals[col.key] || 0)).join('')}
                        </tr>
                        <tr class="count-row">
                            <td style="padding-right:10px; font-weight:bold;">📊 Full Export Count Normal</td>
                            ${columns.map(col => renderCountCell(exprNormalAgg.countContainers[col.key] || 0)).join('')}
                        </tr>

                        <!-- 2. EXPRT خاص -->
                        <tr class="special-row">
                            <td style="padding-right:10px; font-weight:bold;">⭐ Full Re_Export Storage Days</td>
                            ${columns.map(col => renderDaysCell(exprSpecialAgg.totals[col.key] || 0)).join('')}
                        </tr>
                        <!-- Full Re_Export Power Days بعد EXPRT خاص مباشرة -->
                        <tr class="power-special-row">
                            <td style="padding-right:10px; font-weight:bold;">⚡ Full Re_Export Power Days ⭐</td>
                            ${columns.map(col => renderDaysCell(powerExportSpecialAgg.totals[col.key] || 0)).join('')}
                        </tr>
                        <tr class="count-row">
                            <td style="padding-right:10px; font-weight:bold;">📊 Full Re_Export Count</td>
                            ${columns.map(col => renderCountCell(exprSpecialAgg.countContainers[col.key] || 0)).join('')}
                        </tr>

                        <!-- 3. TRSHP من تبويب 1 -->
                        <tr class="trshp-row">
                            <td style="padding-right:10px; font-weight:bold;">🚛 Empty Transit Storage(L.Full)</td>
                            ${columns.map(col => renderDaysCell(trshpTab1Agg.totals[col.key] || 0)).join('')}
                        </tr>

                        <!-- 4. STRGE مجمع 2 و 6 -->
                        <tr class="strge-row">
                            <td style="padding-right:10px; font-weight:bold;">📦Empty Export Storage(L.Full)</td>
                            ${columns.map(col => renderDaysCell(strge26Agg.totals[col.key] || 0)).join('')}
                        </tr>

                        <!-- 5. Empty Export Storage(L.Emtpy) -->
                        <tr class="strge-tab4-row">
                            <td style="padding-right:10px; font-weight:bold;">📦 Empty Export Storage(L.Empty)</td>
                            ${columns.map(col => renderDaysCell(strgeTab4Agg.totals[col.key] || 0)).join('')}
                        </tr>
                        <tr class="count-row">
                            <td style="padding-right:10px; font-weight:bold;">📊 Empty Export Count</td>
                            ${columns.map(col => renderCountCell(strgeTab4Agg.countContainers[col.key] || 0)).join('')}
                        </tr>

                        <!-- 6. تبويب 5 -->
                        <tr class="tab5-row">
                            <td style="padding-right:10px; font-weight:bold;">🚛 Transit Only Storage Days</td>
                            ${columns.map(col => renderDaysCell(tab5Agg.totals[col.key] || 0)).join('')}
                        </tr>
                        <!-- RF (تبويب 5) بعد TRSHP فقط مباشرة -->
                        <tr class="rf-tab5-row">
                            <td style="padding-right:10px; font-weight:bold;">❄️ Transit Only Power Days</td>
                            ${columns.map(col => renderDaysCell(tab5RFAgg.totals[col.key] || 0)).join('')}
                        </tr>
                        <tr class="count-row">
                            <td style="padding-right:10px; font-weight:bold;">📊 Transit Only Count</td>
                            ${columns.map(col => renderCountCell(tab5Agg.countContainers[col.key] || 0)).join('')}
                        </tr>

                        <!-- 7. تبويب 7 -->
                        <tr class="tab7-row">
                            <td style="padding-right:10px; font-weight:bold;">📥 FORWARD Storage Days</td>
                            ${columns.map(col => renderDaysCell(tab7Agg.totals[col.key] || 0)).join('')}
                        </tr>
                        <tr class="count-row">
                            <td style="padding-right:10px; font-weight:bold;">📊 FORWARD Storage Count</td>
                            ${columns.map(col => renderCountCell(tab7Agg.countContainers[col.key] || 0)).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
            <script>
                let printBtn = document.createElement('button');
                printBtn.className = 'print-btn';
                printBtn.textContent = '🖨️ طباعة التقرير';
                printBtn.onclick = function() { window.print(); };
                document.body.appendChild(printBtn);

                let closeBtn = document.createElement('button');
                closeBtn.className = 'close-btn';
                closeBtn.textContent = '✖ إغلاق';
                closeBtn.onclick = function() { window.close(); };
                document.body.appendChild(closeBtn);
            <\/script>
        </body>
        </html>
    `;

    let reportWindow = window.open('', '_blank', 'width=1400,height=800,scrollbars=yes');
    if (!reportWindow) {
        alert("الرجاء السماح للنوافذ المنبثقة لعرض التقرير");
        return;
    }
    reportWindow.document.write(html);
    reportWindow.document.close();
    console.log("✅ تم إنشاء التقرير المجمع بنجاح");
}

// ============================================================
// ========== دوال تحميل الإعدادات من GitHub تلقائياً ==========
// ============================================================

const GITHUB_SETTINGS_URL = 'https://raw.githubusercontent.com/revenudchc-boop/Storage_Reports/main/settings.json';

// ===== دالة التحميل الرئيسية =====
async function loadSettingsFromGitHub() {
    try {
        console.log('🔄 [GitHub] جاري تحميل الإعدادات...');
        
        const response = await fetch(GITHUB_SETTINGS_URL + '?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const settings = await response.json();
        
        // تطبيق الإعدادات على المتغيرات مباشرة
        applyGitHubSettings(settings);
        
        console.log('✅ [GitHub] تم تحميل الإعدادات بنجاح');
        document.getElementById("footerMsg").innerHTML = '✅ تم تحميل الإعدادات من GitHub تلقائياً';
        
    } catch (error) {
        console.warn('⚠️ [GitHub] فشل التحميل، استخدام localStorage:', error.message);
        document.getElementById("footerMsg").innerHTML = '⚠️ استخدام الإعدادات المحفوظة محلياً';
    }
}

// ===== دالة تطبيق الإعدادات =====
function applyGitHubSettings(settings) {
    console.log('🔄 [GitHub] تطبيق الإعدادات...');
    
    // قائمة الخطوط
    if (settings.masterLinesList) {
        masterLinesList = settings.masterLinesList;
        localStorage.setItem("masterLinesList", JSON.stringify(masterLinesList));
        updateAllLineSelects();
    }
    
    // تبويب 1
    if (settings.trshpPeriodsTab1) {
        trshpPeriods1 = settings.trshpPeriodsTab1;
        localStorage.setItem("trshpPeriodsTab1", JSON.stringify(trshpPeriods1));
        nextIdTrshp1 = trshpPeriods1.length > 0 ? Math.max(...trshpPeriods1.map(p => p.id)) + 1 : 1;
    }
    if (settings.exprtPeriodsTab1) {
        exprtPeriods1 = settings.exprtPeriodsTab1;
        localStorage.setItem("exprtPeriodsTab1", JSON.stringify(exprtPeriods1));
        nextIdExprt1 = exprtPeriods1.length > 0 ? Math.max(...exprtPeriods1.map(p => p.id)) + 1 : 1;
    }
    if (settings.excludeLines1) {
        excludeLines1 = settings.excludeLines1;
        localStorage.setItem("excludeLines1", JSON.stringify(excludeLines1));
    }
    
    // تبويب 2
    if (settings.strgePeriodsTab2) {
        strgePeriods2 = settings.strgePeriodsTab2;
        localStorage.setItem("strgePeriodsTab2", JSON.stringify(strgePeriods2));
        nextIdStrge2 = strgePeriods2.length > 0 ? Math.max(...strgePeriods2.map(p => p.id)) + 1 : 1;
    }
    if (settings.exprtPeriodsTab2) {
        exprtPeriods2 = settings.exprtPeriodsTab2;
        localStorage.setItem("exprtPeriodsTab2", JSON.stringify(exprtPeriods2));
        nextIdExprt2 = exprtPeriods2.length > 0 ? Math.max(...exprtPeriods2.map(p => p.id)) + 1 : 1;
    }
    if (settings.excludeLines2) {
        excludeLines2 = settings.excludeLines2;
        localStorage.setItem("excludeLines2", JSON.stringify(excludeLines2));
    }
    
    // تبويب 3
    if (settings.exprtOnlyPeriodsTab3) {
        exprtOnlyPeriods3 = settings.exprtOnlyPeriodsTab3;
        localStorage.setItem("exprtOnlyPeriodsTab3", JSON.stringify(exprtOnlyPeriods3));
        nextIdExprtOnly3 = exprtOnlyPeriods3.length > 0 ? Math.max(...exprtOnlyPeriods3.map(p => p.id)) + 1 : 1;
    }
    if (settings.excludeLines3) {
        excludeLines3 = settings.excludeLines3;
        localStorage.setItem("excludeLines3", JSON.stringify(excludeLines3));
    }
    
    // تبويب 4
    if (settings.emptyStrgePeriodsTab4) {
        emptyStrgePeriods4 = settings.emptyStrgePeriodsTab4;
        localStorage.setItem("emptyStrgePeriodsTab4", JSON.stringify(emptyStrgePeriods4));
        nextIdEmptyStrge4 = emptyStrgePeriods4.length > 0 ? Math.max(...emptyStrgePeriods4.map(p => p.id)) + 1 : 1;
    }
    if (settings.excludeLines4) {
        excludeLines4 = settings.excludeLines4;
        localStorage.setItem("excludeLines4", JSON.stringify(excludeLines4));
    }
    
    // تبويب 5
    if (settings.trshpOnlyPeriodsTab5) {
        trshpOnlyPeriods5 = settings.trshpOnlyPeriodsTab5;
        localStorage.setItem("trshpOnlyPeriodsTab5", JSON.stringify(trshpOnlyPeriods5));
        nextIdTrshpOnly5 = trshpOnlyPeriods5.length > 0 ? Math.max(...trshpOnlyPeriods5.map(p => p.id)) + 1 : 1;
    }
    if (settings.excludeLines5) {
        excludeLines5 = settings.excludeLines5;
        localStorage.setItem("excludeLines5", JSON.stringify(excludeLines5));
    }
    
    // تبويب 6
    if (settings.strgePeriodsTab6) {
        strgePeriods6 = settings.strgePeriodsTab6;
        localStorage.setItem("strgePeriodsTab6", JSON.stringify(strgePeriods6));
        nextIdStrge6 = strgePeriods6.length > 0 ? Math.max(...strgePeriods6.map(p => p.id)) + 1 : 1;
    }
    if (settings.exprtPeriodsTab6) {
        exprtPeriods6 = settings.exprtPeriodsTab6;
        localStorage.setItem("exprtPeriodsTab6", JSON.stringify(exprtPeriods6));
        nextIdExprt6 = exprtPeriods6.length > 0 ? Math.max(...exprtPeriods6.map(p => p.id)) + 1 : 1;
    }
    if (settings.excludeLines6) {
        excludeLines6 = settings.excludeLines6;
        localStorage.setItem("excludeLines6", JSON.stringify(excludeLines6));
    }
    
    // تبويب 7
    if (settings.imprtForwardPeriodsTab7) {
        imprtForwardPeriods7 = settings.imprtForwardPeriodsTab7;
        localStorage.setItem("imprtForwardPeriodsTab7", JSON.stringify(imprtForwardPeriods7));
        nextIdImprtForward7 = imprtForwardPeriods7.length > 0 ? Math.max(...imprtForwardPeriods7.map(p => p.id)) + 1 : 1;
    }
    if (settings.excludeLines7) {
        excludeLines7 = settings.excludeLines7;
        localStorage.setItem("excludeLines7", JSON.stringify(excludeLines7));
    }
    
    // تفضيلات الأعمدة
    if (settings.selectedColumns) {
        for (let key in settings.selectedColumns) {
            selectedColumns[key] = settings.selectedColumns[key];
            localStorage.setItem(`selectedColumns_${key}`, JSON.stringify(selectedColumns[key]));
        }
    }
    
    // تحديث واجهة المستخدم
    initializeAllSelects();
    refreshPeriodsDisplay('1');
    refreshPeriodsDisplay('2');
    refreshPeriodsDisplay('3');
    refreshPeriodsDisplay('4');
    refreshPeriodsDisplay('5');
    refreshPeriodsDisplay('6');
    refreshPeriodsDisplay('7');
    displayExcludeList('excludeList1', excludeLines1, '1');
    displayExcludeList('excludeList2', excludeLines2, '2');
    displayExcludeList('excludeList3', excludeLines3, '3');
    displayExcludeList('excludeList4', excludeLines4, '4');
    displayExcludeList('excludeList5', excludeLines5, '5');
    displayExcludeList('excludeList6', excludeLines6, '6');
    displayExcludeList('excludeList7', excludeLines7, '7');
    
    // إعادة معالجة البيانات إذا كان هناك ملف محمل
    if (containersMap.size > 0) {
        processAndDisplay1();
        processAndDisplay2();
        processAndDisplay3();
        processAndDisplay4();
        processAndDisplay5();
        processAndDisplay6();
        processAndDisplay7();
    }
    
	// بعد تحديث واجهة المستخدم
applyColumnPreferencesFromGitHub();
    console.log('✅ [GitHub] تم تطبيق الإعدادات بنجاح');
}

// ========== تحديث Header لتبويب 8 ==========
function updateStorageFinaloutHeader(headerInfo) {
    // ===== 1. العناصر الخاصة بـ FINALOUT =====
    let orderNumberSpan = document.getElementById("headerOrderNumber");
    let lineOpSpan = document.getElementById("headerLineOp");
    let countSpan = document.getElementById("headerCount");

    // إنشاء العناصر إذا لم تكن موجودة
    if (!orderNumberSpan) {
        let headerDiv = document.getElementById("headerInfo");
        if (headerDiv) {
            let newDiv = document.createElement('div');
            newDiv.id = 'finaloutHeader';
            newDiv.style.marginTop = '10px';
            newDiv.style.paddingTop = '10px';
            newDiv.style.borderTop = '1px solid rgba(255,255,255,0.2)';
            newDiv.innerHTML = `
                <div>📋 <strong>رقم الأمر (Order Number):</strong> <span id="headerOrderNumber">—</span></div>
                <div>🚢 <strong>الخط المشغل (Line Op):</strong> <span id="headerLineOp">—</span></div>
                <div>📦 <strong>عدد الحاويات:</strong> <span id="headerCount">0</span></div>
            `;
            headerDiv.appendChild(newDiv);
        }
        orderNumberSpan = document.getElementById("headerOrderNumber");
        lineOpSpan = document.getElementById("headerLineOp");
        countSpan = document.getElementById("headerCount");
    }

    // تحديث قيم FINALOUT
    if (orderNumberSpan) orderNumberSpan.textContent = headerInfo.orderNumber || "—";
    if (lineOpSpan) lineOpSpan.textContent = headerInfo.lineOp || "—";
    if (countSpan) countSpan.textContent = currentData8.length || 0;

    // إظهار/إخفاء حسب وجود بيانات FINALOUT
    let finaloutHeader = document.getElementById("finaloutHeader");
    if (finaloutHeader) {
        finaloutHeader.style.display = (currentData8 && currentData8.length > 0) ? 'block' : 'none';
    }

    // ===== 🆕 2. تحديث الرؤوس الرئيسية (Carrier/Line/Date) =====
    let carrierNameSpan = document.getElementById("headerCarrierName");
    let lineIdSpan = document.getElementById("headerLineId");
    let shippingDateSpan = document.getElementById("headerShippingDate");

    // إذا كانت فارغة (—)، استخدم بيانات FINALOUT
    if (carrierNameSpan && (carrierNameSpan.innerText === "—" || carrierNameSpan.innerText.trim() === "")) {
        // استخدام Order Number كمعرّف أساسي (لأنه الأوضح)
        if (headerInfo.orderNumber && headerInfo.orderNumber !== "—") {
            carrierNameSpan.innerText = headerInfo.orderNumber;
        } else if (headerInfo.lineOp && headerInfo.lineOp !== "—") {
            carrierNameSpan.innerText = headerInfo.lineOp;
        }
    }

    if (lineIdSpan && (lineIdSpan.innerText === "—" || lineIdSpan.innerText.trim() === "")) {
        // استخدام Line Op كخط ملاحي
        if (headerInfo.lineOp && headerInfo.lineOp !== "—") {
            lineIdSpan.innerText = headerInfo.lineOp;
        }
    }

if (shippingDateSpan && (shippingDateSpan.innerText === "—" || shippingDateSpan.innerText.trim() === "")) {
    // في حالة FINALOUT: لا نضيف تاريخ (لأننا نستخدم Order Number)
    // نتركه فارغاً أو نضع تاريخ اليوم فقط للعرض
    let today = new Date();
    let dateStr = today.getFullYear() + "/" + 
                  String(today.getMonth() + 1).padStart(2, '0') + "/" + 
                  String(today.getDate()).padStart(2, '0');
    
    shippingDateSpan.innerText = dateStr;
}
}
// ===== استدعاء التحميل عند فتح الصفحة =====
// هذا السطر سيتم تنفيذه بعد تحميل الصفحة بالكامل
document.addEventListener("DOMContentLoaded", function() {
    // تأخير بسيط لضمان جاهزية كل شيء
    setTimeout(loadSettingsFromGitHub, 500);
});


// ============================================================
// ===== دالة تطبيق تفضيلات الأعمدة من GitHub =====
// ============================================================
function applyColumnPreferencesFromGitHub() {
    try {
        // التحقق من وجود تفضيلات الأعمدة في selectedColumns
        if (!selectedColumns || Object.keys(selectedColumns).length === 0) {
            console.log('⚠️ لا توجد تفضيلات أعمدة للتحميل');
            return;
        }
        
        // تطبيق التفضيلات على كل تبويب
        for (let tab in selectedColumns) {
            let tabNumber = tab.replace('tab', '');
            let columns = selectedColumns[tab];
            
            if (!columns || columns.length === 0) continue;
            
            // حفظ التفضيلات في localStorage
            localStorage.setItem(`selectedColumns_${tab}`, JSON.stringify(columns));
            
            console.log(`✅ تم تطبيق تفضيلات الأعمدة للتبويب ${tabNumber}:`, columns.length, 'عمود');
        }
        
        // إعادة عرض الجداول مع الأعمدة المختارة
        setTimeout(function() {
            applySavedColumnPreferences();
        }, 200);
        
    } catch (error) {
        console.warn('⚠️ فشل تطبيق تفضيلات الأعمدة:', error);
    }
}

// ============================================================
// 🔍 دالة شاملة لفحص جميع حقول ملف Excel
// ============================================================
function checkExcelFields(rows, fileType = "main") {
    
    // ============================================
    // القائمة الكاملة لجميع الحقول (47 حقل)
    // ============================================
    const ALL_MAIN_FIELDS = [
        //"Batch ID",
        //"Event Type",
        //"Status",
        "Equip ID",
        "Line ID",
        "Freight Kind",
        "Equipment Type",
        "Dray Status",
        "Flex String 32",
        "Notes",
        "I/B Carrier ATA",
        "O/B Carrier ATA",
        "O/B Carrier ATD",
        "Flex String 36",
        "ISO Group",
        "ISO Length",
        "ISO Height",
        "Category",
        "Is OOG",
        "Is Refrigerated",
        "Flex String 04",
        "Is Bundled",
        "Is Hazardous",
        "IMDG Class",
        "Commodity ID",
        "Start Time",
        "End Time",
        "PaidThruDate",
        "Rule Start Time",
        "Rule End Time",
        "First Availability Day",
        "Quay CheID",
        "Is Locked",
        "I/B Loc Type",
        "I/B ID",
        "I/B Visit ID",
        "I/B Carrier Name",
        "I/B Call Nbr",
        "O/B Loc Type",
        "O/B ID",
        "O/B Visit ID",
        "O/B Carrier Name",
        "O/B Call Nbr",
        "Flex String 01",
        "Flex String 02",
        "Flex String 21",
        "Flex String 22"
    ];
    
    // ============================================
    // الحقول المطلوبة في ملف FINALOUT (12 حقل)
    // ============================================
    const ALL_FINALOUT_FIELDS = [
        "Unit Nbr",
        "Type ISO",
        "Category",
        "Orig",
        "Dray Status",
        "Order Number",
        "Time In",
        "Time Out",
        "Storage Days Total",
        "LCL-POSS",
        "Line Op",
        "Frght Kind"
    ];
    
    // ============================================
    // التحقق من وجود البيانات
    // ============================================
    if (!rows || rows.length === 0) {
        alert("⚠️ الملف فارغ أو لا يحتوي على بيانات.");
        return { valid: false, missing: ["الملف فارغ"], actualFields: [] };
    }
    
    // ============================================
    // تحديد قائمة الحقول حسب نوع الملف
    // ============================================
    let requiredFields = (fileType === "finalout") ? ALL_FINALOUT_FIELDS : ALL_MAIN_FIELDS;
    
    // ============================================
    // الحصول على الأعمدة الفعلية
    // ============================================
    let actualFields = Object.keys(rows[0]).map(k => k.toString().trim());
    console.log("🔍 الأعمدة الموجودة في الملف:", actualFields);
    console.log(`📊 عدد الأعمدة الفعلية: ${actualFields.length}`);
    console.log(`📊 عدد الحقول المطلوبة: ${requiredFields.length}`);
    
    // ============================================
    // البحث عن الحقول الناقصة
    // ============================================
    let missingFields = [];
    for (let field of requiredFields) {
        let found = actualFields.some(f => 
            f === field || 
            f.toLowerCase() === field.toLowerCase() ||
            f.replace(/\s+/g, '') === field.replace(/\s+/g, '')
        );
        if (!found) {
            missingFields.push(field);
        }
    }
    
    // ============================================
    // عرض النتيجة
    // ============================================
    if (missingFields.length > 0) {
        let fileTypeLabel = (fileType === "finalout") 
            ? "ملف FINALOUT (تبويب 8)" 
            : "ملف البيانات الرئيسي (التبويبات 1-7)";
        
        let missingList = missingFields.map(f => `  ❌ ${f}`).join("\n");
        
        let message = `⚠️ لا يمكن تحميل الملف!\n\n`;
        message += `نوع الملف: ${fileTypeLabel}\n\n`;
        message += `الحقول التالية مفقودة (${missingFields.length} حقل):\n${missingList}\n\n`;
        message += `يرجى التأكد من أن ملف Excel يحتوي على جميع الحقول المطلوبة.`;
        
        alert(message);
        
        let footer = document.getElementById("footerMsg");
        if (footer) {
            footer.innerHTML = `❌ فشل التحميل: ${missingFields.length} حقل مفقود — ${missingFields.join(" | ")}`;
            footer.style.color = "#dc3545";
            footer.style.fontWeight = "bold";
        }
        
        console.error("❌ الحقول المفقودة:", missingFields);
        console.error("❌ عدد الحقول المفقودة:", missingFields.length);
        
        return { valid: false, missing: missingFields, actualFields: actualFields };
    }
    
    // ============================================
    // جميع الحقول موجودة
    // ============================================
    console.log("✅ جميع الحقول المطلوبة موجودة");
    console.log(`✅ تم فحص ${requiredFields.length} حقل بنجاح`);
    return { valid: true, missing: [], actualFields: actualFields };
}

// ============================================================
// 📊 تقرير مجمع تفاعلي - دالة مستقلة
// ============================================================

function generateInteractiveConsolidatedReport() {
    console.log("🔍 بدء إنشاء التقرير المجمع التفاعلي...");

    // ===== 1. تجهيز البيانات =====
    const dataSources = {
        tab1: currentData1 || [],
        tab2: currentData2 || [],
        tab3: currentData3 || [],
        tab4: currentData4 || [],
        tab5: currentData5 || [],
        tab6: currentData6 || [],
        tab7: currentData7 || [],
        tab8: currentData8 || []
    };

    const totalRows = Object.values(dataSources).reduce((sum, arr) => sum + arr.length, 0);
    if (totalRows === 0) {
        alert("⚠️ لا توجد بيانات. يرجى تحميل ملف Excel أولاً.");
        return;
    }

    // ===== 2. تعريف الأنواع والمقاسات =====
    const sizeTypes = [
        { size: '20', label: '20\'', check: (item) => {
            let s = (item["Size"] || "").toString();
            return s.startsWith("2") || s === "20";
        }},
        { size: '40', label: '40\'', check: (item) => {
            let s = (item["Size"] || "").toString();
            return s.startsWith("4") || s.startsWith("95") || s.startsWith("42") || s.startsWith("45");
        }}
    ];

    const containerTypes = [
        { key: 'GP', label: 'GP', check: (item) => {
            let type = item["Type"] || "";
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return type === "GP" && !isOOG && !isHazard && !isRef;
        }},
        { key: 'RF', label: 'RF', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && !isOOG && !isHazard;
        }},
        { key: 'OOG', label: 'OOG', check: (item) => {
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isOOG && !isRef && !isHazard;
        }},
        { key: 'Hazard', label: 'Hazard', check: (item) => {
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return isHazard && !isOOG && !isRef;
        }},
        { key: 'RF_OOG', label: 'RF+OOG', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && isOOG && !isHazard;
        }},
        { key: 'RF_Hazard', label: 'RF+Hazard', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            return isRef && isHazard && !isOOG;
        }},
        { key: 'OOG_Hazard', label: 'OOG+Hazard', check: (item) => {
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            return isOOG && isHazard && !isRef;
        }},
        { key: 'RF_OOG_Hazard', label: 'RF+OOG+Hazard', check: (item) => {
            let isRef = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            let isOOG = item["Is OOG"] === "true" || item["Is OOG"] === true;
            let isHazard = item["Is Hazardous"] === "true" || item["Is Hazardous"] === true;
            return isRef && isOOG && isHazard;
        }}
    ];

    let columns = [];
    for (let type of containerTypes) {
        for (let size of sizeTypes) {
            let colKey = size.size + '_' + type.key;
            columns.push({
                key: colKey,
                label: size.label + ' ' + type.label,
                check: (item) => type.check(item) && size.check(item)
            });
        }
    }

    // ===== 3. دالة تجميع مع تخزين تفاصيل الحاويات =====
    function aggregateWithDetails(dataArray, categoryKey, filterFn = null) {
        let totals = {};
        let containerSet = new Set();
        let details = {};
        columns.forEach(col => {
            totals[col.key] = 0;
            details[col.key] = [];
        });

        for (let item of dataArray) {
            if (filterFn && !filterFn(item)) continue;

            let containerNo = item["Container No."] || item["رقم الحاوية"] || "";
            if (!containerNo) continue;

            let net = parseFloat(item[categoryKey + " Net"]) || 0;

            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(item)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) matchedCol = columns.find(c => c.key === '20_GP') || columns[0];

            containerSet.add(containerNo + "|" + matchedCol.key);

            if (net > 0) {
                details[matchedCol.key].push({
                    "Container No.": containerNo,
                    "Line ID": item["Line ID"] || "",
                    "Size": item["Size"] || "",
                    "Type": item["Type"] || "",
                    "Is OOG": item["Is OOG"] || "false",
                    "Is Refrigerated": item["Is Refrigerated"] || "false",
                    "Is Hazardous": item["Is Hazardous"] || "false",
                    "IMDG Class": item["IMDG Class"] || "",
                    "Dray Status": item["Dray Status"] || "",
                    "Flex String 01": item["Flex String 01"] || "",
                    "Flex String 04": item["flex_04"] || item["Flex String 04"] || "",
                    "Category": categoryKey,
                    "Start": item[categoryKey + " Start"] || "",
                    "End": item[categoryKey + " End"] || "",
                    "Days": item[categoryKey + " Days"] || 0,
                    "Free": item[categoryKey + " Free"] || 0,
                    "Net": net,
                    "Vessel Name": item["Vessel Name"] || ""
                });
                totals[matchedCol.key] += net;
            }
        }

        let countContainers = {};
        columns.forEach(col => { countContainers[col.key] = 0; });
        containerSet.forEach(key => {
            let parts = key.split("|");
            let colKey = parts[1];
            if (countContainers[colKey] !== undefined) {
                countContainers[colKey] += 1;
            }
        });

        return { totals, countContainers, details };
    }

    // ===== 4. تجميع الفئات =====

    // EXPRT عادي
    let exprNormalData = [];
    [1, 2, 3, 6].forEach(tabKey => {
        let data = dataSources['tab' + tabKey];
        let filtered = data.filter(item => {
            let flex = item["Flex String 01"] || "";
            let drayStatus = item["Dray Status"] || "";
            return flex !== "TRUE" && drayStatus !== "RETURN";
        });
        exprNormalData = exprNormalData.concat(filtered);
    });
    let exprNormalAgg = aggregateWithDetails(exprNormalData, 'EXPRT', null);

    // EXPRT خاص
    let exprSpecialData = [];
    [1, 2, 3, 6].forEach(tabKey => {
        let data = dataSources['tab' + tabKey];
        let filtered = data.filter(item => {
            let flex = item["Flex String 01"] || "";
            let drayStatus = item["Dray Status"] || "";
            return flex === "TRUE" && drayStatus !== "RETURN";
        });
        exprSpecialData = exprSpecialData.concat(filtered);
    });
    let exprSpecialAgg = aggregateWithDetails(exprSpecialData, 'EXPRT', null);

    // TRSHP من تبويب 1
    let trshpTab1Agg = aggregateWithDetails(dataSources.tab1, 'TRSHP', null);

    // STRGE مجمع 2 و 6
    let strge26Data = [];
    [2, 6].forEach(tabKey => {
        strge26Data = strge26Data.concat(dataSources['tab' + tabKey]);
    });
    let strge26Agg = aggregateWithDetails(strge26Data, 'STRGE', null);

    // STRGE من تبويب 4
    let strgeTab4Agg = aggregateWithDetails(dataSources.tab4, 'STRGE', null);

    // تبويب 5 (TRSHP فقط)
    let tab5Agg = aggregateWithDetails(dataSources.tab5, 'TRSHP', null);

    // تبويب 7
    let tab7Agg = aggregateWithDetails(dataSources.tab7, 'Net', null);

    // ===== 5. Power Export =====
    function calculatePowerWithDetails(dataArray) {
        let totals = {};
        let containerSet = new Set();
        let details = {};
        columns.forEach(col => {
            totals[col.key] = 0;
            details[col.key] = [];
        });

        for (let item of dataArray) {
            let isRefrigerated = item["Is Refrigerated"] === "true" || item["Is Refrigerated"] === true;
            if (!isRefrigerated) continue;

            let containerNo = item["Container No."] || "";
            if (!containerNo) continue;

            let days = parseFloat(item["EXPRT Days"]) || 0;

            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(item)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) matchedCol = columns.find(c => c.key === '20_GP') || columns[0];

            containerSet.add(containerNo + "|" + matchedCol.key);

            if (days > 0) {
                details[matchedCol.key].push({
                    "Container No.": containerNo,
                    "Line ID": item["Line ID"] || "",
                    "Size": item["Size"] || "",
                    "Type": item["Type"] || "",
                    "Is Refrigerated": "true",
                    "Dray Status": item["Dray Status"] || "",
                    "Flex String 01": item["Flex String 01"] || "",
                    "Category": "POWER",
                    "Start": item["EXPRT Start"] || "",
                    "End": item["EXPRT End"] || "",
                    "Days": days,
                    "Free": item["EXPRT Free"] || 0,
                    "Net": days,
                    "Vessel Name": item["Vessel Name"] || ""
                });
                totals[matchedCol.key] += days;
            }
        }

        let countContainers = {};
        columns.forEach(col => { countContainers[col.key] = 0; });
        containerSet.forEach(key => {
            let parts = key.split("|");
            let colKey = parts[1];
            if (countContainers[colKey] !== undefined) {
                countContainers[colKey] += 1;
            }
        });

        return { totals, countContainers, details };
    }

    let powerExportAgg = calculatePowerWithDetails(exprNormalData);
    let powerExportSpecialAgg = calculatePowerWithDetails(exprSpecialData);

    // RF من تبويب 5
    function calculateTab5RFWithDetails(dataArray) {
        let totals = {};
        let containerSet = new Set();
        let details = {};
        columns.forEach(col => {
            totals[col.key] = 0;
            details[col.key] = [];
        });

        for (let item of dataArray) {
            let isRefrigerated = false;
            let refValue = item["Is Refrigerated"];
            if (refValue === "true" || refValue === true || refValue === "TRUE" || refValue === 1 || refValue === "1") {
                isRefrigerated = true;
            }
            if (!isRefrigerated) continue;

            let containerNo = item["Container No."] || "";
            if (!containerNo) continue;

            let days = parseFloat(item["TRSHP Days"]) || 0;

            let matchedCol = null;
            for (let col of columns) {
                try {
                    if (col.check(item)) {
                        matchedCol = col;
                        break;
                    }
                } catch(e) {}
            }
            if (!matchedCol) matchedCol = columns.find(c => c.key === '20_GP') || columns[0];

            containerSet.add(containerNo + "|" + matchedCol.key);

            if (days > 0) {
                details[matchedCol.key].push({
                    "Container No.": containerNo,
                    "Line ID": item["Line ID"] || "",
                    "Size": item["Size"] || "",
                    "Type": item["Type"] || "",
                    "Is Refrigerated": "true",
                    "Category": "POWER-TRSHP",
                    "Start": item["TRSHP Start"] || "",
                    "End": item["TRSHP End"] || "",
                    "Days": days,
                    "Free": item["TRSHP Free"] || 0,
                    "Net": days,
                    "Vessel Name": item["Vessel Name"] || ""
                });
                totals[matchedCol.key] += days;
            }
        }

        let countContainers = {};
        columns.forEach(col => { countContainers[col.key] = 0; });
        containerSet.forEach(key => {
            let parts = key.split("|");
            let colKey = parts[1];
            if (countContainers[colKey] !== undefined) {
                countContainers[colKey] += 1;
            }
        });

        return { totals, countContainers, details };
    }

    let tab5RFAgg = calculateTab5RFWithDetails(dataSources.tab5);

    // ===== 6. معلومات السفينة =====
    let vesselInfo = { carrierName: "—", shippingDate: "—", lineId: "—" };

    for (let [id, container] of containersMap.entries()) {
        let sourceData = null;
        if (container.exprtList && container.exprtList.length > 0) sourceData = container.exprtList[0];
        else if (container.exprt) sourceData = container.exprt;
        else if (container.trshpList && container.trshpList.length > 0) sourceData = container.trshpList[0];
        else if (container.trshp) sourceData = container.trshp;
        else if (container.strge) sourceData = container.strge;
        else if (container.imprt) sourceData = container.imprt;

        if (sourceData) {
            if (vesselInfo.carrierName === "—") {
                vesselInfo.carrierName = sourceData["O/B Carrier Name"] || sourceData["I/B Carrier Name"] || "—";
            }
            let atd = sourceData["O/B Carrier ATD"] || sourceData["O/B Carrier ATA"] || sourceData["I/B Carrier ATD"] || "";
            if (atd && atd !== "" && vesselInfo.shippingDate === "—") {
                vesselInfo.shippingDate = atd;
            }
            let lineId = sourceData["Line ID"];
            if (lineId && lineId !== "" && vesselInfo.lineId === "—") {
                vesselInfo.lineId = lineId;
            }
        }
        if (vesselInfo.carrierName !== "—" && vesselInfo.shippingDate !== "—" && vesselInfo.lineId !== "—") break;
    }

    let shippingDateDisplay = vesselInfo.shippingDate;
    if (shippingDateDisplay && shippingDateDisplay !== "—") {
        let converted = convertDate(shippingDateDisplay);
        if (converted) shippingDateDisplay = converted;
    }

    let currentDate = new Date().toLocaleString('ar-EG', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // ===== 7. تجهيز بيانات الصفوف =====
    let reportRows = [
        { id: 'row1', label: "📤 Full Export Storage Days", category: "EXPRT", data: exprNormalAgg, cssClass: "category-row" },
        { id: 'row2', label: "⚡ Full Export Power Days", category: "POWER", data: powerExportAgg, cssClass: "power-row" },
        { id: 'row3', label: "📊 Full Export Count Normal", category: "EXPRT", data: exprNormalAgg, isCount: true, cssClass: "count-row" },
        { id: 'row4', label: "⭐ Full Re_Export Storage Days", category: "EXPRT", data: exprSpecialAgg, cssClass: "special-row" },
        { id: 'row5', label: "⚡ Full Re_Export Power Days ⭐", category: "POWER", data: powerExportSpecialAgg, cssClass: "power-special-row" },
        { id: 'row6', label: "📊 Full Re_Export Count", category: "EXPRT", data: exprSpecialAgg, isCount: true, cssClass: "count-row" },
        { id: 'row7', label: "🚛 Empty Transit Storage(L.Full)", category: "TRSHP", data: trshpTab1Agg, cssClass: "trshp-row" },
        { id: 'row8', label: "📦 Empty Export Storage(L.Full)", category: "STRGE", data: strge26Agg, cssClass: "strge-row" },
        { id: 'row9', label: "📦 Empty Export Storage(L.Empty)", category: "STRGE", data: strgeTab4Agg, cssClass: "strge-tab4-row" },
        { id: 'row10', label: "📊 Empty Export Count", category: "STRGE", data: strgeTab4Agg, isCount: true, cssClass: "count-row" },
        { id: 'row11', label: "🚛 Transit Only Storage Days", category: "TRSHP", data: tab5Agg, cssClass: "tab5-row" },
        { id: 'row12', label: "❄️ Transit Only Power Days", category: "POWER-TRSHP", data: tab5RFAgg, cssClass: "rf-tab5-row" },
        { id: 'row13', label: "📊 Transit Only Count", category: "TRSHP", data: tab5Agg, isCount: true, cssClass: "count-row" },
        { id: 'row14', label: "📥 FORWARD Storage Days", category: "Net", data: tab7Agg, cssClass: "tab7-row" },
        { id: 'row15', label: "📊 FORWARD Storage Count", category: "Net", data: tab7Agg, isCount: true, cssClass: "count-row" }
    ];

    // تخزين البيانات عالمياً
    window.interactiveReportRows = reportRows;
    window.interactiveReportColumns = columns;

    // ===== 8. بناء HTML =====
    function renderDaysCell(rowId, colKey, total) {
        if (total === 0) return `<td class="empty-cell">—</td>`;
        return `<td class="num-days clickable" onclick="openRowDetails('${rowId}', '${colKey}')" style="cursor:pointer;">${total} Day</td>`;
    }

    function renderCountCell(rowId, colKey, count) {
        if (count === 0) return `<td class="empty-cell" style="font-size:10px;color:#999;">0</td>`;
        return `<td class="num-containers clickable" onclick="openRowDetails('${rowId}', '${colKey}')" style="cursor:pointer; font-size:10px;color:#0a3d62;">Cont: ${count}</td>`;
    }

    let tableRows = '';
    reportRows.forEach(row => {
        let data = row.data;
        tableRows += `<tr class="${row.cssClass} clickable-row" data-row-id="${row.id}">`;
        tableRows += `<td style="padding-right:10px; font-weight:bold; cursor:pointer;" onclick="openRowDetails('${row.id}', null)">${row.label}</td>`;

        if (row.isCount) {
            tableRows += columns.map(col => renderCountCell(row.id, col.key, data.countContainers[col.key] || 0)).join('');
        } else {
            tableRows += columns.map(col => renderDaysCell(row.id, col.key, data.totals[col.key] || 0)).join('');
        }
        tableRows += `</tr>`;
    });

    let html = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير مجمع تفاعلي - أيام التخزين</title>
            <style>
                * { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; box-sizing: border-box; }
                body { background: #f0f2f5; padding: 20px; direction: rtl; }
                .report-container { max-width: 100%; margin: auto; background: white; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); padding: 25px; overflow-x: auto; }
                .report-header { text-align: center; padding-bottom: 15px; border-bottom: 2px solid #0a3d62; margin-bottom: 20px; }
                .report-header h1 { color: #0a3d62; font-size: 24px; margin: 0; }
                .vessel-info { display: flex; justify-content: center; gap: 30px; margin-top: 10px; font-size: 14px; color: #0a3d62; background: #f0f8ff; padding: 8px 20px; border-radius: 8px; border: 1px solid #cce5ff; flex-wrap: wrap; }
                .vessel-info span { font-weight: bold; }
                .hint { background: #fff3cd; padding: 8px 15px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; color: #856404; text-align: center; }
                table { width: 100%; border-collapse: collapse; font-size: 10px; border: 2px solid #0a3d62; }
                th, td { border: 1px solid #dee2e6; padding: 4px 3px; text-align: center; vertical-align: middle; }
                .col-sub-header { background: #1a5a7a; color: white; font-size: 9px; }
                .col-sub-header-small { background: #2a7a9a; color: white; font-size: 8px; }
                .category-row { background: #d1ecf1; }
                .special-row { background: #fce4ec; }
                .trshp-row { background: #d4edda; }
                .strge-row { background: #cce5ff; }
                .strge-tab4-row { background: #fff3cd; }
                .count-row { background: #f8f9fa; }
                .tab5-row { background: #d5f5e3; }
                .tab7-row { background: #fadbd8; }
                .tab8-row { background: #e8daef; }
                .power-row { background: #e3f2fd; }
                .power-special-row { background: #fce4ec; }
                .rf-tab5-row { background: #d5f5e3; }
                .num-days { color: #1e6f5c; font-weight: bold; }
                .num-containers { color: #0a3d62; font-weight: bold; }
                .empty-cell { color: #adb5bd; font-style: italic; }
                .clickable:hover { background: #ffd54f !important; transition: 0.2s; }
                .clickable-row:hover { background: #fff9c4 !important; }
                .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6c757d; padding-top: 15px; border-top: 1px solid #dee2e6; }
                .print-btn, .close-btn { position: fixed; top: 20px; padding: 10px 24px; color: white; border: none; border-radius: 30px; font-weight: bold; cursor: pointer; z-index: 1000; }
                .print-btn { right: 20px; background: #0a3d62; }
                .close-btn { right: 160px; background: #dc3545; }
                @media print { body { background: white; padding: 10px; } .print-btn, .close-btn { display: none; } }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="report-header">
                    <h1>📊 تقرير مجمع تفاعلي - أيام التخزين</h1>
                    <div class="vessel-info">
                        <div>🚢 <span>السفينة:</span> ${vesselInfo.carrierName}</div>
                        <div>📅 <span>تاريخ الرحلة:</span> ${shippingDateDisplay}</div>
                        <div>🏷️ <span>الخط:</span> ${vesselInfo.lineId}</div>
                        <div>📅 <span>تاريخ التقرير:</span> ${currentDate}</div>
                    </div>
                </div>
                <div class="hint">💡 اضغط على أي خلية أو صف لعرض تفاصيل الحاويات</div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="3" style="background:#0a3d62; color:white; width:200px; vertical-align:middle;">الفئة</th>
                            <th colspan="${columns.length}" style="background:#0a3d62; color:white; font-size:12px;">أنواع ومقاسات الحاويات</th>
                        </tr>
                        <tr>
                            ${columns.map(col => `<th colspan="1" class="col-sub-header">${col.label}</th>`).join('')}
                        </tr>
                        <tr>
                            ${columns.map(col => `<th class="col-sub-header-small">أيام</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="footer">تم إنشاؤه بواسطة نظام التخزين - تقرير مجمع تفاعلي</div>
            </div>

            <script>
                // البيانات متاحة عبر window.opener
                function openRowDetails(rowId, colKey) {
                    let rows = window.opener.interactiveReportRows;
                    let columns = window.opener.interactiveReportColumns;
                    let row = rows.find(r => r.id === rowId);
                    if (!row) return;
                    
                    let details = row.data.details || {};
                    let containers = [];
                    
                    if (colKey) {
                        if (details[colKey]) containers = details[colKey];
                    } else {
                        for (let ck in details) {
                            containers = containers.concat(details[ck].map(c => Object.assign({}, c, { "_colKey": ck })));
                        }
                    }
                    
                    if (containers.length === 0) {
                        alert("لا توجد حاويات مساهمة في هذه الخلية.");
                        return;
                    }
                    
                    let detailWin = window.open('', '_blank', 'width=1500,height=900,scrollbars=yes');
                    if (!detailWin) {
                        alert("الرجاء السماح للنوافذ المنبثقة.");
                        return;
                    }
                    
                    let colLabel = colKey ? (columns.find(c => c.key === colKey) || {}).label || colKey : "الكل";
                    
                    // ===== بناء صفوف الجدول =====
                    let rowsHtml = '';
                    for (let i = 0; i < containers.length; i++) {
                        let c = containers[i];
                        rowsHtml += '<tr>';
                        rowsHtml += '<td>' + (i + 1) + '</td>';
                        rowsHtml += '<td style="font-weight:bold;">' + (c["Container No."] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["Line ID"] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["Size"] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["Type"] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["Category"] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["Dray Status"] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["Flex String 01"] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["Is Refrigerated"] === "true" ? "❄️" : "—") + '</td>';
                        rowsHtml += '<td>' + (c["Is OOG"] === "true" ? "📐" : "—") + '</td>';
                        rowsHtml += '<td>' + (c["Is Hazardous"] === "true" ? "⚠️" : "—") + '</td>';
                        rowsHtml += '<td>' + (c["IMDG Class"] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["Start"] || "—") + '</td>';
                        rowsHtml += '<td>' + (c["End"] || "—") + '</td>';
                        rowsHtml += '<td style="background:#e3f2fd;">' + (c["Days"] || 0) + '</td>';
                        rowsHtml += '<td style="background:#fff3cd;">' + (c["Free"] || 0) + '</td>';
                        rowsHtml += '<td style="background:#d4edda;font-weight:bold;">' + (c["Net"] || 0) + '</td>';
                        rowsHtml += '<td>' + (c["Vessel Name"] || "—") + '</td>';
                        rowsHtml += '</tr>';
                    }
                    
                    // ===== بناء HTML (بدون أي script tag) =====
                    let innerDocHtml = '';
                    innerDocHtml += '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>Details</title>';
                    innerDocHtml += '<style>';
                    innerDocHtml += '*{font-family:Segoe UI,Tahoma,sans-serif;box-sizing:border-box}';
                    innerDocHtml += 'body{background:#f0f2f5;padding:20px;direction:rtl;margin:0}';
                    innerDocHtml += '.container{max-width:100%;margin:auto;background:white;border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,.1);padding:25px}';
                    innerDocHtml += '.header{text-align:center;padding-bottom:15px;border-bottom:2px solid #0a3d62;margin-bottom:20px}';
                    innerDocHtml += '.header h1{color:#0a3d62;font-size:22px;margin:0}';
                    innerDocHtml += '.header .sub{color:#666;font-size:14px;margin-top:8px}';
                    innerDocHtml += '.info-badge{display:inline-block;background:#e3f2fd;color:#0d47a1;padding:6px 15px;border-radius:20px;margin:5px;font-size:13px;font-weight:bold}';
                    innerDocHtml += '.toolbar{background:#f8f9fa;padding:15px;border-radius:10px;margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}';
                    innerDocHtml += '.toolbar button{padding:10px 20px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px}';
                    innerDocHtml += '.btn-upload{background:#17a2b8;color:white}';
                    innerDocHtml += '.btn-compare{background:#28a745;color:white}';
                    innerDocHtml += '.btn-compare:disabled{background:#ccc;cursor:not-allowed}';
                    innerDocHtml += '.btn-reset{background:#6c757d;color:white}';
                    innerDocHtml += '.file-info{background:#d4edda;color:#155724;padding:8px 15px;border-radius:8px;font-size:13px;font-weight:bold;display:none}';
                    innerDocHtml += 'table{width:100%;border-collapse:collapse;font-size:11px}';
                    innerDocHtml += 'th{background:#0a3d62;color:white;padding:8px 4px}';
                    innerDocHtml += 'td{padding:6px 4px;border-bottom:1px solid #e9ecef;text-align:center}';
                    innerDocHtml += 'tr:hover{background:#f1f3f5}';
                    innerDocHtml += '.diff-row{background:#fff5f5}';
                    innerDocHtml += '.diff-positive{color:#dc3545;font-weight:bold}';
                    innerDocHtml += '.diff-negative{color:#fd7e14;font-weight:bold}';
                    innerDocHtml += '.print-btn{position:fixed;top:20px;right:20px;padding:10px 24px;background:#0a3d62;color:white;border:none;border-radius:30px;font-weight:bold;cursor:pointer}';
                    innerDocHtml += '.close-btn{position:fixed;top:20px;right:160px;padding:10px 24px;background:#dc3545;color:white;border:none;border-radius:30px;font-weight:bold;cursor:pointer}';
                    innerDocHtml += '.section-title{font-size:16px;color:#0a3d62;margin:20px 0 10px 0;padding-bottom:8px;border-bottom:2px solid #0a3d62;font-weight:bold}';
                    innerDocHtml += '.summary{display:flex;gap:15px;margin-bottom:15px;flex-wrap:wrap}';
                    innerDocHtml += '.summary-card{flex:1;min-width:130px;padding:15px;border-radius:10px;text-align:center;color:white}';
                    innerDocHtml += '.summary-card .num{font-size:24px;font-weight:bold;margin:5px 0}';
                    innerDocHtml += '.summary-card .lbl{font-size:12px;opacity:.9}';
                    innerDocHtml += '@media print{.print-btn,.close-btn,.toolbar{display:none}body{background:white}}';
                    innerDocHtml += '</style></head><body>';
                    innerDocHtml += '<button class="print-btn" id="printBtn">🖨️ طباعة</button>';
                    innerDocHtml += '<button class="close-btn" id="closeBtn">✖ إغلاق</button>';
                    innerDocHtml += '<div class="container">';
                    innerDocHtml += '<div class="header">';
                    innerDocHtml += '<h1>📋 تفاصيل الحاويات - مقارنة مع ملف الفواتير</h1>';
                    innerDocHtml += '<div class="sub">' + row.label + '</div>';
                    innerDocHtml += '<div style="margin-top:10px;">';
                    innerDocHtml += '<span class="info-badge">العمود: ' + colLabel + '</span>';
                    innerDocHtml += '<span class="info-badge">عدد الحاويات: ' + containers.length + '</span>';
                    innerDocHtml += '</div></div>';
                    innerDocHtml += '<div class="toolbar">';
                    innerDocHtml += '<input type="file" id="compareFileInput" accept=".xls,.xlsx" style="display:none">';
                    innerDocHtml += '<button class="btn-upload" id="uploadBtn">📂 تحميل ملف المقارنة</button>';
                    innerDocHtml += '<span class="file-info" id="fileInfo"></span>';
                    innerDocHtml += '<button class="btn-compare" id="compareBtn" disabled>🔍 مقارنة</button>';
                    innerDocHtml += '<button class="btn-reset" id="resetBtn">🔄 إعادة تعيين</button>';
                    innerDocHtml += '</div>';
                    innerDocHtml += '<div id="compareResults" style="display:none">';
                    innerDocHtml += '<div class="section-title">📊 نتائج المقارنة (الحاويات التي بها فرق فقط)</div>';
                    innerDocHtml += '<div class="summary" id="compareSummary"></div>';
                    innerDocHtml += '<div id="compareTableContainer"></div>';
                    innerDocHtml += '</div>';
                    innerDocHtml += '<div class="section-title">📋 تفاصيل الحاويات الأصلية</div>';
                    innerDocHtml += '<div style="overflow-x:auto"><table><thead><tr>';
                    innerDocHtml += '<th>#</th><th>Container No.</th><th>Line</th><th>Size</th><th>Type</th><th>Category</th><th>Dray Status</th><th>Flex 01</th><th>RF</th><th>OOG</th><th>Hazard</th><th>IMDG</th><th>Start</th><th>End</th><th>Days</th><th>Free</th><th>Net</th><th>Vessel</th>';
                    innerDocHtml += '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>';
                    innerDocHtml += '</div></body></html>';
                    
                    detailWin.document.write(innerDocHtml);
                    detailWin.document.close();
                    
                    // ===== تحميل XLSX ديناميكياً =====
                    let xlsxScript = detailWin.document.createElement('script');
                    xlsxScript.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
                    detailWin.document.head.appendChild(xlsxScript);
                    
                    // ===== ربط الأحداث =====
                    let billingData = null;
                    
                    detailWin.document.getElementById('printBtn').onclick = function() { detailWin.print(); };
                    detailWin.document.getElementById('closeBtn').onclick = function() { detailWin.close(); };
                    detailWin.document.getElementById('uploadBtn').onclick = function() {
                        detailWin.document.getElementById('compareFileInput').click();
                    };
                    
                    detailWin.document.getElementById('compareFileInput').onchange = function(e) {
                        let file = e.target.files[0];
                        if (!file) return;
                        
                        // التحقق من تحميل XLSX
                        if (typeof detailWin.XLSX === 'undefined') {
                            alert('⏳ جاري تحميل مكتبة XLSX، يرجى المحاولة بعد لحظات');
                            return;
                        }
                        
                        let reader = new FileReader();
                        reader.onload = function(evt) {
                            try {
                                let data = new Uint8Array(evt.target.result);
                                let wb = detailWin.XLSX.read(data, { type: 'array' });
                                let sheet = wb.Sheets[wb.SheetNames[0]];
                                let fileRows = detailWin.XLSX.utils.sheet_to_json(sheet, { defval: '', range: 4 });
                                billingData = window.opener.buildBillingMap(fileRows, '');  // ← يقرأ STORAGE + REEFER
                                
                                let fi = detailWin.document.getElementById('fileInfo');
                                fi.style.display = 'inline-block';
                                fi.textContent = '📄 ' + file.name + ' (' + Object.keys(billingData).length + ' حاوية)';
                                detailWin.document.getElementById('compareBtn').disabled = false;
                            } catch(err) {
                                alert('خطأ: ' + err.message);
                            }
                        };
                        reader.readAsArrayBuffer(file);
                    };
                    
                    detailWin.document.getElementById('compareBtn').onclick = function() {
                        if (!billingData) return;
                        let result = window.opener.compareWithBillingFile(containers, billingData);
                        
                        let s = '';
                        s += '<div class="summary-card" style="background:linear-gradient(135deg,#43e97b,#38f9d7)"><div class="lbl">✅ متطابقة</div><div class="num">' + result.matchCount + '</div></div>';
                        s += '<div class="summary-card" style="background:linear-gradient(135deg,#f5576c,#f093fb)"><div class="lbl">❌ مختلفة</div><div class="num">' + result.diffCount + '</div></div>';
                        s += '<div class="summary-card" style="background:linear-gradient(135deg,#ffc107,#ff9800)"><div class="lbl">⚠️ في البرنامج فقط</div><div class="num">' + result.missingInBilling + '</div></div>';
                        s += '<div class="summary-card" style="background:linear-gradient(135deg,#0a3d62,#1a5a7a)"><div class="lbl">📌 إجمالي</div><div class="num">' + result.totalCompared + '</div></div>';
                        detailWin.document.getElementById('compareSummary').innerHTML = s;
                        
                        let tableEl = detailWin.document.getElementById('compareTableContainer');
                        if (result.diffResults.length === 0) {
                            tableEl.innerHTML = '<div style="padding:30px;text-align:center;background:#d4edda;border-radius:10px;font-size:16px;font-weight:bold;color:#155724">✅ جميع الحاويات متطابقة!</div>';
                        } else {
                            let t = '<div style="overflow-x:auto"><table><thead><tr>';
                            t += '<th>#</th><th>Container No.</th><th>Line</th><th>Size</th><th>Type</th><th>Reefer</th><th>أيام البرنامج</th><th>أيام الملف</th><th>الفرق</th><th>الحالة</th>';
                            t += '</tr></thead><tbody>';
                            for (let i = 0; i < result.diffResults.length; i++) {
                                let r = result.diffResults[i];
                                let dc = r.Difference > 0 ? 'diff-positive' : 'diff-negative';
                                let ds = r.Difference > 0 ? '+' : '';
                                t += '<tr class="diff-row">';
                                t += '<td>' + (i+1) + '</td>';
                                t += '<td style="font-weight:bold">' + r["Container No."] + '</td>';
                                t += '<td>' + r["Line ID"] + '</td>';
                                t += '<td>' + r["Size"] + '</td>';
                                t += '<td>' + r["Type"] + '</td>';
                                t += '<td>' + (r["Is Reefer"] ? '❄️' : '—') + '</td>';
                                t += '<td style="background:#e3f2fd">' + r["Program Days"] + '</td>';
                                t += '<td style="background:#fff3cd">' + r["Billing Days"] + '</td>';
                                t += '<td class="' + dc + '">' + ds + r.Difference + '</td>';
                                t += '<td>' + r.Status + '</td>';
                                t += '</tr>';
                            }
                            t += '</tbody></table></div>';
                            tableEl.innerHTML = t;
                        }
                        detailWin.document.getElementById('compareResults').style.display = 'block';
                    };
                    
                    detailWin.document.getElementById('resetBtn').onclick = function() {
                        billingData = null;
                        detailWin.document.getElementById('compareFileInput').value = '';
                        detailWin.document.getElementById('fileInfo').style.display = 'none';
                        detailWin.document.getElementById('compareBtn').disabled = true;
                        detailWin.document.getElementById('compareResults').style.display = 'none';
                    };
                }
            <\/script>
        </body>
        </html>
    `;

    let reportWindow = window.open('', '_blank', 'width=1600,height=900,scrollbars=yes');
    if (!reportWindow) {
        alert("الرجاء السماح للنوافذ المنبثقة لعرض التقرير");
        return;
    }
    reportWindow.document.write(html);
    reportWindow.document.close();
    console.log("✅ تم إنشاء التقرير المجمع التفاعلي بنجاح");
}

// ربط الزر
document.addEventListener("DOMContentLoaded", function() {
    let btn = document.getElementById("interactiveReportBtn");
    if (btn) {
        btn.addEventListener("click", generateInteractiveConsolidatedReport);
        console.log("✅ تم ربط زر التقرير المجمع التفاعلي");
    }
});


// ============================================================
// 🔧 دالة مستقلة: بناء خريطة الفواتير
// ============================================================
function buildBillingMap(rows, eventTypeFilter) {
    // إذا لم يُحدد فلتر، نقبل كل من STORAGE و REEFER
    let acceptedTypes = ["STORAGE", "REEFER"];
    if (eventTypeFilter && eventTypeFilter !== "") {
        acceptedTypes = [eventTypeFilter.toUpperCase()];
    }
    
    let billingMap = {};
    let typeCounts = {};
    
    for (let row of rows) {
        let eventType = (row["Event Type ID"] || "").toString().trim().toUpperCase();
        if (!acceptedTypes.includes(eventType)) continue;
        
        let entityId = (row["Event Entity ID"] || "").toString().trim();
        if (!entityId) continue;
        
        let qtyRaw = row["Quantity Billed"] || "0";
        let qty = parseFloat(qtyRaw.toString().replace(/,/g, "").trim()) || 0;
        
        if (billingMap[entityId] === undefined) {
            billingMap[entityId] = qty;
        } else {
            billingMap[entityId] += qty;
        }
        
        // احصائيات
        typeCounts[eventType] = (typeCounts[eventType] || 0) + 1;
    }
    
    console.log("✅ خريطة الفواتير:", Object.keys(billingMap).length, "حاوية");
    console.log("📊 عدد الصفوف حسب النوع:", typeCounts);
    
    return billingMap;
}

// ============================================================
// 🔍 دالة مستقلة: المقارنة
// ============================================================
// ============================================================
// 🔍 دالة مستقلة: المقارنة
// ============================================================
function compareWithBillingFile(containers, billingData) {
    let containerMap = {};
    
    for (let c of containers) {
        let cno = c["Container No."];
        if (!cno) continue;
        
        if (!containerMap[cno]) {
            containerMap[cno] = {
                "Container No.": cno,
                "Line ID": c["Line ID"] || "",
                "Size": c["Size"] || "",
                "Type": c["Type"] || "",
                "Is Reefer": false,
                "Days": 0,
                "Net": 0
            };
        }
        
        containerMap[cno]["Days"] += parseFloat(c["Days"]) || 0;
        containerMap[cno]["Net"] += parseFloat(c["Net"]) || 0;
        
        if (c["Is Refrigerated"] === "true" || c["Is Refrigerated"] === true) {
            containerMap[cno]["Is Reefer"] = true;
        }
    }
    
    let results = [];
    let matchCount = 0, diffCount = 0, missingInBilling = 0;
    
    // ===== 1. الحاويات من التقرير =====
    for (let cno in containerMap) {
        let c = containerMap[cno];
        let programValue = c["Net"];
        let inBilling = billingData[cno] !== undefined;
        
        // استبعاد فقط إذا: أيام البرنامج = 0 وليس في الملف
        if (programValue === 0 && !inBilling) continue;
        
        let billingValue = inBilling ? billingData[cno] : 0;
        let diff = programValue - billingValue;
        
        if (!inBilling) missingInBilling++;
        else if (diff === 0) matchCount++;
        else diffCount++;
        
        results.push({
            "Container No.": cno,
            "Line ID": c["Line ID"],
            "Size": c["Size"],
            "Type": c["Type"],
            "Is Reefer": c["Is Reefer"],
            "Program Days": programValue,
            "Billing Days": billingValue,
            "Difference": diff,
            "Status": !inBilling ? "غير موجود في الملف" : (diff === 0 ? "متطابق" : "مختلف")
        });
    }
    
    // ===== 2. الحاويات الموجودة في الملف فقط (غير موجودة في البرنامج) =====
    for (let cno in billingData) {
        if (containerMap[cno]) continue; // تمت معالجتها في الحلقة الأولى
        
        let billingValue = billingData[cno];
        if (billingValue === 0) continue;
        
        diffCount++;
        results.push({
            "Container No.": cno,
            "Line ID": "—",
            "Size": "—",
            "Type": "—",
            "Is Reefer": false,
            "Program Days": 0,
            "Billing Days": billingValue,
            "Difference": -billingValue,
            "Status": "غير موجود في البرنامج"
        });
    }
    
    return {
        results: results,
        diffResults: results.filter(r => r.Status !== "متطابق"),
        matchCount: matchCount,
        diffCount: diffCount,
        missingInBilling: missingInBilling,
        totalCompared: results.length
    };
}

// ============================================================
// 🔑 إعداد GitHub Token
// ============================================================
function setupGitHubToken() {
    let currentToken = localStorage.getItem("github_token") || "";
    
    let message = "🔑 إعداد GitHub Token\n\n";
    if (currentToken) {
        message += "يوجد رمز محفوظ حالياً.\n";
        message += "هل تريد استبداله؟\n\n";
        message += "اضغط OK لإدخال رمز جديد، أو Cancel للاحتفاظ بالحالي.";
        if (!confirm(message)) {
            return;
        }
    }
    
    let token = prompt("الصق GitHub Personal Access Token هنا:\n\n(يبدأ بـ github_pat_ أو ghp_)");
    
    if (!token) return;
    
    token = token.trim();
    if (!token.startsWith("github_pat_") && !token.startsWith("ghp_")) {
        alert("⚠️ الرمز غير صالح. يجب أن يبدأ بـ github_pat_ أو ghp_");
        return;
    }
    
    localStorage.setItem("github_token", token);
    alert("✅ تم حفظ الرمز بنجاح!");
    console.log("✅ GitHub Token محفوظ");
}

// ربط الزر
document.addEventListener("DOMContentLoaded", function() {
    let btn = document.getElementById("setTokenBtn");
    if (btn) {
        btn.addEventListener("click", setupGitHubToken);
    }
});

// ============================================================
// 📤 رفع الملف إلى GitHub
// ============================================================
async function saveFileToGitHub() {
    // ===== 1. الإعدادات =====
    const GITHUB_OWNER = "markingdchc";
    const GITHUB_REPO = "marking.dchc";
    const GITHUB_BRANCH = "main";
    const UPLOAD_FOLDER = "uploads";
    
    // ===== 2. التحقق من الرمز =====
    const token = localStorage.getItem("github_token");
    if (!token) {
        console.warn("⚠️ لا يوجد GitHub Token.");
        showUploadNotification("warning", "⚠️ لا يوجد توكن", "يرجى إعداد GitHub Token أولاً.");
        return { success: false, error: "لا يوجد توكن" };
    }
    
    // ===== 3. التحقق من وجود ملف محفوظ =====
    const fileData = localStorage.getItem("savedExcelFile");
    const originalFileName = localStorage.getItem("savedExcelFileName");
    
    if (!fileData || !originalFileName) {
        console.warn("⚠️ لا يوجد ملف محفوظ.");
        return { success: false, error: "لا يوجد ملف" };
    }
    
    // ===== 4. 🆕 فحص الحقول قبل الرفع =====
    try {
        const binaryString = atob(fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const workbook = XLSX.read(bytes, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 4 });
        
        if (rows.length === 0) {
            console.log("⏭️ الملف فارغ، لا يمكن الرفع");
            return { success: false, error: "الملف فارغ" };
        }
        
        // تحديد نوع الملف
        const keys = Object.keys(rows[0]);
        const isFinalout = keys.some(k => k.trim() === "Unit Nbr") && 
                          !keys.some(k => k.trim() === "Equip ID");
        
        // استدعاء دالة الفحص
        const fieldCheck = checkExcelFields(rows, isFinalout ? "finalout" : "main");
        
        if (!fieldCheck.valid) {
            console.log("⏭️ تم تخطي الرفع - حقول ناقصة:", fieldCheck.missing);
            return { success: false, error: "الحقول ناقصة" };
        }
        
        console.log("✅ فحص الحقول نجح - سيتم الرفع");
        
    } catch (err) {
        console.error("❌ فشل فحص الملف:", err);
        return { success: false, error: "فشل فحص الملف" };
    }
    
    // ===== 5. حماية من الاستدعاء المتكرر =====
    if (_isUploadingToGitHub) {
        console.log("⏭️ تم تخطي الرفع (طلب سابق قيد التنفيذ)");
        return { success: false, error: "طلب مرفوع بالفعل" };
    }
    _isUploadingToGitHub = true;
    
    try {
        // ===== 6. استخراج بيانات الرحلة =====
        // ===== 6. استخراج بيانات الرحلة (مع Fallback من containersMap) =====
        let carrierName = document.getElementById("headerCarrierName")?.innerText?.trim() || "";
        let shippingDate = document.getElementById("headerShippingDate")?.innerText?.trim() || "";
        let lineId = document.getElementById("headerLineId")?.innerText?.trim() || "";
        let orderNumber = document.getElementById("headerOrderNumber")?.innerText?.trim() || "";
        let lineOp = document.getElementById("headerLineOp")?.innerText?.trim() || "";
        
        if (orderNumber === "—") orderNumber = "";
        if (lineOp === "—") lineOp = "";
        
        // ===== 🆕 Fallback من containersMap إذا كانت الرؤوس فارغة =====
        if (!carrierName || carrierName === "—" || carrierName === "UnknownShip" ||
            !lineId || lineId === "—" || lineId === "UnknownLine" ||
            !shippingDate || shippingDate === "—") {
            
            for (let [id, container] of containersMap.entries()) {
                // اجمع كل المصادر المحتملة
                let sources = [];
                if (container.exprtList && container.exprtList.length > 0) sources.push(container.exprtList[0]);
                if (container.trshpList && container.trshpList.length > 0) sources.push(container.trshpList[0]);
                if (container.strge) sources.push(container.strge);
                if (container.imprt) sources.push(container.imprt);
                if (container.trshpReturn) sources.push(container.trshpReturn);
                
                for (let src of sources) {
                    if (!carrierName || carrierName === "—" || carrierName === "UnknownShip") {
                        let name = src["O/B Carrier Name"] || src["I/B Carrier Name"];
                        if (name && name.trim() !== "") carrierName = name.trim();
                    }
                    if (!lineId || lineId === "—" || lineId === "UnknownLine") {
                        let lid = src["Line ID"];
                        if (lid && lid.trim() !== "") lineId = lid.trim();
                    }
                    if (!shippingDate || shippingDate === "—") {
                        let atd = src["O/B Carrier ATD"] || src["O/B Carrier ATA"] || src["I/B Carrier ATA"];
                        if (atd && atd.trim() !== "") {
                            let converted = convertDate(atd);
                            if (converted) shippingDate = converted;
                        }
                    }
                }
                
                // إذا اكتملت كل القيم، اخرج من الحلقة
                if (carrierName && carrierName !== "—" && carrierName !== "UnknownShip" &&
                    lineId && lineId !== "—" && lineId !== "UnknownLine" &&
                    shippingDate && shippingDate !== "—") {
                    break;
                }
            }
        }
        
        // ===== Fallback الأخير =====
        if (!carrierName || carrierName === "—") carrierName = "UnknownShip";
        if (!lineId || lineId === "—") lineId = "UnknownLine";
        if (!shippingDate || shippingDate === "—") {
            let today = new Date();
            shippingDate = today.getFullYear() + "/" + 
                           String(today.getMonth() + 1).padStart(2, '0') + "/" + 
                           String(today.getDate()).padStart(2, '0');
        }
        
        // ===== 7. تنظيف الأسماء =====
        const cleanName = (str) => str
            .replace(/\s+/g, "_")
            .replace(/[^\w\u0600-\u06FF\-\.]/g, "")
            .substring(0, 50);
        
        const safeCarrier = cleanName(carrierName);
        const safeLine = cleanName(lineId);
        const safeDate = shippingDate.replace(/\//g, "-").replace(/[^\d\-]/g, "");
        
        // ===== 8. بناء اسم الملف =====
        const extension = originalFileName.split('.').pop() || "xlsx";
        let parts = [];
        
        if (orderNumber && orderNumber !== "") {
            parts.push(cleanName(orderNumber));
            if (lineOp && lineOp !== "") parts.push(cleanName(lineOp));
        } else {
            parts.push(safeCarrier);
            parts.push(safeLine);
            parts.push(safeDate);
        }
        
        const newFileName = `${parts.join("_")}.${extension}`;
        const filePath = UPLOAD_FOLDER ? `${UPLOAD_FOLDER}/${newFileName}` : newFileName;
        
        console.log("📤 جاري رفع الملف:", filePath);
        
        const footer = document.getElementById("footerMsg");
        if (footer) {
            footer.innerHTML = `⏳ جاري رفع الملف إلى GitHub: <strong>${newFileName}</strong>...`;
            footer.style.color = "#17a2b8";
        }
        
        // ===== 9. التحقق من وجود الملف =====
        const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
        
        let existingSha = null;
        const checkResponse = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json"
            }
        });
        
        if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            existingSha = existingFile.sha;
            console.log("🔄 الملف موجود، سيتم التحديث");
        } else if (checkResponse.status === 404) {
            console.log("🆕 ملف جديد، سيتم الإنشاء");
        } else {
            const err = await checkResponse.json();
            throw new Error(`فشل التحقق: ${err.message}`);
        }
        
        // ===== 10. رفع الملف =====
        const body = {
            message: existingSha 
                ? `Update ${newFileName} - ${new Date().toLocaleString()}` 
                : `Upload ${newFileName} - ${new Date().toLocaleString()}`,
            content: fileData,
            branch: GITHUB_BRANCH
        };
        
        if (existingSha) body.sha = existingSha;
        
        const uploadResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        
        if (!uploadResponse.ok) {
            const err = await uploadResponse.json();
            throw new Error(err.message || "فشل الرفع");
        }
        
        const result = await uploadResponse.json();
        const fileUrl = result.content.html_url;
        
        console.log("✅ تم الرفع بنجاح:", fileUrl);
        
        // ===== 11. عرض النتيجة =====
        if (footer) {
            footer.innerHTML = `✅ تم رفع الملف: <a href="${fileUrl}" target="_blank" style="color:#28a745;font-weight:bold;">${newFileName}</a>`;
            footer.style.color = "#28a745";
        }
        
        showUploadNotification(
            "success",
            "تم الرفع بنجاح",
            `تم رفع الملف:\n${newFileName}`,
            fileUrl
        );
        
		        // 🆕 نسخ الملف إلى الأرشيف تلقائياً
        if (typeof autoArchiveContainerFile === 'function') {
            setTimeout(() => {
                autoArchiveContainerFile().then(result => {
                    if (result.success) {
                        console.log("✅ [الأرشيف] تم النسخ:", result.path);
                        if (typeof notifyArchiveCreated === 'function') {
                            let folderName = result.path.split('/').slice(-2, -1)[0];
                            notifyArchiveCreated(folderName);
                        }
                    }
                });
            }, 500);
        }
        
        return { success: true, url: fileUrl, fileName: newFileName };
		
        return { success: true, url: fileUrl, fileName: newFileName };
        
    } catch (error) {
        console.error("❌ خطأ في الرفع:", error);
        
        const footer = document.getElementById("footerMsg");
        if (footer) {
            footer.innerHTML = `❌ فشل رفع الملف: ${error.message}`;
            footer.style.color = "#dc3545";
        }
        
        showUploadNotification(
            "error",
            "فشل الرفع",
            `تعذّر رفع الملف.\n\nالسبب: ${error.message}`
        );
        
        if (error.message.includes("Bad credentials") || error.message.includes("401")) {
            localStorage.removeItem("github_token");
            if (typeof updateTokenButtonVisibility === "function") {
                updateTokenButtonVisibility();
            }
        }
        
        return { success: false, error: error.message };
        
    } finally {
        _isUploadingToGitHub = false;
        console.log("🔓 تم إلغاء قفل الرفع");
    }
}

// ============================================================
// 📂 إعدادات GitHub
// ============================================================
const GH_OWNER = "markingdchc";
const GH_REPO = "marking.dchc";
const GH_BRANCH = "main";
const GH_UPLOAD_FOLDER = "uploads"; // مجلد الملفات

// ============================================================
// 📂 جلب قائمة الملفات من GitHub
// ============================================================
let ghFilesList = [];

async function loadGitHubFileList() {
    const token = localStorage.getItem("github_token");
    const statusEl = document.getElementById("ghStatus");
    
    if (statusEl) statusEl.textContent = "⏳ جاري جلب الملفات...";
    
    const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_UPLOAD_FOLDER}?ref=${GH_BRANCH}`;
    
    try {
        const headers = { "Accept": "application/vnd.github+json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const response = await fetch(apiUrl, { headers });
        
        if (response.status === 404) {
            console.warn("⚠️ مجلد uploads غير موجود في المستودع");
            if (statusEl) statusEl.textContent = "⚠️ مجلد uploads غير موجود";
            return [];
        }
        
        if (!response.ok) {
            throw new Error(`فشل الجلب: ${response.status}`);
        }
        
        const files = await response.json();
        if (!Array.isArray(files)) return [];
        
        // فلترة ملفات Excel
        const excelFiles = files.filter(f => 
            f.type === "file" && /\.(xlsx|xls)$/i.test(f.name)
        );
        
        // استخراج البيانات من أسماء الملفات
        const parsedFiles = [];
        for (const file of excelFiles) {
            const parsed = parseGitHubFileName(file.name);
            if (parsed) {
                parsedFiles.push({
                    ...parsed,
                    path: file.path,
                    name: file.name,
                    download_url: file.download_url,
                    sha: file.sha
                });
            }
        }
        
        console.log(`✅ تم العثور على ${parsedFiles.length} ملف Excel`, parsedFiles);
        
        if (statusEl) {
            statusEl.textContent = `✅ ${parsedFiles.length} ملف متوفر`;
            statusEl.style.color = "#28a745";
        }
        
        return parsedFiles;
        
    } catch (error) {
        console.error("❌ خطأ في جلب الملفات:", error);
        if (statusEl) {
            statusEl.textContent = `❌ فشل الجلب: ${error.message}`;
            statusEl.style.color = "#dc3545";
        }
        return [];
    }
}

// ============================================================
// 🔍 استخراج بيانات من اسم الملف
// الصيغة: ShipName_Line_YYYY-MM-DD.xlsx
// ============================================================
function parseGitHubFileName(fileName) {
    // إزالة الامتداد
    const nameWithoutExt = fileName.replace(/\.(xlsx|xls)$/i, "");
    
    // ===== محاولة 1: صيغة FINALOUT =====
    // الصيغة: OrderNumber_LineOp (مثل FINALOUT202602_CMA)
    // ملاحظة: Order Number يبدأ بـ FINALOUT
    const finaloutMatch = nameWithoutExt.match(/^(FINALOUT\w+)_([A-Z0-9]+)$/i);
    
    if (finaloutMatch) {
        return {
            shipName: finaloutMatch[1],  // Order Number
            line: finaloutMatch[2],      // Line Op
            date: "",                    // لا يوجد تاريخ
            orderNumber: finaloutMatch[1],
            lineOp: finaloutMatch[2],
            isFinalout: true,
            fullFileName: fileName
        };
    }
    
    // ===== محاولة 2: صيغة الملف العادي =====
    // الصيغة: ShipName_Line_YYYY-MM-DD
    const normalMatch = nameWithoutExt.match(/^(.+?)_([A-Z0-9]+)_(\d{4}-\d{2}-\d{2})$/);
    
    if (normalMatch) {
        return {
            shipName: normalMatch[1].replace(/_/g, " ").trim(),
            line: normalMatch[2].trim(),
            date: normalMatch[3],
            orderNumber: "",
            lineOp: "",
            isFinalout: false,
            fullFileName: fileName
        };
    }
    
    // ===== محاولة 3: صيغة موسعة (مع Order Number و Line Op) =====
    // ShipName_Line_Date_OrderNumber_LineOp
    const extendedMatch = nameWithoutExt.match(/^(.+?)_([A-Z0-9]+)_(\d{4}-\d{2}-\d{2})_(.+)$/);
    
    if (extendedMatch) {
        let shipName = extendedMatch[1].replace(/_/g, " ").trim();
        let line = extendedMatch[2].trim();
        let date = extendedMatch[3];
        let extras = extendedMatch[4];
        
        // استخراج Order Number و Line Op
        let extraParts = extras.split("_").filter(p => p.trim() !== "");
        let orderNumber = "";
        let lineOp = "";
        
        if (extraParts.length >= 2) {
            orderNumber = extraParts[0];
            lineOp = extraParts[extraParts.length - 1];
        } else if (extraParts.length === 1) {
            orderNumber = extraParts[0];
        }
        
        return {
            shipName: shipName,
            line: line,
            date: date,
            orderNumber: orderNumber,
            lineOp: lineOp,
            isFinalout: false,
            fullFileName: fileName
        };
    }
    
    console.warn("⚠️ لم يتم التعرف على صيغة اسم الملف:", fileName);
    return null;
}

// ============================================================
// 📋 ملء القوائم المنسدلة
// ============================================================
async function initGitHubFilesPanel() {
    ghFilesList = await loadGitHubFileList();
    
    // 🔐 فلترة الملفات حسب خطوط المستخدم
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user && user.role !== 'admin' && !user.lineIds.includes('*')) {
        const before = ghFilesList.length;
        ghFilesList = ghFilesList.filter(f => user.lineIds.includes(f.line));
        console.log(`🔐 فلترة GitHub: ${before} → ${ghFilesList.length} (الخطوط المسموحة: ${user.lineIds.join(', ')})`);
    }
    
    const shipSelect = document.getElementById("ghShipSelect");
    if (!shipSelect) return;
    
    shipSelect.innerHTML = '<option value="">-- اختر السفينة --</option>';
    
    // جمع القيم الفريدة من shipName
    const ships = [...new Set(ghFilesList.map(f => f.shipName))].sort();
    ships.forEach(ship => {
        const opt = document.createElement("option");
        opt.value = ship;
        opt.textContent = ship;
        shipSelect.appendChild(opt);
    });
    
    document.getElementById("ghLineSelect").innerHTML = '<option value="">-- اختر الخط --</option>';
    document.getElementById("ghDateSelect").innerHTML = '<option value="">-- اختر التاريخ --</option>';
    
    console.log(`📋 تم تحميل ${ships.length} سفينة`, ships);
}

function updateLineDropdown() {
    const ship = document.getElementById("ghShipSelect").value;
    const lineSelect = document.getElementById("ghLineSelect");
    const dateSelect = document.getElementById("ghDateSelect");
    
    lineSelect.innerHTML = '<option value="">-- اختر الخط --</option>';
    dateSelect.innerHTML = '<option value="">-- اختر التاريخ --</option>';
    
    if (!ship) return;
    
    // 🔐 فلترة الخطوط حسب صلاحيات المستخدم
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    let lines = [...new Set(
        ghFilesList.filter(f => f.shipName === ship).map(f => f.line)
    )].sort();
    
    if (user && user.role !== 'admin' && !user.lineIds.includes('*')) {
        lines = lines.filter(line => user.lineIds.includes(line));
    }
    
    lines.forEach(line => {
        const opt = document.createElement("option");
        opt.value = line;
        opt.textContent = line;
        lineSelect.appendChild(opt);
    });
    
    // 🔐 إذا كان هناك خط واحد فقط، اختره تلقائياً
    if (lines.length === 1) {
        lineSelect.value = lines[0];
        updateDateDropdown();
    }
}

function updateDateDropdown() {
    const ship = document.getElementById("ghShipSelect").value;
    const line = document.getElementById("ghLineSelect").value;
    const dateSelect = document.getElementById("ghDateSelect");
    
    dateSelect.innerHTML = '<option value="">-- اختر التاريخ --</option>';
    
    if (!ship || !line) return;
    
    // 🔐 تأكد من أن الخط مسموح للمستخدم
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user && user.role !== 'admin' && !user.lineIds.includes('*')) {
        if (!user.lineIds.includes(line)) {
            console.warn('⛔ الخط غير مسموح:', line);
            return;
        }
    }
    
    const matchingFiles = ghFilesList
        .filter(f => f.shipName === ship && f.line === line)
        .sort((a, b) => {
            if (a.isFinalout && !b.isFinalout) return -1;
            if (!a.isFinalout && b.isFinalout) return 1;
            return (b.date || "").localeCompare(a.date || "");
        });
    
    // ✅ ✅ ✅ الجزء المُضاف ✅ ✅ ✅
    const seen = new Set();
    matchingFiles.forEach(f => {
        let key = (f.date || "") + "|" + (f.orderNumber || "") + "|" + (f.lineOp || "");
        if (seen.has(key)) return;
        seen.add(key);
        
        const opt = document.createElement("option");
        opt.value = f.fullFileName;
        
        let displayText = "";
        if (f.isFinalout) {
            displayText = "📋 " + f.orderNumber + " | 🚢 " + f.lineOp;
        } else {
            displayText = "📅 " + f.date;
            if (f.orderNumber) displayText += " | 📋 " + f.orderNumber;
            if (f.lineOp) displayText += " | 🚢 " + f.lineOp;
        }
        
        opt.textContent = displayText;
        opt.dataset.date = f.date || "";
        opt.dataset.orderNumber = f.orderNumber || "";
        opt.dataset.lineOp = f.lineOp || "";
        opt.dataset.isFinalout = f.isFinalout ? "true" : "false";
        opt.dataset.fullFileName = f.fullFileName;
        
        dateSelect.appendChild(opt);
    });
}  // ← ← ← قوس إغلاق الدالة (كان مفقوداً!)

// ============================================================
// 📥 تحميل الملف المختار من GitHub
// ============================================================
let _downloadingFromGitHub = false; // ← لمنع رفع تلقائي مرة أخرى

async function downloadSelectedGitHubFile() {
    const ship = document.getElementById("ghShipSelect").value;
    const line = document.getElementById("ghLineSelect").value;
    const dateSelect = document.getElementById("ghDateSelect");
    const selectedOption = dateSelect.options[dateSelect.selectedIndex];
    const footer = document.getElementById("footerMsg");
    
    if (!ship || !line || !dateSelect.value) {
        alert("⚠️ يرجى اختيار السفينة والخط والتاريخ");
        return;
    }
    
    // استخراج القيم من dataset
    const fullFileName = selectedOption.dataset.fullFileName || "";
    
    // البحث عن الملف المطابق
    const match = ghFilesList.find(f => f.fullFileName === fullFileName);
    
    if (!match) {
        alert("⚠️ لم يتم العثور على الملف المطابق");
        return;
    }
       
    if (footer) {
        footer.innerHTML = `⏳ جاري تحميل: <strong>${match.name}</strong>...`;
        footer.style.color = "#17a2b8";
    }
    
    try {
        // ===== 🆕 استخدام download_url مباشرة (يدعم الملفات الكبيرة) =====
        const downloadUrl = match.download_url;
        
        if (!downloadUrl) {
            throw new Error("لا يوجد رابط تحميل للملف");
        }
        
        console.log("📥 جاري تحميل الملف من:", downloadUrl);
        
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
            throw new Error(`فشل التحميل: ${response.status}`);
        }
        
        // ===== 🆕 قراءة كـ arrayBuffer مباشرة (بدون base64) =====
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        console.log("📦 حجم الملف:", bytes.length, "بايت");
        console.log("📦 أول 8 بايت:", Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        // ===== منع الرفع التلقائي =====
        _downloadingFromGitHub = true;
        
        // ===== 🆕 حفظ في localStorage (بشكل آمن للملفات الكبيرة) =====
        try {
            let binary = '';
            let chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
            }
            let base64Data = btoa(binary);
            saveFileToLocalStorage(base64Data, match.name);
        } catch(e) {
            console.warn("⚠️ فشل حفظ الملف:", e.message);
        }
        
        // تحديث عرض اسم الملف
        updateFileNameDisplay(match.name);
        
        // ===== 🆕 استدعاء معالجة مباشرة من bytes =====
        processExcelFromBytes(bytes, match.name);
        
        console.log("✅ تم تحميل الملف من GitHub:", match.name);
        
        if (footer) {
            footer.innerHTML = `✅ تم تحميل الملف من GitHub: <strong>${match.name}</strong>`;
            footer.style.color = "#28a745";
        }
        
        // إعادة تفعيل الرفع التلقائي بعد 5 ثوانٍ
        setTimeout(() => { _downloadingFromGitHub = false; }, 5000);
        
    } catch (error) {
        console.error("❌", error);
        _downloadingFromGitHub = false;
        
        if (footer) {
            footer.innerHTML = `❌ فشل التحميل: ${error.message}`;
            footer.style.color = "#dc3545";
        }
        alert(`❌ فشل التحميل: ${error.message}`);
    }
}

// ============================================================
// 🎯 تهيئة اللوحة عند فتح الصفحة
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    // تهيئة اللوحة بعد 2 ثانية (حتى يتم تحميل الـ Token)
    setTimeout(async () => {
        await initGitHubFilesPanel();
    }, 2000);
    
    // ربط الأحداث
    setTimeout(() => {
        const shipSelect = document.getElementById("ghShipSelect");
        const lineSelect = document.getElementById("ghLineSelect");
        const downloadBtn = document.getElementById("ghDownloadBtn");
        const refreshBtn = document.getElementById("ghRefreshBtn");
        
        if (shipSelect) shipSelect.addEventListener("change", updateLineDropdown);
        if (lineSelect) lineSelect.addEventListener("change", updateDateDropdown);
        if (downloadBtn) downloadBtn.addEventListener("click", downloadSelectedGitHubFile);
        if (refreshBtn) refreshBtn.addEventListener("click", async function() {
            await initGitHubFilesPanel();
        });
    }, 100);
});

// ============================================================
// 🔑 إظهار/إخفاء زر التوكن حسب حالته
// ============================================================
function updateTokenButtonVisibility() {
    const btn = document.getElementById("setTokenBtn");
    if (!btn) return;
    
    const token = localStorage.getItem("github_token");
    
    if (token && token.trim() !== "") {
        btn.style.display = "none";       // التوكن موجود → إخفاء
    } else {
        btn.style.display = "inline-block"; // لا يوجد → إظهار
    }
}

// ============================================================
// 🔑 إعداد التوكن
// ============================================================
function setupGitHubToken() {
    let currentToken = localStorage.getItem("github_token") || "";
    
    if (currentToken) {
        if (!confirm("يوجد رمز محفوظ حالياً.\nهل تريد استبداله؟")) return;
    }
    
    let token = prompt("الصق GitHub Personal Access Token هنا:\n\n(يبدأ بـ github_pat_ أو ghp_)");
    if (!token) return;
    
    token = token.trim();
    if (!token.startsWith("github_pat_") && !token.startsWith("ghp_")) {
        alert("⚠️ الرمز غير صالح");
        return;
    }
    
    localStorage.setItem("github_token", token);
    alert("✅ تم حفظ الرمز بنجاح!");
    
    // 🆕 إخفاء الزر فوراً بعد الحفظ
    updateTokenButtonVisibility();
}

// ============================================================
// 🎯 تفعيل الزر عند تحميل الصفحة
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    // تحديث حالة الزر عند فتح الصفحة
    updateTokenButtonVisibility();
    
    // ربط الزر
    const btn = document.getElementById("setTokenBtn");
    if (btn) {
        btn.addEventListener("click", setupGitHubToken);
    }
});

// ============================================================
// 🔔 دالة إظهار الإشعارات (نجاح / فشل / تحذير)
// ============================================================
function showUploadNotification(type, title, message, linkUrl) {
    // إزالة أي إشعار موجود
    let existing = document.getElementById("uploadNotification");
    if (existing) existing.remove();
    
    // الألوان حسب النوع
    let colors = {
        success: { bg: "#28a745", icon: "✅" },
        error:   { bg: "#dc3545", icon: "❌" },
        warning: { bg: "#ffc107", icon: "⚠️" },
        info:    { bg: "#17a2b8", icon: "ℹ️" }
    };
    
    let c = colors[type] || colors.info;
    
    // بناء الإشعار
    let notif = document.createElement("div");
    notif.id = "uploadNotification";
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 320px;
        max-width: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.25);
        z-index: 999999;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
        direction: rtl;
        font-family: 'Segoe UI', Tahoma, sans-serif;
    `;
    
    // الرأس
    let header = document.createElement("div");
    header.style.cssText = `
        background: ${c.bg};
        color: white;
        padding: 12px 18px;
        font-weight: bold;
        font-size: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <span>${c.icon} ${title}</span>
        <span style="cursor:pointer;font-size:22px;line-height:1;" onclick="this.closest('#uploadNotification').remove()">×</span>
    `;
    
    // المحتوى
    let body = document.createElement("div");
    body.style.cssText = `
        padding: 15px 18px;
        font-size: 13px;
        color: #333;
        line-height: 1.6;
        white-space: pre-line;
    `;
    body.textContent = message;
    
    // رابط GitHub (اختياري)
    if (linkUrl) {
        let linkDiv = document.createElement("div");
        linkDiv.style.cssText = "margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;";
        linkDiv.innerHTML = `
            <a href="${linkUrl}" target="_blank" style="
                display: inline-block;
                background: ${c.bg};
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                font-size: 12px;
            ">🔗 فتح الملف على GitHub</a>
        `;
        body.appendChild(linkDiv);
    }
    
    // شريط التقدم
    let progress = document.createElement("div");
    progress.style.cssText = `
        height: 4px;
        background: ${c.bg};
        width: 100%;
        animation: progressBar 5s linear forwards;
    `;
    
    notif.appendChild(header);
    notif.appendChild(body);
    notif.appendChild(progress);
    
    document.body.appendChild(notif);
    
    // إزالة تلقائية بعد 5 ثوان
    setTimeout(() => {
        if (notif && notif.parentNode) {
            notif.style.animation = "slideOut 0.3s ease-in";
            setTimeout(() => notif.remove(), 300);
        }
    }, 5000);
}

// ============================================================
// 🎨 إضافة أنماط CSS للحركة
// ============================================================
(function addNotificationStyles() {
    if (document.getElementById("notifStyles")) return;
    let style = document.createElement("style");
    style.id = "notifStyles";
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(120%); opacity: 0; }
            to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to   { transform: translateX(120%); opacity: 0; }
        }
        @keyframes progressBar {
            from { width: 100%; }
            to   { width: 0%; }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================================
// 🧹 دالة تنظيف شاملة قبل تحميل ملف جديد
// ============================================================
function resetAllData() {
    console.log("🧹 بدء تنظيف جميع البيانات...");
    
    // ===== 1. مسح المصفوفات =====
    currentData1 = [];
    currentData2 = [];
    currentData3 = [];
    currentData4 = [];
    currentData5 = [];
    currentData6 = [];
    currentData7 = [];
    currentData8 = [];
    
    // ===== 2. مسح containersMap =====
    containersMap.clear();
    
    // ===== 3. مسح بطاقات الإجمالي والجداول =====
    for (let i = 1; i <= 8; i++) {
        let statsDiv = document.getElementById("statsTab" + i);
        if (statsDiv) {
            statsDiv.innerHTML = "";
            statsDiv.style.display = "none";
        }
        
        let tbody = document.getElementById("bodyTab" + i);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="30" style="text-align:center; padding:40px;">⏳ جاري تحميل البيانات...</td></tr>';
        }
        
        let filtersDiv = document.getElementById("filtersTab" + i);
        if (filtersDiv) filtersDiv.style.display = "none";
        
        let wrapperDiv = document.getElementById("wrapperTab" + i);
        if (wrapperDiv) wrapperDiv.style.display = "none";
    }
    
    // ===== 4. مسح الرؤوس =====
    let carrierNameSpan = document.getElementById("headerCarrierName");
    let shippingDateSpan = document.getElementById("headerShippingDate");
    let lineIdSpan = document.getElementById("headerLineId");
    let orderNumberSpan = document.getElementById("headerOrderNumber");
    let lineOpSpan = document.getElementById("headerLineOp");
    
    if (carrierNameSpan) carrierNameSpan.textContent = "—";
    if (shippingDateSpan) shippingDateSpan.textContent = "—";
    if (lineIdSpan) lineIdSpan.textContent = "—";
    if (orderNumberSpan) orderNumberSpan.textContent = "—";
    if (lineOpSpan) lineOpSpan.textContent = "—";
    
    // ===== 5. إعادة تعيين اسم السفينة =====
    if (typeof currentVesselName !== 'undefined') {
        currentVesselName = "";
    }
    
    console.log("✅ تم تنظيف جميع البيانات");
}

// ============================================================
// 🔐 فلترة البيانات حسب خطوط المستخدم
// ============================================================
function applyUserLineFilter() {
    if (typeof getCurrentUser !== 'function') return;
    
    const user = getCurrentUser();
    if (!user || user.role === 'admin' || user.lineIds.includes('*')) {
        console.log('👑 Admin - لا فلترة');
        return;
    }
    
    console.log('🔍 فلترة البيانات للخطوط:', user.lineIds);
    
    // دالة مساعدة
    const filterByLine = (arr) => {
        if (!Array.isArray(arr)) return arr;
        return arr.filter(item => {
            const lineId = item["Line ID"] || item["الخط"] || "";
            return user.lineIds.includes(lineId);
        });
    };
    
    // فلترة كل المصفوفات
    currentData1 = filterByLine(currentData1);
    currentData2 = filterByLine(currentData2);
    currentData3 = filterByLine(currentData3);
    currentData4 = filterByLine(currentData4);
    currentData5 = filterByLine(currentData5);
    currentData6 = filterByLine(currentData6);
    currentData7 = filterByLine(currentData7);
    currentData8 = filterByLine(currentData8);
    
    // فلترة containersMap
    for (let [id, container] of [...containersMap.entries()]) {
        if (!user.lineIds.includes(container.lineId)) {
            containersMap.delete(id);
        }
    }
    
    console.log('✅ تمت الفلترة. عدد الحاويات:', containersMap.size);
    
    // إعادة عرض الجداول
    try { renderTable1WithStats("bodyTab1", currentData1, "searchTab1", "typeTab1", "statsTab1"); } catch(e){}
    try { renderTable2("bodyTab2", currentData2, "searchTab2", "typeTab2", "statsTab2"); } catch(e){}
    try { renderTable3("bodyTab3", currentData3, "searchTab3", "typeTab3", "statsTab3"); } catch(e){}
    try { renderTable4("bodyTab4", currentData4, "searchTab4", "typeTab4", "statsTab4"); } catch(e){}
    try { renderTable5("bodyTab5", currentData5, "searchTab5", "typeTab5", "statsTab5"); } catch(e){}
    try { renderTable6("bodyTab6", currentData6, "searchTab6", "typeTab6", "statsTab6"); } catch(e){}
    try { renderTable7("bodyTab7", currentData7, "searchTab7", "typeTab7", "statsTab7"); } catch(e){}
}

// جعل الدالة متاحة عالمياً
window.applyUserLineFilter = applyUserLineFilter;
window.getCurrentUser = getCurrentUser;