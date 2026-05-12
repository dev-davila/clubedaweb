import { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle, Server, Users, Zap, Lock, ArrowRight, Award, X as XIcon, Building2, Cpu, Globe, Clock, BarChart3, Settings, HelpCircle, ChevronDown, ChevronUp, Laptop, Cloud, ShieldCheck, AlertTriangle, FileSearch, Activity, Target, Gauge } from "lucide-react";

export const metadata: Metadata = {
  title: "Bitdefender GravityZone Business Security - M3Solutions",
  description: "Proteção essencial para endpoints com Bitdefender GravityZone Business Security. Antivírus corporativo com gestão centralizada para PMEs."
};

const features = [
  "Antimalware e antivírus líder de mercado",
  "Proteção contra ransomware",
  "Firewall e controle de conteúdo web",
  "Controle de dispositivos",
  "Gestão centralizada na nuvem",
  "Baixo consumo de recursos",
  "Relatórios e alertas",
  "Suporte técnico incluso"
];

const specs = [
  { title: "Endpoints", value: "5 a 100 máquinas" },
  { title: "Sistemas", value: "Windows, macOS, Linux" },
  { title: "Gestão", value: "Console na nuvem" },
  { title: "Atualizações", value: "Automáticas" }
];

const awards = [
  { title: "AV-TEST", subtitle: "Melhor Proteção", year: "2020", color: "text-red-600" },
  { title: "AV-TEST", subtitle: "Melhor Proteção (EDR)", year: "2021", color: "text-red-600" },
  { title: "AV-COMPARATIVES", subtitle: "Produto Excepcional", year: "2020", color: "text-blue-600" },
  { title: "AV-COMPARATIVES", subtitle: "Produto Excepcional", year: "2021", color: "text-blue-600" }
];

const comparisonFeatures = [
  { name: "Antimalware", business: true, premium: true, enterprise: true },
  { name: "Controle Avançado de Ameaças", business: true, premium: true, enterprise: true },
  { name: "Antiexploit Avançado", business: true, premium: true, enterprise: true },
  { name: "Firewall", business: true, premium: true, enterprise: true },
  { name: "Proteção de Rede", business: true, premium: true, enterprise: true },
  { name: "Controle de Dispositivos", business: true, premium: true, enterprise: true },
  { name: "Gerenciamento de Riscos", business: true, premium: true, enterprise: true },
  { name: "Mitigação de Ransomware", business: true, premium: true, enterprise: true },
  { name: "Proteção contra Ataque sem Arquivo", business: false, premium: true, enterprise: true },
  { name: "HyperDetect", business: false, premium: true, enterprise: true },
  { name: "Analisador Sandbox", business: false, premium: true, enterprise: true },
  { name: "XEDR (eXtended Endpoint Detection and Response)", business: false, premium: false, enterprise: true }
];

const technologies = [
  {
    icon: ShieldCheck,
    title: "Machine Learning",
    description: "Algoritmos de inteligência artificial treinados com bilhões de amostras para detectar malware conhecido e desconhecido em milissegundos, antes mesmo de executar."
  },
  {
    icon: Activity,
    title: "Process Inspector",
    description: "Monitora continuamente os processos em execução, detectando comportamentos suspeitos e bloqueando automaticamente ameaças que tentam se disfarçar de aplicações legítimas."
  },
  {
    icon: Globe,
    title: "Global Threat Intelligence",
    description: "Rede global de sensores e inteligência de ameaças que protege contra ataques emergentes em tempo real, bloqueando URLs maliciosas e IPs comprometidos."
  },
  {
    icon: Lock,
    title: "Proteção Anti-Ransomware",
    description: "Múltiplas camadas de proteção contra ransomware, incluindo backup automático de arquivos críticos e rollback de alterações maliciosas."
  }
];

const stats = [
  { value: "500M+", label: "Endpoints protegidos globalmente" },
  { value: "99.9%", label: "Taxa de detecção de malware" },
  { value: "11B+", label: "Requisições de ameaças/dia" },
  { value: "150+", label: "Países com clientes ativos" }
];

