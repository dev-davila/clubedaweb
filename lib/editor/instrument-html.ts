/**
 * Injeta no <head> de um HTML Stitch um script de instrumentação que:
 *  - destaca elementos editáveis ao hover (text, img, a, button)
 *  - ao clicar, faz contentEditable=true e envia postMessage("select")
 *  - ao blur ou Enter, envia postMessage("update") com o novo conteúdo
 *  - intercepta navegação de <a> e clicks de form (preview seguro)
 *
 * Cada elemento editável recebe um `data-edit-id` único (índice numérico).
 * O parent usa esse id pra encontrar o elemento ao salvar o HTML.
 */

const EDITOR_SCRIPT = `
<style id="__cdw_editor_style">
  [data-edit-id]:hover { outline: 2px dashed rgba(16, 185, 129, 0.6) !important; outline-offset: 2px !important; cursor: text !important; }
  [data-edit-id][data-edit-selected] { outline: 2px solid rgba(16, 185, 129, 0.95) !important; outline-offset: 2px !important; }
  img[data-edit-id]:hover { cursor: zoom-in !important; }
  a[data-edit-id]:hover, button[data-edit-id]:hover { cursor: pointer !important; }
  body { caret-color: rgb(16, 185, 129); }
  [data-edit-id]:focus { outline: 2px solid rgba(16, 185, 129, 0.95) !important; outline-offset: 2px !important; }
</style>
<script id="__cdw_editor_runtime">
(function() {
  var EDITABLE_TAGS = ["H1","H2","H3","H4","H5","H6","P","SPAN","STRONG","EM","LI","A","BUTTON","BLOCKQUOTE","LABEL"];
  var IMG_TAG = "IMG";

  function shouldInstrument(el) {
    if (!el || !el.tagName) return false;
    if (el.closest("[data-no-edit]")) return false;
    if (el.tagName === IMG_TAG) return true;
    if (!EDITABLE_TAGS.includes(el.tagName)) return false;
    // Não instrumenta wrappers vazios
    if (!el.textContent || !el.textContent.trim()) return false;
    // Não duplica em elementos aninhados (deixa o filho mais interno texto)
    var hasEditableChild = Array.from(el.children).some(function(c) {
      return EDITABLE_TAGS.includes(c.tagName) && c.textContent && c.textContent.trim();
    });
    if (hasEditableChild) return false;
    return true;
  }

  function instrumentAll() {
    var id = 0;
    document.querySelectorAll("*").forEach(function(el) {
      if (shouldInstrument(el)) {
        el.setAttribute("data-edit-id", String(id++));
      }
    });
    return id;
  }

  var selected = null;

  function selectEl(el) {
    if (selected) selected.removeAttribute("data-edit-selected");
    selected = el;
    if (selected) selected.setAttribute("data-edit-selected", "true");
    var info = el ? {
      editId: el.getAttribute("data-edit-id"),
      tag: el.tagName,
      isImage: el.tagName === IMG_TAG,
      isLink: el.tagName === "A",
      isButton: el.tagName === "BUTTON",
      text: el.textContent ? el.textContent.trim().slice(0, 200) : "",
      href: el.getAttribute("href") || "",
      src: el.getAttribute("src") || "",
      alt: el.getAttribute("alt") || "",
    } : null;
    parent.postMessage({ type: "cdw-edit-select", info: info }, "*");
  }

  document.addEventListener("click", function(e) {
    var target = e.target.closest("[data-edit-id]");
    if (!target) {
      selectEl(null);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    selectEl(target);
    // Não habilita contentEditable em img/a/button — esses são editados via painel lateral
    if (target.tagName === IMG_TAG) return;
    if (target.tagName === "A" || target.tagName === "BUTTON") {
      // Permite edição inline do texto, mas previne navegação
      target.setAttribute("contenteditable", "true");
      target.focus();
      return;
    }
    target.setAttribute("contenteditable", "true");
    target.focus();
  }, true);

  // Bloqueia submit em forms e navegação de links
  document.addEventListener("submit", function(e) { e.preventDefault(); }, true);

  // Envia update on blur do contentEditable
  document.addEventListener("blur", function(e) {
    var target = e.target.closest("[data-edit-id][contenteditable]");
    if (!target) return;
    target.removeAttribute("contenteditable");
    parent.postMessage({
      type: "cdw-edit-update",
      editId: target.getAttribute("data-edit-id"),
      kind: "text",
      value: target.innerHTML,
    }, "*");
  }, true);

  // Enter sai do edit (sem nova linha)
  document.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      var target = e.target.closest("[data-edit-id][contenteditable]");
      if (target) {
        e.preventDefault();
        target.blur();
      }
    }
  }, true);

  // Recebe atualizações do parent (via postMessage)
  window.addEventListener("message", function(e) {
    var data = e.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "cdw-edit-patch") {
      var el = document.querySelector('[data-edit-id="' + data.editId + '"]');
      if (!el) return;
      if (data.kind === "src") el.setAttribute("src", data.value);
      if (data.kind === "alt") el.setAttribute("alt", data.value);
      if (data.kind === "href") el.setAttribute("href", data.value);
      if (data.kind === "text") {
        if (el.tagName === "IMG") el.setAttribute("alt", data.value);
        else el.innerHTML = data.value;
      }
    }
    if (data.type === "cdw-edit-deselect") selectEl(null);
  });

  // Anuncia pro parent que está pronto e quantos elementos instrumentados
  var count = instrumentAll();
  parent.postMessage({ type: "cdw-edit-ready", count: count }, "*");
})();
</script>
`;

export function instrumentHtmlForEditor(html: string): string {
  // Injeta antes do </head> — fallback antes do <body> se não tem </head>
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${EDITOR_SCRIPT}\n</head>`);
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>\n${EDITOR_SCRIPT}\n`);
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `${EDITOR_SCRIPT}\n<body$1>`);
  }
  return EDITOR_SCRIPT + html;
}

/**
 * Remove instrumentação antes de salvar — limpa data-edit-id, data-edit-selected,
 * contenteditable e o <style>/<script> injetados.
 */
export function deinstrumentHtml(html: string): string {
  let out = html;
  out = out.replace(/<style id="__cdw_editor_style">[\s\S]*?<\/style>\s*/i, "");
  out = out.replace(/<script id="__cdw_editor_runtime">[\s\S]*?<\/script>\s*/i, "");
  out = out.replace(/\s*data-edit-id="[^"]*"/g, "");
  out = out.replace(/\s*data-edit-selected="[^"]*"/g, "");
  out = out.replace(/\s*contenteditable="[^"]*"/g, "");
  return out;
}
