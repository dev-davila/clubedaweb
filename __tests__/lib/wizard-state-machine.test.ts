import {
  initialSnapshot,
  onPageReady,
  onPublished,
  onThemeGenerationFailed,
  transition,
} from "@/lib/wizard/state-machine";
import type { WizardSnapshot } from "@/lib/wizard/types";

function step(snapshot: WizardSnapshot, message: string, origin = "http://localhost:3000") {
  return transition({ snapshot, message, origin });
}

/** Percorre as 9 perguntas de discovery com respostas mínimas válidas. */
function completeDiscovery(s: WizardSnapshot): WizardSnapshot {
  const msgs = [
    "vamos",
    "Acme — consultoria de TI para PMEs",
    "Soluções digitais sob medida. Agende uma conversa.\nAgendar reunião",
    "10 anos no mercado. https://acme.example.com",
    "Cloud — migração segura\nSuporte — SLA 24h\nConsultoria — roadmap digital",
    "PMEs em crescimento no Brasil",
    "comercial@acme.com · 11 3000-0000 · São Paulo",
    "corporativo e direto",
    "azul e cinza",
    "não tenho referência",
  ];
  let snap = s;
  for (const msg of msgs) {
    snap = step(snap, msg).next;
  }
  return snap;
}

describe("wizard state machine", () => {
  it("starts in idle and greets when prompted", () => {
    const s0 = initialSnapshot();
    const o = step(s0, "vamos começar");
    expect(o.next.state).toBe("discovery_company");
    expect(o.reply).toMatch(/empresa/i);
    expect(o.sideEffect.kind).toBe("none");
  });

  it("traverses all 9 discovery questions in order", () => {
    let s = initialSnapshot();
    s = step(s, "vamos").next;
    expect(s.state).toBe("discovery_company");

    s = step(s, "Padaria do Tião — padaria artesanal de bairro").next;
    expect(s.state).toBe("discovery_home");
    expect(s.answers.companyName).toBe("Padaria do Tião");

    s = step(s, "Pão fresco todo dia.\nWhatsApp").next;
    expect(s.state).toBe("discovery_about");

    s = step(s, "Fermentação natural desde 1998. não tenho site").next;
    expect(s.state).toBe("discovery_services");

    s = step(s, "Pão artesanal\nBolos\nCafé").next;
    expect(s.state).toBe("discovery_audience");

    s = step(s, "famílias da vizinhança").next;
    expect(s.state).toBe("discovery_contact");

    s = step(s, "11 99999-0000 · Rua das Flores 100").next;
    expect(s.state).toBe("discovery_tone");

    s = step(s, "acolhedor").next;
    expect(s.state).toBe("discovery_colors");

    s = step(s, "marrom e bege").next;
    expect(s.state).toBe("discovery_references");

    s = step(s, "https://pao.com").next;
    expect(s.state).toBe("confirm_brief");
    expect(s.answers.references).toEqual(["https://pao.com"]);
  });

  it("emits start_site_build when user confirms brief", () => {
    const s = completeDiscovery(initialSnapshot());
    expect(s.state).toBe("confirm_brief");

    const o = step(s, "pode gerar");
    expect(o.next.state).toBe("generating_page");
    expect(o.next.currentPage).toBe("home");
    expect(o.sideEffect).toEqual({ kind: "start_site_build" });
  });

  it("supports going back to discovery from confirmation when user says revisar", () => {
    const s = completeDiscovery(initialSnapshot());
    const o = step(s, "revisar");
    expect(o.next.state).toBe("discovery_company");
  });

  it("review_page approves and queues next page generation", () => {
    const s: WizardSnapshot = {
      state: "review_page",
      answers: { companyName: "Acme" },
      currentPage: "home",
      approvedPages: [],
      previewToken: "tok",
    };
    const o = step(s, "aprovar");
    expect(o.next.state).toBe("generating_page");
    expect(o.next.currentPage).toBe("about");
    expect(o.next.approvedPages).toContain("home");
    expect(o.sideEffect).toEqual({ kind: "generate_page", pageType: "about" });
  });

  it("review_page regenerates on outra versão", () => {
    const s: WizardSnapshot = {
      state: "review_page",
      answers: { companyName: "Acme" },
      currentPage: "home",
      previewToken: "tok",
    };
    const o = step(s, "outra versão — mais cores quentes");
    expect(o.next.state).toBe("generating_page");
    expect(o.sideEffect.kind).toBe("generate_page");
    expect(o.sideEffect).toMatchObject({
      kind: "generate_page",
      pageType: "home",
      regenerate: true,
    });
  });

  it("review_page triggers variant mode on Variante quick reply", () => {
    const s: WizardSnapshot = {
      state: "review_page",
      answers: { companyName: "Acme" },
      currentPage: "home",
      previewToken: "tok",
      stitchScreenIds: { home: "screen-abc" },
    };
    const o = step(s, "Variante");
    expect(o.next.state).toBe("generating_page");
    expect(o.sideEffect).toMatchObject({
      kind: "generate_page",
      pageType: "home",
      regenerate: true,
      mode: "variant",
    });
  });

  it("ready_to_publish accepts publish keyword", () => {
    const s: WizardSnapshot = {
      state: "ready_to_publish",
      answers: { companyName: "Acme" },
      previewToken: "abc",
      approvedPages: ["home", "about", "contact", "services", "blog"],
    };
    const o = step(s, "publicar");
    expect(o.next.state).toBe("publishing");
    expect(o.sideEffect.kind).toBe("publish");
  });

  it("ready_to_publish can adjust a specific page", () => {
    const s: WizardSnapshot = {
      state: "ready_to_publish",
      answers: { companyName: "Acme" },
      previewToken: "abc",
    };
    const o = step(s, "ajustar home");
    expect(o.next.state).toBe("generating_page");
    expect(o.sideEffect).toMatchObject({
      kind: "generate_page",
      pageType: "home",
      regenerate: true,
    });
  });

  it("review_page cancels and resets when user says cancelar", () => {
    const s: WizardSnapshot = {
      state: "review_page",
      answers: { companyName: "Acme" },
      currentPage: "home",
    };
    const o = step(s, "cancelar tudo");
    expect(o.next.state).toBe("idle");
    expect(o.next.answers).toEqual({});
  });

  it("onPageReady transitions generating_page → review_page", () => {
    const s: WizardSnapshot = { state: "generating_page", answers: {}, currentPage: "home" };
    const o = onPageReady(s, "Preview: https://example.com/preview/abc?page=home");
    expect(o.next.state).toBe("review_page");
    expect(o.reply).toContain("preview/abc");
  });

  it("onThemeGenerationFailed transitions to error with retry hint", () => {
    const s: WizardSnapshot = { state: "generating_page", answers: {}, currentPage: "home" };
    const o = onThemeGenerationFailed(s, "timeout");
    expect(o.next.state).toBe("error");
    expect(o.next.currentPage).toBe("home");
    expect(o.reply).toMatch(/sim/i);
  });

  it("error + sim retries page generation instead of briefing", () => {
    const s: WizardSnapshot = {
      state: "error",
      answers: { companyName: "Acme" },
      currentPage: "home",
    };
    const o = step(s, "sim");
    expect(o.next.state).toBe("generating_page");
    expect(o.next.currentPage).toBe("home");
    expect(o.sideEffect).toEqual({ kind: "generate_page", pageType: "home" });
  });

  it("onPublished closes the session", () => {
    const s: WizardSnapshot = { state: "publishing", answers: {} };
    const o = onPublished(s);
    expect(o.next.state).toBe("published");
  });
});
