// Script pour désactiver complètement la toolbar Vercel en PWA
(function() {
  'use strict';
  
  // Vérifier si on est en production
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
    return; // Ne pas exécuter sur localhost ou les domaines Vercel
  }
  
  // Fonction pour supprimer les éléments Vercel
  function removeVercelElements() {
    // Sélecteurs pour tous les éléments possibles de la toolbar Vercel
    const selectors = [
      '[data-vercel-*]',
      '.vercel-*',
      '#__vercel-*',
      '[id*="vercel"]',
      '[class*="vercel"]',
      '[data-*="vercel"]',
      'iframe[src*="vercel"]',
      'script[src*="vercel"]',
      'link[href*="vercel"]'
    ];
    
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && el.parentNode) {
            el.remove();
          }
        });
      } catch (e) {
        // Ignorer les erreurs de sélecteur
      }
    });
  }
  
  // Fonction pour désactiver les objets globaux Vercel
  function disableVercelGlobals() {
    const vercelGlobals = [
      '__VERCEL_DEV_TOOLS__',
      '__VERCEL_DEBUG__',
      '__VERCEL_SPEED_INSIGHTS__',
      '__VERCEL_ANALYTICS__',
      'vercel',
      'Vercel'
    ];
    
    vercelGlobals.forEach(globalName => {
      if (window[globalName]) {
        window[globalName] = false;
      }
    });
  }
  
  // Fonction pour nettoyer le DOM
  function cleanDOM() {
    // Supprimer les attributs data-vercel
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.includes('vercel') || attr.name.includes('debug')) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }
  
  // Exécuter immédiatement
  removeVercelElements();
  disableVercelGlobals();
  cleanDOM();
  
  // Surveiller les changements du DOM
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        removeVercelElements();
        cleanDOM();
      }
    });
  });
  
  // Démarrer l'observation
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Nettoyer périodiquement
  setInterval(() => {
    removeVercelElements();
    disableVercelGlobals();
    cleanDOM();
  }, 1000);
  
})();
