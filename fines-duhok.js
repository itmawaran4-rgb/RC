const FINES_DUHOK = (function () {

  const GOVERNORATE_INFO = {
    id       : 'duhok',
    sequence : 21,
    nameAr   : 'دهوك',
    nameKu   : 'دهۆک',
    nameEn   : 'Duhok',
    baseUrl  : 'https://dtp.moi.gov.krd',
    formPath : '/fines_form_data_{type}.php',
  };

  /* نفس حقول أربيل — الموقعان يشتركان في نفس البنية */
  const FINES_FIELDS = [
    {
      key: 'type', type: 'select', required: true,
      labelAr: 'نوع السيارة', labelKu: 'جۆری ئەوتۆمبێل', labelEn: 'Vehicle Type',
      options: [
        { value: '1', labelAr: 'خصوصي',      labelKu: 'تایبه‌ت',    labelEn: 'Private'      },
        { value: '2', labelAr: 'أجرة',        labelKu: 'كرئ',        labelEn: 'Taxi'         },
        { value: '3', labelAr: 'حمل',         labelKu: 'بارهه‌ڵگر',  labelEn: 'Cargo'        },
        { value: '4', labelAr: 'زراعي',       labelKu: 'كشتوكاڵ',    labelEn: 'Agricultural' },
        { value: '5', labelAr: 'إنشائي',      labelKu: 'بیناسازى',   labelEn: 'Construction' },
        { value: '6', labelAr: 'دراجة نارية', labelKu: 'ماتۆرسكیل', labelEn: 'Motorcycle'   },
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
        { value: '0', labelAr: '-- بلا --', labelKu: '-- بەبێ --', labelEn: '-- None --' },
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

  function buildFormData(car) {
    return new URLSearchParams({
      'Sinif'    : car.type        || '1',
      'plate'    : car.plateNumber || '',
      'PlateChar': car.plateLetter || '0',
      'SanNumber': car.salyanaNumber || '',
    });
  }

  function getFinesUrl(car) {
    return `${GOVERNORATE_INFO.baseUrl}${GOVERNORATE_INFO.formPath.replace('{type}', car.type)}`;
  }

function normalize(text) {
  if (!text) return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // إزالة الحروف المخفية و ZWJ
    .replace(/\s+/g, ' ')                  // توحيد المسافات
    .trim()
    // توحيد الحروف الكردية/العربية المتشابهة
    .replace(/ە/g, 'ه')                    // الكردية Ae -> هاء
    .replace(/[ىيىێئ]/g, 'ي')                // توحيد الياءات (ێ، ي، ى)
    .replace(/[کك]/g, 'ك')                  // توحيد الكاف
    .toLowerCase();
}

function parseHtmlResponse(html) {
    if (!html) return { count: '!', total: '' };

    // تطبيق normalize لإزالة الحروف المخفية وتوحيد الأحرف
    const raw = html.replace(/<[^>]*>/g, ' ');
    const text = normalize(raw);

    // بعد normalize: ە→ه، ێ/ی→ي، وتُزال الحروف المخفية
    // "چ سزا سەر نینە‌‌" يصبح "چ سزا سهر نينه"
    const noFinesRegex = /(سزا.*نينه|نينه.*سزا|لا.*توجد|لا.*يوجد|هيچ.*سزايهك|چ.*سزا)/i;

    if (noFinesRegex.test(text)) {
        return { count: '0', total: '' };
    }

    // البحث عن عدد الغرامات — بعد normalize تصبح "سهرپيچي"
    const countMatch = text.match(/(?:سهرپيچي|سهرپيچ|مخالفة|غرامات)\D*(\d+)/);

    if (countMatch) {
        return { count: countMatch[1], total: '' };
    }

    return { count: '!', total: '' };
}
  return { GOVERNORATE_INFO, FINES_FIELDS, buildFormData, getFinesUrl, parseHtmlResponse };
})();

if (typeof window !== 'undefined') {
  window.FINES_MODULES = window.FINES_MODULES || {};
  window.FINES_MODULES['duhok'] = FINES_DUHOK;
}
