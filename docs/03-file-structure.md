# 03 - ساختار فایلها

## ساختار کلی پروژه

```
SAPRA2/
├── index.html              # صفحه ورود
├── main.html              # داشبورد اصلی
├── main.js                # منطق اصلی برنامه
├── main.css               # استایلهای اصلی
├── reports.html           # صفحه گزارشات
├── docs/                  # مستندات پروژه
│   ├── 01-project-overview.md
│   ├── 02-installation-setup.md
│   ├── 03-file-structure.md
│   ├── 04-data-structure.md
│   ├── 05-user-guide.md
│   ├── 06-api-reference.md
│   ├── 07-customization.md
│   ├── 08-troubleshooting.md
│   └── 09-optimization.md
├── dbcsv/                 # فایلهای داده CSV
│   ├── DATA.CSV
│   ├── ITEMS.CSV
│   ├── PUNCH.CSV
│   ├── HOLD_POINT.CSV
│   ├── HOS.CSV
│   ├── ACTIVITES.CSV
│   └── TRANS.CSV
├── amcharts/             # کتابخانه چارت محلی
│   ├── index.js
│   ├── percent.js
│   ├── themes/
│   └── ...
├── images/               # تصاویر و لوگو
│   ├── SAPRA.png
│   └── ...
└── pages/                # صفحات اضافی
    └── ...
```

## توضیح فایلهای اصلی

### فایلهای HTML
- **index.html**: صفحه ورود با فرم احراز هویت
- **main.html**: داشبورد اصلی با تمام ویژگیها
- **reports.html**: صفحه گزارشات پانچ

### فایلهای JavaScript
- **main.js**: شامل تمام منطق برنامه، مدیریت دادهها، رندر کردن UI

### فایلهای CSS
- **main.css**: تمام استایلها شامل responsive design و dark mode

### پوشه dbcsv/
فایلهای CSV حاوی دادههای پروژه:
- **DATA.CSV**: دادههای اصلی سیستمها و زیرسیستمها
- **ITEMS.CSV**: جزئیات آیتمهای پروژه
- **PUNCH.CSV**: اطلاعات پانچهای پروژه
- **HOLD_POINT.CSV**: نقاط نگهداری
- **HOS.CSV**: وضعیت فرمهای تحویل (Handover Status)
- **ACTIVITES.CSV**: فعالیتهای مربوط به هر آیتم
- **TRANS.CSV**: اطلاعات انتقال و تبدیل

### پوشه amcharts/
کتابخانه amCharts برای نمایش چارتها:
- فایلهای اصلی کتابخانه
- تمهای مختلف
- ماژولهای مختلف چارت

### پوشه images/
- لوگوی SAPRA
- آیکونها و تصاویر مورد استفاده

## وابستگیهای خارجی

### CDN Libraries
```html
<!-- Bootstrap 5 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

<!-- Papa Parse -->
<script src="https://unpkg.com/papaparse@5.4.1/papaparse.min.js"></script>

<!-- SheetJS -->
<script src="https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

<!-- JSZip -->
<script src="https://unpkg.com/jszip@3.10.1/dist/jszip.min.js"></script>

<!-- html2canvas -->
<script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

## نکات مهم
- تمام فایلهای CSS و JS در یک فایل قرار دارند برای سادگی
- استفاده از CDN برای کتابخانههای خارجی
- فایلهای CSV باید در فرمت UTF-8 باشند
- amCharts به صورت محلی نگهداری میشود برای عملکرد بهتر