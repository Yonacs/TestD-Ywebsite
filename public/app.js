const STORAGE_KEY = 'dyimmo_listings_v1';
const SETTINGS_KEY = 'dyimmo_settings_v1';

const mockListings = [
  {
    id: crypto.randomUUID(),
    url: 'https://www.seloger.com/annonces/locations/appartement/paris-11e',
    sourceDomain: 'seloger.com',
    photoUrl: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=900&q=80',
    address: '22 Rue de Charonne',
    cityOrArrondissement: 'Paris 11e',
    rooms: 3,
    areaM2: 72,
    rentPrice: 2450,
    currency: 'EUR',
    dateAdded: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    status: 'new',
    notes: '',
    rawExtract: {},
    extractMethod: 'jsonld',
    confidenceScore: 96
  },
  {
    id: crypto.randomUUID(),
    url: 'https://www.leboncoin.fr/ad/locations/123',
    sourceDomain: 'leboncoin.fr',
    photoUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    address: '18 Rue Oberkampf', cityOrArrondissement: 'Paris 10e', rooms: 2, areaM2: 47, rentPrice: 1890, currency: 'EUR',
    dateAdded: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), status: 'shortlist', notes: 'Belle lumière', rawExtract: {}, extractMethod: 'og', confidenceScore: 88
  },
  {
    id: crypto.randomUUID(), url: 'https://www.pap.fr/annonces', sourceDomain: 'pap.fr',
    photoUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80', address: '4 Avenue Victor Hugo', cityOrArrondissement: 'Boulogne-Billancourt', rooms: 2, areaM2: 58, rentPrice: 1710, currency: 'EUR', dateAdded: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), status: 'visited', notes: '', rawExtract: {}, extractMethod: 'heuristic', confidenceScore: 73
  },
  {
    id: crypto.randomUUID(), url: 'https://www.bienici.com', sourceDomain: 'bienici.com',
    photoUrl: 'https://images.unsplash.com/photo-1616594039964-3f2b4f1f2e24?auto=format&fit=crop&w=900&q=80', address: '8 Rue Danton', cityOrArrondissement: 'Montreuil', rooms: 3, areaM2: 79, rentPrice: 1800, currency: 'EUR', dateAdded: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), status: 'new', notes: '', rawExtract: {}, extractMethod: 'jsonld', confidenceScore: 92
  },
  {
    id: crypto.randomUUID(), url: 'https://www.paruvendu.fr', sourceDomain: 'paruvendu.fr',
    photoUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80', address: '12 Rue de la République', cityOrArrondissement: 'Saint-Denis', rooms: 4, areaM2: 91, rentPrice: 1680, currency: 'EUR', dateAdded: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), status: 'rejected', notes: 'Trop loin', rawExtract: {}, extractMethod: 'heuristic', confidenceScore: 69
  },
  {
    id: crypto.randomUUID(), url: 'https://www.logic-immo.com', sourceDomain: 'logic-immo.com',
    photoUrl: 'https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=900&q=80', address: '7 Rue du Faubourg', cityOrArrondissement: 'Paris 8e', rooms: 1, areaM2: 29, rentPrice: 1400, currency: 'EUR', dateAdded: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), status: 'new', notes: '', rawExtract: {}, extractMethod: 'og', confidenceScore: 84
  },
  {
    id: crypto.randomUUID(), url: 'https://www.avendrealouer.fr', sourceDomain: 'avendrealouer.fr',
    photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', address: '3 Rue du Port', cityOrArrondissement: 'Issy-les-Moulineaux', rooms: 3, areaM2: 67, rentPrice: 1980, currency: 'EUR', dateAdded: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(), status: 'visited', notes: '', rawExtract: {}, extractMethod: 'jsonld', confidenceScore: 94
  },
  {
    id: crypto.randomUUID(), url: 'https://www.superimmo.com', sourceDomain: 'superimmo.com',
    photoUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80', address: '2 Rue Keller', cityOrArrondissement: 'Paris 12e', rooms: 2, areaM2: 45, rentPrice: 1540, currency: 'EUR', dateAdded: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), status: 'shortlist', notes: '', rawExtract: {}, extractMethod: 'og', confidenceScore: 90
  }
];

