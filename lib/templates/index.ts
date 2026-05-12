import type { TemplateManifest } from "./types";
import { m3BaseTemplate } from "./m3-base/manifest";
import { bitdefenderTemplate } from "./bitdefender/manifest";

const TEMPLATES: Record<string, TemplateManifest> = {
  [m3BaseTemplate.key]: m3BaseTemplate,
  [bitdefenderTemplate.key]: bitdefenderTemplate,
};

export function getTemplate(key?: string): TemplateManifest | null {
  if (!key) return null;
  return TEMPLATES[key] ?? null;
}

export function listTemplates(): TemplateManifest[] {
  return Object.values(TEMPLATES);
}

export function registerTemplate(template: TemplateManifest) {
  TEMPLATES[template.key] = template;
}

export type { TemplateManifest };
