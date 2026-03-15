/**
 * Filtre taxon.txt : ne garde que les lignes dont le royaume est Animalia ou Plantae.
 * Usage: node scripts/filter-taxon-kingdom.cjs
 * Lit taxon.txt, écrit taxon-filtered.txt. Renommer ensuite taxon-filtered.txt en taxon.txt si souhaité.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dir = path.join(__dirname, '..');
const inputPath = path.join(dir, 'taxon.txt');
const outputPath = path.join(dir, 'taxon-filtered.txt');

const KINGDOMS = new Set(['Animalia', 'Plantae']);

async function run() {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const out = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  let headerLine = null;
  let kingdomIdx = -1;
  let kept = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (!headerLine) {
      headerLine = line;
      const headers = headerLine.split('\t');
      kingdomIdx = headers.indexOf('kingdom');
      if (kingdomIdx === -1) {
        console.error('Colonne "kingdom" introuvable. En-tête:', headers.slice(0, 12));
        process.exit(1);
      }
      out.write(headerLine + '\n');
      continue;
    }

    const cols = line.split('\t');
    const kingdom = (cols[kingdomIdx] || '').trim();
    if (KINGDOMS.has(kingdom)) {
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
  console.log('Terminé. Gardées:', kept, '| Ignorées:', skipped);
  console.log('Écrit dans', outputPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
