const FINES_ERBIL = (function () {

  const GOVERNORATE_INFO = {
    id       : 'erbil',
    sequence : 22,
    nameAr   : 'أربيل',
    nameKu   : 'هەولێر',
    nameEn   : 'Erbil',
    baseUrl  : 'https://htp.moi.gov.krd',
    formPath : '/fines_form_data_{type}.php',
  };

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
    'PlateChar': car.plateLetter || '0',   // الموقع يتوقع '0' وليس ''
    'SanNumber': car.salyanaNumber || '',
  });
}

  function getFinesUrl(car) {
    return `${GOVERNORATE_INFO.baseUrl}${GOVERNORATE_INFO.formPath.replace('{type}', car.type)}`;
  }

  function parseHtmlResponse(html) {
    // ① فارغ أو قصير جداً
    if (!html || html.trim().length < 300) return { count: '!', total: '' };

    // ② لا يحتوي على محتوى يخص الغرامات
    const hasFinesContent =
      html.includes('سه‌رپێچى') || html.includes('سەرپێچی') ||
      html.includes('مخالف')    || html.includes('plate')   ||
      html.includes('<table')   || html.includes('<tr')     ||
      html.includes('Sinif')    || html.includes('SanNumber');

    if (!hasFinesContent) return { count: '!', total: '' };

    // ③ مؤشرات "لا توجد مخالفات"
    const lowerHtml = html.toLowerCase();
    const noFinesHints = [
      'no record', 'not found', 'result is empty',
      'لا توجد', 'نەدۆزرایەوە', '0 record', 'لايوجد',
    ];
    const hasNoFinesHint = noFinesHints.some(h => lowerHtml.includes(h));

    let count = '0';
    let total = '';

    // ④ استخراج العدد
    const countMatch =
      html.match(/ژماره‌?ى\s+سه‌?رپێچى[^\d]*(\d+)/) ||
      html.match(/عدد المخالفات[^\d]*(\d+)/i)          ||
      html.match(/Total[^:]*:\s*(\d+)/i);

    if (countMatch) {
      count = countMatch[1].trim();
    } else {
      const rows = (html.match(/<tr[\s>]/gi) || []).length;
      if (rows > 1) {
        count = String(rows - 1);
      } else if (hasNoFinesHint) {
        count = '0';
      } else if (rows === 0) {
        return { count: '!', total: '' };
      }
    }

    // ⑤ استخراج المجموع المالي
    const totalMatch =
      html.match(/بڕى\s+گشتى[^\d]*([\d,]+)/)        ||
      html.match(/المجموع الكلي[^\d]*([\d,]+)/i)       ||
      html.match(/Total Amount[^\d]*([\d,]+)/i);

    if (totalMatch) {
      const raw = parseInt(totalMatch[1].replace(/,/g, ''));
      total = raw >= 1000 ? Math.round(raw / 1000) + 'K' : String(raw);
    }

    return { count, total };
  }

  return { GOVERNORATE_INFO, FINES_FIELDS, buildFormData, getFinesUrl, parseHtmlResponse };
})();

if (typeof window !== 'undefined') {
  window.FINES_MODULES = window.FINES_MODULES || {};
  window.FINES_MODULES['erbil'] = FINES_ERBIL;
}
