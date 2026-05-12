"use client";

import { motion } from "framer-motion";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface TextSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    body?: string;
    alignment?: "left" | "center" | "right";
  };
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    maxWidth?: string;
  };
}

// Simple markdown to HTML converter
function convertToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-10 mb-6">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-12 mb-8">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-600 hover:underline">$1</a>')
    .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2">$1</li>')
    .replace(/(<li.*<\/li>)/s, '<ul class="list-disc my-4">$1</ul>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
    .replace(/^(?!<)(.+)$/gm, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>');
}

export default function TextSection({ content, styles }: TextSectionProps) {
  const {
    title,
    subtitle,
    body = "",
    alignment = "left"
  } = content;

  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  };

  return (
    <section
      className="py-16"
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        paddingTop: styles?.paddingTop,
        paddingBottom: styles?.paddingBottom
      }}
    >
      <div
        className="container mx-auto px-4"
        style={{ maxWidth: styles?.maxWidth || "800px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={alignmentClasses[alignment]}
        >
          {title && (
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: styles?.textColor || "#111827" }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xl text-gray-600 mb-8">{subtitle}</p>
          )}
          {body && (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(convertToHtml(body)) }}
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}
