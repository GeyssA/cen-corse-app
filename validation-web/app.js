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
let mapBaseLayers = {}
let clusterGroupObs = null
let clusterGroupSites = null
let layerGroupSitesLine = null

let filterObsText = ''
let filterSitesText = ''

const loginSection = document.getElementById('loginSection')
const dataSection = document.getElementById('dataSection')
const headerActions = document.getElementById('headerActions')
const loginForm = document.getElementById('loginForm')
const accessCodeInput = document.getElementById('accessCode')
const loginError = document.getElementById('loginError')
const loginSubmit = document.getElementById('loginSubmit')
const btnExportAll = document.getElementById('btnExportAll')
const btnExportValidated = document.getElementById('btnExportValidated')
const tbodyObservations = document.getElementById('tbodyObservations')
const theadObservations = document.getElementById('theadObservations')
const tbodySites = document.getElementById('tbodySites')
const theadSites = document.getElementById('theadSites')
const tabCountObs = document.getElementById('tabCountObs')
const tabCountSites = document.getElementById('tabCountSites')

/** 'all' | 'validated' | 'pending' */
let validationFilter = 'all'
let searchObsColumn = 'nom_espece'
let searchSitesColumn = 'nom_du_site'

const selectedObsIds = new Set()
const selectedSiteIds = new Set()

function applyValidationFilter(list) {
  if (validationFilter === 'validated') return list.filter((r) => r.validated)
  if (validationFilter === 'pending') return list.filter((r) => !r.validated)
  return list
}

function getFilteredObservations() {
  let list = applyValidationFilter(observations)
  const q = filterObsText.trim().toLowerCase()
  if (q) {
    const key = searchObsColumn
    list = list.filter(o => {
      const val = o[key]
      if (val == null) return false
      return String(val).toLowerCase().includes(q)
    })
  }
  return list
}

function getFilteredSites() {
  let list = applyValidationFilter(sites)
  const q = filterSitesText.trim().toLowerCase()
  if (q) {
    const key = searchSitesColumn
    list = list.filter(s => {
      const val = s[key]
      if (val == null) return false
      return String(val).toLowerCase().includes(q)
    })
  }
  return list
}

function showToast(message, type = 'success') {
  const stack = document.getElementById('toastStack')
  if (!stack) return
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = message
  stack.appendChild(el)
  setTimeout(() => {
    el.classList.add('out')
    setTimeout(() => el.remove(), 260)
  }, 2200)
}

function setLoading(on) {
  const overlay = document.getElementById('loadingOverlay')
  if (!overlay) return
  overlay.classList.toggle('hidden', !on)
}

function updateStats() {
  const pending =
    observations.filter((o) => !o.validated).length +
    sites.filter((s) => !s.validated).length
  const validated =
    observations.filter((o) => o.validated).length +
    sites.filter((s) => s.validated).length
  const total = observations.length + sites.length
  const elPending = document.getElementById('statPending')
  const elValidated = document.getElementById('statValidated')
  const elTotal = document.getElementById('statTotal')
  if (elPending) elPending.textContent = String(pending)
  if (elValidated) elValidated.textContent = String(validated)
  if (elTotal) elTotal.textContent = String(total)
}

function validatedCell(isValidated) {
  return isValidated
    ? '<td class="cell-validated"><span class="status-pill yes">Validée</span></td>'
    : '<td class="cell-validated"><span class="status-pill no">À valider</span></td>'
}

function setEmptyState(kind, isEmpty) {
  const empty = document.getElementById(kind === 'observation' ? 'emptyObs' : 'emptySites')
  const tableWrap = empty?.previousElementSibling
  if (empty) empty.classList.toggle('hidden', !isEmpty)
  if (tableWrap) tableWrap.classList.toggle('hidden', isEmpty)
}

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

