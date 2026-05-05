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

  // ── اكتشاف خطأ رقم السنوية ──
  const invalidHints = ['سالنامێ یا درست نینە', 'سالنامێ يا درست'];
  for (const hint of invalidHints) {
    if (html.includes(hint)) {
      return { count: 'invalid_salyana', total: '', error: 'invalid_salyana' };
    }
  }

  const raw  = html.replace(/<[^>]*>/g, ' ');
  const text = normalize(raw);

  // ── لا توجد مخالفات ──
  const noFinesRegex = /(سزا.*نينه|نينه.*سزا|لا.*توجد|لا.*يوجد|هيچ.*سزايهك|چ.*سزا)/i;
  if (noFinesRegex.test(text)) {
    return { count: '0', total: '', rows: [] };
  }

  // ── تحليل صفوف الجدول ──
  const rows   = [];
  const trAll  = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  let   dataRows = trAll.filter(m => /<td[\s>]/i.test(m[1])); // تجاهل صف الرأس

  for (const trMatch of dataRows) {
    const cells = [...trMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(td => td[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());

    if (cells.length >= 5) {
      rows.push({
        date      : cells[0] || '',
        fineNo    : cells[1] || '',
        regPlace  : cells[2] || '',
        violation : cells[3] || '',
        amount    : cells[4] || '',
        place     : cells[5] || '',
        time      : cells[6] || '',
      });
    }
  }

  // ── استخراج العدد والمجموع من سطر الملخص ──
  let count = rows.length > 0 ? String(rows.length) : '!';
  let total = '';

  const countM = html.match(/هژمارا\s+سه‌?رپێچییا\s*(\d+)|ژماره‌?ى\s+سه‌?رپێچى[^\d]*(\d+)/);
  if (countM) count = (countM[1] || countM[2]).trim();

  const totalM = html.match(/كوژمێ\s+گشتى[^\d]*([\d,]+)|كوژمێ\s+گشتى\s+یێ[^\d]*([\d,]+)/);
  if (totalM) {
    const raw = parseInt((totalM[1] || totalM[2]).replace(/,/g, ''));
    total = raw >= 1000 ? Math.round(raw / 1000) + 'K' : String(raw);
  }

  return { count, total, rows };
}
  return { GOVERNORATE_INFO, FINES_FIELDS, buildFormData, getFinesUrl, parseHtmlResponse };
})();

if (typeof window !== 'undefined') {
  window.FINES_MODULES = window.FINES_MODULES || {};
  window.FINES_MODULES['duhok'] = FINES_DUHOK;
}
