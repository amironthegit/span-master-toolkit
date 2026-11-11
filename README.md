# Span Master Toolkit for Obsidian

A powerful and precise Obsidian plugin designed to **insert, clear, and convert HTML `<span>` styling tags** across selections, whole files, or entire vaults. Specifically engineered with advanced support for **RTL (Right-to-Left)** languages (Persian, Arabic, Hebrew) to fix line-break glitches, preserve zero-width characters, and clean up messy formatting safely.

---

## Key Features

### 1. Smart Span Insertion
- **Per-Line / Paragraph Wrapping:** Wraps multi-line selections line-by-line to prevent Obsidian Live Preview / Reading mode from collapsing multiple paragraphs into a single run-on line.
- **RTL Character Injection:** Automatically prepends an invisible RTL mark (e.g., `U+200F RLM`) to guarantee correct reading order and layout alignment.
- **Avoids Redundant Spans:** Intelligently skips lines that already contain `<span>` tags.
- **Visual Color Picker & Palette:** Choose from predefined palette colors, select via the native OS color picker, or manually enter custom hex/CSS color values.

### 2. Precise Span Clearance
- **Flexible Targeting:** Filter tags to remove by `font-family`, `color`, or `font-size`.
- **Logic Gates:** Combine match rules using `AND` (all criteria must match) or `OR` (any match triggers removal).
- **Nested Span Handling:** Utilizes an iterative `do...while` regex cleaner to completely resolve nested spans without corrupting markup.
- **Invisible Character Cleanup:** Safely sweeps away preceding zero-width and directional characters (`\u200c`, `\u200d`, `\u200e`, `\u200f`, `\ufeff`) and adjacent whitespace along with the span tags.
- **Keep or Drop Content:** Option to strip only the HTML tags (keeping inner text intact) or remove the tags and their text entirely.

### 3. Advanced Span Conversion & Migration
- **Match Operators (`=` and `!`):** Target specific attributes (e.g., *color IS NOT `#000000`* OR *font IS `Adobe Arabic`*).
- **Transform Actions:**
  - `none` / `keep`: Preserve existing attribute values.
  - `remove` / `delete`: Completely strip out that specific CSS property while keeping others.
  - Custom values: Replace matching attributes with your target font, color, or font-size.
- **Configurable RTL Handling:** Keep existing leading RTL markers or clean them up during the conversion step.

### 4. Scopes & Vault Safety
- **Target Selection:** Execute operations strictly on selected text, the entire active file, or recursively across a folder/vault.
- **Automated `.bak` Backups:** When performing bulk folder or vault operations, the plugin can automatically create a duplicate `.bak` file before writing changes to disk.

---

## Installation

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Navigate to your Obsidian vault plugins directory:
   `<VaultFolder>/.obsidian/plugins/span-master-toolkit/`
3. Paste the downloaded files into the folder.
4. Open Obsidian, go to **Settings > Community plugins**, reload, and enable **Span Master Toolkit**.

### Building from Source
```bash
npm install
npx tsc main.ts --module commonjs --target es2018 --outFile main.js --esModuleInterop --skipLibCheck
```

---

## Usage

1. Open the toolkit modal using any of the following methods:
   - Click the **paintbrush icon** in the left ribbon.
   - Use the command palette (`Ctrl/Cmd + P`) and search for **Span Master Toolkit**.
2. Select your desired tab (**Insert**, **Clear**, or **Convert**).
3. Set your font, color, and size parameters.
4. Choose the scope (**Selection**, **Active File**, or **Folder**).
5. Click **Run**.

---
---

# جعبه‌ابزار مدیریت اسپن (Span Master Toolkit) برای آبسیدین

افزونه‌ای قدرتمند و دقیق برای نرم‌افزار ابسیدین (Obsidian) جهت **درج، حذف و تبدیل استایل‌های تگ `<span>`** در متن انتخاب‌شده، کل سند یا پوشه‌های والت. این افزونه با تمرکز ویژه بر زبان‌های راست‌به‌چپ (فارسی، عربی و...) طراحی شده تا چالش‌های رایج بهینه‌سازی متون راست‌چین، کاراکترهای نامرئی، و تک‌خطی شدن پاراگراف‌ها را برطرف سازد.

---

## قابلیت‌های کلیدی

