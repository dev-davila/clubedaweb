import { Check, X as XIcon } from "lucide-react";

export function BitdefenderComparisonTable({ data }: { data: Record<string, any> }) {
  const {
    title = "Compare as edições",
    subtitle = "",
    columns = [] as string[],
    rows = [] as Array<{ feature?: string; values?: boolean[] }>,
    highlightColumn = -1,
    _editIdx,
  } = data;
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);

  return (
    <section id="comparison" className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3" data-edit={ep("title")}>
            {title}
          </h2>
          {subtitle && <p className="text-foreground/70 text-lg" data-edit={ep("subtitle")}>{subtitle}</p>}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-foreground/70 text-sm uppercase tracking-wider">
                  Recurso
                </th>
                {columns.map((c: string, i: number) => (
                  <th
                    key={i}
                    className={`text-center p-4 font-heading font-bold text-sm ${
                      i === highlightColumn ? "bg-red-600 text-white" : "text-foreground"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="p-4 text-sm text-foreground/85">{row.feature}</td>
                  {(row.values ?? []).map((v, j) => (
                    <td
                      key={j}
                      className={`text-center p-4 ${
                        j === highlightColumn ? "bg-red-50" : ""
                      }`}
                    >
                      {v ? (
                        <Check className="w-5 h-5 mx-auto text-red-600" />
                      ) : (
                        <XIcon className="w-5 h-5 mx-auto text-gray-300" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
