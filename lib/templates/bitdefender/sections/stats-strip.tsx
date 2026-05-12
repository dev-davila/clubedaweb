export function BitdefenderStatsStrip({ data }: { data: Record<string, any> }) {
  const { items = [] } = data as { items?: Array<{ value?: string; label?: string }> };
  if (!items.length) return null;
  return (
    <section className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {items.map((s, i) => (
          <div key={i}>
            <div className="text-3xl md:text-4xl font-heading font-bold text-red-500 mb-1">
              {s.value}
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
