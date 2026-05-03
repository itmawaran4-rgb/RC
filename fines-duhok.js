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
  // إذا كان فارغاً أو ليس نصاً، نرجع رمز الانتظار/الخطأ
  if (!html || typeof html !== 'string' || html.length < 10) {
    return { count: '!', total: '' };
  }

  const cleanText = normalize(html);

  // الكلمات المفتاحية بعد التوحيد (لاحظ استخدام "ه" بدلاً من "ە")
  const noFinesKeywords = [
    'لا توجد', 
    'لايوجد', 
    'نهدوزرايهوه', 
    'هيج سزايه', 
    'چ سزا سهر نينه' // النص الكردي بعد الـ normalize
  ];

  const hasNoFines = noFinesKeywords.some(key => cleanText.includes(normalize(key)));

  if (hasNoFines) {
    return { count: '0', total: '' };
  }

  // استخراج العدد إذا وجد
  let count = '0';
  const countMatch = 
    html.match(/ژماره‌?ى\s+سه‌?رپێچى[^\d]*(\d+)/) || 
    html.match(/عدد المخالفات[^\d]*(\d+)/i);

  if (countMatch) {
    count = countMatch[1];
  } else {
    // إذا لم يجد نص "لا توجد" ولم يجد رقم، ربما هناك خطأ في الصفحة
    // سنعيد 0 كافتراضي أو ! إذا أردت التدقيق
    count = '0'; 
  }

  return { count, total: '' };
}
  return { GOVERNORATE_INFO, FINES_FIELDS, buildFormData, getFinesUrl, parseHtmlResponse };
})();

if (typeof window !== 'undefined') {
  window.FINES_MODULES = window.FINES_MODULES || {};
  window.FINES_MODULES['duhok'] = FINES_DUHOK;
}