const defaultSettings = {
  autoOpenAfterAdd: false,
  glassIntensity: 72
};

const state = {
  listings: [],
  currentPage: 'home',
  selectedId: null,
  filters: { query: '', status: '', source: '', rooms: '', minPrice: '', maxPrice: '' },
  sort: 'date_desc',
  extractionDraft: null,
  settings: defaultSettings
};

function initData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    state.listings = JSON.parse(saved);
  } else {
    state.listings = mockListings;
    persist();
  }
  const settings = localStorage.getItem(SETTINGS_KEY);
  state.settings = settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
  applyGlassIntensity();
}

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.listings)); }
function persistSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }
function euro(v) { return `${Number(v || 0).toLocaleString('fr-FR')} €`; }
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2300);
}

function pageElement(name) { return document.getElementById(`${name}-page`); }

function createPropertyCard(item) {
  return `
    <article class="property-card glass-card" data-id="${item.id}">
      <img src="${item.photoUrl || 'https://placehold.co/600x450/eef2ff/6075a8?text=D%26Y+IMMO'}" alt="photo annonce" />
      <div class="card-body">
        <h3 class="card-title">${item.address || 'Adresse à confirmer'}</h3>
        <p class="card-sub">${item.cityOrArrondissement || 'Ville inconnue'} • ${item.sourceDomain}</p>
        <div class="tags">
          <span class="chip">${item.areaM2 || '--'} m²</span>
          <span class="chip">${item.rooms || '--'} pièces</span>
          <span class="chip">${euro(item.rentPrice)}/mois</span>
          <span class="chip status-pill">${item.status}</span>
        </div>
      </div>
    </article>
  `;
}

function renderHome() {
  const recents = [...state.listings].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 3);
  pageElement('home').innerHTML = `
    <section class="hero-input glass-card">
      <input id="url-input" type="url" placeholder="Collez l'URL de l'annonce…" />
      <button id="analyze-btn" class="btn btn-primary" disabled>Analyser</button>
    </section>
    <p id="url-error" class="inline-error"></p>
    <div class="section-head"><h2>Récents</h2></div>
    <div class="listings-grid">${recents.map(createPropertyCard).join('') || '<div class="empty glass-card">Aucune annonce récente.</div>'}</div>
  `;

  const input = document.getElementById('url-input');
  const btn = document.getElementById('analyze-btn');
  input.addEventListener('input', () => {
    btn.disabled = !isValidUrl(input.value);
    document.getElementById('url-error').textContent = input.value && !isValidUrl(input.value) ? 'URL invalide' : '';
  });
  input.addEventListener('paste', () => setTimeout(() => input.dispatchEvent(new Event('input')), 0));
  btn.addEventListener('click', () => runExtraction(input.value.trim()));
  bindCardClicks();
}

function getFilteredSorted() {
  const f = state.filters;
  let result = state.listings.filter((item) => {
    const q = !f.query || `${item.address} ${item.cityOrArrondissement} ${item.sourceDomain}`.toLowerCase().includes(f.query.toLowerCase());
    const statusOk = !f.status || item.status === f.status;
    const sourceOk = !f.source || item.sourceDomain === f.source;
    const roomsOk = !f.rooms || item.rooms >= Number(f.rooms);
    const minOk = !f.minPrice || item.rentPrice >= Number(f.minPrice);
    const maxOk = !f.maxPrice || item.rentPrice <= Number(f.maxPrice);
    return q && statusOk && sourceOk && roomsOk && minOk && maxOk;
  });

  const sorters = {
    date_desc: (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded),
    price_asc: (a, b) => a.rentPrice - b.rentPrice,
    price_desc: (a, b) => b.rentPrice - a.rentPrice,
    area_desc: (a, b) => b.areaM2 - a.areaM2
  };
  result.sort(sorters[state.sort]);
  return result;
}

