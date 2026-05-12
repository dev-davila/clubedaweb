"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Plus, MessageCircle } from "lucide-react";
import Link from "next/link";

const FAQS = [
  {
    q: "Qual edição Bitdefender é a certa pra minha empresa?",
    a: "Depende do tamanho e maturidade do seu time de TI. Business Security cobre PMEs (5–100 endpoints) com proteção essencial. Premium adiciona EDR e HyperDetect pra empresas em crescimento. Enterprise traz XDR e MDR opcional pra organizações com SOC. Fale com um especialista e a gente recomenda em até 24h."
  },
  {
    q: "Quanto tempo leva pra implementar?",
    a: "Implementação típica é entre 2 e 5 dias úteis. Deploy em endpoints é em minutos via pacote MSI/PKG/RPM, link de download ou integração com ferramentas de gerenciamento (SCCM, Intune, JAMF). Não há servidor local — tudo gerenciado via console na nuvem."
  },
  {
    q: "Bitdefender funciona offline?",
    a: "Sim. A proteção em endpoint funciona 100% offline com a base de assinaturas local + machine learning. A console de gerenciamento é cloud, mas os endpoints continuam protegidos mesmo sem conexão — sincronizam quando voltam online."
  },
  {
    q: "Existe suporte em português?",
    a: "Sim. Toda comunicação, documentação e suporte são em português pela M3Solutions. Resposta em até 4h em horário comercial, com SLA estendido disponível pra Premium e Enterprise."
  },
  {
    q: "Como funciona o licenciamento?",
    a: "Licenciamento anual por endpoint (estação ou servidor). Sem custos de implementação. Volume e plurianualidade têm desconto progressivo. Você paga pelo que usa — incluir/remover endpoints é instantâneo na console."
  },
  {
    q: "Bitdefender atende compliance LGPD/ISO?",
    a: "Sim. Logs detalhados, controles granulares de acesso, trilha de auditoria completa e relatórios de compliance prontos. Premium e Enterprise incluem DLP (prevenção de perda de dados) e forense pós-incidente."
  }
];

export function FaqSection() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 md:py-32 bg-background relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 lg:sticky lg:top-28 self-start"
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-6">
              FAQ
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold leading-[1.05] tracking-tightest text-foreground mb-5">
              Perguntas que
              <span className="block text-primary">a gente escuta sempre.</span>
            </h2>
            <p className="text-foreground/65 text-lg leading-relaxed mb-8 max-w-md">
              Tirou a dúvida mas quer falar com alguém? Os especialistas da M3Solutions respondem em até 4h.
            </p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-2xl font-semibold text-sm hover:scale-[1.03] transition-all"
            >
              <MessageCircle size={16} />
              Falar com especialista
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div className="divide-y divide-border/70 border-y border-border/70">
              {FAQS.map((f, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-start justify-between gap-6 py-6 text-left group"
                  >
                    <span className="font-heading text-lg md:text-xl font-bold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
                      {f.q}
                    </span>
                    <span
                      className={`shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center transition-all duration-300 ${
                        open === i
                          ? "bg-primary border-primary text-primary-foreground rotate-45"
                          : "text-foreground/60 group-hover:border-primary group-hover:text-primary"
                      }`}
                    >
                      <Plus size={16} />
                    </span>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: open === i ? "auto" : 0,
                      opacity: open === i ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 pr-12 text-foreground/70 leading-relaxed">
                      {f.a}
                    </p>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
