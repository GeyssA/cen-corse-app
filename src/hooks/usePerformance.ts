import { useCallback, useRef, useEffect, useState } from 'react';

// Hook pour optimiser les performances avec métriques avancées
export function usePerformance() {
  const renderCount = useRef(0);
  const startTime = useRef<number>(Date.now());
  const performanceMetrics = useRef({
    renders: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0
  });
  
  // Détecter les re-renders excessifs avec métriques
  const trackRender = useCallback((componentName: string) => {
    const now = Date.now();
    const renderTime = now - startTime.current;
    
    renderCount.current += 1;
    performanceMetrics.current.renders += 1;
    performanceMetrics.current.lastRenderTime = renderTime;
    
    // Calculer le temps de rendu moyen
    performanceMetrics.current.averageRenderTime = 
      (performanceMetrics.current.averageRenderTime + renderTime) / 2;
    
    // Mesurer l'usage mémoire si disponible
    if ('memory' in performance) {
      performanceMetrics.current.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendu ${renderCount.current} fois`, {
        renderTime: `${renderTime}ms`,
        averageTime: `${performanceMetrics.current.averageRenderTime.toFixed(2)}ms`,
        memory: performanceMetrics.current.memoryUsage ? `${(performanceMetrics.current.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
      });
      
      // Avertir si trop de re-renders
      if (renderCount.current > 10) {
        console.warn(`⚠️ ${componentName} a rendu ${renderCount.current} fois - Optimisation recommandée`);
      }
    }
    
    startTime.current = now;
  }, []);
  
  // Debounce optimisé avec annulation
  const debounce = useCallback(<T extends (...args: unknown[]) => unknown>(
    func: T, 
    wait: number,
    immediate = false
  ) => {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      const callNow = immediate && !timeout;
      
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        timeout = null;
        if (!immediate) func(...args);
      }, wait);
      
      if (callNow) func(...args);
    };
  }, []);
  
  // Throttle amélioré avec options
  const throttle = useCallback(<T extends (...args: unknown[]) => unknown>(
    func: T, 
    limit: number,
    options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
  ) => {
    let inThrottle: boolean;
    let lastFunc: NodeJS.Timeout | null = null;
    let lastRan: number = 0;
    
    return (...args: Parameters<T>) => {
      if (!lastRan) lastRan = Date.now();
      
      const run = () => {
        lastRan = Date.now();
        inThrottle = false;
        if (lastFunc) {
          clearTimeout(lastFunc);
          lastFunc = null;
        }
      };
      
      if (!inThrottle) {
        if (options.leading) {
          func(...args);
        }
        run();
      } else if (options.trailing) {
        if (lastFunc) clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          func(...args);
          run();
        }, limit - (Date.now() - lastRan));
      }
      
      inThrottle = true;
    };
  }, []);
  
  // Hook pour mesurer les performances d'une fonction
  const measurePerformance = useCallback(<T extends (...args: unknown[]) => unknown>(
    func: T,
    name: string
  ) => {
    return (...args: Parameters<T>) => {
      const start = performance.now();
      const result = func(...args);
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    };
  }, []);
  
  // Hook pour lazy loading avec intersection observer
  const useIntersectionObserver = (
    elementRef: React.RefObject<HTMLElement>,
    options: IntersectionObserverInit = {}
  ) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    
    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting);
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
          ...options
        }
      );
      
      observer.observe(element);
      
      return () => {
        observer.unobserve(element);
      };
    }, [elementRef, options]);
    
    return isIntersecting;
  };
  
  // Nettoyage automatique en production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Nettoyer les métriques périodiquement
      const interval = setInterval(() => {
        if (performanceMetrics.current.renders > 100) {
          performanceMetrics.current = {
            renders: 0,
            lastRenderTime: 0,
            averageRenderTime: 0,
            memoryUsage: 0
          };
        }
      }, 60000); // Nettoyer toutes les minutes
      
      return () => clearInterval(interval);
    }
  }, []);
  
  return {
    trackRender,
    debounce,
    throttle,
    measurePerformance,
    useIntersectionObserver,
    renderCount: renderCount.current,
    metrics: performanceMetrics.current
  };
}
