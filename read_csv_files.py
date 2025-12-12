import pandas as pd
import os

# مسیر پوشه CSV
csv_folder = "dbcsv"

# خواندن تمام فایلهای CSV
csv_files = {}
for filename in os.listdir(csv_folder):
    if filename.endswith('.csv') or filename.endswith('.CSV'):
        file_path = os.path.join(csv_folder, filename)
        csv_files[filename] = pd.read_csv(file_path)
        print(f"فایل {filename} خوانده شد - تعداد ردیف: {len(csv_files[filename])}")

# نمایش نام فایلها
print(f"\nتعداد کل فایلهای CSV: {len(csv_files)}")
print("فایلهای موجود:", list(csv_files.keys()))