const FINES_SULAYMANIYAH = (function () {

  const GOVERNORATE_INFO = {
    id       : 'sulaymaniyah',
    nameAr   : 'السليمانية',
    nameKu   : 'سلێمانی',
    nameEn   : 'Sulaymaniyah',
    baseUrl  : 'https://sultraffic.com',
    formPath : '/fines',
  };

  /*
   * ⚠ السليمانية تختلف عن أربيل ودهوك:
   *   ① رقم السيارة = حرف + رقم مدمجان في حقل واحد  (مثال: A1234 أو 12345)
   *   ② قيم أنواع المركبات مختلفة (راجع value أدناه)
   *   ③ لا يوجد حقل منفصل للحرف
   *   ④ الموقع ASP.NET → يُفتح في تبويب جديد مباشرةً
   */
  const FINES_FIELDS = [
    {
      key: 'type', type: 'select', required: true,
      labelAr: 'نوع السيارة', labelKu: 'جۆری ئەوتۆمبێل', labelEn: 'Vehicle Type',
      options: [
        { value: '2', labelAr: 'خصوصي',      labelKu: 'تایبەت',     labelEn: 'Private'      },
        { value: '1', labelAr: 'حمل',         labelKu: 'بارهەڵگر',   labelEn: 'Cargo'        },
        { value: '4', labelAr: 'أجرة',        labelKu: 'کرێ',        labelEn: 'Taxi'         },
        { value: '6', labelAr: 'إنشائي',      labelKu: 'بیناسازی',   labelEn: 'Construction' },
        { value: '3', labelAr: 'زراعي',       labelKu: 'کشتوکاڵ',    labelEn: 'Agricultural' },
        { value: '5', labelAr: 'دراجة نارية', labelKu: 'ماتۆڕ سکل', labelEn: 'Motorcycle'   },
      ],
    },
    {
      key         : 'carNo', type: 'text', required: true,
      labelAr     : 'رقم السيارة',
      labelKu     : 'ژمارەی ئۆتۆمبێڵ',
      labelEn     : 'Car Number',
      placeholder : 'A1234 یان 12345',
    },
    {
      key         : 'salyanaNumber', type: 'number', required: true,
      labelAr     : 'رقم السنوية',
      labelKu     : 'ژمارەی ساڵانە',
      labelEn     : 'Annual License No.',
      placeholder : '',
      hintAr      : 'لا تكتب أصفاراً في بداية الرقم',
      hintKu      : 'سفری پێش ژمارەی ساڵانە مەنووسە',
      hintEn      : "Don't write leading zeros before the number",
    },
  ];

  /*
   * الموقع يعتمد ASP.NET WebForms ويحتاج VIEWSTATE لا يمكن تضمينه
   * من جانب المتصفح مباشرةً ← نفتح الموقع في تبويب جديد بدلاً من POST مخفي
   */
  function getDirectUrl(/* car */) {
    return GOVERNORATE_INFO.baseUrl + GOVERNORATE_INFO.formPath;
  }

  /* لا تُستخدم للـ POST المباشر — يُعيد null */
  function buildFormData(/* car */) { return null; }
  function getFinesUrl(/* car */)   { return GOVERNORATE_INFO.baseUrl + GOVERNORATE_INFO.formPath; }

  function parseHtmlResponse(html) {
    if (!html || html.trim().length < 200) return { count: '!', total: '' };

    const lower = html.toLowerCase();

    /* ① لا توجد غرامات */
    const noFinesHints = [
      'هیچ سزایەکی لەسەر نییە',
      'هیچ سزایه‌کی له‌سه‌ر نیه‌',
      'هیچ سزایەکی',
      'no record', 'not found', 'result is empty',
      '0 record', 'نەدۆزرایەوە',
    ];
    if (noFinesHints.some(h => lower.includes(h.toLowerCase()))) {
      return { count: '0', total: '' };
    }

    /* ② احسب صفوف الجدول */
    const trMatches = html.match(/<tr[\s>]/gi);
    const rows = trMatches ? trMatches.length : 0;
    if (rows === 0) return { count: '!', total: '' };

    const count = rows > 1 ? String(rows - 1) : '0';
    let total = '';

    /* ③ حاول استخراج المجموع */
    const totalMatch =
      html.match(/بڕى\s+گشتى[^\d]*([\d,]+)/)      ||
      html.match(/کۆی گشتی[^\d]*([\d,]+)/)          ||
      html.match(/المجموع الكلي[^\d]*([\d,]+)/i)     ||
      html.match(/Total Amount[^\d]*([\d,]+)/i);

    if (totalMatch) {
      const raw = parseInt(totalMatch[1].replace(/,/g, ''));
      total = raw >= 1000 ? Math.round(raw / 1000) + 'K' : String(raw);
    }

    return { count, total };
  }

  return {
    GOVERNORATE_INFO, FINES_FIELDS,
    buildFormData, getFinesUrl, getDirectUrl,
    parseHtmlResponse,
  };
})();

if (typeof window !== 'undefined') {
  window.FINES_MODULES = window.FINES_MODULES || {};
  window.FINES_MODULES['sulaymaniyah'] = FINES_SULAYMANIYAH;
}
