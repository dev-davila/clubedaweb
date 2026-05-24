import { chromium } from "playwright";

const ROOT = "http://104.248.235.24:3200";
const EMAIL = "admin@m3solutions.com.br";
const PASS = "M3Admin@2024";

const PROFILE = {
  companyName: "Vitalis Saúde Integrativa",
  industry: "Clínica de saúde integrativa — medicina funcional, nutrição e psicologia",
  homePitch: "Cuidado completo de saúde mental e física, com acompanhamento contínuo por médicos, nutricionistas e psicólogos no mesmo plano.",
  mainPain: "Pacientes pulando entre especialistas isolados, sem ninguém olhando o quadro inteiro — perdem tempo, dinheiro e seguem com sintoma sem causa.",
  audience: "Profissionais de 30 a 55 anos, classe A/B, em São Paulo, que querem prevenir doença crônica e ter um plano de saúde unificado em vez de consultas avulsas.",
  offerings: "Medicina funcional / Nutrição clínica / Psicologia / Exames laboratoriais avançados / Acompanhamento mensal por equipe multidisciplinar",
  differentiators: ["Equipe multidisciplinar revisa cada caso em conjunto, semanalmente", "Exames de microbiota e marcadores inflamatórios incluídos no plano", "App próprio com diário alimentar, sono e humor monitorado pela equipe"],
  productName: "Plano Vitalis 360",
  productDescription: "Assinatura mensal com consultas ilimitadas com médico funcional, nutricionista e psicólogo, exames trimestrais inclusos e revisão da equipe a cada 4 semanas. R$1.890/mês.",
  howItWorks: ["Avaliação inicial de 90min com toda a equipe", "Plano personalizado com metas em sono, alimentação e exercícios", "Revisões mensais de progresso com toda a equipe junta"],
  proofPoints: ["8 anos de operação em SP", "Mais de 1200 pacientes em acompanhamento contínuo", "94% de aderência ao plano após 6 meses"],
  faq: [
    { q: "Atende plano de saúde?", a: "Trabalhamos com reembolso. Emitimos toda a documentação para você solicitar diretamente ao seu plano." },
    { q: "Onde fica a clínica?", a: "Av. Brigadeiro Faria Lima, 1234 - Itaim Bibi, SP." },
    { q: "Posso cancelar?", a: "Sim, sem fidelidade. Cancelamento pelo app." },
  ],
  contactPhone: "(11) 3030-1010",
  contactEmail: "contato@vitalissaude.com.br",
  contactWhatsapp: "(11) 99888-7766",
  contactAddress: "Av. Brigadeiro Faria Lima, 1234 - Itaim Bibi, São Paulo - SP",
  contactHours: "Seg-Sex 7h-21h · Sáb 8h-14h",
  cityState: "São Paulo - SP",
  foundedYear: "2018",
  tone: "Acolhedor, técnico e premium — sem jargão complicado",
  colors: "Tema DARK estilo Spotify — fundo preto/verde-escuro, accent verde-neon vibrante (#1DB954), tipografia bold e moderna, sensação tech e premium, NÃO clinical clean tradicional",
  references: ["spotify.com", "wellth.com", "ouracare.com"],
  siteGoal: "Agendar avaliação inicial gratuita",
  pricingModel: "Plano Vitalis 360 a R$1.890/mês · sem fidelidade",
};

function answerFor(q) {
  q = (q || "").toLowerCase();
  const dict = [
    [["nome.*empres", "como.*chama", "qual.*empresa", "nome do projeto"], PROFILE.companyName],
    [["ramo", "setor", "segmento", "atua", "indústria", "industria"], PROFILE.industry],
    [["mensagem.*home", "headline", "o que.*visitante", "frase de impacto", "pitch"], PROFILE.homePitch],
    [["dor", "problema.*resolv"], PROFILE.mainPain],
    [["público", "publico", "audien", "persona", "para quem"], PROFILE.audience],
    [["serviç", "oferec", "o que vende"], PROFILE.offerings],
    [["diferenc", "destaque", "vantag"], PROFILE.differentiators.join(" / ")],
    [["produto principal", "carro-?chefe", "plano principal"], PROFILE.productName],
    [["descreva.*produto", "detalh.*produto", "descrição.*produto"], PROFILE.productDescription],
    [["como funcion", "etapas", "processo", "passo a passo"], PROFILE.howItWorks.join(" → ")],
    [["prova", "case", "número", "social proof", "depoiment"], PROFILE.proofPoints.join(" · ")],
    [["faq", "dúvida", "pergunt.*frequen"], PROFILE.faq.map(f => `${f.q} — ${f.a}`).join("\n")],
    [["telefone", "fone"], PROFILE.contactPhone],
    [["e-?mail"], PROFILE.contactEmail],
    [["whats"], PROFILE.contactWhatsapp],
    [["endereço", "endereco", "address"], PROFILE.contactAddress],
    [["horário", "horario", "atendimento"], PROFILE.contactHours],
    [["cidade", "estado", "onde fica"], PROFILE.cityState],
    [["fundaç", "fundad", "desde quando"], PROFILE.foundedYear],
    [["tom", "voz", "linguagem"], PROFILE.tone],
    [["cor", "paleta", "visual", "estética", "estilo.*visual", "design.*visual", "tema"], PROFILE.colors],
    [["referência", "inspir", "benchmark", "concorrent"], PROFILE.references.join(", ")],
    [["objetivo", "conversão", "ação principal", "cta"], PROFILE.siteGoal],
    [["preço", "valor", "investimento", "quanto custa"], PROFILE.pricingModel],
    [["sobre.*empresa", "história", "instituci", "about", "quem somos"], "Vitalis nasceu em 2018 quando percebemos que pacientes pulavam entre 5+ especialistas sem ninguém olhando o todo. Equipe multidisciplinar revisa cada caso semanalmente."],
  ];
  for (const [keys, ans] of dict) {
    if (keys.some(k => new RegExp(k, "i").test(q))) return ans;
  }
  return null;
}

