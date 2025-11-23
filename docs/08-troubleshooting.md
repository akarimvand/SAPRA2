# 08 - عیبیابی و حل مشکلات

## مشکلات رایج و راهحلها

### 1. صفحه بارگذاری نمیشود

#### علائم:
- صفحه سفید نمایش داده میشود
- پیام خطا در console
- بارگذاری متوقف میشود

#### راهحلها:
```javascript
// بررسی console برای خطاها
console.log('Debug info:', window.processedData);

// رفرش کامل صفحه
// Ctrl+F5 یا Ctrl+Shift+R
```

#### بررسیهای اولیه:
1. بررسی اتصال اینترنت
2. بررسی دسترسی به فایلهای CSV
3. بررسی console مرورگر (F12)

### 2. دادهها بارگذاری نمیشوند

#### علائم:
- کارتها صفر نشان میدهند
- جدول خالی است
- پیام "No data" نمایش داده میشود

#### راهحلها:
```javascript
// بررسی وضعیت دادهها
window.checkDataStatus();

// بارگذاری مجدد دادهها
window.forceReloadData();
```

#### بررسیهای فایل CSV:
1. بررسی وجود فایلها در پوشه `dbcsv/`
2. بررسی فرمت UTF-8
3. بررسی header های CSV
4. بررسی عدم وجود کاراکترهای خاص

### 3. چارتها نمایش داده نمیشوند

#### علائم:
- جای خالی به جای چارت
- پیام "No data to display"
- خطای JavaScript

#### راهحلها:
```javascript
// بررسی بارگذاری amCharts
console.log('amCharts loaded:', typeof am5 !== 'undefined');

// پاکسازی و رندر مجدد چارتها
cleanupAllCharts();
renderOverviewCharts();
```

#### بررسیهای amCharts:
1. بررسی بارگذاری فایلهای amCharts
2. بررسی مسیر فایلها
3. بررسی دادههای ورودی چارت

### 4. صادرات Excel کار نمیکند

#### علائم:
- فایل دانلود نمیشود
- خطای JavaScript
- فایل خراب دانلود میشود

#### راهحلها:
```javascript
// بررسی بارگذاری SheetJS
console.log('XLSX loaded:', typeof XLSX !== 'undefined');

// تست صادرات ساده
const ws = XLSX.utils.aoa_to_sheet([['Test']]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Test');
XLSX.writeFile(wb, 'test.xlsx');
```

#### بررسیهای مرورگر:
1. بررسی تنظیمات دانلود مرورگر
2. بررسی مسدود نبودن popup ها
3. تست در مرورگر دیگر

### 5. جستجو کار نمیکند

#### علائم:
- نتایج جستجو نمایش داده نمیشود
- فیلتر اعمال نمیشود
- sidebar بروزرسانی نمیشود

#### راهحلها:
```javascript
// بررسی تابع جستجو
console.log('Search term:', searchTerm);
console.log('Filtered data:', performQuickSearch('test'));

// پاکسازی جستجو
document.getElementById('searchInput').value = '';
searchTerm = '';
renderSidebar();
```

### 6. مودالها باز نمیشوند

#### علائم:
- کلیک روی کارتها کاری نمیکند
- مودال نمایش داده نمیشود
- خطای Bootstrap

#### راهحلها:
```javascript
// بررسی Bootstrap
console.log('Bootstrap loaded:', typeof bootstrap !== 'undefined');

// باز کردن دستی مودال
const modal = new bootstrap.Modal(document.getElementById('itemDetailsModal'));
modal.show();
```

### 7. نمای موبایل مشکل دارد

#### علائم:
- layout شکسته است
- دکمهها کار نمیکنند
- scroll مشکل دارد

#### راهحلها:
```css
/* بررسی viewport */
<meta name="viewport" content="width=device-width, initial-scale=1">

/* تست responsive */
@media (max-width: 768px) {
    .test-element {
        background: red !important;
    }
}
```

## ابزارهای عیبیابی

### Console Commands
```javascript
// بررسی وضعیت کلی
window.checkDataStatus();

// بارگذاری مجدد
window.forceReloadData();

// نمایش toast تست
window.showToast('Test message', 'success');

// بررسی دادههای پردازش شده
console.log(window.processedData);

// بررسی آمار
console.log(aggregatedStats);
```

### Network Tab بررسی
1. باز کردن Developer Tools (F12)
2. رفتن به تب Network
3. رفرش صفحه
4. بررسی درخواستهای ناموفق (قرمز)

### Console Errors
```javascript
// خطاهای رایج و معنی آنها:

// "Cannot read property of undefined"
// راهحل: بررسی وجود متغیر قبل از استفاده

// "Failed to fetch"
// راهحل: بررسی مسیر فایل و دسترسی

// "Unexpected token in JSON"
// راهحل: بررسی فرمت CSV

// "Permission denied"
// راهحل: بررسی دسترسیهای فایل
```

## مشکلات عملکرد

### صفحه کند بارگذاری میشود
```javascript
// بهینهسازی بارگذاری
const optimizeLoading = () => {
    // کاهش timeout
    const timeout = 5000; // 5 ثانیه
    
    // lazy loading
    if (!activitiesLoaded) {
        // بارگذاری فقط در صورت نیاز
    }
    
    // debounce برای جستجو
    let searchTimeout;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(search, 300);
};
```

### حافظه زیاد مصرف میشود
```javascript
// پاکسازی چارتها
const cleanup = () => {
    // پاکسازی amCharts
    Object.values(amChartsRoots.disciplines).forEach(root => {
        if (root) root.dispose();
    });
    
    // پاکسازی event listeners
    element.removeEventListener('click', handler);
    
    // پاکسازی متغیرهای بزرگ
    largeDataArray = null;
};
```

## مشکلات مخصوص مرورگر

### Internet Explorer / Edge Legacy
```javascript
// Polyfill برای Promise
if (!window.Promise) {
    // بارگذاری polyfill
}

// Polyfill برای fetch
if (!window.fetch) {
    // استفاده از XMLHttpRequest
}
```

### Safari
```javascript
// مشکل backdrop-filter
.safari-fix {
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
}
```

### Firefox
```javascript
// مشکل scrollbar
.firefox-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #adb5bd #f1f3f5;
}
```

## لاگ سیستم

### فعالسازی Debug Mode
```javascript
// اضافه کردن به main.js
window.DEBUG_MODE = true;

const debugLog = (message, data) => {
    if (window.DEBUG_MODE) {
        console.log(`[SAPRA DEBUG] ${message}:`, data);
    }
};

// استفاده
debugLog('Data loaded', processedData);
```

### ذخیره لاگها
```javascript
const saveDebugInfo = () => {
    const debugInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        processedData: window.processedData,
        errors: window.errorLog || []
    };
    
    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], 
        { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sapra-debug.json';
    a.click();
};
```

## تماس با پشتیبانی

### اطلاعات مورد نیاز
1. نسخه مرورگر
2. سیستم عامل
3. پیام خطا دقیق
4. مراحل تکرار مشکل
5. اسکرین شات console

### اطلاعات تماس
- **توسعهدهنده**: امین ناصری کریموند
- **ایمیل**: akarimvand@gmail.com
- **تلفن**: +989366302800

### قبل از تماس
1. رفرش کامل صفحه (Ctrl+F5)
2. تست در مرورگر دیگر
3. بررسی اتصال اینترنت
4. بررسی console برای خطاها