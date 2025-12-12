# 07 - سفارشیسازی

## تغییر ظاهر

### رنگها و تم
در فایل `main.css`:
```css
:root {
    --primary-color: #2563eb;        /* رنگ اصلی */
    --success-color: #059669;        /* رنگ موفقیت */
    --warning-color: #d97706;        /* رنگ هشدار */
    --danger-color: #dc2626;         /* رنگ خطر */
    --background-color: #f8fafc;     /* رنگ پسزمینه */
}
```

### فونتها
```css
:root {
    --font-family-sans-serif: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    --font-family-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}
```

### اندازه کارتها
```css
.summary-card {
    min-height: 120px;  /* تغییر ارتفاع کارتها */
}
```

## تغییر متنها

### عناوین کارتها
در فایل `main.js` در تابع `renderSummaryCards()`:
```javascript
const originalCardsData = [
    { title: 'تکمیل شده', count: aggregatedStats.done, ... },
    { title: 'در انتظار', count: aggregatedStats.pending, ... },
    { title: 'باقیمانده', count: aggregatedStats.remaining, ... },
];
```

### عناوین ستونهای جدول
در تابع `renderDataTable()`:
```javascript
const columns = [
    { header: 'سیستم', accessor: 'system' },
    { header: 'زیرسیستم', accessor: 'subsystem' },
    // ...
];
```

## اضافه کردن فیلدهای جدید

### اضافه کردن ستون جدید به جدول
1. در CSV فیلد جدید اضافه کنید
2. در `_generateTableDataForView()` فیلد را پردازش کنید:
```javascript
return {
    // فیلدهای موجود
    newField: row["NEW_FIELD_NAME"]?.trim() || '',
};
```
3. در `renderDataTable()` ستون اضافه کنید:
```javascript
const columns = [
    // ستونهای موجود
    { header: 'فیلد جدید', accessor: 'newField' },
];
```

### اضافه کردن کارت جدید
در `renderSummaryCards()`:
```javascript
const newCard = {
    title: 'عنوان جدید',
    count: calculatedValue,
    baseClass: 'bg-white',
    icon: ICONS.YourIcon,
    iconWrapperBgClass: 'bg-primary-subtle',
    iconColorClass: 'text-primary',
    countColor: 'text-primary',
    titleColor: 'text-muted'
};
```

## تغییر منطق فیلتر

### تغییر منطق PENDING
در تابع `isPendingStatus()`:
```javascript
function isPendingStatus(status) {
    if (!status) return false;
    const s = status.trim();
    
    // منطق سفارشی شما
    if (s === 'YOUR_CUSTOM_STATUS') return true;
    
    // منطق موجود
    if (/^0[%]?$/.test(s)) return false;
    const pendingTexts = ['face_cleaning', 'fl/dry', 'hydrotest'];
    if (pendingTexts.includes(s.toLowerCase())) return true;
    return /\d/.test(s) || s.includes('%');
}
```

## اضافه کردن چارت جدید

### چارت amCharts
```javascript
function renderCustomChart() {
    const root = am5.Root.new("chartdiv");
    
    root.setThemes([
        am5themes_Animated.new(root)
    ]);
    
    const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
            panX: true,
            panY: true,
            wheelX: "panX",
            wheelY: "zoomX"
        })
    );
    
    // تنظیمات چارت
}
```

## تغییر فرمت صادرات

### سفارشیسازی Excel
در `handleExport()`:
```javascript
const dataToExport = dataToExportRaw.map(row => ({
    'سیستم': row.system,
    'زیرسیستم': row.subsystem,
    'رشته': row.discipline,
    'کل آیتمها': row.totalItems,
    'تکمیل شده': row.completed,
    'در انتظار': row.pending,
    'پیشرفت': `${row.statusPercent}%`,
    // فیلدهای جدید
    'فیلد سفارشی': row.customField
}));
```

## اضافه کردن زبان جدید

### فایل ترجمه
ایجاد فایل `translations.js`:
```javascript
const translations = {
    en: {
        'completed': 'Completed',
        'pending': 'Pending',
        'remaining': 'Remaining'
    },
    fa: {
        'completed': 'تکمیل شده',
        'pending': 'در انتظار',
        'remaining': 'باقیمانده'
    }
};

function t(key, lang = 'fa') {
    return translations[lang][key] || key;
}
```

## تغییر آیکونها

### اضافه کردن آیکون جدید
در `ICONS` object:
```javascript
const ICONS = {
    // آیکونهای موجود
    CustomIcon: '<i class="bi bi-your-icon" aria-hidden="true"></i>',
};
```

### استفاده از آیکونهای SVG
```javascript
const ICONS = {
    CustomSVG: `<svg width="16" height="16" viewBox="0 0 16 16">
        <path d="your-svg-path"/>
    </svg>`,
};
```

## تنظیمات پیشرفته

### تغییر timeout بارگذاری
در `loadAndProcessData()`:
```javascript
const response = await Promise.race([
    fetch(finalUrl),
    new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout`)), 15000) // 15 ثانیه
    )
]);
```

### تغییر تعداد نتایج جستجو
در `performQuickSearch()`:
```javascript
return results.slice(0, 50); // 50 نتیجه به جای 20
```

### تغییر debounce time
```javascript
// برای جستجو
setTimeout(() => {
    // منطق جستجو
}, 500); // 500ms به جای 300ms

// برای فیلتر
setTimeout(filterMainTable, 500); // 500ms
```

## CSS سفارشی

### اضافه کردن انیمیشن
```css
@keyframes customAnimation {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.custom-element {
    animation: customAnimation 2s infinite;
}
```

### Responsive breakpoints سفارشی
```css
@media (max-width: 1400px) {
    .custom-class {
        /* استایلهای سفارشی */
    }
}
```

## JavaScript سفارشی

### اضافه کردن event listener جدید
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // event listenerهای سفارشی
    document.getElementById('customButton').addEventListener('click', () => {
        // منطق سفارشی
    });
});
```

### اضافه کردن تابع utility
```javascript
// اضافه کردن به انتهای main.js
function customUtilityFunction(param) {
    // منطق سفارشی
    return result;
}

// در دسترس قرار دادن در window
window.customUtilityFunction = customUtilityFunction;
```