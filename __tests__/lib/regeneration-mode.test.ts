import { resolveRegenerationMode } from "@/lib/wizard/regeneration-mode";

describe("resolveRegenerationMode", () => {
  it("uses edit for short feedback when screen exists", () => {
    expect(resolveRegenerationMode("escureça o hero", "screen-123")).toBe("edit");
  });

  it("uses variant for outra versão", () => {
    expect(resolveRegenerationMode("outra versão", "screen-123")).toBe("variant");
  });

  it("uses generate without screen id", () => {
    expect(resolveRegenerationMode("ajuste", null)).toBe("generate");
  });
});