const useCases = [
  {
    icon: Building2,
    title: "Escritórios e PMEs",
    description: "Ideal para empresas de 5 a 100 funcionários que precisam de proteção robusta sem complexidade de gerenciamento.",
    benefits: ["Implementação em minutos", "Sem necessidade de servidor local", "Gestão simplificada"]
  },
  {
    icon: Laptop,
    title: "Trabalho Remoto",
    description: "Proteção completa para colaboradores que trabalham de casa ou em trânsito, com políticas aplicadas automaticamente.",
    benefits: ["Proteção fora da rede corporativa", "VPN não necessária para proteção", "Sincronização automática de políticas"]
  },
  {
    icon: Server,
    title: "Ambientes Mistos",
    description: "Suporte nativo para Windows, macOS e Linux, permitindo proteção unificada independente do sistema operacional.",
    benefits: ["Console única para todos os sistemas", "Políticas consistentes", "Relatórios consolidados"]
  }
];

const howItWorks = [
  {
    step: 1,
    title: "Instalação Rápida",
    description: "Deploy em minutos através de pacote de instalação, link de download ou integração com ferramentas de gerenciamento."
  },
  {
    step: 2,
    title: "Configuração Automática",
    description: "Políticas de segurança pré-configuradas são aplicadas automaticamente, sem necessidade de ajustes complexos."
  },
  {
    step: 3,
    title: "Proteção em Tempo Real",
    description: "Machine learning e heurística analisam arquivos e comportamentos continuamente, bloqueando ameaças instantaneamente."
  },
  {
    step: 4,
    title: "Monitoramento Centralizado",
    description: "Console na nuvem permite visualizar status de todos os endpoints, alertas e relatórios de qualquer lugar."
  }
];

const faqs = [
  {
    question: "Qual a diferença entre Business Security e as versões Premium/Enterprise?",
    answer: "O Business Security é a solução essencial, ideal para PMEs que precisam de proteção robusta. Inclui antimalware, firewall, proteção contra ransomware e gestão na nuvem. As versões Premium e Enterprise adicionam recursos avançados como EDR, análise de sandbox, XDR e ferramentas de threat hunting para empresas que necessitam de capacidades de detecção e resposta mais sofisticadas."
  },
  {
    question: "Preciso de um servidor dedicado para gerenciar o Bitdefender?",
    answer: "Não. O GravityZone Business Security utiliza console de gerenciamento 100% na nuvem. Você acessa pelo navegador de qualquer lugar, sem necessidade de instalar ou manter servidores locais. Isso reduz custos de infraestrutura e simplifica a administração."
  },
  {
    question: "O Bitdefender funciona em Macs e Linux?",
    answer: "Sim. O GravityZone oferece proteção nativa para Windows (7 até 11, Server 2008 R2 até 2022), macOS (10.15+) e distribuições Linux (Ubuntu, Debian, Red Hat, CentOS, etc.). Todos são gerenciados pela mesma console na nuvem."
  },
  {
    question: "Como funciona a proteção contra ransomware?",
    answer: "O Bitdefender utiliza múltiplas camadas: detecção por machine learning identifica ransomware conhecido e desconhecido; monitoramento comportamental detecta tentativas de criptografia em massa; backup automático protege arquivos críticos; e a função de rollback pode reverter alterações maliciosas mesmo após a criptografia começar."
  },
  {
    question: "Quanto tempo leva para implementar em toda empresa?",
    answer: "A implementação é muito rápida. Um endpoint pode ser protegido em menos de 5 minutos. Para empresas maiores, o deploy pode ser automatizado via Group Policy, SCCM, ou scripts, permitindo proteger centenas de máquinas em poucas horas."
  },
  {
    question: "O Bitdefender impacta o desempenho dos computadores?",
    answer: "O GravityZone é conhecido pelo baixo consumo de recursos. A maior parte da análise pesada é feita na nuvem, utilizando os recursos da Bitdefender Labs. Testes independentes como AV-TEST consistentemente classificam o Bitdefender como tendo um dos menores impactos de performance entre os antivírus empresariais."
  }
];

