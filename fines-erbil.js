function parseHtmlResponse(html) {
  // ① صفحة فارغة أو قصيرة جداً → خطأ
  if (!html || html.trim().length < 300) return { count: '!', total: '' };

  // ② لا يحتوي على أي محتوى يخص الغرامات → خطأ (صفحة خاطئة)
  const hasFinesContent =
    html.includes('سه‌رپێچى') || html.includes('سەرپێچی') ||
    html.includes('مخالف')    || html.includes('plate')   ||
    html.includes('<table')   || html.includes('<tr')     ||
    html.includes('Sinif')    || html.includes('SanNumber');

  if (!hasFinesContent) return { count: '!', total: '' };

  // ③ مؤشرات "لا توجد مخالفات" صريحة
  const lowerHtml = html.toLowerCase();
  const noFinesHints = [
    'no record', 'not found', 'result is empty',
    'لا توجد', 'نەدۆزرایەوە', '0 record', 'لايوجد'
  ];
  const hasNoFinesHint = noFinesHints.some(h => lowerHtml.includes(h));

  let count = '0';
  let total = '';

  // ④ استخراج العدد
  const countMatch =
    html.match(/ژماره‌?ى\s+سه‌?رپێچى[^\d]*(\d+)/)  ||
    html.match(/عدد المخالفات[^\d]*(\d+)/i)            ||
    html.match(/Total[^:]*:\s*(\d+)/i);

  if (countMatch) {
    count = countMatch[1].trim();
  } else {
    const rows = (html.match(/<tr[\s>]/gi) || []).length;
    if (rows > 1) {
      count = String(rows - 1); // خصم سطر الرأس
    } else if (hasNoFinesHint) {
      count = '0';
    } else if (rows === 0) {
      // جدول غير موجود ولا تأكيد بالصفر → غير محدد
      return { count: '!', total: '' };
    }
  }

  // ⑤ استخراج المجموع المالي
  const totalMatch =
    html.match(/بڕى\s+گشتى[^\d]*([\d,]+)/)           ||
    html.match(/المجموع الكلي[^\d]*([\d,]+)/i)          ||
    html.match(/Total Amount[^\d]*([\d,]+)/i);

  if (totalMatch) {
    const raw = parseInt(totalMatch[1].replace(/,/g, ''));
    total = raw >= 1000 ? Math.round(raw / 1000) + 'K' : String(raw);
  }

  return { count, total };
}