/** Format nom d'espèce : première lettre en majuscule, reste en minuscules, italique à l'affichage. */
function formatSpecies(str) {
  if (str == null || String(str).trim() === '') return '—'
  const t = String(str).trim().toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
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
  headerActions.innerHTML = '<button type="button" class="btn btn-ghost btn-sm" id="btnLogoutHeader">Fermer la session</button>'
  document.getElementById('btnLogoutHeader').addEventListener('click', hideApp)
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
  setLoading(true)
  let obsError = null
  let sitesError = null

  try {
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
  } finally {
    setLoading(false)
  }

  if (obsError || sitesError) {
    const errMsg = [obsError, sitesError].filter(Boolean).map(e => e?.message || e?.code || String(e)).join(' — ')
    showDataHint(
      'Impossible de charger les données. ' +
        (errMsg ? `Erreur Supabase : ${errMsg}. ` : '') +
        'Si le message parle de "row-level security" ou "policy", exécutez le fichier validation-web/supabase-rls-anon.sql dans le SQL Editor de Supabase (voir README).'
    )
  } else if (observations.length === 0 && sites.length === 0) {
    showDataHint(
      'Aucune donnée pour le moment. Si vous avez des lignes dans Supabase, ajoutez des politiques RLS permettant au rôle anon de SELECT sur les tables observations et observation_sites (voir README validation-web).'
    )
  }

  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
  updateStats()
  updateSearchSuggestions()
}

function updateTabCounts() {
  const totalObs = observations.length
  const totalSites = sites.length
  const obsList = getFilteredObservations()
  const siteList = getFilteredSites()
  const selObs = obsList.filter(o => selectedObsIds.has(o.id)).length
  const selSites = siteList.filter(s => selectedSiteIds.has(s.id)).length
  if (tabCountObs) {
    if (selObs > 0) {
      tabCountObs.textContent = `${obsList.length} · ${selObs}`
      tabCountObs.title = `${totalObs} au total, ${obsList.length} filtrées, ${selObs} sélectionnée(s)`
    } else if (obsList.length !== totalObs) {
      tabCountObs.textContent = `${obsList.length}/${totalObs}`
      tabCountObs.title = `${obsList.length} filtrées sur ${totalObs}`
    } else {
      tabCountObs.textContent = String(totalObs)
      tabCountObs.title = ''
    }
  }
  if (tabCountSites) {
    if (selSites > 0) {
      tabCountSites.textContent = `${siteList.length} · ${selSites}`
      tabCountSites.title = `${totalSites} au total, ${siteList.length} filtrés, ${selSites} sélectionné(s)`
    } else if (siteList.length !== totalSites) {
      tabCountSites.textContent = `${siteList.length}/${totalSites}`
      tabCountSites.title = `${siteList.length} filtrés sur ${totalSites}`
    } else {
      tabCountSites.textContent = String(totalSites)
      tabCountSites.title = ''
    }
  }
  updateMapVisibleCount()
}

function updateMapVisibleCount() {
  const el = document.getElementById('mapVisibleCount')
  if (!el) return
  const { obs, siteList } = getMapVisibleObsAndSites()
  const showObs = document.getElementById('mapShowObs')?.checked !== false
  const showSites = document.getElementById('mapShowSites')?.checked !== false
  const nObs = showObs ? obs.length : 0
  const nSites = showSites ? siteList.length : 0
  el.textContent = nObs + ' observation' + (nObs !== 1 ? 's' : '') + ', ' + nSites + ' site' + (nSites !== 1 ? 's' : '') + ' visible' + (nObs + nSites !== 1 ? 's' : '')
}

function getPhotoUrls(record) {
  const raw = record && record.photo_url
  if (!raw) return []
  const s = String(raw).trim()
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s)
      return Array.isArray(arr) ? arr.filter(u => typeof u === 'string') : [s]
    } catch {
      return [s]
    }
  }
  return [s]
}

function serializePhotoUrls(urls) {
  const list = urls.filter(Boolean).slice(0, 3)
  return list.length > 0 ? JSON.stringify(list) : null
}

/** Appelé quand une image photo ne charge pas (ex. supprimée du bucket). Met à jour Supabase et la donnée locale puis réaffiche. */
async function handlePhotoLoadError(id, type, failedUrl) {
  const record = type === 'observation' ? observations.find(x => x.id === id) : sites.find(x => x.id === id)
  if (!record) return
  const urls = getPhotoUrls(record).filter(u => u !== failedUrl)
  const photo_url = serializePhotoUrls(urls)
  const table = type === 'observation' ? 'observations' : 'observation_sites'
  const { error } = await supabase.from(table).update({ photo_url }).eq('id', id)
  if (error) {
    console.error('Mise à jour photo_url après erreur chargement:', error)
    return
  }
  record.photo_url = photo_url
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
}

function openLightbox(urls, index = 0) {
  if (!urls.length) return
  const el = document.getElementById('lightbox')
  const img = document.getElementById('lightboxImg')
  const counter = document.getElementById('lightboxCounter')
  if (!el || !img) return
  window._lightboxUrls = urls
  window._lightboxIndex = index
  img.src = urls[index]
  counter.textContent = urls.length > 1 ? (index + 1) + ' / ' + urls.length : ''
  el.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  const el = document.getElementById('lightbox')
  if (!el) return
  el.classList.add('hidden')
  document.body.style.overflow = ''
}

