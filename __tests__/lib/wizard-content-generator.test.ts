import { fallbackContent, generateContent } from "@/lib/wizard/content-generator";

const originalFetch = global.fetch;
const originalOpenAI = process.env.OPENAI_API_KEY;
const originalAbacus = process.env.ABACUSAI_API_KEY;

describe("wizard content-generator: fallback", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ABACUSAI_API_KEY;
  });
  afterAll(() => {
    if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
    if (originalAbacus) process.env.ABACUSAI_API_KEY = originalAbacus;
  });

  it("returns fallback content when no API key is set", async () => {
    const c = await generateContent({ companyName: "Acme", industry: "consultoria", tone: "moderno" });
    expect(c.provider).toBe("fallback");
    expect(c.hero.title).toBe("Acme");
    expect(c.features.items).toHaveLength(3);
  });

  it("fallback uses 'Sua empresa' when companyName missing", () => {
    const c = fallbackContent({});
    expect(c.hero.title).toBe("Sua empresa");
    expect(c.features.items[0].icon).toBeDefined();
  });

  it("fallback chooses tone-specific icon for tech", () => {
    const c = fallbackContent({ companyName: "X", industry: "y", tone: "moderno tecnológico" });
    expect(c.features.items[0].icon).toBe("Cpu");
  });

  it("fallback chooses tone-specific icon for cozy", () => {
    const c = fallbackContent({ companyName: "X", industry: "y", tone: "acolhedor e familiar" });
    expect(c.features.items[0].icon).toBe("Heart");
  });

  it("fallback chooses tone-specific icon for premium", () => {
    const c = fallbackContent({ companyName: "X", industry: "y", tone: "premium exclusivo" });
    expect(c.features.items[0].icon).toBe("Award");
  });
});

describe("wizard content-generator: LLM path", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.ABACUSAI_API_KEY;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENAI_API_KEY;
  });

  function mockFetchOnce(payload: string, ok = true, status = 200) {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok,
      status,
      text: async () => "",
      json: async () => ({
        choices: [{ message: { content: payload } }],
      }),
    }) as any;
  }

  it("parses well-formed JSON response", async () => {
    mockFetchOnce(JSON.stringify({
      hero: {
        badge: "PADARIA ARTESANAL",
        title: "Padaria do Tião",
        subtitle: "Pão de fermentação natural feito todo dia.",
        ctaText: "Ver cardápio",
        ctaLink: "#contato",
        secondaryCtaText: "Encomendas",
        secondaryCtaLink: "#servicos",
      },
      features: {
        title: "O que faz a diferença",
        subtitle: "Três coisas que a gente leva a sério.",
        items: [
          { icon: "Wheat", title: "Farinha local", description: "Moinho de pequeno produtor." },
          { icon: "Clock", title: "36h de fermentação", description: "Massa mais leve e digestível." },
          { icon: "Heart", title: "Sem máquinas", description: "Cada peça moldada à mão." },
        ],
      },
      cta: {
        title: "Reserve seu pão",
        text: "Encomende com antecedência para garantir.",
        buttonText: "Falar conosco",
        buttonLink: "#contato",
      },
    }));

    const c = await generateContent({ companyName: "Padaria do Tião", industry: "padaria artesanal" });
    expect(c.provider).toBe("openai");
    expect(c.hero.title).toBe("Padaria do Tião");
    expect(c.features.items[0].icon).toBe("Wheat");
    expect(c.cta.buttonText).toBe("Falar conosco");
  });

  it("strips markdown fences from response", async () => {
    mockFetchOnce("```json\n" + JSON.stringify({
      hero: { badge: "X", title: "Acme", subtitle: "y", ctaText: "z", ctaLink: "#contato", secondaryCtaText: "w", secondaryCtaLink: "#a" },
      features: { title: "f", subtitle: "s", items: [{ icon: "Star", title: "a", description: "b" }] },
      cta: { title: "c", text: "t", buttonText: "go", buttonLink: "#contato" },
    }) + "\n```");

    const c = await generateContent({ companyName: "Acme" });
    expect(c.provider).toBe("openai");
    expect(c.hero.title).toBe("Acme");
  });

  it("falls back when JSON is malformed", async () => {
    mockFetchOnce("not valid json at all");
    const c = await generateContent({ companyName: "Acme", industry: "X" });
    expect(c.provider).toBe("fallback");
    expect(c.hero.title).toBe("Acme");
  });

  it("falls back when JSON shape is wrong", async () => {
    mockFetchOnce(JSON.stringify({ hero: { title: "" } }));
    const c = await generateContent({ companyName: "Acme" });
    expect(c.provider).toBe("fallback");
  });

  it("falls back on HTTP error", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "boom",
      json: async () => ({}),
    }) as any;
    const c = await generateContent({ companyName: "Acme" });
    expect(c.provider).toBe("fallback");
  });

  it("falls back on network/abort error", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("ECONNRESET")) as any;
    const c = await generateContent({ companyName: "Acme" });
    expect(c.provider).toBe("fallback");
  });
});
