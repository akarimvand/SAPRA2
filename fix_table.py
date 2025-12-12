import re

with open('ss-summary-report.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken table HTML
old_pattern = r'<div class="section-title">دستهبندی</th><th>تعداد</th><th>درصد از کل</th><th>وضعیت</th></tr>'
new_text = '<div class="section-title">📊 توزیع پیشرفت زیرسیستمها</div><table class="matrix-table"><tr><th>دستهبندی</th><th>تعداد</th><th>درصد از کل</th><th>وضعیت</th></tr>'

content = content.replace(old_pattern, new_text)

with open('ss-summary-report.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed successfully!")
