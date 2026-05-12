"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch GA ID from site config
    const fetchGaId = async () => {
      try {
        const res = await fetch("/api/site-config/analytics");
        if (res.ok) {
          const data = await res.json();
          if (data.analytics_ga4_id) {
            setGaId(data.analytics_ga4_id);
          }
        }
      } catch (error) {
        console.error("Error fetching GA ID:", error);
      }
    };
    fetchGaId();
  }, []);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
