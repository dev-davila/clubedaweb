"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function BitdefenderFaqs({ data }: { data: Record<string, any> }) {
  const { title = "Perguntas frequentes", items = [], _editIdx } = data as {
    title?: string;
    items?: Array<{ q?: string; a?: string }>;
    _editIdx?: number;
  };
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);
  const epi = (i: number, k: string) =>
    _editIdx !== undefined ? `${_editIdx}.items.${i}.${k}` : undefined;
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-foreground mb-10" data-edit={ep("title")}>
          {title}
        </h2>
        <div className="space-y-3">
          {items.map((f, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-foreground pr-4" data-edit={epi(i, "q")}>{f.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-red-600 shrink-0 transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-foreground/80 text-sm leading-relaxed" data-edit={epi(i, "a")}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
