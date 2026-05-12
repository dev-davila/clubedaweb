import type { ComponentType } from "react";

export interface SectionFieldSchema {
  key: string;
  type: "text" | "textarea" | "richtext" | "image" | "color" | "select" | "toggle" | "array";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  itemSchema?: SectionFieldSchema[]; // for array
}

export interface SectionDefinition {
  key: string;
  label: string;
  description?: string;
  fields: SectionFieldSchema[];
  Component: ComponentType<{ data: Record<string, any> }>;
}

export interface TemplateManifest {
  key: string;
  name: string;
  description: string;
  defaultBrand?: Record<string, string>;
  sections: Record<string, SectionDefinition>;
}

export interface PageSectionData {
  key: string;
  data: Record<string, any>;
}

export interface PageLayoutConfig {
  template?: string;
  sections?: PageSectionData[];
  brandOverride?: Record<string, string>;
  // Backwards-compat (legacy renderer)
  heroBg?: string;
  showCTA?: boolean;
  ctaTitle?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaLink?: string;
}
