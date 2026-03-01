/**
 * Commit et push vers GitHub via simple-git (contourne le PATH du terminal).
 * Usage: node scripts/git-push.js [message de commit]
 */
const path = require('path');

async function main() {
  let simpleGit;
  try {
    simpleGit = require('simple-git');
  } catch (e) {
    console.error('Installez simple-git : npm install --save-dev simple-git');
    process.exit(1);
  }

  const root = path.resolve(__dirname, '..');
  const git = simpleGit({ baseDir: root });

  const message = process.argv.slice(2).join(' ') ||
    'Modals site/observation: 3 photos max, design teal/sections, champ date mobile, date site modifiable, espacement boutons GPS';

  try {
    const status = await git.status();
    if (status.files.length === 0 && status.staged.length === 0 && status.not_added.length === 0 && status.created.length === 0 && status.deleted.length === 0) {
      console.log('Aucun changement à committer.');
      return;
    }

    await git.add('.');
    await git.commit(message);
    await git.push();
    console.log('Commit et push reussis.');
  } catch (err) {
    if (err.message && err.message.includes('not a git repository')) {
      console.error('Ce dossier n\'est pas un depot git. Initialisez avec: git init');
      process.exit(1);
    }
    if (err.message && err.message.includes('not found')) {
      console.error('Git n\'est pas installe ou pas dans le PATH.');
      console.error('Installez Git pour Windows: https://git-scm.com/download/win');
      process.exit(1);
    }
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