function renderHistory() {
  const data = getFilteredSorted();
  const sources = [...new Set(state.listings.map((x) => x.sourceDomain))];
  pageElement('history').innerHTML = `
    <div class="search-sticky glass-card">
      <input id="search" placeholder="Rechercher adresse, ville, source…" value="${state.filters.query}" />
    </div>
    <div class="controls">
      <select id="status-filter"><option value="">Statut</option><option>new</option><option>visited</option><option>shortlist</option><option>rejected</option></select>
      <select id="source-filter"><option value="">Source</option>${sources.map((s) => `<option>${s}</option>`).join('')}</select>
      <select id="rooms-filter"><option value="">Pièces min</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select>
      <select id="sort"><option value="date_desc">Date ajout</option><option value="price_asc">Prix ↑</option><option value="price_desc">Prix ↓</option><option value="area_desc">Surface ↓</option></select>
    </div>
    <div class="controls"><input id="min-price" type="number" placeholder="Budget min" value="${state.filters.minPrice}" /><input id="max-price" type="number" placeholder="Budget max" value="${state.filters.maxPrice}" /></div>
    ${data.length ? `<div class="listings-grid">${data.map(createPropertyCard).join('')}</div>` : '<div class="empty glass-card">Aucune annonce ne correspond à vos filtres.</div>'}
  `;

  const assign = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state.filters[key] || state[key] || '';
    el.addEventListener('input', () => {
      if (key === 'sort') state.sort = el.value;
      else state.filters[key] = el.value;
      renderHistory();
    });
    el.addEventListener('change', () => {
      if (key === 'sort') state.sort = el.value;
      else state.filters[key] = el.value;
      renderHistory();
    });
  };
  assign('search', 'query');
  assign('status-filter', 'status');
  assign('source-filter', 'source');
  assign('rooms-filter', 'rooms');
  assign('min-price', 'minPrice');
  assign('max-price', 'maxPrice');
  assign('sort', 'sort');

  bindCardClicks();
}

function renderDetail() {
  const item = state.listings.find((x) => x.id === state.selectedId) || state.listings[0];
  if (!item) {
    pageElement('detail').innerHTML = '<div class="empty glass-card">Aucune annonce sélectionnée.</div>';
    return;
  }
  state.selectedId = item.id;
  const missing = ['photoUrl', 'address', 'cityOrArrondissement', 'rooms', 'areaM2', 'rentPrice'].filter((k) => !item[k]);

  pageElement('detail').innerHTML = `
    <div class="detail-hero"><img src="${item.photoUrl || 'https://placehold.co/900x600'}" alt="hero" /></div>
    <section class="detail-info glass-card">
      <h2>${item.address || 'Adresse à confirmer'}</h2>
      <p>${item.cityOrArrondissement || 'Ville inconnue'} • ${euro(item.rentPrice)} / mois</p>
      <div class="tags"><span class="chip">${item.areaM2 || '--'} m²</span><span class="chip">${item.rooms || '--'} pièces</span><span class="chip">${item.sourceDomain}</span></div>
    </section>
    <div class="metric-row">
      <section class="glass-card" style="padding:14px;">
        <h3>Notes</h3>
        <textarea id="notes-input" placeholder="Vos observations…">${item.notes || ''}</textarea>
        <div style="display:flex; gap:8px; margin-top:10px; flex-wrap: wrap;">
          ${['new', 'visited', 'shortlist', 'rejected'].map((st) => `<button class="btn ${item.status === st ? 'btn-primary' : 'btn-secondary'} status-action" data-status="${st}">${st}</button>`).join('')}
          <button id="open-link" class="btn btn-secondary">Ouvrir l'annonce</button>
        </div>
      </section>
      <section class="glass-card" style="padding:14px;">
        <h3>Qualité extraction</h3>
        <p>Méthode: <strong>${item.extractMethod}</strong> • Confiance: <strong>${item.confidenceScore}%</strong></p>
        <p>Champs manquants: ${missing.length ? missing.join(', ') : 'Aucun'}</p>
      </section>
    </div>
  `;

  document.getElementById('notes-input').addEventListener('input', (e) => {
    item.notes = e.target.value;
    persist();
  });
  document.querySelectorAll('.status-action').forEach((btn) => btn.addEventListener('click', () => {
    item.status = btn.dataset.status;
    persist();
    renderDetail();
    toast('Statut mis à jour');
  }));
  document.getElementById('open-link').addEventListener('click', () => window.open(item.url, '_blank', 'noopener'));
}

