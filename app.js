const demoCsv = `event_date,event_year,affected_country,affected_organization,affected_industry,event_type,event_subtype,motive,description,actor,actor_type,actor_country,source_url
2024-01-12,2024,United States,Metro Health,Healthcare,Ransomware,Encryption,Financial,Hospital systems disrupted by malware,Group Alpha,Criminal,Unknown,https://example.com
2024-03-22,2024,United Kingdom,NorthBank,Finance,Data Breach,Credential Theft,Financial,Customer data exposed after phishing campaign,Unknown,Criminal,Unknown,https://example.com
2023-11-04,2023,Israel,City Services,Government,DDoS,Service Disruption,Hacktivism,Public services website temporarily unavailable,Collective Beta,Hacktivist,Unknown,https://example.com
2025-02-18,2025,Germany,AutoWerk,Manufacturing,Espionage,Intrusion,Espionage,Intellectual property accessed by suspected intrusion,APT Group,Nation State,Unknown,https://example.com
2025-05-09,2025,France,RetailCo,Retail,Data Breach,Database Leak,Financial,Customer database leaked on underground forum,Unknown,Criminal,Unknown,https://example.com`;

let rows = [];
let filteredRows = [];
let charts = {};

const fields = {
  date: 'event_date', year: 'event_year', country: 'affected_country', org: 'affected_organization',
  industry: 'affected_industry', type: 'event_type', subtype: 'event_subtype', motive: 'motive',
  description: 'description', actor: 'actor', actorType: 'actor_type', actorCountry: 'actor_country', source: 'source_url'
};

const el = id => document.getElementById(id);
const clean = value => (value || '').toString().trim();

function parseCsv(text, label = 'dataset') {
  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    complete: result => {
      rows = result.data.filter(row => Object.values(row).some(Boolean));
      filteredRows = rows;
      fillFilters();
      applyFilters();
      el('statusBox').textContent = `Loaded ${rows.length.toLocaleString()} incidents from ${label}.`;
    },
    error: err => el('statusBox').textContent = `CSV error: ${err.message}`
  });
}

