/* ═══════════════════════════════════════
   FINES — الثوابت
═══════════════════════════════════════ */
const FINES_CACHE_MS = 3 * 24 * 60 * 60 * 1000; // 3 أيام

/* ═══════════════════════════════════════
   FINES — Background (معطّل، الفحص يدوي فقط)
═══════════════════════════════════════ */
function startBackgroundFinesCheck() { return; }
async function backgroundCheckFines(c) { return; }

/* ═══════════════════════════════════════
   FINES — جلب عبر GAS
═══════════════════════════════════════ */
async function queryFinesViaGAS(c) {
  const url = CONFIG.SHEET_URL
    + '?action=check_fines'
    + '&type='      + encodeURIComponent(c.type        || '1')
    + '&plate='     + encodeURIComponent(c.plateNumber || '')
    + '&plateChar=' + encodeURIComponent(c.plateLetter || '0')
    + '&sanNumber=' + encodeURIComponent(c.salyanaNumber || '');
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    const res   = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return { count: '!', total: '' };
    return await res.json();
  } catch (e) {
    console.error('Fines error:', e);
    return { count: '!', total: '' };
  }
}

/* ═══════════════════════════════════════
   FINES — عرض داخلي (inline)
═══════════════════════════════════════ */
async function loadFinesInline() {
  const t = T[lang];
  const c = cars.find(x => x.id === curCar);
  if (!c) return;
  const mod = getFinesModule(c.governorate);
  if (!mod) return;

  const btn = document.getElementById('fines-load-btn');
  const box = document.getElementById('fines-result-box');
  if (!btn || !box) return;

  // حالة التحميل
  btn.disabled = true;
  btn.textContent = t.finesLoading;
  box.style.display = 'none';

  const result = await queryFinesViaGAS(c);

  // فشل التحميل أو محجوب
  if (!result || result.count === '!' || result.blocked) {
    btn.disabled = false;
    btn.textContent = t.finesLoadFailed;
    return;
  }

  // نجح — احفظ في الكاش
  finesCache[curCar] = {
    count     : result.count,
    total     : result.total || '',
    checkedAt : Date.now(),
  };
  saveFinesCache();

  // حدّث الباج
  updateBadge(curCar, result.count, result.total || '');

  // اعرض النتيجة وأخفِ الزر
  btn.style.display = 'none';
  renderFinesResultBox(result);
}

function renderFinesResultBox(cached) {
  const t   = T[lang];
  const box = document.getElementById('fines-result-box');
  if (!box) return;

  const isNone = cached.count === '0';
  const date   = cached.checkedAt
    ? formatNiceDate(new Date(cached.checkedAt).toISOString().split('T')[0])
    : '';

  if (isNone) {
    box.innerHTML = `
      <div style="background:rgba(15,212,176,.1);border:1.5px solid rgba(15,212,176,.35);
                  border-radius:var(--radius);padding:14px 16px;">
        <div style="font-size:18px;font-weight:900;color:var(--teal)">${t.finesNoneDetail}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${t.finesCachedAt(date)}</div>
      </div>`;
  } else {
    const totalLine = cached.total
      ? `<div style="font-size:14px;color:var(--red);margin-top:6px;font-weight:700">
           ${t.finesTotal(cached.total)}
         </div>`
      : '';
    box.innerHTML = `
      <div style="background:rgba(255,77,109,.1);border:1.5px solid rgba(255,77,109,.35);
                  border-radius:var(--radius);padding:14px 16px;">
        <div style="font-size:22px;font-weight:900;color:var(--red)">
          ⚠ ${t.finesCount(cached.count)}
        </div>
        ${totalLine}
        <div style="font-size:11px;color:var(--muted);margin-top:6px">
          ${t.finesCachedAt(date)}
        </div>
      </div>`;
  }
  box.style.display = 'block';
}

/* ═══════════════════════════════════════
   FINES — تهيئة قسم الغرامات في المودال
═══════════════════════════════════════ */
function initFinesSection(carId) {
  const t   = T[lang];
  const mod = getFinesModule(cars.find(x => x.id === carId)?.governorate);

  const card = document.getElementById('fines-summary-card');
  const btn  = document.getElementById('btn-check-fines');
  if (!mod) {
    if (card) card.style.display = 'none';
    if (btn)  btn.style.display  = 'none';
    return;
  }

  if (card) card.style.display = 'none'; // مخفي دائماً الآن
  if (btn)  btn.style.display  = 'none'; // الزر القديم مخفي

  const cached  = finesCache[carId];
  const age     = cached?.checkedAt ? Date.now() - cached.checkedAt : Infinity;
  const valid   = cached && cached.count !== '!' && age < FINES_CACHE_MS;
  const loadBtn = document.getElementById('fines-load-btn');
  const box     = document.getElementById('fines-result-box');

  if (valid) {
    // كاش صالح — اعرض النتيجة مباشرة، أخفِ الزر
    if (loadBtn) loadBtn.style.display = 'none';
    renderFinesResultBox(cached);
    updateBadge(carId, cached.count, cached.total || '');
  } else {
    // لا كاش أو منتهي — اعرض الزر
    if (loadBtn) {
      loadBtn.style.display = '';
      loadBtn.disabled      = false;
      loadBtn.textContent   = t.loadFinesBtn;
    }
    if (box) box.style.display = 'none';
  }
}

/* ═══════════════════════════════════════
   BADGE
═══════════════════════════════════════ */
function updateBadge(id, count, total) {
  const b = document.getElementById('badge-' + id);
  if (!b) return;
  if (count === 'checking') { b.className = 'car-fines-badge checking'; b.textContent = '⏳'; }
  else if (count === '0')   { b.className = 'car-fines-badge no-fines'; b.textContent = '✓ 0'; }
  else if (!count || count === '?' || count === '!') {
    b.className = 'car-fines-badge'; b.textContent = '🔍';
  } else {
    b.className = 'car-fines-badge has-fines';
    b.textContent = total ? `⚠ ${count}` : `⚠ ${count}`;
  }
}
