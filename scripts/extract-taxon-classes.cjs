const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'taxon.txt');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split(/\r?\n/);
const header = lines[0].split('\t');
const classIdx = header.indexOf('class');
if (classIdx === -1) {
  console.error('Column "class" not found. Header:', header.slice(0, 15));
  process.exit(1);
}
const set = new Set();
for (let i = 1; i < lines.length; i++) {
  const row = lines[i].split('\t');
  const v = (row[classIdx] || '').trim();
  if (v) set.add(v);
}
const arr = Array.from(set).sort();
const outPath = path.join(__dirname, '..', 'src', 'data', 'taxonClasses.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(arr, null, 2), 'utf8');
console.log('Wrote', arr.length, 'classes to', outPath);