function lightboxPrev() {
  if (!window._lightboxUrls || window._lightboxUrls.length <= 1) return
  window._lightboxIndex = (window._lightboxIndex - 1 + window._lightboxUrls.length) % window._lightboxUrls.length
  document.getElementById('lightboxImg').src = window._lightboxUrls[window._lightboxIndex]
  document.getElementById('lightboxCounter').textContent = (window._lightboxIndex + 1) + ' / ' + window._lightboxUrls.length
}

function lightboxNext() {
  if (!window._lightboxUrls || window._lightboxUrls.length <= 1) return
  window._lightboxIndex = (window._lightboxIndex + 1) % window._lightboxUrls.length
  document.getElementById('lightboxImg').src = window._lightboxUrls[window._lightboxIndex]
  document.getElementById('lightboxCounter').textContent = (window._lightboxIndex + 1) + ' / ' + window._lightboxUrls.length
}

function renderObservationsTable() {
  const filtered = getFilteredObservations()
  setEmptyState('observation', filtered.length === 0)
  const columns = [
    { key: '_select', label: '', type: 'select', dataType: 'observation' },
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
  theadObservations.innerHTML = '<tr>' + columns.map(c => c.type === 'select' ? '<th class="cell-select"></th>' : `<th>${c.label}</th>`).join('') + '</tr>'
  tbodyObservations.innerHTML = filtered.map(o => {
    const id = o.id || ''
    const checked = selectedObsIds.has(id)
    const cells = columns.map(c => {
      if (c.type === 'select') return `<td class="cell-select"><input type="checkbox" class="row-select" data-id="${id}" data-type="observation" ${checked ? 'checked' : ''} aria-label="Sélectionner"></td>`
      if (c.type === 'photo') {
        const urls = getPhotoUrls(o)
        if (!urls.length) return `<td class="cell-photo"><span class="no-photo">—</span></td>`
        return `<td class="cell-photo"><button type="button" class="cell-photo-btn" data-id="${o.id || ''}" data-type="observation" title="Agrandir">${urls.map((u, i) => `<img src="${u}" alt="" data-index="${i}" />`).join('')}</button></td>`
      }
      if (c.type === 'bool') return `<td>${o[c.key] ? 'Oui' : 'Non'}</td>`
      if (c.type === 'num') return `<td class="cell-numeric">${o[c.key] != null ? Number(o[c.key]).toFixed(5) : '—'}</td>`
      if (c.type === 'date') return `<td class="cell-date">${formatDate(o[c.key])}</td>`
      if (c.type === 'validated') return validatedCell(!!o.validated)
      if (c.type === 'action' && c.action === 'observation') {
        if (o.validated) {
          return `<td class="cell-actions"><button type="button" class="btn btn-sm btn-ghost btn-unvalidate" data-id="${o.id}" data-type="observation">Retirer validation</button></td>`
        }
        return `<td class="cell-actions"><button type="button" class="btn btn-sm btn-validate" data-id="${o.id}" data-type="observation">Valider</button></td>`
      }
      const val = o[c.key]
      if (c.key === 'nom_espece') return `<td class="cell-species">${val != null ? formatSpecies(val) : '—'}</td>`
      return `<td>${val ?? '—'}</td>`
    })
    return '<tr data-id="' + (o.id || '') + '" class="' + (selectedObsIds.has(o.id) ? 'selected' : '') + '">' + cells.join('') + '</tr>'
  }).join('')
  tbodyObservations.querySelectorAll('.row-select[data-type="observation"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id
      if (cb.checked) selectedObsIds.add(id); else selectedObsIds.delete(id)
      cb.closest('tr').classList.toggle('selected', cb.checked)
      updateMap()
      updateTabCounts()
    })
  })
  tbodyObservations.querySelectorAll('.btn-validate').forEach(btn => {
    btn.addEventListener('click', () => validateRow(btn.dataset.id, 'observation'))
  })
  tbodyObservations.querySelectorAll('.btn-unvalidate').forEach(btn => {
    btn.addEventListener('click', () => unvalidateRow(btn.dataset.id, 'observation'))
  })
  tbodyObservations.querySelectorAll('.cell-photo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id
      const type = btn.dataset.type
      const record = type === 'observation' ? observations.find(x => x.id === id) : sites.find(x => x.id === id)
      const urls = record ? getPhotoUrls(record) : []
      const img = btn.querySelector('img')
      const index = img ? parseInt(img.dataset.index, 10) : 0
      if (urls.length) openLightbox(urls, isNaN(index) ? 0 : index)
    })
  })
  tbodyObservations.querySelectorAll('.cell-photo img').forEach((img) => {
    img.addEventListener('error', () => {
      const btn = img.closest('.cell-photo-btn')
      if (btn && btn.dataset.id && btn.dataset.type) handlePhotoLoadError(btn.dataset.id, btn.dataset.type, img.src)
    })
  })
}

