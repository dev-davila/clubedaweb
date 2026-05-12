import { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle, Layers, Eye, Database, ArrowRight, Lock, Award, X as XIcon, Building2, Cpu, Globe, Clock, BarChart3, Settings, HelpCircle, Laptop, Cloud, ShieldCheck, Activity, Target, Gauge, Search, Brain, FileSearch, Network, Workflow, Radio, Users, Zap, AlertTriangle, Server } from "lucide-react";

export const metadata: Metadata = {
  title: "Bitdefender GravityZone Business Security Enterprise - M3Solutions",
  description: "Solução completa de segurança com XDR, Sandbox e proteção avançada. Bitdefender GravityZone Business Security Enterprise para grandes corporações."
};

const features = [
  "Tudo do Business Security Premium",
  "XDR - Extended Detection & Response",
  "Sandbox Analyzer (análise de malware)",
  "Correlação de eventos avançada",
  "Threat Intelligence integrada",
  "Integração com SIEM/SOAR",
  "Hunting de ameaças",
  "Forense digital",
  "Relatórios executivos",
  "SLA de suporte prioritário"
];

const capabilities = [
  {
    icon: Layers,
    title: "XDR - Extended Detection & Response",
    description: "Vá além do endpoint. Correlacione dados de rede, email, nuvem e identidade para visão completa de ataques."
  },
  {
    icon: Database,
    title: "Sandbox Analyzer",
    description: "Envie arquivos suspeitos para análise em ambiente isolado. Detecte malwares desconhecidos antes que causem danos."
  },
  {
    icon: Eye,
    title: "Threat Hunting",
    description: "Busque proativamente por ameaças ocultas na sua rede com ferramentas avançadas de investigação."
  },
  {
    icon: Lock,
    title: "Forense Digital",
    description: "Investigue incidentes em profundidade com timeline completa de eventos e evidências."
  }
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

const xdrSources = [
  {
    icon: Laptop,
    title: "Endpoints",
    description: "Telemetria detalhada de processos, arquivos, registros, conexões de rede e comportamento de usuários em workstations e servidores."
  },
  {
    icon: Network,
    title: "Rede",
    description: "Integração com sensores de rede para detectar movimentação lateral, comunicação C2 e exfiltração de dados."
  },
  {
    icon: Cloud,
    title: "Nuvem",
    description: "Visibilidade em workloads cloud (AWS, Azure, GCP), detectando configurações inseguras e atividades suspeitas."
  },
  {
    icon: Users,
    title: "Identidade",
    description: "Correlação com Active Directory e provedores de identidade para detectar comprometimento de contas e escalação de privilégios."
  }
];

const threatHuntingCapabilities = [
  {
    title: "Queries Personalizadas",
    description: "Execute buscas complexas usando linguagem de query intuitiva. Encontre IOCs específicos, padrões de comportamento ou atividades suspeitas em toda sua infraestrutura."
  },
  {
    title: "Biblioteca de Hunting",
    description: "Acesso a biblioteca de queries pré-construídas baseadas em MITRE ATT&CK e ameaças emergentes. Mantenha-se atualizado sem precisar criar tudo do zero."
  },
  {
    title: "Hunting Automatizado",
    description: "Configure buscas recorrentes para detecção contínua de ameaças específicas. Receba alertas quando padrões suspeitos forem identificados."
  },
  {
    title: "Compartilhamento de IOCs",
    description: "Importe IOCs de fontes externas ou ISAC do seu setor. Verifique automaticamente se indicadores de comprometimento estão presentes no ambiente."
  }
];

const forensicsFeatures = [
  "Timeline visual de incidentes com drill-down em cada evento",
  "Reconstrução completa da cadeia de ataque (kill chain)",
  "Coleta remota de evidências (memória, arquivos, registros)",
  "Análise de malware com extração de IOCs",
  "Relatórios forenses para compliance e legal",
  "Exportação de dados para ferramentas externas"
];

const integrations = [
  {
    category: "SIEM",
    items: ["Splunk", "IBM QRadar", "Microsoft Sentinel", "Elastic SIEM", "ArcSight"]
  },
  {
    category: "SOAR",
    items: ["Palo Alto XSOAR", "Splunk SOAR", "IBM Resilient", "ServiceNow"]
  },
  {
    category: "Ticketing",
    items: ["ServiceNow", "Jira", "ConnectWise", "Autotask"]
  },
  {
    category: "Identity",
    items: ["Active Directory", "Azure AD", "Okta", "Ping Identity"]
  }
];

const stats = [
  { value: "500M+", label: "Endpoints protegidos" },
  { value: "30B+", label: "Requisições de ameaças/dia" },
  { value: "400+", label: "Patentes de segurança" },
  { value: "150+", label: "Países com clientes" }
];

const useCases = [
  {
    icon: Building2,
    title: "Grandes Corporações",
    description: "Para organizações com 500+ endpoints, múltiplas localidades e requisitos complexos de segurança e compliance.",
    benefits: ["Escalabilidade ilimitada", "Multi-tenancy", "Suporte 24/7 prioritário"]
  },
  {
    icon: Shield,
    title: "SOC / CSIRT",
    description: "Equipes de segurança dedicadas que precisam de ferramentas avançadas de detecção, investigação e resposta.",
    benefits: ["Threat hunting avançado", "Forense digital", "Integração SIEM/SOAR"]
  },
  {
    icon: Server,
    title: "Infraestrutura Crítica",
    description: "Setores regulados como financeiro, saúde e governo que precisam de máxima proteção e auditabilidade.",
    benefits: ["Compliance automatizado", "Trilha de auditoria completa", "SLA garantido"]
  }
];

const mdServices = [
  {
    title: "MDR - Managed Detection & Response",
    description: "Equipe Bitdefender monitora seu ambiente 24/7, detecta ameaças e executa respostas em seu nome.",
    features: ["Monitoramento 24/7/365", "Caça proativa de ameaças", "Resposta a incidentes", "Relatórios mensais"]
  },
  {
    title: "MDR Foundations",
    description: "Nível essencial de serviço gerenciado para organizações que estão começando a jornada de segurança avançada.",
    features: ["Monitoramento em horário comercial", "Alertas priorizados", "Recomendações de resposta", "Portal de relatórios"]
  }
];

const faqs = [
  {
    question: "Qual a diferença entre EDR e XDR?",
    answer: "EDR (Endpoint Detection and Response) foca na detecção e resposta a nível de endpoint. XDR (Extended Detection and Response) expande essa visibilidade para além do endpoint, correlacionando dados de múltiplas fontes como rede, nuvem, email e identidade. Isso permite detectar ataques complexos que atravessam múltiplos vetores e reduzir o tempo de investigação."
  },
  {
    question: "Preciso de uma equipe de SOC para usar o Enterprise?",
    answer: "O Enterprise é projetado para organizações com equipes de segurança dedicadas ou que planejam desenvolvê-las. As ferramentas avançadas de threat hunting e forense requerem conhecimento especializado para uso efetivo. Se sua organização não tem esse recurso, considere adicionar o serviço MDR (Managed Detection & Response) ou a versão Premium com suporte M3Solutions."
  },
  {
    question: "O GravityZone Enterprise integra com meu SIEM?",
    answer: "Sim. O Enterprise oferece integração nativa com os principais SIEMs do mercado (Splunk, QRadar, Sentinel, Elastic) via Syslog, API REST ou conectores específicos. Isso permite enriquecer seu SIEM com telemetria detalhada de endpoints e correlacionar com outras fontes de dados."
  },
  {
    question: "Como funciona o Threat Hunting no Enterprise?",
    answer: "O módulo de Threat Hunting permite executar queries personalizadas em toda a telemetria coletada dos endpoints. Você pode buscar IOCs específicos, padrões de comportamento suspeito ou atividades que correspondam a técnicas do MITRE ATT&CK. Também oferece biblioteca de queries pré-construídas e a capacidade de agendar buscas recorrentes."
  },
  {
    question: "O que é o serviço MDR e quando devo considerar?",
    answer: "MDR (Managed Detection and Response) é um serviço onde a equipe de especialistas da Bitdefender monitora seu ambiente 24/7, caça proativamente por ameaças e executa respostas em seu nome. É ideal para organizações que precisam de capacidades avançadas de segurança mas não têm recursos para manter um SOC interno."
  },
  {
    question: "Posso migrar do Premium para Enterprise?",
    answer: "Sim. A migração é simples pois ambos usam a mesma plataforma e agente. Basta adquirir licenças Enterprise e os recursos adicionais (XDR, Threat Hunting, Forense) são habilitados automaticamente. A telemetria histórica é preservada para investigações retrospectivas."
  }
];

const howXdrWorks = [
  {
    step: 1,
    title: "Coleta Unificada",
    description: "Sensores coletam telemetria de endpoints, rede, cloud e identidade em formato padronizado."
  },
  {
    step: 2,
    title: "Correlação Automática",
    description: "Motor de correlação identifica relações entre eventos aparentemente isolados de diferentes fontes."
  },
  {
    step: 3,
    title: "Detecção Contextual",
    description: "Machine learning e regras analisam o contexto completo, detectando ataques multi-estágio."
  },
  {
    step: 4,
    title: "Resposta Orquestrada",
    description: "Ações de resposta coordenadas em múltiplas plataformas, automatizadas ou com um clique."
  }
];

export default function BitdefenderEnterprisePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 to-red-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-red-400" />
              <span className="text-red-400 font-medium">Bitdefender</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              GravityZone Business Security Enterprise
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              A solução mais completa de segurança para grandes corporações. XDR, 
              Threat Hunting, Forense Digital e muito mais para equipes de segurança maduras.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition"
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

      {/* Stats */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
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
              A plataforma de segurança mais premiada do mercado
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

      {/* XDR Deep Dive */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Layers className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">XDR - Extended Detection & Response</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Vá além do endpoint com visibilidade unificada de toda sua infraestrutura. 
                Correlacione eventos de múltiplas fontes para detectar ataques complexos.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {xdrSources.map((source, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl text-center">
                  <source.icon className="w-10 h-10 text-red-600 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">{source.title}</h3>
                  <p className="text-gray-600 text-sm">{source.description}</p>
                </div>
              ))}
            </div>

            {/* How XDR Works */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white text-center mb-8">Como o XDR Funciona</h3>
              <div className="grid md:grid-cols-4 gap-6">
                {howXdrWorks.map((step, index) => (
                  <div key={index} className="text-center relative">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                      {step.step}
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Capacidades Avançadas</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Recursos enterprise para equipes de segurança maduras
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {capabilities.map((cap, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <cap.icon className="w-10 h-10 text-red-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{cap.title}</h3>
                <p className="text-gray-600">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Threat Hunting Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Search className="w-8 h-8 text-red-600" />
                  <span className="text-red-600 font-medium uppercase text-sm tracking-wider">Caça Proativa</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Threat Hunting</h2>
                <p className="text-gray-600 mb-6">
                  Não espere alertas. Busque proativamente por ameaças ocultas em 
                  seu ambiente usando ferramentas poderosas de investigação e 
                  queries personalizadas em toda a telemetria.
                </p>
                <p className="text-gray-600">
                  Acesse biblioteca de queries baseadas em MITRE ATT&CK, importe 
                  IOCs de fontes externas e configure buscas automatizadas para 
                  detecção contínua de ameaças específicas.
                </p>
              </div>
              <div className="space-y-4">
                {threatHuntingCapabilities.map((cap, index) => (
                  <div key={index} className="bg-gray-50 p-5 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-2">{cap.title}</h4>
                    <p className="text-gray-600 text-sm">{cap.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forensics Section */}
      <section className="py-20 bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileSearch className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Forense Digital</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Investigue incidentes em profundidade com ferramentas forenses 
                integradas. Reconstrua ataques, colete evidências e gere relatórios 
                para compliance e procedimentos legais.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Capacidades Forenses</h3>
                  <ul className="space-y-3">
                    {forensicsFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Benefícios</h3>
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-1">Investigação Acelerada</h4>
                      <p className="text-gray-400 text-sm">Reduza o tempo de investigação de dias para horas com visualizações intuitivas e drill-down automático.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-1">Evidências Preservadas</h4>
                      <p className="text-gray-400 text-sm">Coleta de evidências com cadeia de custódia para uso em procedimentos legais ou disciplinares.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-1">Lições Aprendidas</h4>
                      <p className="text-gray-400 text-sm">Entenda como ataques aconteceram para melhorar defesas e prevenir incidentes similares.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Integrações</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Integre com seu stack de segurança existente via APIs e conectores nativos
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4 text-center">{integration.category}</h3>
                <ul className="space-y-2">
                  {integration.items.map((item, iIndex) => (
                    <li key={iIndex} className="text-sm text-gray-600 text-center">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Todos os Recursos</h2>
            <p className="text-gray-600">O pacote mais completo de segurança endpoint</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
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
              Para organizações com requisitos avançados de segurança
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

      {/* MDR Services */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Serviços Gerenciados (Opcional)</h2>
            <p className="text-red-100 max-w-2xl mx-auto">
              Potencialize sua segurança com equipe de especialistas Bitdefender
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {mdServices.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Comparison Table */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-red-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Compare as Soluções Bitdefender</h2>
            <p className="text-gray-300">Escolha a solução ideal para sua empresa</p>
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
            <Link href="/bitdefender-gravityzone-business-security" className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-red-600 mb-2">Business Security</h3>
              <p className="text-gray-600 text-sm mb-4">Ideal para pequenas e médias empresas</p>
              <div className="inline-flex items-center justify-center gap-2 bg-red-100 text-red-700 px-6 py-2.5 rounded-lg font-medium hover:bg-red-200 transition text-sm">
                Saiba Mais
              </div>
            </Link>
            <Link href="/bitdefender-gravityzone-business-security-premium" className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-red-700 mb-2">Business Security Premium</h3>
              <p className="text-gray-600 text-sm mb-4">Ideal para empresas médias e grandes</p>
              <div className="inline-flex items-center justify-center gap-2 bg-red-100 text-red-700 px-6 py-2.5 rounded-lg font-medium hover:bg-red-200 transition text-sm">
                Saiba Mais
              </div>
            </Link>
            <div className="bg-white rounded-xl p-6 text-center border-4 border-red-500 shadow-lg">
              <h3 className="text-xl font-bold text-red-800 mb-2">Business Security Enterprise</h3>
              <p className="text-gray-600 text-sm mb-4">Ideal para grandes corporações</p>
              <div className="text-xs text-red-600 font-semibold mb-4">✓ VOCÊ ESTÁ AQUI</div>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 bg-red-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-950 transition text-sm"
              >
                Saiba Mais
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
            <p className="text-gray-600">Tire suas dúvidas sobre o Business Security Enterprise</p>
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
      <section className="py-20 bg-gradient-to-r from-gray-900 to-red-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Proteção Enterprise para sua organização</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Fale com nossos especialistas e descubra como o Bitdefender Enterprise 
            pode proteger sua organização contra as ameaças mais sofisticadas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contato"
              className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition"
            >
              Falar com Especialista <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/solucoes/antivirus"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition"
            >
              Ver outras soluções
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
