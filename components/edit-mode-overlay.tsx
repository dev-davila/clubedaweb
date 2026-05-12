"use client";

import { useEffect } from "react";

/**
 * Renderizado quando ?_edit=1 está na URL.
 * Torna todos os elementos com [data-edit] editáveis inline e envia
 * mudanças via postMessage para o parent (editor visual).
 */
export function EditModeOverlay() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const styleEl = document.createElement("style");
    styleEl.textContent = `
      [data-edit] {
        outline: 1.5px dashed transparent;
        outline-offset: 4px;
        transition: outline-color .15s, background-color .15s;
        cursor: text;
        position: relative;
      }
      [data-edit]:hover {
        outline-color: #3b82f6;
        background-color: rgba(59, 130, 246, .04);
      }
      [data-edit][contenteditable="true"] {
        outline: 2px solid #3b82f6 !important;
        background-color: rgba(59, 130, 246, .08) !important;
        outline-offset: 4px;
      }
      [data-edit]:focus {
        outline: 2px solid #3b82f6 !important;
      }
      [data-edit]::after {
        content: attr(data-edit);
        position: absolute;
        top: -22px;
        left: 0;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: #3b82f6;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        opacity: 0;
        pointer-events: none;
        transition: opacity .15s;
        white-space: nowrap;
      }
      [data-edit]:hover::after,
      [data-edit][contenteditable="true"]::after {
        opacity: 1;
      }
      a[data-edit] {
        pointer-events: none;
      }
      body.edit-mode { padding-top: 8px !important; }
    `;
    document.head.appendChild(styleEl);
    document.body.classList.add("edit-mode");

    function setupElement(el: HTMLElement) {
      if ((el as any).__editSetup) return;
      (el as any).__editSetup = true;

      const original = el.textContent ?? "";
      el.setAttribute("data-edit-original", original);

      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (el.getAttribute("contenteditable") === "true") return;
        el.setAttribute("contenteditable", "true");
        el.focus();
        // Place cursor at end
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });

      el.addEventListener("blur", () => {
        el.setAttribute("contenteditable", "false");
        const newValue = el.textContent ?? "";
        if (newValue !== original) {
          const path = el.getAttribute("data-edit") ?? "";
          window.parent.postMessage(
            {
              type: "EDIT_FIELD",
              path,
              value: newValue,
            },
            "*"
          );
        }
      });

      el.addEventListener("keydown", (e) => {
        const ke = e as KeyboardEvent;
        if (ke.key === "Enter" && !ke.shiftKey) {
          e.preventDefault();
          el.blur();
        }
        if (ke.key === "Escape") {
          el.textContent = original;
          el.blur();
        }
      });
    }

    function scan() {
      document.querySelectorAll<HTMLElement>("[data-edit]").forEach(setupElement);
    }
    scan();

    // Observe DOM for new elements (e.g., motion.div mounting late)
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    // Notify parent that edit-mode is ready
    window.parent.postMessage({ type: "EDIT_MODE_READY" }, "*");

    return () => {
      observer.disconnect();
      document.body.classList.remove("edit-mode");
      styleEl.remove();
    };
  }, []);

  return null;
}