function renderSitesTable() {
  const filtered = getFilteredSites()
  setEmptyState('site', filtered.length === 0)
  const columns = [
    { key: '_select', label: '', type: 'select', dataType: 'site' },
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
  theadSites.innerHTML = '<tr>' + columns.map(c => c.type === 'select' ? '<th class="cell-select"></th>' : `<th>${c.label}</th>`).join('') + '</tr>'
  tbodySites.innerHTML = filtered.map(s => {
    const id = s.id || ''
    const checked = selectedSiteIds.has(id)
    const cells = columns.map(c => {
      if (c.type === 'select') return `<td class="cell-select"><input type="checkbox" class="row-select" data-id="${id}" data-type="site" ${checked ? 'checked' : ''} aria-label="Sélectionner"></td>`
      if (c.type === 'photo') {
        const urls = getPhotoUrls(s)
        if (!urls.length) return `<td class="cell-photo"><span class="no-photo">—</span></td>`
        return `<td class="cell-photo"><button type="button" class="cell-photo-btn" data-id="${s.id || ''}" data-type="site" title="Agrandir">${urls.map((u, i) => `<img src="${u}" alt="" data-index="${i}" />`).join('')}</button></td>`
      }
      if (c.type === 'num') return `<td class="cell-numeric">${s[c.key] != null ? Number(s[c.key]).toFixed(c.key === 'length_meters' ? 1 : 5) : '—'}</td>`
      if (c.type === 'date') return `<td class="cell-date">${formatDate(s[c.key])}</td>`
      if (c.type === 'validated') return validatedCell(!!s.validated)
      if (c.type === 'action' && c.action === 'site') {
        if (s.validated) {
          return `<td class="cell-actions"><button type="button" class="btn btn-sm btn-ghost btn-unvalidate" data-id="${s.id}" data-type="site">Retirer validation</button></td>`
        }
        return `<td class="cell-actions"><button type="button" class="btn btn-sm btn-validate" data-id="${s.id}" data-type="site">Valider</button></td>`
      }
      return `<td>${s[c.key] ?? '—'}</td>`
    })
    return '<tr data-id="' + (s.id || '') + '" class="' + (selectedSiteIds.has(s.id) ? 'selected' : '') + '">' + cells.join('') + '</tr>'
  }).join('')
  tbodySites.querySelectorAll('.row-select[data-type="site"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id
      if (cb.checked) selectedSiteIds.add(id); else selectedSiteIds.delete(id)
      cb.closest('tr').classList.toggle('selected', cb.checked)
      updateMap()
      updateTabCounts()
    })
  })
  tbodySites.querySelectorAll('.btn-validate').forEach(btn => {
    btn.addEventListener('click', () => validateRow(btn.dataset.id, 'site'))
  })
  tbodySites.querySelectorAll('.btn-unvalidate').forEach(btn => {
    btn.addEventListener('click', () => unvalidateRow(btn.dataset.id, 'site'))
  })
  tbodySites.querySelectorAll('.cell-photo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id
      const type = btn.dataset.type
      const record = type === 'observation' ? observations.find(x => x.id === id) : sites.find(x => x.id === id)
      const urls = record ? getPhotoUrls(record) : []
      const img = btn.querySelector('img')
      const index = img ? parseInt(img.dataset.index, 10) : 0
      if (urls.length) openLightbox(urls, isNaN(index) ? 0 : index)
    })
  })
  tbodySites.querySelectorAll('.cell-photo img').forEach((img) => {
    img.addEventListener('error', () => {
      const btn = img.closest('.cell-photo-btn')
      if (btn && btn.dataset.id && btn.dataset.type) handlePhotoLoadError(btn.dataset.id, btn.dataset.type, img.src)
    })
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
    showToast('Échec de la validation', 'error')
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
  updateTabCounts()
  updateStats()
  showToast(type === 'observation' ? 'Observation validée' : 'Site validé', 'success')
  const tbody = type === 'observation' ? tbodyObservations : tbodySites
  const row = tbody?.querySelector(`tr[data-id="${id}"]`)
  if (row) {
    row.classList.add('row-flash')
    setTimeout(() => row.classList.remove('row-flash'), 700)
  }
}

async function unvalidateRow(id, type) {
  const table = type === 'observation' ? 'observations' : 'observation_sites'
  const { error } = await supabase
    .from(table)
    .update({ validated: false, validated_at: null })
    .eq('id', id)
  if (error) {
    console.error('Retrait validation:', error)
    showToast('Échec du retrait', 'error')
    return
  }
  if (type === 'observation') {
    const o = observations.find(x => x.id === id)
    if (o) { o.validated = false; o.validated_at = null }
  } else {
    const s = sites.find(x => x.id === id)
    if (s) { s.validated = false; s.validated_at = null }
  }
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
  updateStats()
  showToast('Validation retirée', 'success')
}

function selectAllObservation() {
  getFilteredObservations().forEach(o => { if (o.id) selectedObsIds.add(o.id) })
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
}
function deselectAllObservation() {
  selectedObsIds.clear()
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
}
function invertSelectionObservation() {
  const filtered = getFilteredObservations()
  filtered.forEach(o => {
    if (!o.id) return
    if (selectedObsIds.has(o.id)) selectedObsIds.delete(o.id)
    else selectedObsIds.add(o.id)
  })
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
}

function selectAllSite() {
  getFilteredSites().forEach(s => { if (s.id) selectedSiteIds.add(s.id) })
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
}
function deselectAllSite() {
  selectedSiteIds.clear()
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
}
function invertSelectionSite() {
  const filtered = getFilteredSites()
  filtered.forEach(s => {
    if (!s.id) return
    if (selectedSiteIds.has(s.id)) selectedSiteIds.delete(s.id)
    else selectedSiteIds.add(s.id)
  })
  renderObservationsTable()
  renderSitesTable()
  updateMap()
  updateTabCounts()
}

function updateMap() {
  const container = document.getElementById('map')
  const panel = document.getElementById('panelMap')
  if (!container || !panel.classList.contains('active')) return

  const showObs = document.getElementById('mapShowObs')?.checked !== false
  const showSites = document.getElementById('mapShowSites')?.checked !== false

  const hasObsSelection = selectedObsIds.size > 0
  const hasSiteSelection = selectedSiteIds.size > 0
  const filteredObs = hasObsSelection
    ? getFilteredObservations().filter(o => selectedObsIds.has(o.id))
    : getFilteredObservations()
  const filteredSitesList = hasSiteSelection
    ? getFilteredSites().filter(s => selectedSiteIds.has(s.id))
    : getFilteredSites()

  updateMapVisibleCount()

  if (!mapInstance) {
    mapInstance = L.map('map').setView(CORSICA_CENTER, 8)
    mapBaseLayers = {
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri' }),
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenTopoMap' }),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' })
    }
    mapBaseLayers.osm.addTo(mapInstance)
    clusterGroupObs = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false
    })
    clusterGroupSites = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount()
        let size = 'small'
        if (count >= 20) size = 'large'
        else if (count >= 10) size = 'medium'
        return L.divIcon({
          html: '<div><span>' + count + '</span></div>',
          className: 'marker-cluster marker-cluster-sites marker-cluster-' + size,
          iconSize: L.point(40, 40)
        })
      }
    })
    layerGroupSitesLine = L.layerGroup()
    clusterGroupObs.addTo(mapInstance)
    clusterGroupSites.addTo(mapInstance)
    layerGroupSitesLine.addTo(mapInstance)
    const sel = document.getElementById('basemapSelect')
    if (sel) sel.addEventListener('change', (e) => {
      Object.values(mapBaseLayers).forEach(l => mapInstance.removeLayer(l))
      mapBaseLayers[e.target.value].addTo(mapInstance)
      clusterGroupObs.addTo(mapInstance)
      clusterGroupSites.addTo(mapInstance)
      layerGroupSitesLine.addTo(mapInstance)
    })
  }

  clusterGroupObs.clearLayers()
  clusterGroupSites.clearLayers()
  layerGroupSitesLine.clearLayers()

  if (showObs) {
    filteredObs.forEach(o => {
      if (o.latitude != null && o.longitude != null) {
        const popup = `<div class="popup-content"><div class="popup-title">Observation</div><div class="popup-line"><strong>Date :</strong> ${o.date || '—'}</div><div class="popup-line"><strong>Espèce :</strong> ${(o.nom_espece && formatSpecies(o.nom_espece)) || '—'}</div><div class="popup-line"><strong>Site :</strong> ${o.site || '—'}</div></div>`
        const m = L.circleMarker([o.latitude, o.longitude], {
          radius: 6,
          fillColor: '#0ea5e9',
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9
        }).bindPopup(popup)
        clusterGroupObs.addLayer(m)
      }
    })
  }

  if (showSites) {
    filteredSitesList.forEach(s => {
      if (s.path_coordinates && Array.isArray(s.path_coordinates) && s.path_coordinates.length >= 2) {
        const latLngs = s.path_coordinates.map(p => [p[0], p[1]])
        const popup = `<div class="popup-content"><div class="popup-title">Site linéaire</div><div class="popup-line"><strong>Nom :</strong> ${s.nom_du_site || '—'}</div><div class="popup-line"><strong>Longueur :</strong> ${s.length_meters != null ? s.length_meters + ' m' : '—'}</div></div>`
        const polyline = L.polyline(latLngs, { color: '#14b8a6', weight: 4 }).bindPopup(popup)
        layerGroupSitesLine.addLayer(polyline)
      } else if (s.latitude != null && s.longitude != null && showSites) {
        const popup = `<div class="popup-content"><div class="popup-title">Site</div><div class="popup-line"><strong>Nom :</strong> ${s.nom_du_site || '—'}</div></div>`
        const m = L.circleMarker([s.latitude, s.longitude], {
          radius: 8,
          fillColor: '#10b981',
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9
        }).bindPopup(popup)
        clusterGroupSites.addLayer(m)
      }
    })
  }
}

