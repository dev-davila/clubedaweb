import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

export function BitdefenderCta({ data }: { data: Record<string, any> }) {
  const {
    title = "Pronto para proteger sua empresa?",
    subtitle = "",
    buttonText = "Solicitar orçamento",
    buttonLink = "/contato",
    phoneText = "",
    phoneLink = "",
    _editIdx,
  } = data;
  const ep = (k: string) => (_editIdx !== undefined ? `${_editIdx}.${k}` : undefined);

  return (
    <section className="bg-gradient-to-br from-red-700 to-red-900 py-16 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4" data-edit={ep("title")}>{title}</h2>
        {subtitle && (
          <p className="text-lg text-white/85 max-w-2xl mx-auto mb-8" data-edit={ep("subtitle")}>{subtitle}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={buttonLink}
            className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition shadow-lg"
          >
            <span data-edit={ep("buttonText")}>{buttonText}</span>
            <ArrowRight size={18} />
          </Link>
          {phoneText && (
            <a
              href={phoneLink || `tel:${phoneText.replace(/\D/g, "")}`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition"
            >
              <Phone size={18} />
              {phoneText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
