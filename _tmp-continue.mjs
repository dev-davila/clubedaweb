import { chromium } from 'playwright';
const BASE = 'http://104.248.235.24:3200';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`${BASE}/gestor/login`);
await page.fill('input[type=email]', 'admin@m3solutions.com.br');
await page.fill('input[type=password]', 'M3Admin@2024');
await page.click('button[type=submit]');
await page.waitForURL(/\/gestor$/, { timeout: 30000 });
const cookieStr = (await ctx.cookies()).map(c=>`${c.name}=${c.value}`).join('; ');
// pega sessionId atual
const wiz = await page.evaluate(async()=> (await fetch('/api/gestor/wizard/chat')).json());
const sessionId = wiz?.sessionId;
console.log('sessionId=', sessionId, 'state=', wiz?.state, 'page=', wiz?.currentPage);
await browser.close();

async function send(message, timeoutMs=120_000) {
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${BASE}/api/gestor/wizard/chat`, {
      method:'POST', headers:{'Content-Type':'application/json',Cookie:cookieStr},
      body: JSON.stringify({ message, sessionId }), signal: ctrl.signal,
    });
    return { status:r.status, body: await r.json().catch(()=>null) };
  } catch(e) { return { status:0, body:null, err:String(e) }; } finally { clearTimeout(t); }
}

// Poll passivo (mensagem " " só lê estado, timeout curto)
async function waitState(targets, timeoutMs=600_000) {
  const start=Date.now(); let last=null;
  while(Date.now()-start<timeoutMs){
    const r = await send(' ', 40_000);
    const s = r.body?.state ?? last;
    if(s!==last){console.log('   →',s,r.body?.currentPage?`(${r.body.currentPage})`:''); last=s;}
    if(targets.includes(s)) return s;
    await new Promise(x=>setTimeout(x,8000));
  }
  return last;
}

const APPROVALS = ["ótimo, pode seguir","gostei dessa, manda a próxima","tá perfeito, segue","pode mandar ver, ficou bom"];
let state = wiz?.state, idx=0;

for (let i=0;i<6;i++){
  console.log(`\n[ciclo #${i+1}] state atual=${state}`);
  if (state === 'review_page') {
    const phrase = APPROVALS[Math.min(idx,APPROVALS.length-1)]; idx++;
    console.log(`  aprovar NL: "${phrase}"`);
    // dispara aprovação (não espera resposta longa — a geração roda no server)
    const r = await send(phrase, 30_000);
    if (r.err) console.log('  (request retornou cedo/timeout, geração segue no server)');
    else console.log('  state pós-envio:', r.body?.state);
  }
  // espera próxima review ou ready
  state = await waitState(['review_page','ready_to_publish','published','error'], 600_000);
  if (['ready_to_publish','published','error'].includes(state)) break;
}

if (state === 'ready_to_publish') {
  console.log('\n[publicar: "pode colocar no ar"]');
  const r = await send('pode colocar no ar', 60_000);
  state = r.body?.state ?? state;
  console.log('  state=', state);
  for(let i=0;i<15 && state==='publishing';i++){
    await new Promise(x=>setTimeout(x,5000));
    const rr = await send(' ',40_000); state = rr.body?.state ?? state;
    console.log(`  publish wait#${i+1} ${state}`);
  }
}
console.log('\n=== FINAL:', state, '===');
process.exit(state==='published'?0:1);
