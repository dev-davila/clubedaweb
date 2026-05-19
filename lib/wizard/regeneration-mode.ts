import type { StitchPipelineMode } from "@/lib/stitch/stitch-pipeline";

const REGENERATE_STRONG =
  /\b(outra versão|outra versao|regerar|gerar outr|não gostei|nao gostei|refazer|do zero)\b/i;
const VARIANT_HINT = /\b(variante|opção b|opcao b|outro visual|outra opção|outra opcao)\b/i;

function editMaxChars(): number {
  const n = Number(process.env.STITCH_EDIT_MAX_CHARS ?? 120);
  return Number.isFinite(n) && n > 20 ? n : 120;
}

export function resolveRegenerationMode(
  feedback: string | null | undefined,
  existingScreenId: string | null | undefined,
  explicitMode?: StitchPipelineMode,
): StitchPipelineMode {
  if (explicitMode) return explicitMode;
  if (!existingScreenId?.trim()) return "generate";

  const text = feedback?.trim() ?? "";
  if (!text) return "generate";

  if (VARIANT_HINT.test(text) || REGENERATE_STRONG.test(text)) {
    return "variant";
  }

  if (text.length <= editMaxChars() && !REGENERATE_STRONG.test(text)) {
    return "edit";
  }

  return "generate";
}