function uniqueValues(key) {
  return [...new Set(rows.map(r => clean(r[key])).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function fillSelect(id, values) {
  const select = el(id);
  const first = select.options[0].textContent;
  select.innerHTML = `<option value="">${first}</option>` + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
}

function fillFilters() {
  fillSelect('yearFilter', uniqueValues(fields.year).sort((a, b) => b - a));
  fillSelect('countryFilter', uniqueValues(fields.country));
  fillSelect('industryFilter', uniqueValues(fields.industry));
  fillSelect('typeFilter', uniqueValues(fields.type));
  fillSelect('motiveFilter', uniqueValues(fields.motive));
  fillSelect('actorTypeFilter', uniqueValues(fields.actorType));
}

function applyFilters() {
  const q = clean(el('searchInput').value).toLowerCase();
  const filters = {
    [fields.year]: el('yearFilter').value,
    [fields.country]: el('countryFilter').value,
    [fields.industry]: el('industryFilter').value,
    [fields.type]: el('typeFilter').value,
    [fields.motive]: el('motiveFilter').value,
    [fields.actorType]: el('actorTypeFilter').value
  };

  filteredRows = rows.filter(row => {
    const matchesFilters = Object.entries(filters).every(([key, value]) => !value || clean(row[key]) === value);
    const searchable = Object.values(row).join(' ').toLowerCase();
    return matchesFilters && (!q || searchable.includes(q));
  });

  updateStats();
  renderCharts();
  renderTable();
}

function countBy(key) {
  const counts = {};
  filteredRows.forEach(row => {
    const value = clean(row[key]) || 'Unknown';
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function updateStats() {
  el('totalIncidents').textContent = filteredRows.length.toLocaleString();
  el('totalCountries').textContent = new Set(filteredRows.map(r => clean(r[fields.country])).filter(Boolean)).size;
  el('totalIndustries').textContent = new Set(filteredRows.map(r => clean(r[fields.industry])).filter(Boolean)).size;
  el('totalActors').textContent = new Set(filteredRows.map(r => clean(r[fields.actor])).filter(Boolean)).size;
  const years = filteredRows.map(r => Number(r[fields.year])).filter(Boolean).sort((a, b) => a - b);
  el('dateRange').textContent = years.length ? `${years[0]}-${years[years.length - 1]}` : '-';
  el('resultCount').textContent = `${filteredRows.length.toLocaleString()} results`;
}

function chart(id, type, labels, data) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(el(id), {
    type,
    data: { labels, datasets: [{ label: 'Incidents', data, borderWidth: 2, tension: 0.35 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: '#9fb3c8' } }, y: { ticks: { color: '#9fb3c8' }, beginAtZero: true } }
    }
  });
}

function renderCharts() {
  const years = countBy(fields.year).sort((a, b) => Number(a[0]) - Number(b[0]));
  chart('yearChart', 'line', years.map(x => x[0]), years.map(x => x[1]));
  [['countryChart', fields.country], ['industryChart', fields.industry], ['typeChart', fields.type], ['motiveChart', fields.motive], ['actorTypeChart', fields.actorType]]
    .forEach(([id, key]) => {
      const data = countBy(key).slice(0, 10);
      chart(id, 'bar', data.map(x => x[0]), data.map(x => x[1]));
    });
}

function renderTable() {
  el('incidentTable').innerHTML = filteredRows.slice(0, 300).map((row, index) => `
    <tr data-index="${index}">
      <td>${escapeHtml(clean(row[fields.date]))}</td>
      <td>${escapeHtml(clean(row[fields.country]))}</td>
      <td>${escapeHtml(clean(row[fields.org]))}</td>
      <td>${escapeHtml(clean(row[fields.industry]))}</td>
      <td>${escapeHtml(clean(row[fields.type]))}</td>
      <td>${escapeHtml(clean(row[fields.actor]))}</td>
      <td>${escapeHtml(clean(row[fields.motive]))}</td>
    </tr>`).join('');

  document.querySelectorAll('#incidentTable tr').forEach(tr => {
    tr.addEventListener('click', () => openDrawer(filteredRows[Number(tr.dataset.index)]));
  });
}

function openDrawer(row) {
  el('drawerOrg').textContent = clean(row[fields.org]) || 'Incident Details';
  el('drawerContent').innerHTML = Object.entries({
    Date: row[fields.date], Year: row[fields.year], Country: row[fields.country], Industry: row[fields.industry],
    Type: row[fields.type], Subtype: row[fields.subtype], Motive: row[fields.motive], Actor: row[fields.actor],
    'Actor Type': row[fields.actorType], 'Actor Country': row[fields.actorCountry], Description: row[fields.description]
  }).map(([k, v]) => `<p><strong>${k}:</strong> ${escapeHtml(clean(v) || '-')}</p>`).join('') +
  (clean(row[fields.source]) ? `<p><a href="${escapeHtml(row[fields.source])}" target="_blank" rel="noreferrer">Open source</a></p>` : '');
  el('drawer').classList.remove('hidden');
}

function exportCsv() {
  const csv = Papa.unparse(filteredRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filtered-cyber-incidents.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[c]));
}

['searchInput','yearFilter','countryFilter','industryFilter','typeFilter','motiveFilter','actorTypeFilter'].forEach(id => el(id).addEventListener('input', applyFilters));
el('resetBtn').addEventListener('click', () => { document.querySelectorAll('.controls input,.controls select').forEach(i => i.value = ''); applyFilters(); });
el('exportBtn').addEventListener('click', exportCsv);
el('closeDrawer').addEventListener('click', () => el('drawer').classList.add('hidden'));
el('csvInput').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => parseCsv(e.target.result, file.name);
  reader.readAsText(file);
});

fetch('sample-data.csv').then(r => r.ok ? r.text() : demoCsv).then(text => parseCsv(text, 'sample data')).catch(() => parseCsv(demoCsv, 'demo data'));
