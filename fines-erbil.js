/**
 * ═══════════════════════════════════════════════════════════
 *  RC Service — Google Apps Script  (doPost + doGet)
 *  Sheets: users | cars | feedback | crane | cranedata
 * ═══════════════════════════════════════════════════════════
 */

const SHEET_ID = '1aYVnVz4-T6oh6jTEUaLZC_TgKjk4fWC9-7TgEg7T4gY';

/* ─── رؤوس الأعمدة لكل صفحة ─── */
const HEADERS = {
  users    : ['الاسم','الهاتف','المدينة','تاريخ الميلاد','الجنس','التاريخ'],
  cars     : [
    'car_id','user_phone','اسم السيارة','نوع السيارة','المحافظة',
    'رقم اللوحة','الحرف','رقم السنوية',
    'كم تغيير الزيت','تاريخ تغيير الزيت','فلتر الزيت','ملاحظات الزيت','التغيير القادم (كم)',
    'كم تغيير الكير','تاريخ تغيير الكير','ملاحظات الكير',
    'تاريخ الإضافة'
  ],
  feedback : ['الاسم','الهاتف','الملاحظة','التاريخ'],
  crane    : ['اسم صاحب الكرين','الهاتف','lat','lng'],
  cranedata: ['التاريخ','اسم صاحب الكرين','هاتف المستخدم'],
};

/* ─── مساعد: تأكد من وجود رأس الصفحة ─── */
function ensureHeader(sh, key) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS[key]);
    sh.getRange(1, 1, 1, HEADERS[key].length)
      .setFontWeight('bold')
      .setBackground('#f5a623')
      .setFontColor('#000000');
  }
}

/* ─── مساعد: فتح أو إنشاء صفحة ─── */
function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

/* ═══════════════════════════════════════
   doPost — استقبال البيانات من التطبيق
═══════════════════════════════════════ */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.openById(SHEET_ID);

    /* ── تسجيل مستخدم ── */
    if (data.sheet === 'users') {
      const sh = getOrCreateSheet(ss, 'users');
      ensureHeader(sh, 'users');
      sh.appendRow([data.name, data.phone, data.city, data.dob, data.gender, data.timestamp]);
    }

    /* ── إضافة سيارة أو تحديث بيانات الزيت/الكير ──
     *
     *  عند إضافة سيارة جديدة: action = 'add_car'
     *  عند تحديث الزيت       : action = 'update_oil'
     *  عند تحديث الكير       : action = 'update_gear'
     *
     *  البحث يتم بـ car_id في العمود A
     */
if (data.sheet === 'cars') {
  const sh = getOrCreateSheet(ss, 'cars');
  ensureHeader(sh, 'cars');

  if (data.action === 'add_car') {
    sh.appendRow([
      data.car_id,
      data.user_phone,
      data.carName,
      data.carType,
      data.governorate,
      data.plateNumber,
      data.plateLetter,
      data.salyanaNumber,
      '', '', '', '', '',
      '', '', '',
      data.timestamp,
    ]);
  }

  // ── مسح رقم الهاتف فقط (فك الارتباط عند الحذف) ──
  if (data.action === 'unlink_car') {
    const lastRow = sh.getLastRow();
    if (lastRow >= 2) {
      const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      const rowIdx = ids.map(String).indexOf(String(data.car_id));
      if (rowIdx !== -1) {
        sh.getRange(rowIdx + 2, 2).setValue('');
      }
    }
  }

  if (data.action === 'update_oil' || data.action === 'update_gear') {
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return okResponse();
    const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    const rowIdx = ids.map(String).indexOf(String(data.car_id));
    if (rowIdx === -1) return okResponse();
    const sheetRow = rowIdx + 2;

    if (data.action === 'update_oil') {
      sh.getRange(sheetRow, 9).setValue(data.oilKm     || '');
      sh.getRange(sheetRow,10).setValue(data.oilDate   || '');
      sh.getRange(sheetRow,11).setValue(data.oilFilter ? 'نعم' : 'لا');
      sh.getRange(sheetRow,12).setValue(data.oilNotes  || '');
      sh.getRange(sheetRow,13).setValue(data.oilNextKm || '');
    }

    if (data.action === 'update_gear') {
      sh.getRange(sheetRow,14).setValue(data.gearKm    || '');
      sh.getRange(sheetRow,15).setValue(data.gearDate  || '');
      sh.getRange(sheetRow,16).setValue(data.gearNotes || '');
    }
  }
}

    /* ── ملاحظات ── */
    if (data.sheet === 'feedback') {
      const sh = getOrCreateSheet(ss, 'feedback');
      ensureHeader(sh, 'feedback');
      sh.appendRow([data.name, data.phone, data.feedback, data.timestamp]);
    }

    /* ── تسجيل طلب كرين ── */
    if (data.sheet === 'cranedata') {
      const sh = getOrCreateSheet(ss, 'cranedata');
      ensureHeader(sh, 'cranedata');
      sh.appendRow([data.timestamp, data.craneName, data.userPhone || '']);
    }

    return okResponse();
  } catch (err) {
    return errResponse(err.toString());
  }
}

