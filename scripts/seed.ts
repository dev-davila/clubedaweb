import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin users
  const hashedPassword1 = await bcrypt.hash("johndoe123", 10);
  const hashedPassword2 = await bcrypt.hash("M3Admin@2024", 10);

  await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      name: "John Doe",
      password: hashedPassword1,
      role: "admin"
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@m3solutions.com.br" },
    update: {},
    create: {
      email: "admin@m3solutions.com.br",
      name: "Admin M3",
      password: hashedPassword2,
      role: "admin"
    }
  });

  console.log("Users created");

  // Create partners
  const partners = [
    { name: "AWS", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg", description: "Amazon Web Services - Líder mundial em serviços de computação em nuvem.", website: "https://aws.amazon.com", order: 1 },
    { name: "Microsoft Azure", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg", description: "Plataforma de nuvem da Microsoft para aplicações empresariais.", website: "https://azure.microsoft.com", order: 2 },
    { name: "IBM Cloud", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg", description: "Soluções de nuvem híbrida e inteligência artificial.", website: "https://www.ibm.com/cloud", order: 3 },
    { name: "Microsoft 365", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", description: "Suite de produtividade e colaboração empresarial.", website: "https://www.microsoft.com/microsoft-365", order: 4 },
    { name: "Acronis", logoUrl: "https://i.ytimg.com/vi/uCXGi_F-Mrs/sddefault.jpg", description: "Líder em proteção de dados e backup corporativo.", website: "https://www.acronis.com", order: 5 },
    { name: "Kaspersky", logoUrl: "https://cdn.m3solutions.net.br/partners/kaspersky.png", description: "Soluções avançadas de cibersegurança.", website: "https://www.kaspersky.com.br", order: 6 },
    { name: "Sophos", logoUrl: "https://cdn.m3solutions.net.br/partners/sophos.png", description: "Segurança de rede e endpoint de próxima geração.", website: "https://www.sophos.com/pt-br", order: 7 },
    { name: "Bitdefender", logoUrl: "https://cdn.m3solutions.net.br/partners/bitdefender.png", description: "Proteção contra malware e ameaças digitais.", website: "https://www.bitdefender.com.br", order: 8 },
    { name: "ESET", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/ESET_logo.svg/1280px-ESET_logo.svg.png", description: "Segurança digital para empresas e usuários.", website: "https://www.eset.com/br", order: 9 },
    { name: "Panda Security", logoUrl: "https://yt3.googleusercontent.com/h4i9TGIT0b0vSeH4ZTd3CSmifDQwLFDuhuKQ3f1GtJAO7yGcnHgWZch5vHSstAxmek3O_UBpgg=s900-c-k-c0x00ffffff-no-rj", description: "Proteção avançada contra ameaças cibernéticas.", website: "https://www.pandasecurity.com", order: 10 },
    { name: "Autodesk", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Autodesk_Logo_2021.svg/3840px-Autodesk_Logo_2021.svg.png", description: "Software de design, engenharia e entretenimento 3D.", website: "https://latinoamerica.autodesk.com", order: 11 }
  ];

  for (const partner of partners) {
    await prisma.partner.upsert({
      where: { id: partner.name.toLowerCase().replace(/\s+/g, "-") },
      update: partner,
      create: { ...partner, id: partner.name.toLowerCase().replace(/\s+/g, "-") }
    });
  }

  console.log("Partners created");

  // Create posts
  const posts = [
    {
      title: "Backup é diferente de segurança: entenda antes de perder seus dados",
      slug: "backup-diferente-seguranca",
      content: `<p>Muitas empresas acreditam que ter um backup é sinônimo de estar protegido contra ameaças digitais. No entanto, backup e segurança são conceitos complementares, mas distintos.</p>\n\n<h2>O que é Backup?</h2>\n<p>Backup é a cópia de segurança dos seus dados. Ele garante que, em caso de perda, corrupção ou exclusão acidental, você possa recuperar suas informações. Um bom backup deve ser:</p>\n<ul>\n<li>Automático e regular</li>\n<li>Armazenado em local seguro (preferencialmente em nuvem)</li>\n<li>Testado periodicamente</li>\n</ul>\n\n<h2>O que é Segurança?</h2>\n<p>Segurança de TI envolve todas as medidas para proteger seus sistemas contra ameaças como:</p>\n<ul>\n<li>Ransomware e malware</li>\n<li>Ataques de phishing</li>\n<li>Invasões e acessos não autorizados</li>\n<li>Vazamento de dados</li>\n</ul>\n\n<h2>Por que você precisa dos dois?</h2>\n<p>Imagine que sua empresa sofra um ataque de ransomware. Se você tiver apenas segurança, mas o ataque conseguir passar, você pode perder tudo. Se tiver apenas backup, mas ele também for criptografado pelo ransomware, de nada adianta.</p>\n\n<p><strong>A solução ideal combina:</strong></p>\n<ul>\n<li>Firewall e antivírus atualizados</li>\n<li>Backup isolado e criptografado</li>\n<li>Monitoramento 24x7</li>\n<li>Políticas de acesso e autenticação</li>\n</ul>\n\n<p>Na M3Solutions, oferecemos soluções completas de backup e segurança para proteger sua empresa. Entre em contato conosco!</p>`,
      excerpt: "Descubra a diferença crucial entre backup e segurança de TI e por que sua empresa precisa de ambos para estar verdadeiramente protegida.",
      imageUrl: "https://cdn.abacus.ai/images/de239951-321f-40d2-a4da-0afef7afcf98.png",
      category: "Segurança",
      author: "M3Solutions"
    },
    {
      title: "5 benefícios do Multicloud para sua empresa",
      slug: "5-beneficios-multicloud",
      content: `<p>A estratégia multicloud está se tornando cada vez mais popular entre empresas que buscam flexibilidade, resiliência e otimização de custos em suas operações de TI.</p>\n\n<h2>O que é Multicloud?</h2>\n<p>Multicloud é a utilização de múltiplos provedores de nuvem (como AWS, Azure e IBM Cloud) de forma integrada, aproveitando o melhor de cada plataforma.</p>\n\n<h2>Principais Benefícios:</h2>\n\n<h3>1. Evita Vendor Lock-in</h3>\n<p>Você não fica preso a um único fornecedor, tendo liberdade para escolher as melhores soluções.</p>\n\n<h3>2. Maior Resiliência</h3>\n<p>Se um provedor tiver problemas, seus serviços podem continuar funcionando em outro.</p>\n\n<h3>3. Otimização de Custos</h3>\n<p>Você pode escolher o provedor mais econômico para cada tipo de workload.</p>\n\n<h3>4. Conformidade e Localização</h3>\n<p>Alguns dados precisam ficar em regiões específicas por questões de compliance.</p>\n\n<h3>5. Melhor Performance</h3>\n<p>Você pode utilizar o provedor com melhor latência para cada região ou tipo de aplicação.</p>\n\n<p>A M3Solutions é especialista em implementação de estratégias multicloud. Fale conosco!</p>`,
      excerpt: "Conheça os principais benefícios de adotar uma estratégia multicloud e como ela pode transformar a TI da sua empresa.",
      imageUrl: "https://cdn.abacus.ai/images/bacf05fc-c0e4-48d3-b8f6-de3391c3f06f.png",
      category: "Cloud",
      author: "M3Solutions"
    },
    {
      title: "LGPD: O que sua empresa precisa saber",
      slug: "lgpd-o-que-sua-empresa-precisa-saber",
      content: `<p>A Lei Geral de Proteção de Dados (LGPD) está em vigor e todas as empresas brasileiras precisam se adequar. Entenda os principais pontos.</p>\n\n<h2>O que é a LGPD?</h2>\n<p>A LGPD (Lei 13.709/2018) regulamenta o tratamento de dados pessoais no Brasil, estabelecendo regras sobre coleta, armazenamento, tratamento e compartilhamento de dados.</p>\n\n<h2>Principais Obrigações:</h2>\n<ul>\n<li>Obter consentimento para coleta de dados</li>\n<li>Informar a finalidade do tratamento</li>\n<li>Garantir segurança dos dados</li>\n<li>Permitir que titulares acessem e excluam seus dados</li>\n<li>Nomear um DPO (Data Protection Officer)</li>\n</ul>\n\n<h2>Penalidades</h2>\n<p>As multas podem chegar a 2% do faturamento da empresa, limitadas a R$ 50 milhões por infração.</p>\n\n<h2>Como a M3Solutions pode ajudar?</h2>\n<p>Oferecemos consultoria completa para adequação à LGPD, incluindo:</p>\n<ul>\n<li>Mapeamento de dados</li>\n<li>Implementação de controles de segurança</li>\n<li>Políticas de privacidade</li>\n<li>Treinamento de equipes</li>\n</ul>`,
      excerpt: "Entenda os principais pontos da LGPD e como adequar sua empresa à legislação de proteção de dados.",
      imageUrl: "https://cdn.abacus.ai/images/2ce1a089-6d03-4701-a130-37f761520ace.png",
      category: "LGPD",
      author: "M3Solutions"
    },
    {
      title: "NOC 24x7: Por que monitoramento contínuo é essencial",
      slug: "noc-24x7-monitoramento-continuo-essencial",
      content: `<p>Em um mundo onde sistemas operam 24 horas por dia, qualquer minuto de indisponibilidade pode significar prejuízos significativos. O NOC 24x7 é a solução.</p>\n\n<h2>O que é NOC?</h2>\n<p>NOC (Network Operations Center) é um centro de operações que monitora, gerencia e responde a incidentes em infraestruturas de TI de forma contínua.</p>\n\n<h2>Benefícios do NOC 24x7:</h2>\n\n<h3>Detecção Proativa</h3>\n<p>Identificamos problemas antes que eles afetem seus usuários ou clientes.</p>\n\n<h3>Resposta Rápida</h3>\n<p>Nossa equipe responde a incidentes em minutos, não horas.</p>\n\n<h3>Redução de Custos</h3>\n<p>Evite prejuízos com downtime e reduza custos com equipe interna.</p>\n\n<h3>SLAs Garantidos</h3>\n<p>Oferecemos acordos de nível de serviço com garantia de disponibilidade.</p>\n\n<h2>O que monitoramos?</h2>\n<ul>\n<li>Servidores e storage</li>\n<li>Redes e conectividade</li>\n<li>Aplicações críticas</li>\n<li>Segurança e backups</li>\n<li>Cloud e ambientes híbridos</li>\n</ul>`,
      excerpt: "Descubra como o monitoramento NOC 24x7 pode garantir a disponibilidade e segurança da infraestrutura de TI da sua empresa.",
      imageUrl: "https://cdn.abacus.ai/images/fd06d353-1861-441e-a830-41617c126019.png",
      category: "Infraestrutura",
      author: "M3Solutions"
    },
    {
      title: "Transformação Digital: Como começar na sua empresa",
      slug: "transformacao-digital-como-comecar",
      content: `<p>A transformação digital não é mais uma opção, é uma necessidade. Mas por onde começar?</p>\n\n<h2>O que é Transformação Digital?</h2>\n<p>Transformação digital é a integração da tecnologia digital em todas as áreas de uma empresa, mudando fundamentalmente como ela opera e entrega valor aos clientes.</p>\n\n<h2>Passos para Começar:</h2>\n\n<h3>1. Diagnóstico</h3>\n<p>Avalie o nível de maturidade digital atual da sua empresa.</p>\n\n<h3>2. Defina Objetivos</h3>\n<p>Estabeleça metas claras e mensuráveis para a transformação.</p>\n\n<h3>3. Priorize Projetos</h3>\n<p>Comece pelos projetos que trarão maior impacto com menor risco.</p>\n\n<h3>4. Capacite Pessoas</h3>\n<p>Invista em treinamento e cultura digital.</p>\n\n<h3>5. Execute e Meça</h3>\n<p>Implemente, monitore resultados e ajuste conforme necessário.</p>\n\n<h2>Como a M3Solutions ajuda?</h2>\n<p>Nossa consultoria em TI guia sua empresa em cada etapa da jornada de transformação digital, desde o diagnóstico até a implementação.</p>`,
      excerpt: "Guia prático para iniciar a jornada de transformação digital na sua empresa de forma estruturada e eficiente.",
      imageUrl: "https://cdn.abacus.ai/images/33585bc1-a263-4282-ac7a-1202bd897363.png",
      category: "Tecnologia",
      author: "M3Solutions"
    },
    {
      title: "Gestão de TI Terceirizada: Vantagens para PMEs",
      slug: "gestao-ti-terceirizada-vantagens-pmes",
      content: `<p>Pequenas e médias empresas muitas vezes não têm recursos para manter uma equipe de TI completa. A terceirização pode ser a solução ideal.</p>\n\n<h2>Por que terceirizar a Gestão de TI?</h2>\n\n<h3>Redução de Custos</h3>\n<p>Elimine custos com contratação, treinamento e benefícios de uma equipe interna.</p>\n\n<h3>Acesso a Especialistas</h3>\n<p>Tenha acesso a profissionais especializados em diversas áreas de TI.</p>\n\n<h3>Foco no Core Business</h3>\n<p>Sua equipe pode focar no que realmente importa: o negócio.</p>\n\n<h3>Escalabilidade</h3>\n<p>Aumente ou reduza recursos conforme a demanda.</p>\n\n<h3>Tecnologia Atualizada</h3>\n<p>Acesso às últimas tecnologias sem grandes investimentos.</p>\n\n<h2>O que inclui nossa Gestão de TI?</h2>\n<ul>\n<li>Suporte técnico completo</li>\n<li>Monitoramento de infraestrutura</li>\n<li>Gestão de segurança</li>\n<li>Backup e recuperação</li>\n<li>Consultoria estratégica</li>\n<li>Gestão de fornecedores</li>\n</ul>`,
      excerpt: "Conheça as principais vantagens da gestão de TI terceirizada para pequenas e médias empresas.",
      imageUrl: "https://cdn.abacus.ai/images/f64e19b9-b249-4df1-a4c4-7e340f9a3396.png",
      category: "Gestão",
      author: "M3Solutions"
    },
    {
      title: "Inteligência Artificial para Micro Empresas: Como transformar seu negócio",
      slug: "inteligencia-artificial-para-micro-empresas",
      content: `<p>A Inteligência Artificial (IA) não é mais exclusividade das grandes corporações. Micro e pequenas empresas podem - e devem - aproveitar essa tecnologia para otimizar operações e crescer.</p>\n\n<h2>IA acessível para pequenos negócios</h2>\n<p>Com a popularização de ferramentas como ChatGPT, Microsoft Copilot e Google Gemini, a IA se tornou acessível para empresas de todos os portes. Essas ferramentas podem ajudar em:</p>\n<ul>\n<li>Atendimento ao cliente automatizado</li>\n<li>Criação de conteúdo para marketing</li>\n<li>Análise de dados e relatórios</li>\n<li>Automação de tarefas repetitivas</li>\n<li>Gestão financeira simplificada</li>\n</ul>\n\n<h2>Por onde começar?</h2>\n<h3>1. Identifique processos repetitivos</h3>\n<p>Liste as tarefas que consomem mais tempo da sua equipe.</p>\n\n<h3>2. Experimente ferramentas gratuitas</h3>\n<p>Comece com versões gratuitas de ChatGPT, Canva AI ou ferramentas similares.</p>\n\n<h3>3. Treine sua equipe</h3>\n<p>Invista em capacitação básica sobre uso de IA.</p>\n\n<h3>4. Automatize gradualmente</h3>\n<p>Comece com um processo e expanda conforme os resultados.</p>\n\n<h2>Casos de uso práticos</h2>\n<ul>\n<li><strong>Restaurantes:</strong> Chatbots para reservas e pedidos</li>\n<li><strong>Escritórios:</strong> Automação de documentos e contratos</li>\n<li><strong>Varejo:</strong> Recomendação de produtos e gestão de estoque</li>\n<li><strong>Serviços:</strong> Agendamento automático e follow-up</li>\n</ul>\n\n<p>A M3Solutions pode ajudar sua empresa a implementar soluções de IA de forma segura e eficiente. Entre em contato!</p>`,
      excerpt: "Descubra como a Inteligência Artificial pode transformar micro e pequenas empresas com soluções acessíveis e práticas.",
      imageUrl: "https://cdn.abacus.ai/images/33585bc1-a263-4282-ac7a-1202bd897363.png",
      category: "Tecnologia",
      author: "M3Solutions"
    },
    {
      title: "Cibersegurança e Proteção Digital: Guia completo para empresas",
      slug: "ciberseguranca-e-protecao-digital",
      content: `<p>A cibersegurança se tornou uma prioridade para empresas de todos os tamanhos. Com o aumento de ataques cibernéticos, proteger seus dados e sistemas é essencial para a sobrevivência do negócio.</p>\n\n<h2>O cenário atual de ameaças</h2>\n<p>Os ataques cibernéticos cresceram exponencialmente nos últimos anos:</p>\n<ul>\n<li>Ransomware: sequestro de dados com pedido de resgate</li>\n<li>Phishing: golpes por email para roubo de credenciais</li>\n<li>Vazamento de dados: exposição de informações sensíveis</li>\n<li>Ataques DDoS: sobrecarga de servidores</li>\n</ul>\n\n<h2>Pilares da proteção digital</h2>\n\n<h3>1. Antivírus e EDR</h3>\n<p>Proteção de endpoints com detecção e resposta avançada.</p>\n\n<h3>2. Firewall de próxima geração</h3>\n<p>Controle de tráfego e inspeção profunda de pacotes.</p>\n\n<h3>3. Backup seguro</h3>\n<p>Cópias de segurança isoladas e criptografadas.</p>\n\n<h3>4. Gestão de identidade (IAM)</h3>\n<p>Controle de quem acessa o quê, com autenticação multifator.</p>\n\n<h3>5. Conscientização</h3>\n<p>Treinamento de colaboradores sobre ameaças e boas práticas.</p>\n\n<h2>Checklist de segurança básica</h2>\n<ul>\n<li>Senhas fortes e únicas para cada sistema</li>\n<li>Autenticação em dois fatores (2FA) ativada</li>\n<li>Atualizações de software em dia</li>\n<li>Backup regular testado</li>\n<li>Antivírus em todos os dispositivos</li>\n<li>Firewall configurado corretamente</li>\n<li>Política de segurança documentada</li>\n</ul>\n\n<p>A M3Solutions oferece soluções completas de cibersegurança para proteger sua empresa. Fale conosco!</p>`,
      excerpt: "Guia completo sobre cibersegurança e proteção digital para empresas: ameaças, soluções e boas práticas.",
      imageUrl: "https://cdn.abacus.ai/images/de239951-321f-40d2-a4da-0afef7afcf98.png",
      category: "Segurança",
      author: "M3Solutions"
    },
    {
      title: "Como proteger sua empresa contra golpes digitais e sequestro de dados (Ransomware)",
      slug: "como-proteger-empresa-golpes-digitais-ransomware",
      content: `<p>O ransomware é uma das maiores ameaças cibernéticas da atualidade. Criminosos sequestram os dados da empresa e exigem pagamento para liberá-los. Saiba como se proteger.</p>\n\n<h2>O que é Ransomware?</h2>\n<p>Ransomware é um tipo de malware que criptografa todos os arquivos do computador ou servidor, tornando-os inacessíveis. Os criminosos então exigem um "resgate" (ransom) em criptomoedas para fornecer a chave de descriptografia.</p>\n\n<h2>Como os ataques acontecem?</h2>\n<ul>\n<li><strong>Email de phishing:</strong> Links ou anexos maliciosos</li>\n<li><strong>Vulnerabilidades:</strong> Softwares desatualizados</li>\n<li><strong>RDP exposto:</strong> Acesso remoto sem proteção</li>\n<li><strong>Downloads infectados:</strong> Softwares piratas ou de fontes não confiáveis</li>\n</ul>\n\n<h2>Como se proteger?</h2>\n\n<h3>1. Backup isolado</h3>\n<p>Mantenha backups offline ou em nuvem isolada, que não podem ser acessados pela rede principal.</p>\n\n<h3>2. Atualizações em dia</h3>\n<p>Mantenha todos os sistemas operacionais e softwares atualizados.</p>\n\n<h3>3. Antivírus/EDR</h3>\n<p>Use soluções de proteção avançada que detectem comportamentos suspeitos.</p>\n\n<h3>4. Treinamento</h3>\n<p>Ensine colaboradores a identificar emails e links suspeitos.</p>\n\n<h3>5. Segmentação de rede</h3>\n<p>Separe redes críticas para limitar a propagação de ataques.</p>\n\n<h2>O que fazer se for atacado?</h2>\n<ul>\n<li>Isole imediatamente os sistemas afetados</li>\n<li>Não pague o resgate (não há garantia de recuperação)</li>\n<li>Acione sua equipe de TI ou parceiro de segurança</li>\n<li>Restaure os dados a partir do backup</li>\n<li>Notifique as autoridades competentes</li>\n</ul>\n\n<p>A M3Solutions pode ajudar a proteger sua empresa contra ransomware. Entre em contato!</p>`,
      excerpt: "Aprenda a proteger sua empresa contra ransomware e golpes digitais com medidas práticas e eficazes.",
      imageUrl: "https://cdn.abacus.ai/images/de239951-321f-40d2-a4da-0afef7afcf98.png",
      category: "Segurança",
      author: "M3Solutions"
    },
    {
      title: "Os 7 erros de segurança mais comuns em pequenas e médias empresas",
      slug: "7-erros-seguranca-pequenas-medias-empresas",
      content: `<p>Pequenas e médias empresas são alvos frequentes de ataques cibernéticos justamente por cometerem erros básicos de segurança. Conheça os mais comuns e como evitá-los.</p>\n\n<h2>1. Senhas fracas ou compartilhadas</h2>\n<p>Usar "123456" ou compartilhar senhas entre funcionários facilita invasões. Use senhas fortes e únicas, com gerenciador de senhas.</p>\n\n<h2>2. Falta de backup</h2>\n<p>Não ter backup ou tê-lo na mesma rede é receita para desastre. Mantenha backups isolados e testados regularmente.</p>\n\n<h2>3. Softwares desatualizados</h2>\n<p>Sistemas operacionais e aplicativos sem atualização contêm vulnerabilidades conhecidas. Ative atualizações automáticas.</p>\n\n<h2>4. Sem antivírus ou com antivírus gratuito</h2>\n<p>Soluções gratuitas não oferecem proteção adequada para empresas. Invista em proteção corporativa com gerenciamento centralizado.</p>\n\n<h2>5. Acesso irrestrito</h2>\n<p>Todos os funcionários com acesso a tudo aumenta riscos. Implemente controle de acesso baseado em funções.</p>\n\n<h2>6. Ignorar treinamento</h2>\n<p>Funcionários são o elo mais fraco. Treine regularmente sobre phishing e boas práticas de segurança.</p>\n\n<h2>7. Sem monitoramento</h2>\n<p>Não saber o que acontece na rede impede resposta rápida. Implemente monitoramento e alertas de segurança.</p>\n\n<h2>Como corrigir?</h2>\n<p>A M3Solutions oferece assessment de segurança para identificar vulnerabilidades e implementar as correções necessárias. Entre em contato!</p>`,
      excerpt: "Conheça os 7 erros de segurança mais comuns em PMEs e aprenda como corrigi-los para proteger sua empresa.",
      imageUrl: "https://cdn.abacus.ai/images/fd06d353-1861-441e-a830-41617c126019.png",
      category: "Segurança",
      author: "M3Solutions"
    },
    {
      title: "Sua empresa pode estar vulnerável agora: principais brechas que hackers exploram",
      slug: "empresa-vulneravel-brechas-hackers-exploram",
      content: `<p>Hackers estão constantemente procurando brechas em sistemas empresariais. Conheça as vulnerabilidades mais exploradas e verifique se sua empresa está em risco.</p>\n\n<h2>Principais vulnerabilidades exploradas</h2>\n\n<h3>1. RDP (Remote Desktop) exposto</h3>\n<p>Servidores com acesso remoto direto pela internet são alvos fáceis. Use VPN ou soluções de acesso seguro.</p>\n\n<h3>2. VPNs desatualizadas</h3>\n<p>VPNs com vulnerabilidades conhecidas são portas abertas. Mantenha atualizadas ou use alternativas modernas como ZTNA.</p>\n\n<h3>3. Servidores Exchange antigos</h3>\n<p>Versões antigas do Exchange têm falhas críticas. Migre para Exchange Online ou atualize urgentemente.</p>\n\n<h3>4. Sistemas operacionais obsoletos</h3>\n<p>Windows 7 e Server 2008 não recebem mais correções de segurança. Atualize para versões suportadas.</p>\n\n<h3>5. Plugins desatualizados</h3>\n<p>WordPress, Java, Flash com vulnerabilidades são explorados em minutos. Mantenha tudo atualizado.</p>\n\n<h2>Como descobrir se você está vulnerável?</h2>\n<p>Realizamos varreduras de vulnerabilidades que identificam brechas antes que hackers as encontrem. Solicite uma avaliação gratuita!</p>\n\n<h2>Próximos passos</h2>\n<ul>\n<li>Faça um inventário de sistemas e versões</li>\n<li>Identifique o que está exposto à internet</li>\n<li>Priorize atualizações críticas</li>\n<li>Implemente monitoramento contínuo</li>\n</ul>\n\n<p>A M3Solutions pode ajudar a identificar e corrigir vulnerabilidades na sua empresa. Fale conosco!</p>`,
      excerpt: "Descubra as principais brechas de segurança que hackers exploram e verifique se sua empresa está em risco.",
      imageUrl: "https://cdn.abacus.ai/images/de239951-321f-40d2-a4da-0afef7afcf98.png",
      category: "Segurança",
      author: "M3Solutions"
    },
    {
      title: "Antivírus ainda funciona? O que realmente protege uma empresa hoje",
      slug: "antivirus-ainda-funciona-protege-empresa-hoje",
      content: `<p>O antivírus tradicional já não é suficiente para proteger empresas contra ameaças modernas. Entenda o que realmente funciona hoje.</p>\n\n<h2>A evolução das ameaças</h2>\n<p>Os ataques cibernéticos evoluíram muito além de vírus tradicionais:</p>\n<ul>\n<li>Ransomware sofisticado</li>\n<li>Ataques fileless (sem arquivos)</li>\n<li>Exploração de vulnerabilidades zero-day</li>\n<li>Engenharia social avançada</li>\n<li>Ataques direcionados (APT)</li>\n</ul>\n\n<h2>Antivírus tradicional vs moderno</h2>\n\n<h3>Antivírus tradicional</h3>\n<ul>\n<li>Baseado em assinaturas (conhece ameaças já catalogadas)</li>\n<li>Reativo (detecta depois que o arquivo é baixado)</li>\n<li>Sem visibilidade de comportamento</li>\n</ul>\n\n<h3>Soluções modernas (EDR/XDR)</h3>\n<ul>\n<li>Análise comportamental com IA</li>\n<li>Detecção de ameaças desconhecidas</li>\n<li>Resposta automática a incidentes</li>\n<li>Visibilidade completa do endpoint</li>\n<li>Integração com outras camadas de segurança</li>\n</ul>\n\n<h2>O que uma empresa precisa hoje?</h2>\n<ol>\n<li><strong>EDR (Endpoint Detection & Response):</strong> Proteção avançada de endpoints</li>\n<li><strong>Firewall NGFW:</strong> Controle de tráfego e inspeção</li>\n<li><strong>Email Security:</strong> Proteção contra phishing</li>\n<li><strong>Backup isolado:</strong> Última linha de defesa</li>\n<li><strong>Conscientização:</strong> Treinamento de usuários</li>\n</ol>\n\n<p>A M3Solutions oferece soluções de segurança de última geração. Fale conosco para uma avaliação!</p>`,
      excerpt: "Entenda por que o antivírus tradicional não é mais suficiente e o que realmente protege uma empresa hoje.",
      imageUrl: "https://cdn.abacus.ai/images/fd06d353-1861-441e-a830-41617c126019.png",
      category: "Segurança",
      author: "M3Solutions"
    }
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: post,
      create: post
    });
  }

  console.log("Posts created");

  // Create blog categories
  const blogCategories = [
    { name: "Segurança", slug: "seguranca", description: "Artigos sobre cibersegurança, proteção de dados e ameaças digitais.", color: "#DC2626", order: 1 },
    { name: "Cloud", slug: "cloud", description: "Conteúdo sobre computação em nuvem, multicloud e infraestrutura.", color: "#2563EB", order: 2 },
    { name: "Infraestrutura", slug: "infraestrutura", description: "Artigos sobre servidores, redes e datacenter.", color: "#7C3AED", order: 3 },
    { name: "Gestão de TI", slug: "gestao-de-ti", description: "Conteúdo sobre gestão, terceirização e estratégia de TI.", color: "#059669", order: 4 },
    { name: "LGPD", slug: "lgpd", description: "Artigos sobre a Lei Geral de Proteção de Dados e compliance.", color: "#D97706", order: 5 },
    { name: "Transformação Digital", slug: "transformacao-digital", description: "Conteúdo sobre inovação, digitalização e tecnologia.", color: "#0891B2", order: 6 }
  ];

  for (const cat of blogCategories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
  }
  console.log("Blog categories created");

  // Create blog authors
  const blogAuthors = [
    { name: "Equipe M3Solutions", slug: "equipe-m3solutions", bio: "Equipe de especialistas em TI da M3Solutions.", email: "contato@m3solutions.com.br" },
    { name: "Especialista em Segurança", slug: "especialista-seguranca", bio: "Especialista em cibersegurança e proteção de dados." },
    { name: "Consultor de Cloud", slug: "consultor-cloud", bio: "Consultor especializado em soluções cloud e infraestrutura." }
  ];

  for (const author of blogAuthors) {
    await prisma.blogAuthor.upsert({
      where: { slug: author.slug },
      update: author,
      create: author
    });
  }
  console.log("Blog authors created");

  // Create voice templates
  const voiceTemplates = [
    {
      name: "Técnico B2B",
      description: "Tom profissional e técnico para artigos B2B de tecnologia.",
      persona: "Você é um redator especializado em conteúdo B2B de tecnologia.\n\nTom: Profissional, informativo e técnico quando necessário.\nEstilo: Claro, objetivo e focado em soluções.\nObjetivo: Educar o leitor e posicionar a M3Solutions como especialista.\n\nDiretrizes:\n- Use linguagem técnica mas acessível\n- Inclua dados e estatísticas quando relevante\n- Foque em benefícios práticos para empresas\n- Termine com um CTA claro",
      tone: "Profissional e técnico",
      isDefault: true
    },
    {
      name: "Educativo",
      description: "Tom mais didático para explicar conceitos complexos.",
      persona: "Você é um educador de tecnologia que explica conceitos complexos de forma simples.\n\nTom: Didático, acessível e paciente.\nEstilo: Usa analogias e exemplos do dia a dia.\nObjetivo: Desmistificar a tecnologia para gestores não-técnicos.\n\nDiretrizes:\n- Evite jargões desnecessários\n- Use analogias para explicar conceitos\n- Divida informações em tópicos claros\n- Inclua exemplos práticos",
      tone: "Educativo e acessível",
      isDefault: false
    },
    {
      name: "Urgência",
      description: "Tom que transmite urgência para temas de segurança.",
      persona: "Você é um especialista em segurança alertando sobre riscos.\n\nTom: Urgente mas não alarmista.\nEstilo: Direto, com fatos e estatísticas de impacto.\nObjetivo: Motivar ação imediata sem causar pânico.\n\nDiretrizes:\n- Apresente os riscos de forma clara\n- Use dados de ataques reais\n- Ofereça soluções concretas\n- Crie senso de urgência para ação",
      tone: "Urgente e direto",
      isDefault: false
    }
  ];

  for (const template of voiceTemplates) {
    const existing = await prisma.voiceTemplate.findFirst({ where: { name: template.name } });
    if (!existing) {
      await prisma.voiceTemplate.create({ data: template });
    }
  }
  console.log("Voice templates created");

  // ==========================================
  // TEMPLATES DE PÁGINA (Sistema CMS)
  // ==========================================
  
  const pageTemplates = [
    {
      name: "Cabeçalho",
      slug: "header",
      type: "HEADER" as const,
      description: "Template do cabeçalho do site com logo, navegação e contatos",
      isSystem: true,
      schema: {
        fields: [
          { key: "logo", type: "image", label: "Logo", required: true },
          { key: "logoAlt", type: "text", label: "Texto Alt do Logo" },
          { key: "phone", type: "text", label: "Telefone" },
          { key: "email", type: "text", label: "E-mail" },
          { key: "whatsapp", type: "text", label: "WhatsApp" },
          { key: "showTopBar", type: "boolean", label: "Mostrar barra superior" }
        ]
      },
      defaultContent: {
        logo: "/og-image.png",
        logoAlt: "M3Solutions",
        phone: "(11) 3644-7037",
        email: "contato@m3solutions.com.br",
        whatsapp: "5511964497037",
        showTopBar: true
      },
      sections: {
        items: [
          { key: "topBar", label: "Barra Superior", editable: true },
          { key: "navigation", label: "Navegação", editable: true },
          { key: "mobileMenu", label: "Menu Mobile", editable: false }
        ]
      }
    },
    {
      name: "Rodapé",
      slug: "footer",
      type: "FOOTER" as const,
      description: "Template do rodapé com links, contatos e redes sociais",
      isSystem: true,
      schema: {
        fields: [
          { key: "companyName", type: "text", label: "Nome da Empresa" },
          { key: "description", type: "textarea", label: "Descrição" },
          { key: "address", type: "textarea", label: "Endereço" },
          { key: "cnpj", type: "text", label: "CNPJ" },
          { key: "linkedin", type: "text", label: "LinkedIn URL" },
          { key: "instagram", type: "text", label: "Instagram URL" },
          { key: "facebook", type: "text", label: "Facebook URL" }
        ]
      },
      defaultContent: {
        companyName: "M3Solutions",
        description: "Soluções em TI para empresas",
        address: "Rua Vergueiro, 2087 - Cj 101 - Vila Mariana, São Paulo - SP",
        cnpj: "05.416.937/0001-24",
        linkedin: "https://linkedin.com/company/m3solutions",
        instagram: "https://instagram.com/m3solutions",
        facebook: "https://facebook.com/m3solutions"
      },
      sections: {
        items: [
          { key: "about", label: "Sobre", editable: true },
          { key: "links", label: "Links Rápidos", editable: true },
          { key: "contact", label: "Contato", editable: true },
          { key: "social", label: "Redes Sociais", editable: true },
          { key: "copyright", label: "Copyright", editable: true }
        ]
      }
    },
    {
      name: "Home",
      slug: "home",
      type: "HOME" as const,
      description: "Página inicial com hero, serviços, parceiros e CTA",
      isSystem: true,
      schema: {
        fields: [
          { key: "heroTitle", type: "text", label: "Título Principal" },
          { key: "heroSubtitle", type: "textarea", label: "Subtítulo" },
          { key: "heroImage", type: "image", label: "Imagem de Fundo" },
          { key: "heroCta", type: "text", label: "Texto do Botão" },
          { key: "heroCtaLink", type: "text", label: "Link do Botão" },
          { key: "statsClients", type: "text", label: "Número de Clientes" },
          { key: "statsUptime", type: "text", label: "Uptime" },
          { key: "statsSupport", type: "text", label: "Suporte" }
        ]
      },
      defaultContent: {
        heroTitle: "Transformamos a TI da sua empresa",
        heroSubtitle: "Soluções completas em tecnologia para impulsionar seu negócio",
        heroImage: "https://cdn.m3solutions.net.br/hero-background.jpg",
        heroCta: "Fale Conosco",
        heroCtaLink: "/contato",
        statsClients: "5597+",
        statsUptime: "99.9%",
        statsSupport: "24x7"
      },
      sections: {
        items: [
          { key: "hero", label: "Hero Banner", editable: true, order: 1 },
          { key: "services", label: "Serviços", editable: true, order: 2 },
          { key: "solutions", label: "Soluções", editable: true, order: 3 },
          { key: "whyUs", label: "Por que Escolher", editable: true, order: 4 },
          { key: "testimonials", label: "Depoimentos", editable: true, order: 5 },
          { key: "partners", label: "Parceiros", editable: true, order: 6 },
          { key: "news", label: "Notícias", editable: true, order: 7 },
          { key: "cta", label: "CTA Final", editable: true, order: 8 }
        ]
      }
    },
    {
      name: "Página de Serviços",
      slug: "services",
      type: "SERVICES" as const,
      description: "Listagem de serviços com cards e filtros",
      isSystem: true,
      schema: {
        fields: [
          { key: "title", type: "text", label: "Título" },
          { key: "subtitle", type: "textarea", label: "Subtítulo" },
          { key: "showFilters", type: "boolean", label: "Mostrar Filtros" }
        ]
      },
      defaultContent: {
        title: "Nossas Soluções",
        subtitle: "Conheça todas as soluções que oferecemos para transformar sua TI",
        showFilters: true
      },
      sections: {
        items: [
          { key: "header", label: "Cabeçalho", editable: true, order: 1 },
          { key: "filters", label: "Filtros", editable: true, order: 2 },
          { key: "grid", label: "Grid de Serviços", editable: true, order: 3 },
          { key: "cta", label: "CTA", editable: true, order: 4 }
        ]
      }
    },
    {
      name: "Página de Produtos",
      slug: "products",
      type: "PRODUCTS" as const,
      description: "Catálogo de produtos e soluções",
      isSystem: true,
      schema: {
        fields: [
          { key: "title", type: "text", label: "Título" },
          { key: "subtitle", type: "textarea", label: "Subtítulo" },
          { key: "showCategories", type: "boolean", label: "Mostrar Categorias" }
        ]
      },
      defaultContent: {
        title: "Nossos Produtos",
        subtitle: "Soluções de hardware e software para sua empresa",
        showCategories: true
      },
      sections: {
        items: [
          { key: "header", label: "Cabeçalho", editable: true, order: 1 },
          { key: "categories", label: "Categorias", editable: true, order: 2 },
          { key: "grid", label: "Grid de Produtos", editable: true, order: 3 },
          { key: "cta", label: "CTA", editable: true, order: 4 }
        ]
      }
    },
    {
      name: "Quem Somos",
      slug: "about",
      type: "ABOUT" as const,
      description: "Página institucional com história, missão e valores",
      isSystem: true,
      schema: {
        fields: [
          { key: "title", type: "text", label: "Título" },
          { key: "intro", type: "textarea", label: "Introdução" },
          { key: "history", type: "richtext", label: "História" },
          { key: "mission", type: "textarea", label: "Missão" },
          { key: "vision", type: "textarea", label: "Visão" },
          { key: "values", type: "array", label: "Valores" },
          { key: "mainImage", type: "image", label: "Imagem Principal" }
        ]
      },
      defaultContent: {
        title: "Quem Somos",
        intro: "Conheça a M3Solutions",
        history: "Fundada em 2002, a M3Solutions nasceu com o propósito de oferecer soluções completas em TI...",
        mission: "Oferecer soluções completas e personalizadas em gestão de TI",
        vision: "Ser referência nacional em outsourcing de TI",
        values: ["Excelência", "Inovação", "Ética", "Compromisso", "Parceria"],
        mainImage: "https://cdn.m3solutions.net.br/equipe-corporativa.jpg"
      },
      sections: {
        items: [
          { key: "hero", label: "Hero", editable: true, order: 1 },
          { key: "intro", label: "Introdução", editable: true, order: 2 },
          { key: "history", label: "História", editable: true, order: 3 },
          { key: "mission", label: "Missão e Visão", editable: true, order: 4 },
          { key: "values", label: "Valores", editable: true, order: 5 },
          { key: "cta", label: "CTA", editable: true, order: 6 }
        ]
      }
    },
    {
      name: "Contato",
      slug: "contact",
      type: "CONTACT" as const,
      description: "Página de contato com formulário e mapa",
      isSystem: true,
      schema: {
        fields: [
          { key: "title", type: "text", label: "Título" },
          { key: "subtitle", type: "textarea", label: "Subtítulo" },
          { key: "address", type: "textarea", label: "Endereço" },
          { key: "phone", type: "text", label: "Telefone" },
          { key: "email", type: "text", label: "E-mail" },
          { key: "hours", type: "textarea", label: "Horário de Atendimento" },
          { key: "mapEmbed", type: "textarea", label: "Embed do Mapa" }
        ]
      },
      defaultContent: {
        title: "Entre em Contato",
        subtitle: "Estamos prontos para atender você",
        address: "Rua Vergueiro, 2087 - Cj 101 - Vila Mariana, São Paulo - SP",
        phone: "(11) 3644-7037",
        email: "contato@m3solutions.com.br",
        hours: "Segunda a Sexta: 8h às 18h"
      },
      sections: {
        items: [
          { key: "header", label: "Cabeçalho", editable: true, order: 1 },
          { key: "form", label: "Formulário", editable: true, order: 2 },
          { key: "info", label: "Informações", editable: true, order: 3 },
          { key: "map", label: "Mapa", editable: true, order: 4 }
        ]
      }
    },
    {
      name: "Listagem de Posts",
      slug: "post-list",
      type: "POST_LIST" as const,
      description: "Página de listagem de notícias/blog",
      isSystem: true,
      schema: {
        fields: [
          { key: "title", type: "text", label: "Título" },
          { key: "subtitle", type: "textarea", label: "Subtítulo" },
          { key: "postsPerPage", type: "number", label: "Posts por Página" },
          { key: "showFilters", type: "boolean", label: "Mostrar Filtros" },
          { key: "showSearch", type: "boolean", label: "Mostrar Busca" }
        ]
      },
      defaultContent: {
        title: "Notícias",
        subtitle: "Fique por dentro das novidades do mundo de TI",
        postsPerPage: 9,
        showFilters: true,
        showSearch: true
      },
      sections: {
        items: [
          { key: "header", label: "Cabeçalho", editable: true, order: 1 },
          { key: "filters", label: "Filtros", editable: true, order: 2 },
          { key: "grid", label: "Grid de Posts", editable: false, order: 3 },
          { key: "pagination", label: "Paginação", editable: false, order: 4 }
        ]
      }
    },
    {
      name: "Página Legal",
      slug: "legal",
      type: "LEGAL" as const,
      description: "Template para páginas legais (LGPD, Termos, etc)",
      isSystem: true,
      schema: {
        fields: [
          { key: "title", type: "text", label: "Título" },
          { key: "lastUpdate", type: "date", label: "Última Atualização" },
          { key: "content", type: "richtext", label: "Conteúdo" }
        ]
      },
      defaultContent: {
        title: "Política de Privacidade",
        lastUpdate: new Date().toISOString(),
        content: "Conteúdo da política..."
      },
      sections: {
        items: [
          { key: "header", label: "Cabeçalho", editable: true, order: 1 },
          { key: "content", label: "Conteúdo", editable: true, order: 2 }
        ]
      }
    }
  ];

  // Page templates model foi deletado
  // for (const template of pageTemplates) {
  //   const existing = await prisma.pageTemplate.findFirst({ where: { slug: template.slug } });
  //   if (!existing) {
  //     await prisma.pageTemplate.create({ data: template });
  //     console.log(`  ✓ Template "${template.name}" criado`);
  //   }
  // }
  console.log("Page templates skipped (model deleted)");

  // Create default author "Márcio Petito" for Chronicles module
  const marcioPetito = await prisma.blogAuthor.upsert({
    where: { slug: "marcio-petito" },
    update: {
      name: "Márcio Petito",
      avatar: "https://cdn.abacus.ai/images/6a4da12c-c367-4051-95aa-45f371daf2e3.png",
      bio: "CEO da M3Solutions com mais de 20 anos de experiência em tecnologia e segurança da informação. Especialista em infraestrutura de TI, cloud computing e transformação digital para empresas.",
      linkedin: "https://www.linkedin.com/in/marciopetito/",
    },
    create: {
      name: "Márcio Petito",
      slug: "marcio-petito",
      bio: "CEO da M3Solutions com mais de 20 anos de experiência em tecnologia e segurança da informação. Especialista em infraestrutura de TI, cloud computing e transformação digital para empresas.",
      email: "marcio@m3solutions.com.br",
      avatar: "https://cdn.abacus.ai/images/6a4da12c-c367-4051-95aa-45f371daf2e3.png",
      linkedin: "https://www.linkedin.com/in/marciopetito/",
      active: true,
      tone: "Conversacional e envolvente",
      writingStyle: "Crônicas tecnológicas com análises críticas",
      targetAudience: "Profissionais de TI e empresários",
      contentGoals: "Informar sobre tendências de tecnologia e segurança",
      wordCountMin: 100,
      wordCountMax: 200
    }
  });
  console.log("Author 'Márcio Petito' created:", marcioPetito.id);

  // Seed NotificationRecipient - model foi deletado
  // await prisma.notificationRecipient.upsert({
  //   where: { email_category: { email: "gestores@m3solutions.com.br", category: "gestao" } },
  //   update: {},
  //   create: {
  //     name: "Gestores M3",
  //     email: "gestores@m3solutions.com.br",
  //     category: "gestao",
  //     active: true,
  //   },
  // });
  // await prisma.notificationRecipient.upsert({
  //   where: { email_category: { email: "gestores@m3solutions.com.br", category: "materiais" } },
  //   update: {},
  //   create: {
  //     name: "Gestores M3",
  //     email: "gestores@m3solutions.com.br",
  //     category: "materiais",
  //     active: true,
  //   },
  // });
  console.log("NotificationRecipient seeded: gestores@m3solutions.com.br (gestao + materiais)");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