function renderSettings() {
  pageElement('settings').innerHTML = `
    <section class="glass-card" style="padding:16px;">
      <h2>Préférences</h2>
      <label style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin:14px 0;">
        Auto-ouvrir l'annonce après ajout
        <input id="auto-open" type="checkbox" ${state.settings.autoOpenAfterAdd ? 'checked' : ''} style="width:auto;" />
      </label>
      <label>Intensité glass (${state.settings.glassIntensity})
        <input id="glass-range" type="range" min="45" max="90" value="${state.settings.glassIntensity}" />
      </label>
      <button id="export-btn" class="btn btn-primary" style="margin-top:14px;">Export CSV</button>
    </section>
  `;

  document.getElementById('auto-open').addEventListener('change', (e) => {
    state.settings.autoOpenAfterAdd = e.target.checked;
    persistSettings();
  });
  document.getElementById('glass-range').addEventListener('input', (e) => {
    state.settings.glassIntensity = Number(e.target.value);
    applyGlassIntensity();
    persistSettings();
    renderSettings();
  });
  document.getElementById('export-btn').addEventListener('click', exportCsv);
}

function exportCsv() {
  const headers = ['url', 'sourceDomain', 'address', 'cityOrArrondissement', 'rooms', 'areaM2', 'rentPrice', 'status', 'dateAdded'];
  const rows = [headers.join(',')].concat(
    state.listings.map((item) => headers.map((h) => `"${String(item[h] ?? '').replaceAll('"', '""')}"`).join(','))
  );
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dy-immo-export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function applyGlassIntensity() {
  document.documentElement.style.setProperty('--glass-opacity', (state.settings.glassIntensity / 100).toFixed(2));
}

function bindCardClicks() {
  document.querySelectorAll('.property-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.selectedId = card.dataset.id;
      switchPage('detail');
    });
  });
}

function switchPage(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  pageElement(page).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.page === page));
  if (page === 'home') renderHome();
  if (page === 'history') renderHistory();
  if (page === 'detail') renderDetail();
  if (page === 'settings') renderSettings();
}

function isValidUrl(v) {
  try {
    const u = new URL(v);
    return /^https?:$/.test(u.protocol);
  } catch {
    return false;
  }
}

function showLoader(show, message) {
  const modal = document.getElementById('loader-modal');
  const step = document.getElementById('progress-step');
  if (typeof message === 'string') step.textContent = message;
  modal.classList.toggle('hidden', !show);
}

function showManualConfirm(draft, originalUrl) {
  const requiredFields = [
    ['address', 'Adresse'],
    ['cityOrArrondissement', 'Ville / Arrondissement'],
    ['rooms', 'Pièces'],
    ['areaM2', 'Surface m²'],
    ['rentPrice', 'Loyer mensuel (€)'],
    ['photoUrl', 'Photo URL']
  ];

  const form = document.getElementById('manual-form');
  form.innerHTML = `
    <p style="font-size:.8rem;color:#64708b;">${originalUrl}</p>
    ${requiredFields
      .map(([key, label]) => `<label>${label}<input name="${key}" value="${draft[key] ?? ''}" /></label>`)
      .join('')}
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button type="button" id="manual-cancel" class="btn btn-secondary">Annuler</button>
      <button class="btn btn-primary">Sauver</button>
    </div>
  `;

  const modal = document.getElementById('manual-modal');
  modal.classList.remove('hidden');

  document.getElementById('manual-cancel').onclick = () => modal.classList.add('hidden');
  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    addListing({ ...draft, ...payload, rooms: Number(payload.rooms), areaM2: Number(payload.areaM2), rentPrice: Number(payload.rentPrice), extractMethod: 'manual' });
    modal.classList.add('hidden');
  };
}

