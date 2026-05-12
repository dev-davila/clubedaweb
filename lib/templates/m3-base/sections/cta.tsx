import Link from "next/link";

export function CtaSection({ data }: { data: Record<string, any> }) {
  const {
    title = "Quer saber mais?",
    text = "Entre em contato com nossos especialistas",
    buttonText = "Fale Conosco",
    buttonLink = "/contato",
    _editIdx,
  } = data;
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);
  return (
    <section className="bg-gradient-to-r from-primary to-primary/80 py-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-3" data-edit={ep("title")}>
          {title}
        </h2>
        <p className="text-white/85 mb-6" data-edit={ep("text")}>{text}</p>
        <Link
          href={buttonLink}
          className="inline-flex items-center px-8 py-3 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 transition"
        >
          <span data-edit={ep("buttonText")}>{buttonText}</span>
        </Link>
      </div>
    </section>
  );
}