function getMapVisibleObsAndSites() {
  const hasObsSelection = selectedObsIds.size > 0
  const hasSiteSelection = selectedSiteIds.size > 0
  const obs = hasObsSelection ? getFilteredObservations().filter(o => selectedObsIds.has(o.id)) : getFilteredObservations()
  const siteList = hasSiteSelection ? getFilteredSites().filter(s => selectedSiteIds.has(s.id)) : getFilteredSites()
  return { obs, siteList }
}

function zoomMapToSelection() {
  if (!mapInstance) return
  mapInstance.invalidateSize()
  const showObs = document.getElementById('mapShowObs')?.checked !== false
  const showSites = document.getElementById('mapShowSites')?.checked !== false
  const { obs, siteList } = getMapVisibleObsAndSites()
  const latLngs = []
  if (showObs) obs.forEach(o => { if (o.latitude != null && o.longitude != null) latLngs.push([o.latitude, o.longitude]) })
  if (showSites) {
    siteList.forEach(s => {
      if (s.path_coordinates && Array.isArray(s.path_coordinates)) s.path_coordinates.forEach(p => latLngs.push([p[0], p[1]]))
      else if (s.latitude != null && s.longitude != null) latLngs.push([s.latitude, s.longitude])
    })
  }
  if (latLngs.length === 0) {
    mapInstance.setView(CORSICA_CENTER, 8)
    return
  }
  const bounds = L.latLngBounds(latLngs)
  mapInstance.fitBounds(bounds.pad(0.15), { maxZoom: 14 })
}

