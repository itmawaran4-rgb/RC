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
  return (text || '')
    // remove ALL zero-width + invisible chars
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // normalize spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseHtmlResponse(html) {

  if (!html) {
    return { count: '!', total: '' };
  }

  const cleanText = normalize(html);

  // ✅ 1. تحقق من "لا يوجد مخالفات"
const text = normalize(html);

const noFines = (
  text.includes('لا توجد') ||
  text.includes('لايوجد') ||
  text.includes('نەدۆزرایەوە') ||
  text.includes('هیچ سزایه') ||
  text.includes('چ سزا سەر نینە')
);

if (noFines) {
  return { count: '0', total: '' };
}

  // ✅ 2. استخراج العدد إن وجد
  let count = '0';
  let total = '';

  const countMatch =
    html.match(/ژماره‌?ى\s+سه‌?رپێچى[^\d]*(\d+)/) ||
    html.match(/عدد المخالفات[^\d]*(\d+)/i);

  if (countMatch) {
    count = countMatch[1];
  }

  // ✅ 3. لا تعتمد على <tr> نهائياً
  return { count, total };
}

  return { GOVERNORATE_INFO, FINES_FIELDS, buildFormData, getFinesUrl, parseHtmlResponse };
})();

if (typeof window !== 'undefined') {
  window.FINES_MODULES = window.FINES_MODULES || {};
  window.FINES_MODULES['duhok'] = FINES_DUHOK;
}
