/**
 * Supprime les lignes dont le phylum est Arthropoda dans taxon-filtered.txt.
 * Usage: node scripts/remove-arthropoda.cjs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dir = path.join(__dirname, '..');
const inputPath = path.join(dir, 'taxon-filtered.txt');
const tempPath = path.join(dir, 'taxon-filtered.tmp');

async function run() {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const out = fs.createWriteStream(tempPath, { encoding: 'utf8' });
  let headerLine = null;
  let phylumIdx = -1;
  let kept = 0;
  let removed = 0;

  for await (const line of rl) {
    if (!headerLine) {
      headerLine = line;
      const headers = headerLine.split('\t');
      phylumIdx = headers.indexOf('phylum');
      if (phylumIdx === -1) {
        console.error('Colonne "phylum" introuvable.');
        process.exit(1);
      }
      out.write(headerLine + '\n');
      continue;
    }

    const cols = line.split('\t');
    const phylum = (cols[phylumIdx] || '').trim();
    if (phylum === 'Arthropoda') {
      removed++;
    } else {
      out.write(line + '\n');
      kept++;
    }

    if ((kept + removed) % 100000 === 0) {
      console.log('Traité:', kept + removed, '| Gardées:', kept, '| Arthropoda supprimées:', removed);
    }
  }

  out.end();
  await new Promise((resolve) => out.on('finish', resolve));
  fs.renameSync(tempPath, inputPath);
  console.log('Terminé. Gardées:', kept, '| Arthropoda supprimées:', removed);
  console.log('Fichier mis à jour :', inputPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
