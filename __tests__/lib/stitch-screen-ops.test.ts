jest.mock("@google/stitch-sdk", () => ({
  stitch: {
    project: jest.fn(),
  },
}));

import { resolveRegenerationMode } from "@/lib/wizard/regeneration-mode";

describe("stitch screen ops (routing)", () => {
  it("variant hint maps to variant mode", () => {
    expect(resolveRegenerationMode("variante", "abc")).toBe("variant");
  });
});
