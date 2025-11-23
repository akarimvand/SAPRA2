# 02 - نصب و راهاندازی

## پیش‌نیازها
- وب سرور (Apache, Nginx, IIS یا هر سرور HTTP)
- مرورگر مدرن (Chrome, Firefox, Edge, Safari)
- دسترسی به فایلهای CSV

## مراحل نصب

### 1. دانلود فایلها
```bash
git clone https://github.com/username/SAPRA2.git
cd SAPRA2
```

### 2. کپی فایلها به سرور
- تمام فایلهای پروژه را در root directory سرور قرار دهید
- اطمینان حاصل کنید که پوشه `dbcsv/` در دسترس است

### 3. تنظیم فایلهای CSV
فایلهای زیر باید در پوشه `dbcsv/` قرار گیرند:
- `DATA.CSV` - داده‌های اصلی سیستم
- `ITEMS.CSV` - جزئیات آیتمها
- `PUNCH.CSV` - اطلاعات پانچها
- `HOLD_POINT.CSV` - نقاط نگهداری
- `HOS.CSV` - وضعیت فرمهای تحویل
- `ACTIVITES.CSV` - فعالیتهای آیتمها
- `TRANS.CSV` - اطلاعات انتقال

### 4. تنظیم کتابخانه amCharts
```bash
# کپی فایلهای amCharts به پوشه amcharts/
cp -r amcharts5/* amcharts/
```

### 5. تست نصب
- به آدرس `http://yourserver/index.html` مراجعه کنید
- وارد کردن اطلاعات ورود
- بررسی بارگذاری داده‌ها

## تنظیمات پیشرفته

### تغییر مسیر فایلهای CSV
در فایل `main.js`:
```javascript
const GITHUB_BASE_URL = "your-custom-path/";
```

### تنظیم Cache
برای بهبود عملکرد:
```javascript
// در main.js
const cacheBuster = '?t=' + Date.now();
```

### تنظیم CORS
اگر از دامنه متفاوت استفاده می‌کنید:
```apache
# .htaccess
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
```

## عیب‌یابی رایج

### خطای بارگذاری CSV
- بررسی مسیر فایلها
- بررسی دسترسی‌های فایل
- بررسی فرمت CSV

### مشکل نمایش چارت
- بررسی بارگذاری amCharts
- بررسی console برای خطاها
- بررسی داده‌های ورودی

### مشکل صادرات Excel
- بررسی بارگذاری SheetJS
- بررسی مرورگر (برخی مرورگرها محدودیت دارند)

## تنظیمات امنیتی
- محدود کردن دسترسی به فایلهای CSV
- استفاده از HTTPS
- تنظیم CSP headers