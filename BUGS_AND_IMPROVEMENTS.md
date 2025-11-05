# گزارش باگها و بهبودهای SAPRA

## 🐛 باگهای شناسایی شده

### 1. باگ کریتیکال - متغیر activitiesModal تعریف نشده
**مکان**: `main.js` خط 349  
**توضیح**: متغیر `activitiesModal` قبل از تعریف استفاده شده  
**اولویت**: 🔴 بالا  
**راهکار**:
```javascript
// در تابع initModals() اضافه شود:
let activitiesModal = new bootstrap.Modal(document.getElementById('activitiesModal'), {});
```

### 2. باگ - URL خارجی در handleDownloadAll
**مکان**: `main.js` خط ~2800  
**توضیح**: از GitHub URL استفاده میکند به جای فایلهای محلی  
**اولویت**: 🟡 متوسط  
**راهکار**:
```javascript
const baseUrl = 'dbcsv/'; // به جای GitHub URL
```

### 3. باگ - تابع exportActivitiesToExcel تعریف نشده
**مکان**: `main.html` - Activities Modal  
**توضیح**: دکمه Export Excel تابعی را صدا میزند که وجود ندارد  
**اولویت**: 🟡 متوسط  
**راهکار**: تابع را در `main.js` اضافه کنید

### 4. باگ - Event Listener تکراری
**مکان**: `renderDataTable()` - خط ~2500  
**توضیح**: هر بار که جدول render میشود، listener جدید اضافه میشود  
**اولویت**: 🟡 متوسط  
**راهکار**: قبل از اضافه کردن، listener قبلی را remove کنید یا از event delegation استفاده کنید

### 5. باگ احتمالی - Memory Leak در چارتها
**مکان**: `renderDisciplineCharts()`  
**توضیح**: اگر چارتها dispose نشوند، memory leak ایجاد میشود  
**اولویت**: 🟢 پایین  
**راهکار**: همیشه قبل از ایجاد چارت جدید، چارت قبلی را dispose کنید (این کار انجام شده ولی باید تست شود)

---

## 💡 بهبودهای پیشنهادی

### عملکرد (Performance)

#### 1. Debounce برای جستجو
**مزیت**: کاهش تعداد render ها  
**پیاده سازی**:
```javascript
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// استفاده:
searchInput.addEventListener('input', debounce((e) => {
    searchTerm = e.target.value.toLowerCase();
    renderSidebar();
}, 300));
```

#### 2. Virtual Scrolling برای جداول بزرگ
**مزیت**: نمایش سریعتر جداول با هزاران ردیف  
**کتابخانه پیشنهادی**: `react-window` یا پیادهسازی دستی

#### 3. Lazy Loading برای چارتها
**مزیت**: بارگذاری سریعتر صفحه  
**وضعیت**: ✅ تا حدی پیادهسازی شده (Activities)

#### 4. Cache کردن نتایج فیلتر
**مزیت**: سرعت بیشتر در فیلتر مجدد  
**پیاده سازی**:
```javascript
const filterCache = new Map();
function getFilteredData(key) {
    if (filterCache.has(key)) return filterCache.get(key);
    const result = performFilter();
    filterCache.set(key, result);
    return result;
}
```

---

### تجربه کاربری (UX)

#### 1. Loading Skeleton
**مزیت**: تجربه بهتر در زمان بارگذاری  
**پیاده سازی**: استفاده از placeholder های متحرک به جای spinner

#### 2. Pagination برای جدول اصلی
**مزیت**: مدیریت بهتر دادههای زیاد  
**پیاده سازی**:
```javascript
const itemsPerPage = 50;
let currentPage = 1;
function renderPage(page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = tableData.slice(start, end);
    // render pageData
}
```

#### 3. Sort کردن ستونهای جدول
**مزیت**: یافتن سریعتر دادهها  
**پیاده سازی**: اضافه کردن icon sort به header ها

