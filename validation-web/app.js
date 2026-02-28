import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ACCESS_CODE = '20290'
const STORAGE_KEY = 'cen_validation_access'

const SUPABASE_URL = window.SUPABASE_URL
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('VOTRE') || SUPABASE_ANON_KEY.includes('VOTRE')) {
  console.warn('Configurez config.js avec votre URL et clé Supabase.')
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')

const CORSICA_CENTER = [42.1, 9.1]

let observations = []
let sites = []
let mapInstance = null
let mapLayerGroup = null
let mapBaseLayers = {}

const loginSection = document.getElementById('loginSection')
const dataSection = document.getElementById('dataSection')
const headerActions = document.getElementById('headerActions')
const loginForm = document.getElementById('loginForm')
const accessCodeInput = document.getElementById('accessCode')
const loginError = document.getElementById('loginError')
const loginSubmit = document.getElementById('loginSubmit')
const btnLogout = document.getElementById('btnLogout')
const btnExportAll = document.getElementById('btnExportAll')
const btnExportValidated = document.getElementById('btnExportValidated')
const tbodyObservations = document.getElementById('tbodyObservations')
const theadObservations = document.getElementById('theadObservations')
const tbodySites = document.getElementById('tbodySites')
const theadSites = document.getElementById('theadSites')
const obsCount = document.getElementById('obsCount')
const sitesCount = document.getElementById('sitesCount')
const validatedCount = document.getElementById('validatedCount')

function isAccessGranted() {
  return sessionStorage.getItem(STORAGE_KEY) === ACCESS_CODE
}

function grantAccess() {
  sessionStorage.setItem(STORAGE_KEY, ACCESS_CODE)
}

function revokeAccess() {
  sessionStorage.removeItem(STORAGE_KEY)
}

function showError(el, msg) {
  if (!el) return
  el.textContent = msg || ''
  el.classList.toggle('error', !!msg)
}

function showDataHint(msg) {
  const el = document.getElementById('dataHint')
  if (!el) return
  if (!msg) {
    el.classList.add('hidden')
    el.textContent = ''
    return
  }
  el.textContent = msg
  el.classList.remove('hidden')
}

function showLoginWarning() {}

function checkEnvironment() {}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return String(iso)
  }
}