const browser = await chromium.launch({ headless: false, slowMo: 80 });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
const page = await ctx.newPage();

console.log("→ login");
await page.goto(`${ROOT}/gestor/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForURL(/\/gestor(?!\/login)/, { timeout: 15000 });
console.log("  ✓ logado");

console.log("→ abre chat");
await page.goto(`${ROOT}/gestor/wizard/chat`, { waitUntil: "networkidle" });
await page.waitForSelector("textarea:not([disabled])", { timeout: 30000 });
await page.waitForTimeout(1500);

console.log("→ Reiniciar");
await page.getByRole("button", { name: /Reiniciar/i }).click();
await page.waitForTimeout(2500);
const confirm = page.getByRole("button", { name: /^(sim|confirmar|reiniciar)$/i });
if ((await confirm.count().catch(() => 0)) > 0) {
  try { await confirm.first().click({ timeout: 2000 }); } catch {}
}
await page.waitForSelector("textarea:not([disabled])", { timeout: 30000 });
await page.waitForTimeout(2500);

async function getBotMessages() {
  const all = await page.locator("main div.flex.justify-start > div").allInnerTexts();
  // Filtra spinner "Processando…" / "Gerando página…" (são divs do busy, não mensagens reais)
  return all.filter(t => !/^(Processando|Gerando)/.test(t.trim()));
}
async function waitBusyGone(timeoutMs = 240000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const spinning = await page.locator("main div.flex.justify-start > div").filter({ hasText: /^(Processando|Gerando)/ }).count().catch(() => 0);
    if (spinning === 0) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}
async function getState() {
  try { return (await page.locator("header div.font-mono").innerText({ timeout: 1000 })).trim(); }
  catch { return ""; }
}

async function waitForNewBot(prevCount, timeoutMs = 300000) {
  const start = Date.now();
  // Espera spinner sumir
  await waitBusyGone(timeoutMs);
  while (Date.now() - start < timeoutMs) {
    await page.waitForTimeout(1500);
    const all = await getBotMessages();
    if (all.length > prevCount) {
      await page.waitForTimeout(1200);
      const final = await getBotMessages();
      return final[final.length - 1] || "";
    }
  }
  return "";
}

async function send(text) {
  const cnt = (await getBotMessages()).length;
  const short = text.slice(0, 70).replace(/\n/g, " ");
  console.log(`  → "${short}${text.length > 70 ? "…" : ""}"`);
  await page.waitForSelector("textarea:not([disabled])", { timeout: 60000 });
  const ta = page.locator("textarea").last();
  await ta.fill(text);
  await ta.press("Enter");
  const reply = await waitForNewBot(cnt);
  const state = await getState();
  console.log(`    ← [${state}] ${reply.slice(0, 130).replace(/\n/g, " ")}…`);
  return { reply, state };
}

const all0 = await getBotMessages();
let last = all0[all0.length - 1] || "";
let st = await getState();
console.log(`  init [${st}] (${all0.length} bots): ${last.slice(0, 180).replace(/\n/g, " ")}…`);

let stuckHash = "";
let stuckN = 0;
for (let turn = 1; turn <= 60; turn++) {
  let ans;
  const stt = await getState();
  if (/confirm_brief/i.test(stt) && /sim.*pode gerar|posso gerar|começ.*gerar/i.test(last)) {
    ans = "sim, pode gerar";
  } else if (/review_page/i.test(stt) || /proposta de design|outra versão/i.test(last)) {
    ans = "aprovar";
  } else {
    ans = answerFor(last) || "Pode seguir com o que já tem coletado.";
  }
  const { reply, state } = await send(ans);
  last = reply;

  if (/site pronto|preview liberado|ready_to_publish|publicad/i.test(reply) || /ready_to_publish/i.test(state)) {
    console.log("🎉 SITE PRONTO");
    break;
  }
  const hash = reply.slice(0, 100);
  if (hash === stuckHash) {
    stuckN++;
    if (stuckN > 3) { console.log("⚠ stuck"); break; }
  } else stuckN = 0;
  stuckHash = hash;
}

console.log("→ screenshot final");
await page.screenshot({ path: "/tmp/vitalis-chat-end.png", fullPage: true });
console.log("✓ done — janela ficará aberta por 90s");
await page.waitForTimeout(90000);
await browser.close();
