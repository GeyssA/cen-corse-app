/**
 * Extrait les espèces par groupe depuis taxon-filtered.txt.
 * Produit public/taxon/species-by-group.json pour l'autocomplete.
 * Usage: node scripts/extract-species-by-group.cjs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dir = path.join(__dirname, '..');
const inputPath = path.join(dir, 'taxon-filtered.txt');
const outDir = path.join(dir, 'public', 'taxon');

function getGroup(kingdom, clazz, order) {
  if (kingdom === 'Plantae') return 'Plantes';
  if (clazz === 'Amphibia') return 'Amphibiens';
  if (clazz === 'Reptilia') return 'Reptiles';
  if (clazz === 'Aves') return 'Oiseaux';
  if (clazz === 'Arachnida') return 'Arachnides';
  if (clazz === 'Mammalia') return 'Mammifères';
  if (['Actinopterygii', 'Chondrichthyes', 'Sarcopterygii', 'Petromyzonti', 'Myxini'].includes(clazz)) return 'Poissons';
  if (order === 'Lepidoptera') return 'Lépidoptères';
  if (order === 'Odonata') return 'Odonates';
  if (order === 'Orthoptera') return 'Orthoptères';
  return null;
}

function normalizeVernacular(s) {
  if (!s || !s.trim()) return '';
  return s
    .replace(/\s*\(L['eE]\)\s*$/i, '')
    .replace(/\s*\(Le\)\s*$/i, '')
    .replace(/\s*\(La\)\s*$/i, '')
    .replace(/\s*\(Les\)\s*$/i, '')
    .trim();
}

async function run() {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let headerLine = null;
  let kingdomIdx = -1, classIdx = -1, orderIdx = -1;
  let scientificNameIdx = -1, vernacularNameIdx = -1, acceptedNameUsageIdx = -1, taxonRankIdx = -1;

  const byGroup = {
    Plantes: new Set(),
    Amphibiens: new Set(),
    Reptiles: new Set(),
    Oiseaux: new Set(),
    Lépidoptères: new Set(),
    Arachnides: new Set(),
    Odonates: new Set(),
    Orthoptères: new Set(),
    Mammifères: new Set(),
    Poissons: new Set()
  };

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (!headerLine) {
      headerLine = line;
      const h = headerLine.split('\t');
      kingdomIdx = h.indexOf('kingdom');
      classIdx = h.indexOf('class');
      orderIdx = h.indexOf('order');
      scientificNameIdx = h.indexOf('scientificName');
      vernacularNameIdx = h.indexOf('vernacularName');
      taxonRankIdx = h.indexOf('taxonRank');
      acceptedNameUsageIdx = h.indexOf('acceptedNameUsage');
      if ([kingdomIdx, classIdx, orderIdx, scientificNameIdx, vernacularNameIdx, taxonRankIdx, acceptedNameUsageIdx].some(i => i === -1)) {
        console.error('Colonnes manquantes');
        process.exit(1);
      }
      continue;
    }

    const cols = line.split('\t');
    const kingdom = (cols[kingdomIdx] || '').trim();
    const clazz = (cols[classIdx] || '').trim();
    const order = (cols[orderIdx] || '').trim();
    const rank = (cols[taxonRankIdx] || '').trim();
    const scientificName = (cols[scientificNameIdx] || '').trim();
    const acceptedNameUsage = (cols[acceptedNameUsageIdx] || '').trim();
    const vernacularName = normalizeVernacular((cols[vernacularNameIdx] || '').trim());

    const group = getGroup(kingdom, clazz, order);
    if (!group) continue;
    if (rank !== 'species' && rank !== 'subspecies') continue;

    const accepted = acceptedNameUsage || scientificName;
    if (!accepted) continue;

    if (vernacularName) {
      vernacularName.split(',').forEach((part) => {
        const n = normalizeVernacular(part);
        if (n) byGroup[group].add(n + ' - ' + accepted);
      });
    } else {
      byGroup[group].add(accepted);
    }
    if (lineCount % 50000 === 0) console.log('Lignes lues:', lineCount);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const result = {};
  for (const [group, set] of Object.entries(byGroup)) {
    result[group] = Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }
  fs.writeFileSync(path.join(outDir, 'species-by-group.json'), JSON.stringify(result), 'utf8');
  console.log('Terminé. Espèces par groupe:', Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.length])));
  console.log('Écrit:', path.join(outDir, 'species-by-group.json'));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
