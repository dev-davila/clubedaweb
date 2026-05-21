"use client";

import { ensurePreviewHtml } from "@/lib/ai-site/ensure-preview-html";

interface StitchPageViewProps {
  html: string;
  /** Banner no topo (preview: navegação + aviso). */
  banner?: React.ReactNode;
  /** Ocupa viewport inteira e esconde chrome do layout pai. */
  fullViewport?: boolean;
}

const IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation";

export function StitchPageView({ html, banner, fullViewport = false }: StitchPageViewProps) {
  const srcDoc = ensurePreviewHtml(html);

  if (fullViewport) {
    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > header,
              body > div.flex.flex-col.min-h-screen > header,
              body > div.flex.flex-col.min-h-screen > footer,
              body > div.fixed.bottom-6.right-6 { display: none !important; }
            `,
          }}
        />
        <div
          className="fixed inset-0 z-[100000] flex flex-col bg-zinc-950"
          data-stitch-page-root="true"
        >
          {banner ? <div className="shrink-0">{banner}</div> : null}
          <iframe
            title="Página gerada"
            srcDoc={srcDoc}
            sandbox={IFRAME_SANDBOX}
            className="flex-1 w-full border-0"
          />
        </div>
      </>
    );
  }

  return (
    <div className="w-full -mx-0" data-stitch-embed="true">
      {banner ? <div className="mb-0">{banner}</div> : null}
      <iframe
        title="Página gerada"
        srcDoc={srcDoc}
        sandbox={IFRAME_SANDBOX}
        className="w-full border-0 min-h-[80vh]"
        style={{ height: "calc(100vh - 8rem)" }}
      />
    </div>
  );
}
