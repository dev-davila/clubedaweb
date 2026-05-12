import { Award } from "lucide-react";

export function BitdefenderAwards({ data }: { data: Record<string, any> }) {
  const { title = "Reconhecido pela indústria", items = [], _editIdx } = data as {
    title?: string;
    items?: Array<{ org?: string; description?: string; year?: string }>;
    _editIdx?: number;
  };
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);
  const epi = (i: number, k: string) =>
    _editIdx !== undefined ? `${_editIdx}.items.${i}.${k}` : undefined;
  if (!items.length) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-10 text-foreground" data-edit={ep("title")}>
          {title}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((a, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-2xl p-6 text-center hover:border-red-300 hover:shadow-lg transition"
            >
              <Award className="w-10 h-10 mx-auto mb-3 text-red-600" />
              <div className="font-heading font-bold text-foreground mb-1" data-edit={epi(i, "org")}>{a.org}</div>
              <div className="text-sm text-foreground/70 mb-2" data-edit={epi(i, "description")}>{a.description}</div>
              <span className="inline-block text-xs px-3 py-1 bg-red-50 text-red-700 rounded-full font-semibold" data-edit={epi(i, "year")}>
                {a.year}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