const systemRequirements = {
  windows: {
    title: "Windows",
    items: [
      "Windows 11, 10, 8.1, 8, 7 SP1",
      "Windows Server 2022, 2019, 2016, 2012 R2, 2012, 2008 R2",
      "Intel/AMD 64-bit ou 32-bit (dependendo do OS)",
      "1 GB RAM (2 GB recomendado)",
      "1.5 GB espaço em disco"
    ]
  },
  macos: {
    title: "macOS",
    items: [
      "macOS Sonoma (14.x)",
      "macOS Ventura (13.x)",
      "macOS Monterey (12.x)",
      "macOS Big Sur (11.x)",
      "macOS Catalina (10.15)",
      "1 GB espaço em disco"
    ]
  },
  linux: {
    title: "Linux",
    items: [
      "Ubuntu 18.04 LTS, 20.04 LTS, 22.04 LTS",
      "Debian 10, 11, 12",
      "Red Hat Enterprise Linux 7, 8, 9",
      "CentOS 7, 8",
      "SUSE Linux Enterprise 12, 15",
      "Oracle Linux 7, 8, 9"
    ]
  }
};

export default function BitdefenderBusinessSecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-red-700 to-red-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-red-300" />
              <span className="text-red-300 font-medium">Bitdefender</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              GravityZone Business Security
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Proteção essencial para pequenas e médias empresas. Antivírus 
              líder de mercado com gestão centralizada na nuvem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-8 py-4 rounded-xl font-bold hover:bg-red-50 transition"
              >
                Solicitar Orçamento
              </Link>
              <Link
                href="/solucoes/antivirus"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition"
              >
                Ver todas soluções
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {specs.map((spec, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">{spec.value}</div>
                <div className="text-gray-600 text-sm">{spec.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Bitdefender em Números</h2>
            <p className="text-gray-400">Líder global em segurança cibernética</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-500 mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">
              Bitdefender GravityZone: Reconhecido pelos Especialistas
            </h2>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              Consistentemente premiado pelos principais laboratórios de testes independentes do mundo
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {awards.map((award, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition">
                <div className="flex justify-center mb-3">
                  <Award className={`w-10 h-10 ${award.color}`} />
                </div>
                <div className={`text-lg font-bold ${award.color}`}>{award.title}</div>
                <div className="text-gray-600 text-sm mt-1">{award.subtitle}</div>
                <div className="text-gray-500 text-sm">{award.year}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Proteção Completa para Pequenas e Médias Empresas</h2>
            <div className="prose max-w-none text-gray-600 space-y-4">
              <p>
                O Bitdefender GravityZone Business Security oferece proteção de 
                próxima geração contra todas as ameaças cibernéticas, incluindo vírus, 
                malware, ransomware, phishing e ataques de dia zero. Utilizando 
                tecnologias avançadas de machine learning e inteligência artificial, 
                o Bitdefender identifica e bloqueia ameaças antes mesmo que possam 
                ser executadas em seus sistemas.
              </p>
              <p>
                Com uma console de gerenciamento na nuvem fácil de usar, você pode 
                proteger e gerenciar todos os seus endpoints de qualquer lugar, 
                sem necessidade de infraestrutura local. A instalação leva minutos 
                e as políticas de segurança são aplicadas automaticamente, permitindo 
                que sua equipe de TI foque em tarefas estratégicas.
              </p>
              <p>
                O GravityZone Business Security é a escolha ideal para empresas que 
                precisam de proteção robusta e confiável sem a complexidade de 
                soluções enterprise. Oferece o equilíbrio perfeito entre segurança 
                de nível mundial e facilidade de uso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tecnologias de Proteção</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Múltiplas camadas de segurança trabalhando em conjunto para proteção completa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {technologies.map((tech, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <tech.icon className="w-10 h-10 text-red-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{tech.title}</h3>
                <p className="text-gray-600">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recursos Incluídos</h2>
            <p className="text-gray-600">Tudo que você precisa para proteger sua empresa</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Como Funciona</h2>
            <p className="text-gray-400">Implementação simples, proteção imediata</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Casos de Uso</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Solução flexível que se adapta às necessidades de diferentes ambientes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-2xl">
                <useCase.icon className="w-12 h-12 text-red-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                <p className="text-gray-600 mb-4">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.benefits.map((benefit, bIndex) => (
                    <li key={bIndex} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Requisitos de Sistema</h2>
            <p className="text-gray-600">Compatível com os principais sistemas operacionais</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.values(systemRequirements).map((sys, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-red-600" />
                  {sys.title}
                </h3>
                <ul className="space-y-2">
                  {sys.items.map((item, iIndex) => (
                    <li key={iIndex} className="text-sm text-gray-600 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Comparison Table */}
      <section className="py-20 bg-gradient-to-br from-red-700 to-red-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Compare as Soluções Bitdefender</h2>
            <p className="text-red-100">Escolha a solução ideal para sua empresa</p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full bg-white rounded-2xl overflow-hidden shadow-xl">
              <thead>
                <tr>
                  <th className="text-left p-4 bg-gray-100 text-gray-900 font-semibold">Funcionalidades</th>
                  <th className="p-4 bg-red-600 text-white font-semibold text-center min-w-[140px]">
                    <div>Business</div>
                    <div className="font-normal text-sm text-red-100">Security</div>
                  </th>
                  <th className="p-4 bg-red-700 text-white font-semibold text-center min-w-[140px]">
                    <div>Business Security</div>
                    <div className="font-normal text-sm text-red-100">PREMIUM</div>
                  </th>
                  <th className="p-4 bg-red-800 text-white font-semibold text-center min-w-[140px]">
                    <div>Business Security</div>
                    <div className="font-normal text-sm text-red-100">ENTERPRISE</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-4 text-gray-700 font-medium text-sm">{feature.name}</td>
                    <td className="p-4 text-center">
                      {feature.business ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {feature.premium ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {feature.enterprise ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Product Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10">
            <div className="bg-white rounded-xl p-6 text-center border-4 border-red-500 shadow-lg">
              <h3 className="text-xl font-bold text-red-600 mb-2">Business Security</h3>
              <p className="text-gray-600 text-sm mb-4">Ideal para pequenas e médias empresas</p>
              <div className="text-xs text-red-600 font-semibold mb-4">✓ VOCÊ ESTÁ AQUI</div>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition text-sm"
              >
                Saiba Mais
              </Link>
            </div>
            <Link href="/bitdefender-gravityzone-business-security-premium" className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-red-700 mb-2">Business Security Premium</h3>
              <p className="text-gray-600 text-sm mb-4">Ideal para empresas médias e grandes</p>
              <div className="inline-flex items-center justify-center gap-2 bg-red-100 text-red-700 px-6 py-2.5 rounded-lg font-medium hover:bg-red-200 transition text-sm">
                Saiba Mais
              </div>
            </Link>
            <Link href="/bitdefender-gravityzone-business-security-enterprise" className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-red-800 mb-2">Business Security Enterprise</h3>
              <p className="text-gray-600 text-sm mb-4">Ideal para grandes corporações</p>
              <div className="inline-flex items-center justify-center gap-2 bg-red-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-950 transition text-sm">
                Saiba Mais
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
            <p className="text-gray-600">Tire suas dúvidas sobre o Bitdefender GravityZone</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 ml-9">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para proteger sua empresa?</h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">
            Solicite um orçamento personalizado e tenha a proteção líder de mercado 
            Bitdefender. Nossa equipe está pronta para ajudar sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contato"
              className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-8 py-4 rounded-xl font-bold hover:bg-red-50 transition"
            >
              Solicitar Orçamento <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/bitdefender-gravityzone-business-security-premium"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition"
            >
              Conhecer versão Premium
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
