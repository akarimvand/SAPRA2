# 06 - مرجع API و توابع

## توابع اصلی JavaScript

### مدیریت دادهها

#### `loadAndProcessData()`
بارگذاری و پردازش تمام فایلهای CSV
```javascript
async function loadAndProcessData()
```
- **بازگشت**: Promise
- **کاربرد**: بارگذاری اولیه دادهها

#### `_aggregateStatsForView(view, systemMap, subSystemMap)`
محاسبه آمار برای نمای انتخاب شده
```javascript
function _aggregateStatsForView(view, systemMap, subSystemMap)
```
- **پارامترها**:
  - `view`: نمای انتخاب شده
  - `systemMap`: نقشه سیستمها
  - `subSystemMap`: نقشه زیرسیستمها
- **بازگشت**: Object حاوی آمار

### رندر کردن UI

#### `renderSummaryCards()`
رندر کردن کارتهای خلاصه
```javascript
function renderSummaryCards()
```

#### `renderDataTable()`
رندر کردن جدول اصلی
```javascript
function renderDataTable()
```

#### `renderSidebar()`
رندر کردن نوار کناری
```javascript
function renderSidebar()
```

#### `renderOverviewCharts()`
رندر کردن چارت کلی
```javascript
function renderOverviewCharts()
```

#### `renderDisciplineCharts()`
رندر کردن چارتهای رشتهای
```javascript
function renderDisciplineCharts()
```

### مدیریت مودالها

#### `populateDetailsModal(items, context, dataType)`
پر کردن مودال جزئیات
```javascript
function populateDetailsModal(items, context, dataType)
```
- **پارامترها**:
  - `items`: آرایه آیتمها
  - `context`: زمینه فیلتر
  - `dataType`: نوع داده ('items', 'punch', 'hold')

#### `loadActivitiesForTag(tagNo)`
بارگذاری فعالیتهای یک تگ
```javascript
async function loadActivitiesForTag(tagNo)
```
- **پارامترها**:
  - `tagNo`: شماره تگ آیتم

### فیلتر کردن دادهها

#### `filterDetailedItems(context)`
فیلتر آیتمهای جزئی
```javascript
function filterDetailedItems(context)
```
- **پارامترها**:
  - `context`: زمینه فیلتر
- **بازگشت**: آرایه آیتمهای فیلتر شده

#### `filterPunchItems(context)`
فیلتر پانچها
```javascript
function filterPunchItems(context)
```

#### `filterHoldItems(context)`
فیلتر نقاط نگهداری
```javascript
function filterHoldItems(context)
```

### صادرات

#### `handleExport()`
صادرات جدول اصلی به Excel
```javascript
function handleExport()
```

#### `handleDetailsExport()`
صادرات جزئیات مودال
```javascript
function handleDetailsExport()
```

#### `exportActivitiesToExcel()`
صادرات فعالیتها
```javascript
function exportActivitiesToExcel()
```

#### `handleDownloadAll()`
دانلود تمام فایلها
```javascript
async function handleDownloadAll()
```

### ابزارهای کمکی

#### `showToast(message, type, duration)`
نمایش پیام toast
```javascript
function showToast(message, type = 'info', duration = 3000)
```
- **پارامترها**:
  - `message`: متن پیام
  - `type`: نوع پیام ('success', 'error', 'info', 'warning')
  - `duration`: مدت نمایش (میلیثانیه)

#### `showProgress(percent)`
نمایش نوار پیشرفت
```javascript
function showProgress(percent)
```
- **پارامترها**:
  - `percent`: درصد پیشرفت (0-100)

#### `updateBreadcrumb(path)`
بروزرسانی breadcrumb
```javascript
function updateBreadcrumb(path)
```
- **پارامترها**:
  - `path`: آرایه مسیر

#### `performQuickSearch(query)`
جستجوی سریع
```javascript
function performQuickSearch(query)
```
- **پارامترها**:
  - `query`: متن جستجو
- **بازگشت**: آرایه نتایج

## متغیرهای سراسری

### دادههای اصلی
```javascript
let processedData = { systemMap: {}, subSystemMap: {}, allRawData: [] };
let selectedView = { type: 'all', id: 'all', name: 'All Systems' };
let aggregatedStats = { totalItems: 0, done: 0, pending: 0, punch: 0, hold: 0, remaining: 0 };
```

### دادههای جزئی
```javascript
let detailedItemsData = [];
let punchItemsData = [];
let holdPointItemsData = [];
let activitiesData = [];
let hosData = [];
```

### وضعیت UI
```javascript
let searchTerm = '';
let currentModalDataType = null;
let displayedItemsInModal = [];
let donutChartsInitialized = false;
```

## رویدادها (Events)

### رویدادهای DOM
- `DOMContentLoaded`: شروع برنامه
- `click`: مدیریت کلیکها
- `input`: مدیریت ورودیها
- `shown.bs.tab`: تغییر تب

### رویدادهای سفارشی
- `dataLoaded`: پس از بارگذاری دادهها
- `viewChanged`: تغییر نمای انتخاب شده
- `filterApplied`: اعمال فیلتر

## ثابتها (Constants)

### URLهای CSV
```javascript
const CSV_URL = GITHUB_BASE_URL + "DATA.CSV";
const ITEMS_CSV_URL = GITHUB_BASE_URL + "ITEMS.CSV";
const PUNCH_CSV_URL = GITHUB_BASE_URL + "PUNCH.CSV";
const HOLD_POINT_CSV_URL = GITHUB_BASE_URL + "HOLD_POINT.CSV";
const ACTIVITIES_CSV_URL = GITHUB_BASE_URL + "ACTIVITES.CSV";
```

### رنگهای چارت
```javascript
const COLORS_STATUS_CHARTJS = {
    done: 'rgba(76, 175, 80, 0.8)',
    pending: 'rgba(255, 166, 0, 0.8)',
    remaining: 'rgba(252, 95, 63, 0.8)'
};
```

### آیکونها
```javascript
const ICONS = {
    Collection: '<i class="bi bi-collection"></i>',
    Folder: '<i class="bi bi-folder"></i>',
    // ...
};
```

## نکات برنامهنویسی

### مدیریت حافظه
- استفاده از `cleanupAllCharts()` برای پاکسازی چارتها
- حذف event listenerهای غیرضروری
- استفاده از `will-change` برای بهینهسازی

### مدیریت خطا
- استفاده از try-catch برای عملیات async
- نمایش پیامهای خطا با toast
- fallback برای حالات خطا

### بهینهسازی
- lazy loading برای دادههای فعالیت
- debounce برای جستجو و فیلتر
- caching برای دادههای پردازش شده