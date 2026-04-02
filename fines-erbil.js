/**
 * ═══════════════════════════════════════════════
 *  FINES MODULE — محافظة أربيل  (Sequence: 22)
 *  كل محافظة تحصل على ملف منفصل بنفس الواجهة
 * ═══════════════════════════════════════════════
 *
 *  EXPORTED INTERFACE  (يجب أن تبقى ثابتة في كل محافظة):
 *
 *  GOVERNORATE_INFO  — معلومات المحافظة
 *  FINES_FIELDS      — الحقول المطلوبة عند إضافة سيارة
 *  buildFormData()   — يبني FormData / URLSearchParams من بيانات السيارة
 *  getFinesUrl()     — يرجع URL نموذج الغرامات
 *  parseHtmlResponse()— يحلل HTML الراجع ويستخرج count + total
 */

const FINES_ERBIL = (function () {

  /* ── معلومات المحافظة ── */
  const GOVERNORATE_INFO = {
    id        : 'erbil',
    sequence  : 22,
    nameAr    : 'أربيل',
    nameKu    : 'هەولێر',
    nameEn    : 'Erbil',
    baseUrl   : 'https://htp.moi.gov.krd',
    formPath  : '/fines_form_data_{type}.php',
  };

  /* ── الحقول المطلوبة (يعرضها UI عند اختيار هذه المحافظة) ──
   *  type      : نوع الحقل  (text | number | select)
   *  key       : مفتاح القيمة في كائن السيارة
   *  required  : مطلوب؟
   *  options   : فقط لنوع select
   */
  const FINES_FIELDS = [
    {
      key: 'type', type: 'select', required: true,
      labelAr: 'نوع السيارة', labelKu: 'جۆری ئەوتۆمبێل', labelEn: 'Vehicle Type',
      options: [
        { value: '1', labelAr: 'خصوصي',      labelKu: 'تایبه‌ت',     labelEn: 'Private'      },
        { value: '2', labelAr: 'أجرة',        labelKu: 'كرئ',         labelEn: 'Taxi'         },
        { value: '3', labelAr: 'حمل',         labelKu: 'بارهه‌ڵگر',   labelEn: 'Cargo'        },
        { value: '4', labelAr: 'زراعي',       labelKu: 'كشتوكاڵ',     labelEn: 'Agricultural' },
        { value: '5', labelAr: 'إنشائي',      labelKu: 'بیناسازى',    labelEn: 'Construction' },
        { value: '6', labelAr: 'دراجة نارية', labelKu: 'ماتۆرسكیل',  labelEn: 'Motorcycle'   },
      ],
    },
    {
      key: 'plateNumber', type: 'number', required: true,
      labelAr: 'رقم اللوحة', labelKu: 'ژمارەی لۆحە', labelEn: 'Plate Number',
      placeholder: '12345',
    },
    {
      key: 'plateLetter', type: 'select', required: false,
      labelAr: 'الحرف', labelKu: 'پیت', labelEn: 'Letter',
      options: [
        { value: '0',  labelAr: '-- بلا --', labelKu: '-- بەبێ --', labelEn: '-- None --' },
        ...['A','B','C','D','E','F','G','H','I','J','K','L','M',
            'N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
          .map(l => ({ value: l, labelAr: l, labelKu: l, labelEn: l })),
      ],
    },
    {
      key: 'salyanaNumber', type: 'number', required: true,
      labelAr: 'رقم السنوية', labelKu: 'ژمارەی سالیانە', labelEn: 'Annual License No.',
      placeholder: '',
    },
  ];

  /* ── بناء FormData للإرسال ── */
  function buildFormData(car) {
    return new URLSearchParams({
      'Sinif'    : car.type,
      'plate'    : car.plateNumber,
      'PlateChar': car.plateLetter === '0' ? '' : car.plateLetter,
      'SanNumber': car.salyanaNumber,
    });
  }

  /* ── URL الغرامات ── */
  function getFinesUrl(car) {
    return `${GOVERNORATE_INFO.baseUrl}${GOVERNORATE_INFO.formPath.replace('{type}', car.type)}`;
  }

  /* ── تحليل HTML الراجع ── */
  function parseHtmlResponse(html) {
    let count = '0';
    let total = '';

    const countMatch =
      html.match(/ژماره‌?ى\s+سه‌?رپێچى[^\d]*(\d+)/) ||
      html.match(/عدد المخالفات[^\d]*(\d+)/i)         ||
      html.match(/Total[^:]*:\s*(\d+)/i);

    const totalMatch =
      html.match(/بڕى\s+گشتى[^\d]*([\d,]+)/)          ||
      html.match(/المجموع الكلي[^\d]*([\d,]+)/i)        ||
      html.match(/Total Amount[^\d]*([\d,]+)/i);

    if (countMatch) {
      count = countMatch[1].trim();
    } else {
      const rows = (html.match(/<tr[\s>]/gi) || []).length;
      count = rows > 1 ? String(rows - 1) : '0';
    }

    if (totalMatch) {
      const raw = parseInt(totalMatch[1].replace(/,/g, ''));
      total = raw >= 1000 ? Math.round(raw / 1000) + 'K' : String(raw);
    }

    return { count, total };
  }

  /* ── الواجهة العامة ── */
  return { GOVERNORATE_INFO, FINES_FIELDS, buildFormData, getFinesUrl, parseHtmlResponse };
})();

/* تصدير للاستخدام في index.html */
if (typeof window !== 'undefined') {
  window.FINES_MODULES = window.FINES_MODULES || {};
  window.FINES_MODULES['erbil'] = FINES_ERBIL;
}
