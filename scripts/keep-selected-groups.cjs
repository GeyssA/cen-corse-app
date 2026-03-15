/**
 * Garde uniquement les lignes correspondant à :
 * amphibiens, reptiles, oiseaux, lépidoptères, arachnides, odonates, orthoptères,
 * mammifères, poissons, plantes.
 * Usage: node scripts/keep-selected-groups.cjs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dir = path.join(__dirname, '..');
const inputPath = path.join(dir, 'taxon-filtered.txt');
const tempPath = path.join(dir, 'taxon-filtered.tmp');

// Classes à garder (amphibiens, reptiles, oiseaux, arachnides, mammifères, poissons)
const KEEP_CLASS = new Set([
  'Amphibia',      // amphibiens
  'Reptilia',      // reptiles
  'Aves',          // oiseaux
  'Arachnida',     // arachnides
  'Mammalia',      // mammifères
  'Actinopterygii', // poissons (rayonnés)
  'Chondrichthyes', // poissons (cartilagineux)
  'Sarcopterygii',  // poissons (à nageoires charnues)
  'Petromyzonti',   // lamproies
  'Myxini',        // myxines
]);

// Ordres à garder (lépidoptères, odonates, orthoptères — dans la classe Insecta)
const KEEP_ORDER = new Set([
  'Lepidoptera',   // lépidoptères
  'Odonata',       // odonates
  'Orthoptera',    // orthoptères
]);

async function run() {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const out = fs.createWriteStream(tempPath, { encoding: 'utf8' });
  let headerLine = null;
  let kingdomIdx = -1;
  let classIdx = -1;
  let orderIdx = -1;
  let kept = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (!headerLine) {
      headerLine = line;
      const headers = headerLine.split('\t');
      kingdomIdx = headers.indexOf('kingdom');
      classIdx = headers.indexOf('class');
      orderIdx = headers.indexOf('order');
      if (kingdomIdx === -1 || classIdx === -1 || orderIdx === -1) {
        console.error('Colonnes manquantes. kingdom:', kingdomIdx, 'class:', classIdx, 'order:', orderIdx);
        process.exit(1);
      }
      out.write(headerLine + '\n');
      continue;
    }

    const cols = line.split('\t');
    const kingdom = (cols[kingdomIdx] || '').trim();
    const clazz = (cols[classIdx] || '').trim();
    const order = (cols[orderIdx] || '').trim();

    const keep =
      kingdom === 'Plantae' ||
      KEEP_CLASS.has(clazz) ||
      KEEP_ORDER.has(order);

    if (keep) {
      out.write(line + '\n');
      kept++;
    } else {
      skipped++;
    }

    if ((kept + skipped) % 100000 === 0) {
      console.log('Traité:', kept + skipped, '| Gardées:', kept, '| Ignorées:', skipped);
    }
  }

  out.end();
  await new Promise((resolve) => out.on('finish', resolve));
  fs.renameSync(tempPath, inputPath);
  console.log('Terminé. Gardées:', kept, '| Ignorées:', skipped);
  console.log('Fichier mis à jour :', inputPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
