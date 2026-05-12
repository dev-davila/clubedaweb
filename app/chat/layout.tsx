"use client";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Hide ALL root layout elements: top bar, header, footer, whatsapp float, cookie consent */}
      <style>{`
        header, footer, [data-cookie-consent] { display: none !important; }
        /* Hide the top contact bar (div above header with bg-primary) */
        header + *, header ~ * { /* noop, handled below */ }
        .bg-primary.text-white.text-sm.py-2 { display: none !important; }
        /* Hide whatsapp float */
        .fixed.bottom-6.right-6, .fixed.bottom-4.right-4 { display: none !important; }
        /* Fullscreen chat */
        main.flex-1, main { padding: 0 !important; margin: 0 !important; min-height: 100vh !important; }
        body > div > div > div.min-h-screen { min-height: 100vh !important; }
      `}</style>
      {children}
    </>
  );
}
