// Performance Monitoring - Web Vitals and Performance Observer
// Tracks Core Web Vitals and rendering performance

(function() {
    'use strict';
    
    if (!window.PerformanceMonitor) {
        window.PerformanceMonitor = {};
    }
    
    const PerformanceMonitor = window.PerformanceMonitor;
    
    // Performance metrics storage
    PerformanceMonitor.metrics = {
        fps: 60,
        frameTime: 16.67,
        lcp: null, // Largest Contentful Paint
        fid: null, // First Input Delay
        cls: null, // Cumulative Layout Shift
        fcp: null, // First Contentful Paint
        ttfb: null, // Time to First Byte
        memory: null
    };
    
    // Web Vitals tracking
    PerformanceMonitor.initWebVitals = function() {
        // LCP - Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    PerformanceMonitor.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
                    
                    if (window.CONFIG?.DEBUG) {
                        console.log('[Performance] LCP:', PerformanceMonitor.metrics.lcp);
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('[PerformanceMonitor] LCP observer not supported:', e);
            }
            
            // FID - First Input Delay
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!PerformanceMonitor.metrics.fid) {
                            PerformanceMonitor.metrics.fid = entry.processingStart - entry.startTime;
                            
                            if (window.CONFIG?.DEBUG) {
                                console.log('[Performance] FID:', PerformanceMonitor.metrics.fid);
                            }
                        }
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('[PerformanceMonitor] FID observer not supported:', e);
            }
            
            // CLS - Cumulative Layout Shift
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    PerformanceMonitor.metrics.cls = clsValue;
                    
                    if (window.CONFIG?.DEBUG) {
                        console.log('[Performance] CLS:', PerformanceMonitor.metrics.cls);
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('[PerformanceMonitor] CLS observer not supported:', e);
            }
            
            // FCP - First Contentful Paint
            try {
                const fcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            PerformanceMonitor.metrics.fcp = entry.startTime;
                            
                            if (window.CONFIG?.DEBUG) {
                                console.log('[Performance] FCP:', PerformanceMonitor.metrics.fcp);
                            }
                        }
                    });
                });
                fcpObserver.observe({ entryTypes: ['paint'] });
            } catch (e) {
                console.warn('[PerformanceMonitor] FCP observer not supported:', e);
            }
        }
        
        // TTFB - Time to First Byte
        if ('performance' in window && 'timing' in window.performance) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                PerformanceMonitor.metrics.ttfb = navigation.responseStart - navigation.requestStart;
                
                if (window.CONFIG?.DEBUG) {
                    console.log('[Performance] TTFB:', PerformanceMonitor.metrics.ttfb);
                }
            }
        }
        
        // Memory API (if available)
        if ('memory' in performance) {
            PerformanceMonitor.metrics.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
    };
    
    // Update FPS metrics (called from game loop)
    PerformanceMonitor.updateFPS = function(fps, frameTime) {
        PerformanceMonitor.metrics.fps = fps;
        PerformanceMonitor.metrics.frameTime = frameTime;
    };
    
    // Get performance report
    PerformanceMonitor.getReport = function() {
        return {
            ...PerformanceMonitor.metrics,
            timestamp: Date.now()
        };
    };
    
    // Log performance report
    PerformanceMonitor.logReport = function() {
        const report = PerformanceMonitor.getReport();
        console.log('📊 Performance Report:', report);
        return report;
    };
    
    // Initialize on page load
    if (document.readyState === 'complete') {
        PerformanceMonitor.initWebVitals();
    } else {
        window.addEventListener('load', () => {
            PerformanceMonitor.initWebVitals();
        });
    }
})();

