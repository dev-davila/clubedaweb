import { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle, Zap, Search, AlertTriangle, ArrowRight, Award, X as XIcon, Building2, Cpu, Globe, Clock, BarChart3, Settings, HelpCircle, Laptop, Cloud, ShieldCheck, Activity, Target, Gauge, Eye, Brain, Layers, FileSearch, Lock, Network } from "lucide-react";

export const metadata: Metadata = {
  title: "Bitdefender GravityZone Business Security Premium - M3Solutions",
  description: "Proteção avançada com EDR incluso. Bitdefender GravityZone Business Security Premium para empresas que precisam de detecção e resposta a ameaças."
};

const features = [
  "Tudo do Business Security",
  "EDR - Endpoint Detection & Response",
  "Análise de riscos em tempo real",
  "Proteção contra ataques fileless",
  "Machine Learning avançado",
  "Sandboxing na nuvem",
  "HyperDetect (IA contra ataques direcionados)",
  "Network Attack Defense",
  "Patch Management (opcional)",
  "Full Disk Encryption (opcional)"
];

const advantages = [
  {
    icon: Search,
    title: "Visibilidade Total",
    description: "Veja tudo o que acontece nos seus endpoints com detalhes de processos, arquivos e rede."
  },
  {
    icon: Zap,
    title: "Resposta Automática",
    description: "Isolamento automático de ameaças e remediação com um clique."
  },
  {
    icon: AlertTriangle,
    title: "Detecção Avançada",
    description: "Identifica ameaças sofisticadas que passam despercebidas por antivírus tradicionais."
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

const edrCapabilities = [
  {
    icon: Eye,
    title: "Detecção Comportamental",
    description: "Monitora continuamente o comportamento de processos, identificando atividades suspeitas como tentativas de escalação de privilégios, movimentação lateral e comunicação com servidores de comando e controle."
  },
  {
    icon: Activity,
    title: "Timeline de Incidentes",
    description: "Visualize a linha do tempo completa de um ataque, desde a entrada inicial até as ações posteriores. Entenda exatamente o que aconteceu, quando e como."
  },
  {
    icon: Target,
    title: "Investigação Guiada",
    description: "Interface intuitiva que guia analistas através do processo de investigação, mesmo sem experiência prévia em resposta a incidentes."
  },
  {
    icon: Zap,
    title: "Resposta Automatizada",
    description: "Configure respostas automáticas para diferentes tipos de ameaças: isolamento de máquina, kill de processo, quarentena de arquivo, ou notificação para análise manual."
  }
];

const hyperDetectFeatures = [
  {
    title: "Detecção de Ataques Direcionados",
    description: "Identifica ataques personalizados criados especificamente para sua organização, que não seriam detectados por assinaturas convencionais."
  },
  {
    title: "Proteção contra Ferramentas de Hacking",
    description: "Bloqueia ferramentas comumente usadas em ataques como Mimikatz, PowerShell Empire, Cobalt Strike e outras utilizadas em pentests e ataques reais."
  },
  {
    title: "Análise de Scripts Suspeitos",
    description: "Analisa scripts PowerShell, JavaScript, VBScript e macros em tempo real, detectando comportamentos maliciosos mesmo em scripts ofuscados."
  },
  {
    title: "Machine Learning Ajustável",
    description: "Permite ajustar a sensibilidade da detecção por machine learning, balanceando entre máxima proteção e redução de falsos positivos."
  }
];

const sandboxBenefits = [
  "Análise automática de arquivos suspeitos em ambiente isolado",
  "Detecção de malware evasivo que tenta escapar de sandboxes tradicionais",
  "Relatórios detalhados com IOCs (Indicadores de Comprometimento)",
  "Integração automática com threat intelligence do Bitdefender",
  "Suporte para múltiplos tipos de arquivos: executáveis, documentos, scripts"
];

const stats = [
  { value: "500M+", label: "Endpoints protegidos globalmente" },
  { value: "99.9%", label: "Taxa de detecção de malware" },
  { value: "<1ms", label: "Tempo de resposta a ameaças" },
  { value: "30%", label: "Redução de alertas com HyperDetect" }
];

const useCases = [
  {
    icon: Building2,
    title: "Empresas em Crescimento",
    description: "Para organizações de 50 a 500 endpoints que precisam ir além da proteção básica e ter visibilidade sobre o que acontece em seus sistemas.",
    benefits: ["Escalabilidade sem complexidade", "Console unificada", "Suporte técnico especializado"]
  },
  {
    icon: Shield,
    title: "Ambientes Regulados",
    description: "Empresas sujeitas a regulamentações como LGPD, PCI-DSS ou ISO 27001 que precisam demonstrar capacidades avançadas de detecção e resposta.",
    benefits: ["Relatórios de compliance", "Logs detalhados de eventos", "Trilha de auditoria completa"]
  },
  {
    icon: Network,
    title: "Equipes de TI Enxutas",
    description: "Times de TI que não podem ter um SOC dedicado mas precisam de capacidades de detecção e resposta a incidentes.",
    benefits: ["Automação de respostas", "Investigação guiada", "Redução de tempo de análise"]
  }
];

const howItWorks = [
  {
    step: 1,
    title: "Coleta de Telemetria",
    description: "Agente coleta informações detalhadas sobre processos, arquivos, conexões de rede e comportamento do sistema."
  },
  {
    step: 2,
    title: "Análise em Tempo Real",
    description: "Machine learning e regras comportamentais analisam a telemetria, identificando padrões suspeitos e anomalias."
  },
  {
    step: 3,
    title: "Correlação de Eventos",
    description: "O sistema correlaciona eventos aparentemente isolados para identificar cadeias de ataque complexas."
  },
  {
    step: 4,
    title: "Resposta Orquestrada",
    description: "Ações de resposta são executadas automaticamente ou apresentadas ao analista com recomendações claras."
  }
];

const faqs = [
  {
    question: "O que é EDR e por que preciso dele?",
    answer: "EDR (Endpoint Detection and Response) é uma tecnologia que vai além do antivírus tradicional. Enquanto o antivírus foca em prevenir infecções conhecidas, o EDR monitora continuamente o comportamento dos endpoints para detectar ameaças avançadas e fornecer ferramentas para investigar e responder a incidentes. É essencial para detectar ataques sofisticados que escapam da proteção preventiva."
  },
  {
    question: "Qual a diferença entre o Premium e o Enterprise?",
    answer: "O Business Security Premium inclui EDR com capacidades completas de detecção e resposta a nível de endpoint. O Enterprise adiciona XDR (Extended Detection and Response), que correlaciona dados além do endpoint - incluindo rede, email e nuvem - além de ferramentas avançadas de threat hunting e forense digital para equipes de segurança maduras."
  },
  {
    question: "O Sandbox Analyzer afeta o desempenho?",
    answer: "Não. A análise de sandbox é realizada na nuvem Bitdefender, não nos endpoints. Quando um arquivo suspeito é detectado, ele é enviado para análise sem impactar o desempenho da máquina local. O resultado retorna em minutos e atualiza a proteção de todos os endpoints automaticamente."
  },
  {
    question: "Preciso de uma equipe de SOC para usar o Premium?",
    answer: "Não necessariamente. O Bitdefender Premium foi projetado para ser utilizável por equipes de TI sem especialização em segurança. A interface de investigação é guiada, as respostas podem ser automatizadas, e os incidentes são priorizados automaticamente. Equipes que desejam capacidades mais avançadas de threat hunting devem considerar a versão Enterprise."
  },
  {
    question: "O que é HyperDetect?",
    answer: "HyperDetect é uma camada de machine learning ajustável que detecta ataques direcionados, ferramentas de hacking e ameaças avançadas. Diferente de ML tradicional, ele permite ajustar o nível de sensibilidade para diferentes cenários: máxima proteção para servidores críticos, ou menos agressivo para estações de trabalho de usuários específicos."
  },
  {
    question: "Posso fazer upgrade do Business Security para Premium?",
    answer: "Sim. A migração é simples pois ambos usam o mesmo agente e console. Basta adquirir licenças Premium e ativar os recursos adicionais - não é necessário reinstalar o agente ou reconfigurar políticas existentes."
  }
];

const optionalModules = [
  {
    title: "Patch Management",
    description: "Gerenciamento automatizado de patches para Windows e aplicações de terceiros. Identifica vulnerabilidades, testa e implanta atualizações de forma centralizada.",
    benefits: ["Redução de superfície de ataque", "Conformidade automatizada", "Relatórios de vulnerabilidades"]
  },
  {
    title: "Full Disk Encryption",
    description: "Criptografia de disco completo gerenciada centralmente. Protege dados em caso de perda ou roubo de dispositivos.",
    benefits: ["Conformidade com LGPD", "Recuperação de chaves centralizada", "Relatórios de status de criptografia"]
  },
  {
    title: "Security for Mobile",
    description: "Extensão de proteção para dispositivos iOS e Android. Proteção contra malware móvel, phishing e apps maliciosos.",
    benefits: ["Gestão unificada", "Políticas de conformidade", "Localização e wipe remoto"]
  }
];

export default function BitdefenderPremiumPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-red-800 to-red-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-red-300" />
              <span className="text-red-300 font-medium">Bitdefender</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              GravityZone Business Security Premium
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Proteção avançada com EDR incluso. Detecte e responda a ameaças 
              sofisticadas com inteligência artificial e análise comportamental.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 bg-white text-red-800 px-8 py-4 rounded-xl font-bold hover:bg-red-50 transition"
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
              Líder consistente nos testes de EDR e proteção avançada
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

      {/* EDR Highlight */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-8 rounded-3xl">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">EDR - Endpoint Detection & Response</h2>
              <p className="text-lg text-gray-700 mb-6">
                O EDR vai além do antivírus tradicional. Ele monitora continuamente 
                o comportamento dos endpoints, detecta atividades suspeitas e permite 
                resposta rápida a incidentes. Essencial para enfrentar ameaças modernas 
                que utilizam técnicas de evasão sofisticadas.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {advantages.map((adv, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl">
                    <adv.icon className="w-8 h-8 text-red-600 mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">{adv.title}</h3>
                    <p className="text-gray-600 text-sm">{adv.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDR Capabilities Deep Dive */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Capacidades de EDR em Detalhe</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Entenda como o EDR do Bitdefender protege sua organização
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {edrCapabilities.map((cap, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <cap.icon className="w-10 h-10 text-red-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{cap.title}</h3>
                <p className="text-gray-600">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HyperDetect Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-8 h-8 text-red-600" />
                  <span className="text-red-600 font-medium uppercase text-sm tracking-wider">Tecnologia Exclusiva</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">HyperDetect™</h2>
                <p className="text-gray-600 mb-6">
                  Camada avançada de machine learning que detecta ameaças que escapam 
                  de outras soluções. Identifica ataques direcionados, ferramentas 
                  de hacking e malware evasivo com alta precisão e baixos falsos positivos.
                </p>
                <p className="text-gray-600">
                  Diferente de ML tradicional, o HyperDetect permite ajustar a 
                  sensibilidade da detecção para diferentes grupos de endpoints, 
                  equilibrando proteção máxima e produtividade.
                </p>
              </div>
              <div className="space-y-4">
                {hyperDetectFeatures.map((feature, index) => (
                  <div key={index} className="bg-gray-50 p-5 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Section */}
      <section className="py-20 bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileSearch className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Sandbox Analyzer</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Análise automática de arquivos suspeitos em ambiente isolado na nuvem. 
                Detecta malware evasivo que tenta escapar de análises tradicionais.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Como Funciona</h3>
                  <p className="text-gray-300 mb-4">
                    Quando o agente encontra um arquivo suspeito que não pode ser 
                    classificado definitivamente como malicioso ou seguro, ele é 
                    enviado automaticamente para o Sandbox Analyzer na nuvem Bitdefender.
                  </p>
                  <p className="text-gray-300">
                    Lá, o arquivo é executado em um ambiente virtual isolado enquanto 
                    é monitorado por múltiplas camadas de análise. O resultado atualiza 
                    a inteligência de ameaças global, protegendo todos os clientes.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Benefícios</h3>
                  <ul className="space-y-3">
                    {sandboxBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recursos Incluídos</h2>
            <p className="text-gray-600">Proteção completa com detecção e resposta avançadas</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
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
            <h2 className="text-3xl font-bold text-white mb-4">Como o EDR Funciona</h2>
            <p className="text-gray-400">Da coleta de dados à resposta orquestrada</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-red-600/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Casos de Uso</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Para organizações que precisam de mais que proteção básica
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
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

      {/* Optional Modules */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Módulos Opcionais</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Expanda a proteção com recursos adicionais conforme necessário
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {optionalModules.map((module, index) => (
              <div key={index} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{module.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{module.description}</p>
                <ul className="space-y-2">
                  {module.benefits.map((benefit, bIndex) => (
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
            <Link href="/bitdefender-gravityzone-business-security" className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-red-600 mb-2">Business Security</h3>
              <p className="text-gray-600 text-sm mb-4">Ideal para pequenas e médias empresas</p>
              <div className="inline-flex items-center justify-center gap-2 bg-red-100 text-red-700 px-6 py-2.5 rounded-lg font-medium hover:bg-red-200 transition text-sm">
                Saiba Mais
              </div>
            </Link>
            <div className="bg-white rounded-xl p-6 text-center border-4 border-red-500 shadow-lg">
              <h3 className="text-xl font-bold text-red-700 mb-2">Business Security Premium</h3>
              <p className="text-gray-600 text-sm mb-4">Ideal para empresas médias e grandes</p>
              <div className="text-xs text-red-600 font-semibold mb-4">✓ VOCÊ ESTÁ AQUI</div>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-800 transition text-sm"
              >
                Saiba Mais
              </Link>
            </div>
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
            <p className="text-gray-600">Tire suas dúvidas sobre o Business Security Premium</p>
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
          <h2 className="text-3xl font-bold text-white mb-4">Eleve sua segurança com EDR</h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">
            Detecte ameaças avançadas e responda rapidamente com Bitdefender Premium. 
            Nossa equipe de especialistas pode ajudar na implementação.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contato"
              className="inline-flex items-center justify-center gap-2 bg-white text-red-700 px-8 py-4 rounded-xl font-bold hover:bg-red-50 transition"
            >
              Solicitar Orçamento <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/bitdefender-gravityzone-business-security-enterprise"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition"
            >
              Conhecer versão Enterprise
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
