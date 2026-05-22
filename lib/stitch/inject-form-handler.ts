/**
 * Form de contato no Stitch é HTML puro: submit nativo faz POST mas o
 * navegador não sabe lidar com a resposta JSON 201 do /api/contact — fica
 * preso ou navega pro endpoint mostrando JSON.
 *
 * Esta função injeta um script no body que:
 *  1. Intercepta submit dos forms cuja action contém /api/contact
 *  2. Faz fetch com JSON body
 *  3. Mostra toast de sucesso/erro inline
 *  4. Reset do form no sucesso
 *
 * Idempotente: marca via id="__cdw_form_handler".
 */

const FORM_HANDLER_SCRIPT = `
<script id="__cdw_form_handler">
(function() {
  function toast(msg, ok) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:14px 22px;border-radius:12px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.2);max-width:90vw;text-align:center;" + (ok ? "background:#10b981;color:white;" : "background:#ef4444;color:white;");
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity = "0"; t.style.transition = "opacity 0.4s"; }, 4000);
    setTimeout(function(){ t.remove(); }, 4500);
  }

  document.addEventListener("submit", function(e) {
    var form = e.target;
    if (!form || form.tagName !== "FORM") return;
    var action = form.getAttribute("action") || "";
    if (!/\\/api\\/contact/.test(action)) return;
    e.preventDefault();

    var btn = form.querySelector('button[type="submit"], input[type="submit"]');
    var origBtnText = btn ? btn.innerText || btn.value : "";
    if (btn) {
      btn.disabled = true;
      if (btn.innerText !== undefined) btn.innerText = "Enviando...";
      else btn.value = "Enviando...";
    }

    var fd = new FormData(form);
    var payload = {};
    fd.forEach(function(v, k) { payload[k] = v; });

    fetch(action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    .then(function(r) { return r.json().then(function(d) { return { status: r.status, data: d }; }); })
    .then(function(res) {
      if (res.status >= 200 && res.status < 300) {
        toast("Mensagem enviada! Em breve entraremos em contato.", true);
        form.reset();
      } else {
        toast(res.data && res.data.message ? res.data.message : "Não foi possível enviar. Tente novamente.", false);
      }
    })
    .catch(function() {
      toast("Falha na conexão. Tente novamente.", false);
    })
    .finally(function() {
      if (btn) {
        btn.disabled = false;
        if (btn.innerText !== undefined) btn.innerText = origBtnText;
        else btn.value = origBtnText;
      }
    });
  }, true);
})();
</script>
`;

export function injectFormHandler(html: string): string {
  // Só injeta se houver form apontando pra /api/contact
  if (!/<form\b[^>]*action=["'][^"']*\/api\/contact[^"']*["']/i.test(html)) {
    return html;
  }
  // Já injetado?
  if (/__cdw_form_handler/.test(html)) return html;
  // Injeta antes de </body>; fallback antes de </html>
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${FORM_HANDLER_SCRIPT}\n</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${FORM_HANDLER_SCRIPT}\n</html>`);
  }
  return html + FORM_HANDLER_SCRIPT;
}
