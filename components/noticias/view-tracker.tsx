"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Fire-and-forget view count increment
    fetch(`/api/posts/${slug}/views`, { method: "POST" }).catch(() => {});
  }, [slug]);

  return null;
}
