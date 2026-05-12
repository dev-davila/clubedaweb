"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track gestor (admin) pages
    if (pathname?.startsWith('/gestor')) {
      return;
    }

    const trackPageView = async () => {
      try {
        const startTime = performance.now();

        // Send page view
        await fetch('/api/analytics/pageview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
            duration: Math.round(performance.now() - startTime),
          }),
        }).catch(() => {
          // Silently fail - don't disrupt user experience
        });
      } catch (error) {
        // Analytics errors should never crash the app
      }
    };

    trackPageView();
  }, [pathname]);

  return null;
}
