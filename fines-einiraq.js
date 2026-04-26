

const FINES_EINIRAQ = (function () {

/* ──────── إعدادات التطبيق (المستخرجة من المانفيست) ──────── */
const APP_CONFIG = {
  DEEP_LINK_SCHEME : 'ayniq',
  ANDROID_PACKAGE  : 'com.moi.ayniq',
  IOS_APP_ID       : '6740897723',
  PLAY_STORE_URL   : 'https://play.google.com/store/apps/details?id=com.moi.ayniq',
  APP_STORE_URL    : 'https://apps.apple.com/us/app/id6740897723',
};

function getDirectUrl(car) {
  // iOS: فتح التطبيق فقط
  return `${APP_CONFIG.DEEP_LINK_SCHEME}://`;
}

function getAndroidIntentUrl(car) {
  // Android: package فقط — يفتح التطبيق أو يذهب للمتجر تلقائياً
  return `intent://#Intent;package=${APP_CONFIG.ANDROID_PACKAGE};end`;
}

function getStoreUrl() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    ? APP_CONFIG.APP_STORE_URL
    : APP_CONFIG.PLAY_STORE_URL;
}

  /* ──────── المحافظات المدعومة ──────── */
  const SUPPORTED_GOVERNORATES = [
    { id: 'baghdad',    nameAr: 'بغداد',       nameKu: 'بەغداد',     nameEn: 'Baghdad'       },
    { id: 'basra',      nameAr: 'البصرة',      nameKu: 'بەسرە',      nameEn: 'Basra'         },
    { id: 'nineveh',    nameAr: 'نينوى',       nameKu: 'مووسڵ',      nameEn: 'Nineveh'       },
    { id: 'najaf',      nameAr: 'النجف',       nameKu: 'نەجەف',      nameEn: 'Najaf'         },
    { id: 'kirkuk',     nameAr: 'كركوك',       nameKu: 'کەرکووک',    nameEn: 'Kirkuk'        },
    { id: 'diyala',     nameAr: 'ديالى',       nameKu: 'دیالە',      nameEn: 'Diyala'        },
    { id: 'anbar',      nameAr: 'الأنبار',     nameKu: 'ئەنبار',     nameEn: 'Al-Anbar'      },
    { id: 'babylon',    nameAr: 'بابل',        nameKu: 'بابل',       nameEn: 'Babylon'       },
    { id: 'karbala',    nameAr: 'كربلاء',      nameKu: 'کەربەلا',    nameEn: 'Karbala'       },
    { id: 'wasit',      nameAr: 'واسط',        nameKu: 'واسیت',      nameEn: 'Wasit'         },
    { id: 'dhiqar',     nameAr: 'ذي قار',      nameKu: 'ذیقار',      nameEn: 'Dhi Qar'       },
    { id: 'muthanna',   nameAr: 'المثنى',      nameKu: 'موسەنا',     nameEn: 'Al-Muthanna'   },
    { id: 'qadisiyah',  nameAr: 'القادسية',    nameKu: 'قادسیە',     nameEn: 'Al-Qadisiyah'  },
    { id: 'salahuddin', nameAr: 'صلاح الدين',  nameKu: 'سەلاحەدین',  nameEn: 'Salah Al-Din'  },
    { id: 'maysan',     nameAr: 'ميسان',       nameKu: 'مەیسان',     nameEn: 'Maysan'        },
    { id: 'halabja',    nameAr: 'حلبجة',       nameKu: 'هەڵەبجە',    nameEn: 'Halabja'       },
  ];

/* ──────── حقول الإدخال ──────── */
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
    key: 'salyanaNumber', type: 'text', required: true,
    inputMode: 'numeric',
    labelAr: 'رقم السنوية',
    labelKu: 'ژمارەی ساڵانە',
    labelEn: 'Annual License No.',
    placeholder: '',
    hintAr: 'سيُنسخ تلقائياً عند فتح تطبيق عين العراق',
    hintKu: 'بە کردنەوەی ئەپ ئۆتۆماتیکی کۆپی دەکرێت',
    hintEn: 'Will be copied automatically when opening Ein Iraq app',
  },
];

  /* علامة تُعرّف هذه المحافظات كـ "عين العراق" */
  const usesEinIraq = true;

  /* ──────── بناء روابط عين العراق ──────── */
function getDirectUrl(car) {
  // فتح التطبيق فقط بدون مسار محدد
  return `${APP_CONFIG.DEEP_LINK_SCHEME}://`;
}

function getAndroidIntentUrl(car) {
  return [
    `intent://`,
    `#Intent`,
    `scheme=${APP_CONFIG.DEEP_LINK_SCHEME}`,
    `package=${APP_CONFIG.ANDROID_PACKAGE}`,
    `end`,
  ].join(';');
}

  function getStoreUrl() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
      ? APP_CONFIG.APP_STORE_URL
      : APP_CONFIG.PLAY_STORE_URL;
  }

  /* غير مستخدمتان للـ POST المباشر */
  function buildFormData() { return null; }
  function getFinesUrl()   { return ''; }
  function parseHtmlResponse() { return { count: 'einiraq', total: '' }; }

  return {
    GOVERNORATE_INFO      : { id: 'einiraq' },
    FINES_FIELDS,
    usesEinIraq,
    APP_CONFIG,
    SUPPORTED_GOVERNORATES,
    buildFormData,
    getFinesUrl,
    getDirectUrl,
    getAndroidIntentUrl,
    getStoreUrl,
    parseHtmlResponse,
  };
})();

/* ── تسجيل الوحدة لجميع المحافظات المدعومة ── */
if (typeof window !== 'undefined') {
  window.FINES_MODULES = window.FINES_MODULES || {};
  FINES_EINIRAQ.SUPPORTED_GOVERNORATES.forEach(function (gov) {
    window.FINES_MODULES[gov.id] = FINES_EINIRAQ;
  });
}
