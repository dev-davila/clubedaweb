import { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { SITE_CONFIG } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato com a M3Solutions. Estamos prontos para ajudar sua empresa."
};

async function getSiteConfig() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { category: { in: ['contact', 'general'] } }
    });
    const result: Record<string, string> = {};
    configs.forEach(c => {
      result[c.key] = c.value;
    });
    return result;
  } catch {
    return {};
  }
}

export default async function ContatoPage() {
  const dbConfig = await getSiteConfig();
  
  const phone = dbConfig.contact_phone || SITE_CONFIG.phone;
  const whatsapp = dbConfig.contact_whatsapp || SITE_CONFIG.whatsapp;
  const whatsappLink = dbConfig.contact_whatsapp 
    ? `https://wa.me/55${dbConfig.contact_whatsapp.replace(/\D/g, '')}` 
    : SITE_CONFIG.whatsappLink;
  const email = dbConfig.contact_email || SITE_CONFIG.email;
  const address = dbConfig.contact_address || SITE_CONFIG.address;
  const addressLink = dbConfig.contact_address
    ? `https://maps.google.com/?q=${encodeURIComponent(dbConfig.contact_address)}`
    : SITE_CONFIG.addressLink;

  const contactInfo = [
    {
      icon: Phone,
      title: "Telefone",
      value: phone,
      link: `tel:${phone?.replace(/\D/g, "")}`
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: whatsapp,
      link: whatsappLink
    },
    {
      icon: Mail,
      title: "E-mail",
      value: email,
      link: `mailto:${email}`
    },
    {
      icon: MapPin,
      title: "Endereço",
      value: address,
      link: addressLink
    }
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Contato</h1>
            <p className="text-xl text-primary-foreground/80">
              Entre em contato conosco. Estamos prontos para ajudar sua empresa a crescer com tecnologia.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Fale Conosco
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Preencha o formulário ao lado ou entre em contato diretamente pelos canais abaixo. 
                Nossa equipe responderá o mais rápido possível.
              </p>

              <div className="space-y-6 mb-12">
                {contactInfo?.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.title}
                      href={item.link}
                      target={item.link?.startsWith("http") ? "_blank" : undefined}
                      rel={item.link?.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition group"
                    >
                      <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 transition">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.title}</div>
                        <div className="text-gray-600">{item.value}</div>
                      </div>
                    </a>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl">
                <Clock className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-semibold text-gray-900">Horário de Atendimento Comercial</div>
                  <div className="text-gray-600">Segunda a Sexta: 8h às 18h</div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Envie sua mensagem
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-96 relative">
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${address}, ${dbConfig.contact_city || ''}, ${dbConfig.contact_state || 'SP'}, Brasil`)}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localização M3Solutions"
        />
      </section>
    </>
  );
}
