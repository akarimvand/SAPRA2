# 04 - ساختار دادهها

## فرمت فایلهای CSV

### DATA.CSV - دادههای اصلی
```csv
SD_System,SD_System_Name,SD_Sub_System,SD_Subsystem_Name,discipline,TOTAL ITEM,TOTAL DONE,TOTAL PENDING,TOTAL NOT CLEAR PUNCH,TOTAL HOLD POINT
```

**فیلدها:**
- `SD_System`: کد سیستم
- `SD_System_Name`: نام سیستم
- `SD_Sub_System`: کد زیرسیستم
- `SD_Subsystem_Name`: نام زیرسیستم
- `discipline`: رشته مهندسی
- `TOTAL ITEM`: تعداد کل آیتمها
- `TOTAL DONE`: تعداد آیتمهای تکمیل شده
- `TOTAL PENDING`: تعداد آیتمهای در انتظار
- `TOTAL NOT CLEAR PUNCH`: تعداد پانچهای حل نشده
- `TOTAL HOLD POINT`: تعداد نقاط نگهداری

### ITEMS.CSV - جزئیات آیتمها
```csv
SD_Sub_System,Discipline_Name,ITEM_Tag_NO,ITEM_Type_Code,ITEM_Description,ITEM_Status
```

**فیلدها:**
- `SD_Sub_System`: کد زیرسیستم
- `Discipline_Name`: نام رشته
- `ITEM_Tag_NO`: شماره تگ آیتم
- `ITEM_Type_Code`: کد نوع آیتم
- `ITEM_Description`: توضیحات آیتم
- `ITEM_Status`: وضعیت آیتم (DONE, PENDING, etc.)

### PUNCH.CSV - اطلاعات پانچها
```csv
SD_Sub_System,Discipline_Name,ITEM_Tag_NO,ITEM_Type_Code,PL_Punch_Category,PL_Punch_Description,PL_No
```

**فیلدها:**
- `SD_Sub_System`: کد زیرسیستم
- `Discipline_Name`: نام رشته
- `ITEM_Tag_NO`: شماره تگ آیتم
- `ITEM_Type_Code`: کد نوع آیتم
- `PL_Punch_Category`: دسته پانچ (A, B, C)
- `PL_Punch_Description`: توضیحات پانچ
- `PL_No`: شماره پانچ لیست

### HOLD_POINT.CSV - نقاط نگهداری
```csv
SD_SUB_SYSTEM,Discipline_Name,ITEM_Tag_NO,ITEM_Type_Code,HP_Priority,HP_Description,HP_Location
```

**فیلدها:**
- `SD_SUB_SYSTEM`: کد زیرسیستم
- `Discipline_Name`: نام رشته
- `ITEM_Tag_NO`: شماره تگ آیتم
- `ITEM_Type_Code`: کد نوع آیتم
- `HP_Priority`: اولویت نقطه نگهداری
- `HP_Description`: توضیحات نقطه نگهداری
- `HP_Location`: موقعیت نقطه نگهداری

### HOS.CSV - وضعیت فرمهای تحویل
```csv
Sub_System,Subsystem_Name,FormA,FormB,FormC,FormD
```

**فیلدها:**
- `Sub_System`: کد زیرسیستم
- `Subsystem_Name`: نام زیرسیستم
- `FormA`: تاریخ فرم A
- `FormB`: تاریخ فرم B
- `FormC`: تاریخ فرم C
- `FormD`: تاریخ فرم D

### ACTIVITES.CSV - فعالیتهای آیتمها
```csv
Tag_No,Form_Title,Done
```

**فیلدها:**
- `Tag_No`: شماره تگ آیتم
- `Form_Title`: عنوان فعالیت
- `Done`: وضعیت انجام (1 = انجام شده، 0 = انجام نشده)

## ساختار دادهها در JavaScript

### processedData Object
```javascript
{
  systemMap: {
    "systemId": {
      id: "systemId",
      name: "System Name",
      subs: [
        { id: "subId", name: "Sub Name" }
      ]
    }
  },
  subSystemMap: {
    "subSystemId": {
      id: "subSystemId",
      name: "SubSystem Name",
      systemId: "parentSystemId",
      title: "SubId - SubName",
      disciplines: {
        "disciplineName": {
          total: 100,
          done: 80,
          pending: 15,
          punch: 3,
          hold: 2,
          remaining: 5
        }
      }
    }
  },
  allRawData: [/* raw CSV data */]
}
```

### aggregatedStats Object
```javascript
{
  totalItems: 1000,
  done: 800,
  pending: 150,
  punch: 30,
  hold: 20,
  remaining: 50
}
```

## قوانین دادهها

### وضعیت آیتمها
- **DONE**: آیتم تکمیل شده
- **PENDING**: آیتم در حال انجام (شامل درصدها و متنهای خاص)
- **OTHER**: سایر وضعیتها

### منطق PENDING
آیتم در حالت PENDING محسوب میشود اگر:
1. حاوی عدد یا درصد باشد (غیر از 0 و 0%)
2. حاوی متنهای خاص: face_cleaning, fl/dry, hydrotest, cleaning, line check

### دسته‌بندی پانچها
- **A**: بحرانی (قرمز)
- **B**: متوسط (آبی)
- **C**: کم اهمیت (سبز)

### فرمهای تحویل
- **Form A**: ارسال به کلاینت برای تایید تکمیل مکانیکی
- **Form B**: بازگشت از کلاینت با پانچهای پیش راهاندازی
- **Form C**: پاکسازی پانچها و ارسال مجدد
- **Form D**: تایید نهایی کلاینت و فرآیند تحویل

## نکات مهم
- تمام فایلها باید UTF-8 باشند
- فیلدهای تاریخ در فرمت استاندارد
- مقادیر عددی بدون کاما
- رشتهها بدون کاراکترهای خاص