/* ═══════════════════════════════════════
   doGet — إرجاع بيانات الكرينات (CORS آمن)
   مثال: ?action=cranes
═══════════════════════════════════════ */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    const ss     = SpreadsheetApp.openById(SHEET_ID);

    if (action === 'cranes') {
      const sh       = getOrCreateSheet(ss, 'crane');
      const lastRow  = sh.getLastRow();
      if (lastRow < 2) return jsonResponse([]);

      const rows = sh.getRange(2, 1, lastRow - 1, 4).getValues();
      const cranes = rows
        .filter(r => r[0] && r[2] && r[3])
        .map(r => ({
          name : r[0],
          phone: String(r[1]),
          lat  : parseFloat(r[2]),
          lng  : parseFloat(r[3]),
        }));
      return jsonResponse(cranes);
    }

    // ✅ حطيناها هنا قبل الـ return
    if (action === 'get_user_cars') {
      const phone = e.parameter.phone || '';
      if (!phone) return jsonResponse({ cars: [] });

      const sh = getOrCreateSheet(ss, 'cars');
      const lastRow = sh.getLastRow();
      if (lastRow < 2) return jsonResponse({ cars: [] });

      const data = sh.getRange(2, 1, lastRow - 1, 16).getValues();
      const userCars = [];

      for (let i = 0; i < data.length; i++) {
        const cellPhone = String(data[i][1]).replace(/^0+/, '').trim();
        const searchPhone = String(phone).replace(/^0+/, '').trim();
        if (cellPhone === searchPhone) {

          userCars.push({
            car_id: data[i][0],
            carName: data[i][2],
            carType: data[i][3],
            governorate: data[i][4],
            plateNumber: data[i][5],
            plateLetter: data[i][6],
            salyanaNumber: data[i][7],
            oilKm: data[i][8],
            oilDate: data[i][9],
            oilFilter: data[i][10],
            oilNotes: data[i][11],
            oilNextKm: data[i][12],
            gearKm: data[i][13],
            gearDate: data[i][14],
            gearNotes: data[i][15]
          });
        }
      }
      return jsonResponse({ cars: userCars });
    }
