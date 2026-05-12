import * as Lucide from "lucide-react";
import { Check } from "lucide-react";

function Icon({ name, className }: { name?: string; className?: string }) {
  const Comp = name && (Lucide as any)[name] ? (Lucide as any)[name] : Lucide.Building2;
  return <Comp className={className} />;
}

export function BitdefenderUseCases({ data }: { data: Record<string, any> }) {
  const { title = "Casos de uso", items = [], _editIdx } = data as {
    title?: string;
    items?: Array<{ icon?: string; title?: string; description?: string; benefits?: string[] }>;
    _editIdx?: number;
  };
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);
  const epi = (i: number, k: string) =>
    _editIdx !== undefined ? `${_editIdx}.items.${i}.${k}` : undefined;
  const epb = (i: number, j: number) =>
    _editIdx !== undefined ? `${_editIdx}.items.${i}.benefits.${j}` : undefined;
  if (!items.length) return null;
  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-foreground mb-10" data-edit={ep("title")}>
          {title}
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((u, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition"
            >
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Icon name={u.icon} className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-2 text-foreground" data-edit={epi(i, "title")}>
                {u.title}
              </h3>
              <p className="text-foreground/70 text-sm mb-4 leading-relaxed" data-edit={epi(i, "description")}>
                {u.description}
              </p>
              {Array.isArray(u.benefits) && u.benefits.length > 0 && (
                <ul className="space-y-2">
                  {u.benefits.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground/85">
                      <Check className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span data-edit={epb(i, j)}>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