function escapeCsvCell(val) {
  if (val == null) return ''
  const s = String(val)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(filename, content) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function showApp() {
  loginSection.classList.add('hidden')
  dataSection.classList.remove('hidden')
  headerActions.innerHTML = '<span class="session-badge">Session active</span>'
  loadData()
}

function hideApp() {
  revokeAccess()
  loginSection.classList.remove('hidden')
  dataSection.classList.add('hidden')
  headerActions.innerHTML = ''
  accessCodeInput.value = ''
  showError(loginError, '')
}

async function loadData() {
  showDataHint('')
  let obsError = null
  let sitesError = null

  const { data: obsData, error: oErr } = await supabase
    .from('observations')
    .select('*')
    .order('created_at', { ascending: false })
  obsError = oErr
  if (oErr) console.error('Observations:', oErr)
  observations = obsError ? [] : (obsData || [])

  const { data: sitesData, error: sErr } = await supabase
    .from('observation_sites')
    .select('*')
    .order('created_at', { ascending: false })
  sitesError = sErr
  if (sErr) console.error('Sites:', sErr)
  sites = sitesError ? [] : (sitesData || [])

  if (obsError || sitesError) {
    showDataHint(
      'Impossible de charger les données. Vérifiez que les secrets SUPABASE_URL et SUPABASE_ANON_KEY sont bien renseignés sur GitHub (Settings > Secrets) et que le déploiement a été relancé après les avoir ajoutés.'
    )
  } else if (observations.length === 0 && sites.length === 0) {
    showDataHint(
      'Aucune donnée pour le moment. Si vous avez des lignes dans Supabase, ajoutez des politiques RLS permettant au rôle anon de SELECT sur les tables observations et observation_sites (voir README validation-web).'
    )
  }

  renderObservationsTable()
  renderSitesTable()
  updateMap()
  obsCount.textContent = observations.length.toLocaleString('fr-FR')
  sitesCount.textContent = sites.length.toLocaleString('fr-FR')
  const totalValidated = observations.filter(o => o.validated).length + sites.filter(s => s.validated).length
  validatedCount.textContent = totalValidated.toLocaleString('fr-FR')
}

function renderObservationsTable() {
  const columns = [
    { key: 'photo_url', label: 'Photo', type: 'photo' },
    { key: 'date', label: 'Date' },
    { key: 'protocole', label: 'Protocole' },
    { key: 'passage', label: 'Passage' },
    { key: 'site', label: 'Site' },
    { key: 'presence', label: 'Présence', type: 'bool' },
    { key: 'groupe', label: 'Groupe' },
    { key: 'nom_espece', label: 'Espèce' },
    { key: 'effectif', label: 'Effectif' },
    { key: 'stade', label: 'Stade' },
    { key: 'sexe', label: 'Sexe' },
    { key: 'remarques', label: 'Remarques' },
    { key: 'latitude', label: 'Lat', type: 'num' },
    { key: 'longitude', label: 'Lon', type: 'num' },
    { key: 'observateur', label: 'Observateur' },
    { key: 'created_at', label: 'Encodé le', type: 'date' },
    { key: 'validated', label: 'Validé', type: 'validated' },
    { key: 'validated_at', label: 'Validé le', type: 'date' },
    { key: '_action', label: 'Action', type: 'action', action: 'observation' }
  ]
  theadObservations.innerHTML = '<tr>' + columns.map(c => `<th>${c.label}</th>`).join('') + '</tr>'
  tbodyObservations.innerHTML = observations.map(o => {
    const cells = columns.map(c => {
      if (c.type === 'photo') {
        return `<td class="cell-photo">${o.photo_url ? `<a href="${o.photo_url}" target="_blank" rel="noopener"><img src="${o.photo_url}" alt="" /></a>` : '<span class="no-photo">—</span>'}</td>`
      }
      if (c.type === 'bool') return `<td>${o[c.key] ? 'Oui' : 'Non'}</td>`
      if (c.type === 'num') return `<td class="cell-numeric">${o[c.key] != null ? Number(o[c.key]).toFixed(5) : '—'}</td>`
      if (c.type === 'date') return `<td class="cell-date">${formatDate(o[c.key])}</td>`
      if (c.type === 'validated') return `<td class="cell-validated ${o.validated ? 'yes' : 'no'}">${o.validated ? 'Oui' : 'Non'}</td>`
      if (c.type === 'action' && c.action === 'observation') {
        return `<td class="cell-actions">${!o.validated ? `<button type="button" class="btn btn-sm btn-validate" data-id="${o.id}" data-type="observation">Valider</button>` : '<span class="cell-validated yes">Validé</span>'}</td>`
      }
      return `<td>${o[c.key] ?? '—'}</td>`
    })
    return '<tr>' + cells.join('') + '</tr>'
  }).join('')
  tbodyObservations.querySelectorAll('.btn-validate').forEach(btn => {
    btn.addEventListener('click', () => validateRow(btn.dataset.id, 'observation'))
  })
}

function renderSitesTable() {
  const columns = [
    { key: 'photo_url', label: 'Photo', type: 'photo' },
    { key: 'date', label: 'Date' },
    { key: 'protocole', label: 'Protocole' },
    { key: 'nom_du_site', label: 'Nom du site' },
    { key: 'latitude', label: 'Lat', type: 'num' },
    { key: 'longitude', label: 'Lon', type: 'num' },
    { key: 'length_meters', label: 'Longueur (m)', type: 'num' },
    { key: 'created_at', label: 'Encodé le', type: 'date' },
    { key: 'validated', label: 'Validé', type: 'validated' },
    { key: 'validated_at', label: 'Validé le', type: 'date' },
    { key: '_action', label: 'Action', type: 'action', action: 'site' }
  ]
  theadSites.innerHTML = '<tr>' + columns.map(c => `<th>${c.label}</th>`).join('') + '</tr>'
  tbodySites.innerHTML = sites.map(s => {
    const cells = columns.map(c => {
      if (c.type === 'photo') {
        return `<td class="cell-photo">${s.photo_url ? `<a href="${s.photo_url}" target="_blank" rel="noopener"><img src="${s.photo_url}" alt="" /></a>` : '<span class="no-photo">—</span>'}</td>`
      }
      if (c.type === 'num') return `<td class="cell-numeric">${s[c.key] != null ? Number(s[c.key]).toFixed(c.key === 'length_meters' ? 1 : 5) : '—'}</td>`
      if (c.type === 'date') return `<td class="cell-date">${formatDate(s[c.key])}</td>`
      if (c.type === 'validated') return `<td class="cell-validated ${s.validated ? 'yes' : 'no'}">${s.validated ? 'Oui' : 'Non'}</td>`
      if (c.type === 'action' && c.action === 'site') {
        return `<td class="cell-actions">${!s.validated ? `<button type="button" class="btn btn-sm btn-validate" data-id="${s.id}" data-type="site">Valider</button>` : '<span class="cell-validated yes">Validé</span>'}</td>`
      }
      return `<td>${s[c.key] ?? '—'}</td>`
    })
    return '<tr>' + cells.join('') + '</tr>'
  }).join('')
  tbodySites.querySelectorAll('.btn-validate').forEach(btn => {
    btn.addEventListener('click', () => validateRow(btn.dataset.id, 'site'))
  })
}

async function validateRow(id, type) {
  const table = type === 'observation' ? 'observations' : 'observation_sites'
  const { error } = await supabase
    .from(table)
    .update({ validated: true, validated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('Validation:', error)
    return
  }
  if (type === 'observation') {
    const o = observations.find(x => x.id === id)
    if (o) { o.validated = true; o.validated_at = new Date().toISOString() }
  } else {
    const s = sites.find(x => x.id === id)
    if (s) { s.validated = true; s.validated_at = new Date().toISOString() }
  }
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  const totalValidated = observations.filter(o => o.validated).length + sites.filter(s => s.validated).length
  validatedCount.textContent = totalValidated.toLocaleString('fr-FR')
}

function updateMap() {
  const container = document.getElementById('map')
  const panel = document.getElementById('panelMap')
  if (!container || !panel.classList.contains('active')) return

  if (!mapInstance) {
    mapInstance = L.map('map').setView(CORSICA_CENTER, 9)
    mapBaseLayers = {
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri'
      }),
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap'
      }),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
      })
    }
    mapBaseLayers.osm.addTo(mapInstance)
    mapLayerGroup = L.layerGroup().addTo(mapInstance)
    const sel = document.getElementById('basemapSelect')
    if (sel) sel.addEventListener('change', (e) => {
      Object.values(mapBaseLayers).forEach(l => mapInstance.removeLayer(l))
      mapBaseLayers[e.target.value].addTo(mapInstance)
      mapLayerGroup.addTo(mapInstance)
    })
  }
  mapLayerGroup.clearLayers()

  observations.forEach(o => {
    if (o.latitude != null && o.longitude != null) {
      const popup = `<div class="popup-content"><div class="popup-title">Observation</div><div class="popup-line"><strong>Date :</strong> ${o.date || '—'}</div><div class="popup-line"><strong>Espèce :</strong> ${o.nom_espece || '—'}</div><div class="popup-line"><strong>Site :</strong> ${o.site || '—'}</div></div>`
      const m = L.circleMarker([o.latitude, o.longitude], {
        radius: 6,
        fillColor: '#0ea5e9',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      }).bindPopup(popup)
      mapLayerGroup.addLayer(m)
    }
  })

  sites.forEach(s => {
    if (s.path_coordinates && Array.isArray(s.path_coordinates) && s.path_coordinates.length >= 2) {
      const latLngs = s.path_coordinates.map(p => [p[0], p[1]])
      const popup = `<div class="popup-content"><div class="popup-title">Site linéaire</div><div class="popup-line"><strong>Nom :</strong> ${s.nom_du_site || '—'}</div><div class="popup-line"><strong>Longueur :</strong> ${s.length_meters != null ? s.length_meters + ' m' : '—'}</div></div>`
      const polyline = L.polyline(latLngs, { color: '#14b8a6', weight: 4 }).bindPopup(popup)
      mapLayerGroup.addLayer(polyline)
    } else if (s.latitude != null && s.longitude != null) {
      const popup = `<div class="popup-content"><div class="popup-title">Site</div><div class="popup-line"><strong>Nom :</strong> ${s.nom_du_site || '—'}</div></div>`
      const m = L.circleMarker([s.latitude, s.longitude], {
        radius: 8,
        fillColor: '#10b981',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      }).bindPopup(popup)
      mapLayerGroup.addLayer(m)
    }
  })
}

