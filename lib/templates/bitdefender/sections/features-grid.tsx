import * as Lucide from "lucide-react";

function Icon({ name, className }: { name?: string; className?: string }) {
  const Comp = name && (Lucide as any)[name] ? (Lucide as any)[name] : Lucide.Shield;
  return <Comp className={className} />;
}

export function BitdefenderFeaturesGrid({ data }: { data: Record<string, any> }) {
  const { title = "", subtitle = "", items = [], _editIdx } = data as {
    title?: string;
    subtitle?: string;
    items?: Array<{ icon?: string; title?: string; description?: string }>;
    _editIdx?: number;
  };
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);
  const epi = (i: number, k: string) =>
    _editIdx !== undefined ? `${_editIdx}.items.${i}.${k}` : undefined;
  if (!items.length) return null;
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3" data-edit={ep("title")}>
                {title}
              </h2>
            )}
            {subtitle && <p className="text-foreground/70 text-lg" data-edit={ep("subtitle")}>{subtitle}</p>}
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it, i) => (
            <div
              key={i}
              className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon name={it.icon} className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 text-foreground" data-edit={epi(i, "title")}>
                {it.title}
              </h3>
              <p className="text-foreground/70 text-sm leading-relaxed" data-edit={epi(i, "description")}>
                {it.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