function zoomMapToFiltered() {
  if (!mapInstance) return
  const showObs = document.getElementById('mapShowObs')?.checked !== false
  const showSites = document.getElementById('mapShowSites')?.checked !== false
  const filteredObs = getFilteredObservations()
  const filteredSitesList = getFilteredSites()
  const latLngs = []
  if (showObs) filteredObs.forEach(o => { if (o.latitude != null && o.longitude != null) latLngs.push([o.latitude, o.longitude]) })
  if (showSites) {
    filteredSitesList.forEach(s => {
      if (s.path_coordinates && Array.isArray(s.path_coordinates)) s.path_coordinates.forEach(p => latLngs.push([p[0], p[1]]))
      else if (s.latitude != null && s.longitude != null) latLngs.push([s.latitude, s.longitude])
    })
  }
  if (latLngs.length === 0) return
  const bounds = L.latLngBounds(latLngs)
  mapInstance.fitBounds(bounds.pad(0.15), { maxZoom: 10 })
}

function bindSearchAndMapControls() {
  const searchObs = document.getElementById('searchObs')
  const searchSites = document.getElementById('searchSites')
  const searchObsClear = document.getElementById('searchObsClear')
  const searchSitesClear = document.getElementById('searchSitesClear')
  const searchObsColumnEl = document.getElementById('searchObsColumn')
  const searchSitesColumnEl = document.getElementById('searchSitesColumn')
  const filterValidated = document.getElementById('filterValidated')
  const btnShowObsOnMap = document.getElementById('btnShowObsOnMap')
  const btnShowSitesOnMap = document.getElementById('btnShowSitesOnMap')
  const mapShowObs = document.getElementById('mapShowObs')
  const mapShowSites = document.getElementById('mapShowSites')

  const updateClearObsVisibility = () => {
    if (searchObsClear) searchObsClear.setAttribute('aria-hidden', searchObs && searchObs.value.trim() ? 'false' : 'true')
  }
  const updateClearSitesVisibility = () => {
    if (searchSitesClear) searchSitesClear.setAttribute('aria-hidden', searchSites && searchSites.value.trim() ? 'false' : 'true')
  }

  const applyObsFilter = () => {
    filterObsText = searchObs ? searchObs.value : ''
    searchObsColumn = searchObsColumnEl ? searchObsColumnEl.value : 'nom_espece'
    updateClearObsVisibility()
    renderObservationsTable()
    updateMap()
    updateTabCounts()
    updateSearchSuggestions()
  }
  const applySitesFilter = () => {
    filterSitesText = searchSites ? searchSites.value : ''
    searchSitesColumn = searchSitesColumnEl ? searchSitesColumnEl.value : 'nom_du_site'
    updateClearSitesVisibility()
    renderSitesTable()
    updateMap()
    updateTabCounts()
    updateSearchSuggestions()
  }

  if (searchObsClear) {
    searchObsClear.addEventListener('click', () => {
      if (searchObs) { searchObs.value = ''; searchObs.focus() }
      applyObsFilter()
    })
  }
  if (searchSitesClear) {
    searchSitesClear.addEventListener('click', () => {
      if (searchSites) { searchSites.value = ''; searchSites.focus() }
      applySitesFilter()
    })
  }

  if (filterValidated) {
    filterValidated.addEventListener('change', () => {
      validationFilter = filterValidated.value
      renderObservationsTable()
      renderSitesTable()
      updateMap()
      updateTabCounts()
      updateSearchSuggestions()
    })
  }

  if (searchObsColumnEl) searchObsColumnEl.addEventListener('change', applyObsFilter)
  if (searchObs) searchObs.addEventListener('input', applyObsFilter)
  if (searchSitesColumnEl) searchSitesColumnEl.addEventListener('change', applySitesFilter)
  if (searchSites) searchSites.addEventListener('input', applySitesFilter)

  if (btnShowObsOnMap) btnShowObsOnMap.addEventListener('click', () => {
    const tabMap = document.querySelector('.tab[data-tab="map"]')
    if (tabMap) tabMap.click()
    setTimeout(() => { updateMap(); zoomMapToFiltered() }, 150)
  })
  if (btnShowSitesOnMap) btnShowSitesOnMap.addEventListener('click', () => {
    const tabMap = document.querySelector('.tab[data-tab="map"]')
    if (tabMap) tabMap.click()
    setTimeout(() => { updateMap(); zoomMapToFiltered() }, 150)
  })

  if (mapShowObs) mapShowObs.addEventListener('change', updateMap)
  if (mapShowSites) mapShowSites.addEventListener('change', updateMap)

  const lightboxEl = document.getElementById('lightbox')
  const lightboxCloseBtn = lightboxEl?.querySelector('.lightbox-close')
  const lightboxPrevBtn = lightboxEl?.querySelector('.lightbox-prev')
  const lightboxNextBtn = lightboxEl?.querySelector('.lightbox-next')
  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox)
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', lightboxPrev)
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', lightboxNext)
  if (lightboxEl) lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox() })
  document.addEventListener('keydown', (e) => {
    if (lightboxEl?.classList.contains('hidden')) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') lightboxPrev()
    if (e.key === 'ArrowRight') lightboxNext()
  })
}