### ۱. درج هوشمند اسپن (Insert)
- **اسپن‌گذاری خط‌به‌خط:** به منظور جلوگیری از باگ به‌هم‌چسبیدن پاراگراف‌ها در پیش‌نمایش آبسیدین، هر خط به صورت مجزا در تگ اسپن قرار می‌گیرد و خطوط خالی دست‌نخورده باقی می‌مانند.
- **افزودن خودکار کاراکتر مخفی RTL:** کاراکتر نامرئی راست‌به‌چپ (مانند `U+200F`) قبل از اسپن تزریق می‌شود تا چیدمان متن به هم نریزد.
- **جلوگیری از اسپن‌های تکراری:** خطوطی که از پیش دارای تگ اسپن هستند به صورت خودکار شناسایی و مجدداً پوشش داده نمی‌شوند.
- **پالت رنگ و انتخاب‌گر بصری:** قابلیت انتخاب رنگ از پالت سفارشی، استفاده از ColorPicker گرافیکی یا وارد کردن کد رنگی دلخواه (`#0070C0`، `black` و...).

### ۲. پاک‌سازی و حذف منعطف (Clear)
- **فیلترهای هدفمند:** حذف بر اساس فونت، رنگ یا اندازه قلم.
- **شروط منطقی ترکیبی:** امکان انتخاب شرط `OR` (تطابق حداقل یک ویژگی) یا `AND` (تطابق تمام ویژگی‌ها).
- **حل اسپن‌های تو در تو:** مجهز به الگوریتم بازگشتی `do...while` برای پاک‌سازی بدون نقص اسپن‌های چندلایه.
- **پاک‌سازی کاراکترهای نامرئی و فواصل:** حذف هوشمند کاراکترهای مخفی و کنترلی (`\u200c`، `\u200d`، `\u200e`، `\u200f`، `\ufeff`) و فاصله‌های چسبیده به اسپن هنگام حذف تگ.
- **حذف با یا بدون محتوا:** انتخاب بین پاک کردن صرفاً تگ استایل (حفظ متن داخلی) یا حذف کامل تگ همراه با متن آن.

### ۳. تبدیل و مهاجرت ساختار اسپن‌ها (Convert)
- **عملگرهای شرطی (`=` و `!`):** امکان جست‌وجوی شرطی (مثلاً رنگ برابر با `black` نباشد، یا فونت برابر با یک قلم خاص باشد).
- **رفتار هوشمند برای خروجی:**
  - `none` یا `keep`: ویژگی فعلی بدون تغییر باقی می‌ماند.
  - `remove` یا `delete`: آن ویژگی مشخص به طور کامل از استایل حذف می‌شود.
  - مقدار جدید: مشخصه با مقدار دلخواه جایگزین خواهد شد.
- **مدیریت جهت در تبدیل:** تعیین اینکه کاراکترهای RTL قبلی حفظ، افزوده یا به صورت کامل پاک شوند.

### ۴. محدوده اجرا و پشتیبان‌گیری ایمن
- **تعیین محدوده:** امکان اجرا بر روی متن انتخابی (Selection)، کل فایل فعال، یا یک پوشه/کل والت.
- **پشتیبان‌گیری خودکار (`.bak`):** هنگام پردازش گروهی روی پوشه‌ها یا کل والت، قبل از اعمال تغییرات، یک فایل با پسوند `.bak` در کنار فایل اصلی ساخته می‌شود تا ریسک از دست رفتن داده‌ها به صفر برسد.

---

## نحوه نصب

### نصب دستی
1. فایل‌های `main.js`، `manifest.json` و `styles.css` را آماده کنید.
2. در پوشه والت خود به مسیر زیر بروید:
   `<VaultFolder>/.obsidian/plugins/span-master-toolkit/`
   *(در صورت عدم وجود پوشه، آن را با همین نام بسازید)*.
3. فایل‌ها را داخل این پوشه کپی کنید.
4. در آبسیدین به مسیر **Settings > Community plugins** رفته، افزونه‌ها را رفرش کرده و **Span Master Toolkit** را فعال کنید.

### بیلد از سورس‌کد
```bash
npm install
npx tsc main.ts --module commonjs --target es2018 --outFile main.js --esModuleInterop --skipLibCheck
```

---

## نحوه استفاده

1. از یکی از روش‌های زیر پنجره افزونه را باز کنید:
   - کلیک روی **آیکون قلم‌مو (Paintbrush)** در نوار ابزار سمت چپ (Ribbon).
   - فشردن کلیدهای `Ctrl/Cmd + P` و اجرای دستور **Span Master Toolkit**.
2. سربرگ مورد نظر خود را انتخاب کنید (**درج اسپن**، **حذف اسپن** یا **تبدیل اسپن**).
3. مشخصات استایل (فونت، رنگ، اندازه) و شروط را مشخص نمایید.
4. محدوده اجرا (متن انتخاب‌شده، کل فایل، یا پوشه) را تعیین کنید.
5. دکمه **اجرا** را بزنید.