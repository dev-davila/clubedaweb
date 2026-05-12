"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function NotFoundTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/gestor")) return;

    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname || "/unknown",
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        statusCode: 404,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