function updateSearchSuggestions() {
  const listObs = document.getElementById('searchObsSuggestions')
  const listSites = document.getElementById('searchSitesSuggestions')
  const colObs = document.getElementById('searchObsColumn')
  const colSites = document.getElementById('searchSitesColumn')
  const keyObs = colObs ? colObs.value : searchObsColumn
  const keySites = colSites ? colSites.value : searchSitesColumn
  if (listObs && keyObs) {
    let list = applyValidationFilter(observations)
    const values = [...new Set(list.map(o => o[keyObs]).filter(Boolean).map(String))].sort()
    const q = filterObsText.trim().toLowerCase()
    const filtered = q ? values.filter(v => v.toLowerCase().includes(q)) : values
    listObs.innerHTML = filtered.slice(0, 50).map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('')
  }
  if (listSites && keySites) {
    let list = applyValidationFilter(sites)
    const values = [...new Set(list.map(s => s[keySites]).filter(Boolean).map(String))].sort()
    const q = filterSitesText.trim().toLowerCase()
    const filtered = q ? values.filter(v => v.toLowerCase().includes(q)) : values
    listSites.innerHTML = filtered.slice(0, 50).map(v => `<option value="${v.replace(/"/g, '&quot;')}">`).join('')
  }
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
    allCols.slice(1).forEach(k => r.push(escapeCsvCell(k === 'nom_espece' && o[k] != null ? formatSpecies(o[k]) : o[k])))
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
      if (tabName === 'map') setTimeout(() => { updateMap(); zoomMapToSelection() }, 100)
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

let pendingExportValidated = null

btnExportAll.addEventListener('click', () => openExportModal(false))
btnExportValidated.addEventListener('click', () => openExportModal(true))

function openExportModal(validatedOnly) {
  const overlay = document.getElementById('exportModal')
  const message = document.getElementById('exportModalMessage')
  const btnConfirm = document.getElementById('exportModalConfirm')
  const btnCancel = document.getElementById('exportModalCancel')
  if (!overlay || !message) return
  pendingExportValidated = validatedOnly
  if (validatedOnly) {
    message.textContent = 'Exporter uniquement les données validées en fichier .csv ?'
  } else {
    message.textContent = 'Exporter toutes les données en fichier .csv ?'
  }
  overlay.classList.remove('hidden')
}

function closeExportModal() {
  const overlay = document.getElementById('exportModal')
  if (overlay) overlay.classList.add('hidden')
  pendingExportValidated = null
}

function confirmExportModal() {
  if (pendingExportValidated !== null) {
    exportCsv(pendingExportValidated)
    closeExportModal()
  }
}

setupTabs()

bindSearchAndMapControls()
bindSelectionToolbar()

const btnRefresh = document.getElementById('btnRefresh')
if (btnRefresh) btnRefresh.addEventListener('click', () => loadData())

function bindSelectionToolbar() {
  const byId = (id) => document.getElementById(id)
  if (byId('btnObsSelectAll')) byId('btnObsSelectAll').addEventListener('click', selectAllObservation)
  if (byId('btnObsDeselectAll')) byId('btnObsDeselectAll').addEventListener('click', deselectAllObservation)
  if (byId('btnObsInvert')) byId('btnObsInvert').addEventListener('click', invertSelectionObservation)
  if (byId('btnSiteSelectAll')) byId('btnSiteSelectAll').addEventListener('click', selectAllSite)
  if (byId('btnSiteDeselectAll')) byId('btnSiteDeselectAll').addEventListener('click', deselectAllSite)
  if (byId('btnSiteInvert')) byId('btnSiteInvert').addEventListener('click', invertSelectionSite)
  if (byId('btnZoomToSelection')) byId('btnZoomToSelection').addEventListener('click', () => {
    const panelMap = document.getElementById('panelMap')
    const mapTab = document.querySelector('.tab[data-tab="map"]')
    if (panelMap && !panelMap.classList.contains('active') && mapTab) {
      mapTab.click()
      setTimeout(() => { updateMap(); zoomMapToSelection() }, 150)
    } else {
      updateMap()
      zoomMapToSelection()
    }
  })
}

const exportModal = document.getElementById('exportModal')
const exportModalConfirm = document.getElementById('exportModalConfirm')
const exportModalCancel = document.getElementById('exportModalCancel')
if (exportModalConfirm) exportModalConfirm.addEventListener('click', confirmExportModal)
if (exportModalCancel) exportModalCancel.addEventListener('click', closeExportModal)
if (exportModal) exportModal.addEventListener('click', (e) => { if (e.target === exportModal) closeExportModal() })

if (isAccessGranted()) {
  showApp()
} else {
  hideApp()
}
