/**
 * Reconstruit taxon-filtered.txt en ne gardant que les 10 groupes de l'app :
 * Plantae, Amphibiens, Reptiles, Oiseaux, Lépidoptères, Arachnides, Odonates,
 * Orthoptères, Mammifères, Poissons.
 * À utiliser à la place de filter-taxon-kingdom + remove-arthropoda.
 * Ne pas lancer remove-arthropoda après ce script.
 *
 * Usage: node scripts/rebuild-taxon-filtered.cjs
 * Prérequis: taxon.txt à la racine du projet (export TAXREF complet ou avec Animalia + Plantae).
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dir = path.join(__dirname, '..');
const inputPath = path.join(dir, 'taxon.txt');
const outputPath = path.join(dir, 'taxon-filtered.txt');

const KINGDOMS = new Set(['Animalia', 'Plantae']);

const KEEP_CLASS = new Set([
  'Amphibia',
  'Reptilia',
  'Aves',
  'Arachnida',
  'Mammalia',
  'Actinopterygii',
  'Chondrichthyes',
  'Sarcopterygii',
  'Petromyzonti',
  'Myxini'
]);

const KEEP_ORDER = new Set([
  'Lepidoptera',
  'Odonata',
  'Orthoptera'
]);

async function run() {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const out = fs.createWriteStream(outputPath, { encoding: 'utf8' });
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
      KINGDOMS.has(kingdom) &&
      (
        kingdom === 'Plantae' ||
        KEEP_CLASS.has(clazz) ||
        KEEP_ORDER.has(order)
      );

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
  console.log('Terminé. Gardées:', kept, '| Ignorées:', skipped);
  console.log('Écrit:', outputPath);
  console.log('Lancez ensuite: node scripts/extract-species-by-group.cjs');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