#### 4. Dark Mode
**مزیت**: راحتی چشم در شب  
**پیاده سازی**:
```javascript
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}
```

#### 5. Keyboard Navigation
**وضعیت**: ✅ تا حدی پیادهسازی شده  
**بهبود**: اضافه کردن navigation با Arrow keys در جدول

---

### کد (Code Quality)

#### 1. جداسازی به ماژولها
**مزیت**: نگهداری آسانتر  
**پیشنهاد**:
```
main.js → 
  - dataLoader.js
  - chartRenderer.js
  - tableManager.js
  - modalManager.js
  - utils.js
```

#### 2. استفاده بیشتر از async/await
**وضعیت**: ✅ در بخش data loading استفاده شده  
**بهبود**: تبدیل تمام Promise ها به async/await

#### 3. Error Boundary
**مزیت**: مدیریت بهتر خطاها  
**پیاده سازی**:
```javascript
window.addEventListener('error', (e) => {
    console.error('Global error:', e);
    showToast('خطایی رخ داد. لطفاً صفحه را رفرش کنید.', 'error');
});
```

#### 4. Type Checking با JSDoc
**مزیت**: کاهش باگها  
**پیاده سازی**:
```javascript
/**
 * @param {string} type - نوع view
 * @param {string} id - شناسه
 * @param {string} name - نام
 * @param {string|null} parentId - شناسه والد
 */
function handleNodeSelect(type, id, name, parentId = null) {
    // ...
}
```

---

### امنیت (Security)

#### 1. Sanitize کردن ورودیها
**اولویت**: 🔴 بالا  
**پیاده سازی**:
```javascript
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
```

#### 2. CSP Headers
**وضعیت**: ❌ حذف شده  
**پیشنهاد**: اضافه کردن CSP مناسب در سرور

#### 3. Input Validation
**اولویت**: 🟡 متوسط  
**پیاده سازی**: اعتبارسنجی تمام ورودیهای کاربر

---

## 📊 اولویت بندی

### فوری (این هفته)
1. ✅ رفع باگ activitiesModal
2. ✅ رفع باگ handleDownloadAll URL
3. ✅ اضافه کردن exportActivitiesToExcel

### کوتاه مدت (این ماه)
1. ✅ Debounce برای جستجو
2. ✅ رفع Event Listener تکراری
3. ✅ Sanitize کردن ورودیها
4. ✅ Loading Skeleton

### میان مدت (3 ماه)
1. ✅ Pagination
2. ✅ Sort کردن جدول
3. ✅ Dark Mode
4. ✅ جداسازی کد به ماژولها

### بلند مدت (6 ماه)
1. ✅ Virtual Scrolling
2. ✅ PWA (Progressive Web App)
3. ✅ Offline Support
4. ✅ بازنویسی با Framework (React/Vue)

---

## 🧪 تست های پیشنهادی

### Unit Tests
- تست توابع فیلتر
- تست توابع aggregation
- تست export functions

### Integration Tests
- تست بارگذاری CSV
- تست render چارتها
- تست modal ها

### E2E Tests
- تست کامل user flow
- تست responsive design
- تست browser compatibility

---

## 📝 نتیجه گیری

برنامه SAPRA یک پروژه خوب و کاربردی است اما نیاز به بهبودهایی دارد:

### نقاط قوت ✅
- معماری خوب و قابل فهم
- UI/UX مدرن و زیبا
- استفاده از amCharts برای چارتها
- قابلیتهای جامع

### نقاط ضعف ❌
- چند باگ کریتیکال
- عدم ماژولار بودن کد
- نبود تست
- مدیریت ضعیف خطاها

### توصیه نهایی 🎯
با رفع باگهای فوری و پیادهسازی بهبودهای کوتاه مدت، برنامه به یک محصول production-ready تبدیل میشود.

---

**تاریخ گزارش**: 2025  
**نسخه**: 2.0  
**توسعه دهنده**: امین ناصری کریموند