if (action === 'check_fines') {
  var type      = e.parameter.type      || '1';
  var plate     = e.parameter.plate     || '';
  var plateChar = e.parameter.plateChar || '0';
  var sanNumber = e.parameter.sanNumber || '';

  if (!plate || !sanNumber) return jsonResponse({ count: '!', total: '' });

  var url = 'https://htp.moi.gov.krd/fines_form_data_' + type + '.php';
  var payload = 'Sinif='     + encodeURIComponent(type)      +
                '&plate='    + encodeURIComponent(plate)      +
                '&PlateChar='+ encodeURIComponent(plateChar)  +
                '&SanNumber='+ encodeURIComponent(sanNumber);

  // 1. محاولة جلب الجلسة (Cookie) لتقليل احتمالية الحظر من موقع المرور
  var cookieString = '';
  try {
     var initReq = UrlFetchApp.fetch('https://htp.moi.gov.krd/', { muteHttpExceptions: true });
     var headers = initReq.getAllHeaders();
     var cookies = headers['Set-Cookie'];
     if (cookies) {
         // أخذ أول كعكة فقط وتجهيزها
         cookieString = Array.isArray(cookies) ? cookies[0].split(';')[0] : cookies.split(';')[0];
     }
  } catch(err) {}

  var options = {
    method            : 'post',
    contentType       : 'application/x-www-form-urlencoded',
    payload           : payload,
    headers           : {
      'User-Agent'      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept'          : 'text/html, */*; q=0.01',
      'Referer'         : 'https://htp.moi.gov.krd/',
      'X-Requested-With': 'XMLHttpRequest'
    },
    muteHttpExceptions: true,
    followRedirects   : true,
  };

  // إرفاق الكوكي إذا تم العثور عليه
  if (cookieString) {
      options.headers['Cookie'] = cookieString;
  }

  try {
    var resp = UrlFetchApp.fetch(url, options);
    var code = resp.getResponseCode();
    var html = resp.getContentText('UTF-8');

    if (code === 200 && html) {
      var parseResult = gasParseFines(html);
      
      // إضافة الـ HTML للنتيجة في حال الفشل لكي تتمكن من قراءة الخطأ في الـ Console
      if (parseResult.count === '!') {
          parseResult.debug_html = html.substring(0, 200); 
          parseResult.debug_code = code;
      }
      return jsonResponse(parseResult);
    } else {
      return jsonResponse({ count: '!', total: '', error: 'HTTP Error: ' + code });
    }
  } catch (fetchErr) {
    return jsonResponse({ count: '!', total: '', error: fetchErr.toString() });
  }
}

    // 👇 هذا آخر شيء
    return jsonResponse({ status: 'ok', msg: 'RC Service API' });

  } catch (err) {
    return errResponse(err.toString());
  }
  
}

/* ─── مساعدات الردود ─── */
function okResponse() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
function errResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function gasParseFines(html) {
  if (!html || html.trim().length < 5) return { count: '!', total: '' };

  var lower = html.toLowerCase();

  /* ① فحص "لا غرامات" أولاً — قبل أي شيء آخر */
var noFinesHints = [
    'no record', 'not found', 'result is empty', '0 record',
    'لا توجد', 'لايوجد',
    'نەدۆزرایەوە',
    'هیچ سەرپێچى', 'هیچ سه‌رپێچى', 'هیچ سەرپێچی',
    'هیچ ئەنجامێک', 'هیچ داتایەک', 'ئەنجامێک نییە',
    'بەدەرنەهات', 'تۆمارنەکراوە',
    'هیچ سزایه‌كى له‌سه‌ر نیه‌', // تمت الإضافة هنا
    'هیچ سزایەکی لەسەر نیە'    // تمت إضافة تنويع إملائي للاحتياط
  ];
  if (noFinesHints.some(function(h) { return lower.indexOf(h.toLowerCase()) !== -1; })) {
    return { count: '0', total: '' };
  }

  /* ② لا جداول ولا محتوى واضح → خطأ */
  var trMatches = html.match(/<tr[\s>]/gi);
  var rows = trMatches ? trMatches.length : 0;

  if (rows === 0) return { count: '!', total: '' };

  /* ③ استخراج العدد */
  var count = rows > 1 ? String(rows - 1) : '0';
  var total = '';

  var countPatterns = [
    /ژماره‌?ى\s+سه‌?رپێچى[^\d]*(\d+)/,
    /عدد المخالفات[^\d]*(\d+)/i,
    /Total[^:]*:\s*(\d+)/i,
    /(\d+)\s*سه‌?رپێچى/,
  ];
  for (var i = 0; i < countPatterns.length; i++) {
    var m = html.match(countPatterns[i]);
    if (m) { count = m[1].trim(); break; }
  }

  /* ④ استخراج المجموع المالي */
  var totalPatterns = [
    /بڕى\s+گشتى[^\d]*([\d,]+)/,
    /المجموع الكلي[^\d]*([\d,]+)/i,
    /Total Amount[^\d]*([\d,]+)/i,
    /کۆی گشتی[^\d]*([\d,]+)/,
  ];
  for (var j = 0; j < totalPatterns.length; j++) {
    var tm = html.match(totalPatterns[j]);
    if (tm) {
      var raw = parseInt(tm[1].replace(/,/g, ''));
      total = raw >= 1000 ? Math.round(raw / 1000) + 'K' : String(raw);
      break;
    }
  }

  return { count: count, total: total };
}
function forceAuth() {
  // هذا السطر هدفه فقط إجبار جوجل على طلب صلاحية الاتصال الخارجي
  UrlFetchApp.fetch("https://google.com");
}
