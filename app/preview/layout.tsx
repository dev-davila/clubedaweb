// Site chrome leaks: cookie banner and whatsapp button are siblings of the
// main element in RootLayout — they live outside the {children} we render
// here. Hide them via CSS so the preview iframe occupies the full viewport.
// Header/footer fall under the preview wrapper (z-[100000]); no need to hide.
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Hide WhatsApp floating button (fixed bottom-6 right-6 z-50) */
            body > div.fixed.bottom-6.right-6 {
              display: none !important;
            }
            /* Hide cookie consent modal (two stacked z-[9998] and z-[9999] divs) */
            body > div.fixed.inset-0.bg-black\\/60,
            body > div.fixed.inset-0[class*="z-\\[9998\\]"],
            body > div.fixed.inset-0[class*="z-\\[9999\\]"] {
              display: none !important;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
