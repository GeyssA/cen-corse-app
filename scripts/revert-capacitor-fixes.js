const fs = require('fs');
const path = require('path');

// Script pour retirer les modifications Capacitor après le build

console.log('🔄 Retrait des modifications Capacitor...');

const files = [
  'src/app/presentation/[id]/page.tsx',
  'src/app/projets/[id]/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Retirer generateStaticParams si présent (uniquement ceux marqués [CAPACITOR FIX])
    if (content.includes('[CAPACITOR FIX]')) {
      // Supprimer la fonction generateStaticParams et ses commentaires
      content = content.replace(
        /\/\/ \[CAPACITOR FIX\][\s\S]*?export async function generateStaticParams\(\) \{\n[\s\S]*?\}\n\n/g,
        ''
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Modifications retirées: ${file}`);
    }
  }
});

console.log('✅ Modifications Capacitor retirées');

