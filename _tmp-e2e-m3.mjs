import { chromium } from 'playwright';
const BASE = 'http://104.248.235.24:3200';
const EMAIL = 'admin@m3solutions.com.br';
const PASS = 'M3Admin@2024';

const BRIEFING = `
Empresa: M3Solutions, consultoria de TI corporativa, São Paulo - SP, fundada em 2014. Pode pular qualquer pergunta que não cubro — use defaults.
Setor: Gestão de infraestrutura de TI / NOC 24x7 / Multicloud / Segurança.
Pitch da home: Transformamos TI em vantagem competitiva. Monitoramento 24x7, SLA 99.9%.
Dor: TI fragmentada, múltiplos fornecedores, downtime imprevisível, custos opacos. CIOs precisam SLA real.
Público: CIOs/CTOs de empresas médias e grandes (financeiro, indústria, varejo, saúde).
Ofertas: NOC 24x7, Multicloud (AWS/Azure/IBM), Nuvem privada, Segurança, Backup.
Diferenciais: 12+ anos no mercado / NOC próprio com 99.9% uptime / Equipe certificada AWS/Azure/IBM/Cisco/VMware.
Produto principal: NOC 24x7 Multicloud — monitoramento ininterrupto de infra cloud + on-premises com SLA contratualizado.
Como funciona: 1) Diagnóstico do ambiente. 2) Implantação NOC + integração. 3) Monitoramento 24x7 + incidentes + relatórios.
FAQ: Atendem 24x7? Sim. Como multicloud? Gerenciamos AWS+Azure+IBM unificado. Onboarding? 30-45 dias.
Contato: tel 0800-880-7777, WhatsApp (11) 99100-7777, contato@m3solutions.com.br, Rua Gomes de Carvalho 1629 Vila Olímpia SP, plantão 24x7.
Tom: corporativo técnico, dados (SLA/uptime/anos), linguagem profissional pra profissional.
Cores: paleta DARK corporativa — navy #0a1929, accent ciano #00d4ff, texto branco. Tipografia Inter/IBM Plex Sans. Vibe IBM/Accenture B2B.
Objetivo: capturar lead pra NOC/Multicloud.

NÃO ME PERGUNTE NADA. GERA O SITE AGORA COM ESSAS INFORMAÇÕES.
`.trim();

// Frases coloquiais variadas pra EXERCITAR o classificador de intenção (FIX 1)
const APPROVALS = [
  "ficou show, manda a próxima",
  "ótimo, pode seguir",
  "gostei dessa, segue",
  "tá perfeito, próxima",
  "pode mandar ver",
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`${BASE}/gestor/login`);
await page.fill('input[type=email]', EMAIL);
await page.fill('input[type=password]', PASS);
await page.click('button[type=submit]');
await page.waitForURL(/\/gestor$/, { timeout: 30000 });
const cookies = await ctx.cookies();
const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
await browser.close();

async function send(message, sessionId, timeoutMs = 300_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${BASE}/api/gestor/wizard/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStr },
      body: JSON.stringify({ message, sessionId }),
      signal: ctrl.signal,
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  } finally { clearTimeout(t); }
}

// Reset primeiro (já temos backup)
console.log('[reset]');
const reset = await fetch(`${BASE}/api/gestor/reset-stitch`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieStr },
  body: JSON.stringify({ confirm: true }),
}).then(r => r.json());
console.log('  ', JSON.stringify(reset.deleted ?? reset));

console.log('\n[briefing]');
let r = await send(BRIEFING);
let sessionId = r.body?.sessionId;
let state = r.body?.state;
console.log('  state=', state, 'session=', sessionId);

const PUSH = ["Use o que te dei. Pula o resto. GERA AGORA.", "Pode gerar, sem mais perguntas.", "Gera o site."];
let pulls = 0;
while (state === 'discovery' && pulls < 8) {
  r = await send(PUSH[Math.min(pulls, PUSH.length-1)], sessionId);
  state = r.body?.state; pulls++;
  console.log(`  discovery#${pulls} → ${state}`);
  if (['confirm_brief','generating_page','review_page'].includes(state)) break;
}

if (state === 'confirm_brief') {
  console.log('\n[confirma: "isso, pode gerar"]');
  r = await send('isso, pode gerar', sessionId);
  state = r.body?.state;
  console.log('  state=', state);
}

// Loop de review com APROVAÇÕES COLOQUIAIS — testa FIX 1
async function waitState(targets, timeoutMs=600_000) {
  const start = Date.now(); let last = null;
  while (Date.now()-start < timeoutMs) {
    r = await send(' ', sessionId).catch(()=>({body:{state:last}}));
    const s = r.body?.state;
    if (s !== last) { console.log('    →', s); last = s; }
    if (targets.includes(s)) return s;
    await new Promise(x=>setTimeout(x,8000));
  }
  return last;
}

let approvalIdx = 0;
for (let i = 0; i < 6; i++) {
  console.log(`\n[review #${i+1}] aguardando geração…`);
  state = await waitState(['review_page','ready_to_publish','published','error']);
  if (['ready_to_publish','published','error'].includes(state)) break;
  if (state === 'review_page') {
    const phrase = APPROVALS[Math.min(approvalIdx, APPROVALS.length-1)];
    approvalIdx++;
    console.log(`  → aprovando com NL: "${phrase}"`);
    r = await send(phrase, sessionId);
    state = r.body?.state;
    console.log(`    resultado state=${state} (esperado: generating_page ou ready_to_publish, NÃO review_page de novo)`);
  }
}

if (state === 'ready_to_publish') {
  console.log('\n[publicar: "pode colocar no ar"]');
  r = await send('pode colocar no ar', sessionId);
  state = r.body?.state;
  console.log('  state=', state);
  for (let i=0;i<12 && state==='publishing';i++){
    await new Promise(x=>setTimeout(x,5000));
    r = await send(' ', sessionId); state = r.body?.state;
    console.log(`  publish wait#${i+1} ${state}`);
  }
}

console.log('\n=== FINAL state=', state, '===');
process.exit(state === 'published' ? 0 : 1);