function missingFields(data) {
  return ['photoUrl', 'address', 'cityOrArrondissement', 'rooms', 'areaM2', 'rentPrice'].filter((key) => !data[key]);
}

async function runExtraction(url) {
  if (!isValidUrl(url)) {
    document.getElementById('url-error').textContent = 'URL invalide';
    return;
  }

  showLoader(true, 'Lecture des metadata…');
  const steps = ['Lecture des metadata…', 'Analyse du contenu…', 'Finalisation…'];
  let stepIx = 0;
  const interval = setInterval(() => {
    stepIx = (stepIx + 1) % steps.length;
    showLoader(true, steps[stepIx]);
  }, 1500);

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      showLoader(false);
      clearInterval(interval);
      showExtractionError(url);
      return;
    }

    clearInterval(interval);
    showLoader(false);

    const extracted = result.data;
    const listing = {
      id: crypto.randomUUID(),
      url,
      sourceDomain: extracted.sourceDomain,
      photoUrl: extracted.photoUrl,
      address: extracted.address,
      cityOrArrondissement: extracted.cityOrArrondissement,
      rooms: Number(extracted.rooms) || null,
      areaM2: Number(extracted.areaM2) || null,
      rentPrice: Number(extracted.rentPrice) || null,
      currency: 'EUR',
      dateAdded: new Date().toISOString(),
      status: 'new',
      notes: '',
      rawExtract: extracted.rawExtract,
      extractMethod: extracted.extractMethod,
      confidenceScore: extracted.confidenceScore
    };

    const missing = missingFields(listing);
    if (missing.length) {
      showManualConfirm(listing, url);
      return;
    }

    addListing(listing);
  } catch {
    clearInterval(interval);
    showLoader(false);
    showExtractionError(url);
  }
}

function showExtractionError(url) {
  const home = pageElement('home');
  home.insertAdjacentHTML(
    'beforeend',
    `<section class="error glass-card">Ce site bloque l’extraction automatique.<br/><br/>
      <button id="open-origin" class="btn btn-secondary">Ouvrir l'annonce</button>
      <button id="manual-add" class="btn btn-primary">Ajouter manuellement</button>
    </section>`
  );
  document.getElementById('open-origin').onclick = () => window.open(url, '_blank', 'noopener');
  document.getElementById('manual-add').onclick = () => showManualConfirm({ url, sourceDomain: new URL(url).hostname.replace('www.', ''), rawExtract: {} }, url);
}

function addListing(listing) {
  listing.confidenceScore = listing.confidenceScore || computeConfidenceClient(listing);
  listing.extractMethod = listing.extractMethod || 'manual';
  state.listings.unshift(listing);
  persist();
  renderHome();
  renderHistory();
  state.selectedId = listing.id;
  toast('Annonce ajoutée');
  if (state.settings.autoOpenAfterAdd) window.open(listing.url, '_blank', 'noopener');
}

function computeConfidenceClient(listing) {
  const fields = ['photoUrl', 'address', 'cityOrArrondissement', 'rooms', 'areaM2', 'rentPrice'];
  return Math.round((fields.filter((f) => listing[f]).length / fields.length) * 100);
}

function init() {
  initData();
  document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => switchPage(btn.dataset.page)));
  renderHome();
  renderHistory();
  renderDetail();
  renderSettings();
  switchPage('home');
}

init();
