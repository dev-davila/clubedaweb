import {
  REQUIRED_HOME_CHAT_BLOCKS,
  REQUIRED_HOME_CHAT_PREVIEW_SECTIONS,
  REQUIRED_HOME_LEGACY_M3_BLOCKS,
  REQUIRED_PAGE_BLOCKS,
  WIZARD_TO_TEMPLATE_BLOCK,
  assertHomeChatContent,
  normalizeBlockKey,
} from "@/lib/cms/required-blocks";

describe("required blocks contract", () => {
  it("wizard home requires hero, features, cta", () => {
    expect(REQUIRED_HOME_CHAT_BLOCKS).toEqual(["hero", "features", "cta"]);
    expect(() => assertHomeChatContent({ hero: {}, features: {} })).toThrow(/cta/);
    expect(() =>
      assertHomeChatContent({ hero: {}, features: {}, cta: {} }),
    ).not.toThrow();
  });

  it("maps wizard blocks to template section keys", () => {
    expect(WIZARD_TO_TEMPLATE_BLOCK.features).toBe("features-grid");
  });

  it("preview fallback follows stitch home standard", () => {
    expect(REQUIRED_HOME_CHAT_PREVIEW_SECTIONS).toEqual([
      "hero",
      "features-grid",
      "cta",
    ]);
  });

  it("legacy M3 home has full marketing stack", () => {
    expect(REQUIRED_HOME_LEGACY_M3_BLOCKS).toContain("news");
    expect(REQUIRED_HOME_LEGACY_M3_BLOCKS.length).toBeGreaterThan(
      REQUIRED_HOME_CHAT_BLOCKS.length,
    );
  });

  it("every required page type defines template blocks", () => {
    for (const page of ["home", "about", "contact", "services", "blog"] as const) {
      expect(REQUIRED_PAGE_BLOCKS[page].length).toBeGreaterThan(0);
      expect(REQUIRED_PAGE_BLOCKS[page]).toContain("hero");
    }
  });

  it("normalizes legacy aliases", () => {
    expect(normalizeBlockKey("whyUs")).toBe("features-grid");
    expect(normalizeBlockKey("services")).toBe("features-grid");
  });
});
