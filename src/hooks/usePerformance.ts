import { useCallback, useRef } from 'react';

// Hook pour optimiser les performances
export function usePerformance() {
  const renderCount = useRef(0);
  
  // Détecter les re-renders excessifs
  const trackRender = useCallback((componentName: string) => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendu ${renderCount.current} fois`);
    }
  }, []);
  
  // Debounce pour les fonctions fréquemment appelées
  const debounce = useCallback(<T extends (...args: unknown[]) => unknown>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);
  
  // Throttle pour limiter la fréquence d'exécution
  const throttle = useCallback(<T extends (...args: unknown[]) => unknown>(func: T, limit: number) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);
  
  return {
    trackRender,
    debounce,
    throttle,
    renderCount: renderCount.current
  };
}