function exportCsv(validatedOnly = false) {
  const obsKeys = ['id', 'date', 'protocole', 'passage', 'site', 'presence', 'groupe', 'nom_espece', 'effectif', 'stade', 'sexe', 'remarques', 'latitude', 'longitude', 'observateur', 'user_id', 'photo_url', 'validated', 'validated_at', 'created_at']
  const siteKeys = ['id', 'date', 'protocole', 'nom_du_site', 'latitude', 'longitude', 'user_id', 'photo_url', 'validated', 'validated_at', 'created_at', 'path_coordinates', 'length_meters']
  const allCols = ['type', ...new Set([...obsKeys, ...siteKeys])]
  const rows = []
  const obsList = validatedOnly ? observations.filter(o => o.validated) : observations
  const sitesList = validatedOnly ? sites.filter(s => s.validated) : sites
  obsList.forEach(o => {
    const r = ['observation']
    allCols.slice(1).forEach(k => r.push(escapeCsvCell(o[k])))
    rows.push(r)
  })
  sitesList.forEach(s => {
    const r = ['site']
    allCols.slice(1).forEach(k => r.push(escapeCsvCell(s[k])))
    rows.push(r)
  })
  const content = [allCols.map(escapeCsvCell).join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const suffix = validatedOnly ? 'validees' : 'donnees'
  downloadCsv(`cen-corse-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`, content)
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab
      document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t === tab)
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false')
      })
      document.querySelectorAll('.panel').forEach(p => {
        const id = p.id
        const active = (id === 'panelObservations' && tabName === 'observations') ||
          (id === 'panelSites' && tabName === 'sites') ||
          (id === 'panelMap' && tabName === 'map')
        p.classList.toggle('active', active)
      })
      if (tabName === 'map') setTimeout(updateMap, 100)
    })
  })
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault()
  showError(loginError, '')
  const code = accessCodeInput.value.trim()
  if (code !== ACCESS_CODE) {
    showError(loginError, 'Code incorrect.')
    return
  }
  grantAccess()
  showApp()
})

btnLogout.addEventListener('click', () => {
  hideApp()
})

btnExportAll.addEventListener('click', () => exportCsv(false))
btnExportValidated.addEventListener('click', () => exportCsv(true))

setupTabs()

if (isAccessGranted()) {
  showApp()
} else {
  hideApp()
}
