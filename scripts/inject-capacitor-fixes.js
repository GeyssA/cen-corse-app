const fs = require('fs');
const path = require('path');

// Script pour injecter les modifications Capacitor dans les fichiers nécessaires
// Ces modifications sont temporaires et uniquement pour le build Capacitor

console.log('🔧 Injection des modifications Capacitor...');

const fixes = [
  {
    file: 'src/app/presentation/[id]/page.tsx',
    search: "'use client'\n\nimport { useState, useEffect, useRef } from 'react'",
    inject: "'use client'\n\n// [CAPACITOR FIX] Fonction pour l'export statique (injectée automatiquement)\nexport async function generateStaticParams() {\n  return [\n    { id: '1' },\n    { id: '2' },\n  ]\n}\n\nimport { useState, useEffect, useRef } from 'react'"
  },
  {
    file: 'src/app/projets/[id]/page.tsx',
    search: "'use client'\n\nimport Link from 'next/link'",
    inject: "'use client'\n\n// [CAPACITOR FIX] Fonction pour l'export statique (injectée automatiquement)\nexport async function generateStaticParams() {\n  return [\n    { id: '1' },\n    { id: '2' },\n    { id: '3' },\n  ]\n}\n\nimport Link from 'next/link'"
  }
];

fixes.forEach(({ file, search, inject }) => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si la modification n'a pas déjà été faite
    if (!content.includes('generateStaticParams')) {
      // Injecter la modification
      content = content.replace(search, inject);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Modifié: ${file}`);
    } else {
      console.log(`⏭️  Déjà modifié: ${file}`);
    }
  } else {
    console.warn(`⚠️  Fichier non trouvé: ${file}`);
  }
});

console.log('✅ Modifications Capacitor injectées');

