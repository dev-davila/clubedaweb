/**
 * AI Agent Orchestration Library
 * Handles LLM integration with Abacus AI for WhatsApp AI customer service.
 */

import { prisma } from "@/lib/db";
import { createEvolutionClient } from "@/lib/evolution-api";
import {
  isUnodeskConfigured,
  buscarEmpresaPorCnpj,
  buscarPessoaPorTelefone,
  buscarPessoaPorEmail,
  cadastrarEmpresa,
  cadastrarPessoa,
  criarChamado,
} from "@/lib/unodesk";

const LLM_URL = () =>
  process.env.OPENAI_API_KEY
    ? "https://api.openai.com/v1/chat/completions"
    : "https://routellm.abacus.ai/v1/chat/completions";
const API_KEY = () => process.env.OPENAI_API_KEY || process.env.ABACUSAI_API_KEY || "";

// ---- Session Processing Lock (prevents duplicate/parallel AI processing) ----
// Key: "phone:instanceId", Value: timestamp when lock was acquired
const sessionLocks = new Map<string, number>();
const LOCK_TIMEOUT_MS = 120_000; // 2 min max lock

function acquireSessionLock(phone: string, instanceId: string): boolean {
  const key = `${phone}:${instanceId}`;
  const now = Date.now();
  const existing = sessionLocks.get(key);
  // Allow if no lock or lock expired
  if (!existing || (now - existing) > LOCK_TIMEOUT_MS) {
    sessionLocks.set(key, now);
    return true;
  }
  return false;
}

function releaseSessionLock(phone: string, instanceId: string): void {
  sessionLocks.set(`${phone}:${instanceId}`, 0);
}

// ---- Processed Message Dedup (prevents same message from being AI-processed twice) ----
const processedMessageIds = new Set<string>();
const MAX_PROCESSED_IDS = 500;

function markMessageProcessed(msgId: string): boolean {
  if (processedMessageIds.has(msgId)) return false; // already processed
  processedMessageIds.add(msgId);
  // Prevent memory leak — trim oldest entries
  if (processedMessageIds.size > MAX_PROCESSED_IDS) {
    const first = processedMessageIds.values().next().value;
    if (first) processedMessageIds.delete(first);
  }
  return true;
}

// ---- Types ----

export interface AiResponse {
  reply: string;
  department?: string;
  step?: string;
  metadata?: Record<string, any>;
  shouldHandoff?: boolean;
  handoffReason?: string;
  shouldClose?: boolean;
  closeReason?: string;
  routeTo?: string; // inter-agent routing: department name to transfer to
  toolAction?: string; // tool to execute (e.g. "consultar_cnpj")
  toolParams?: Record<string, any>; // parameters for the tool
}

// ---- Unodesk Tool Execution ----

async function executeUnodeskTool(action: string, params: Record<string, any>): Promise<string> {
  try {
    const configured = await isUnodeskConfigured();
    if (!configured) return "[ERRO] Integração Unodesk não configurada.";

    switch (action) {
      case "consultar_cnpj": {
        const cnpj = params.cnpj || "";
        if (!cnpj) return "[ERRO] CNPJ não fornecido.";
        const empresas = await buscarEmpresaPorCnpj(cnpj);
        if (empresas.length === 0) {
          return `[RESULTADO] Nenhuma empresa encontrada no Unodesk com CNPJ ${cnpj}. A empresa NÃO está cadastrada. Você pode oferecer para cadastrá-la usando a ferramenta "cadastrar_empresa".`;
        }
        const e = empresas[0];
        return `[RESULTADO] Empresa encontrada no Unodesk:
- ID: ${e.id}
- Nome: ${e.nome}
- Apelido: ${e.apelido || "-"}
- CNPJ: ${e.numero}
- Email: ${e.email || "-"}
- Telefone: ${e.telefone || "-"}
- Ativo: ${e.is_ativo ? "Sim" : "Não"}
- Chamados: ${e.count_chamados || 0}
- Pessoas: ${e.count_pessoas || 0}`;
      }

      case "consultar_telefone": {
        const telefone = params.telefone || "";
        const empresaId = params.empresa_id ? Number(params.empresa_id) : undefined;
        if (!telefone) return "[ERRO] Telefone não fornecido.";
        const pessoas = await buscarPessoaPorTelefone(telefone, empresaId);
        if (pessoas.length === 0) {
          return `[RESULTADO] Nenhuma pessoa encontrada no Unodesk com telefone ${telefone}. A pessoa NÃO está cadastrada. Você pode oferecer para cadastrá-la usando a ferramenta "cadastrar_pessoa".`;
        }
        return `[RESULTADO] ${pessoas.length} pessoa(s) encontrada(s):\n` +
          pessoas.map((p: any) => `- ID: ${p.id} | Nome: ${p.nome} | Email: ${p.email || "-"} | Empresa ID: ${p.empresa_id}`).join("\n");
      }

      case "consultar_email": {
        const email = params.email || "";
        if (!email) return "[ERRO] Email não fornecido.";
        const pessoas = await buscarPessoaPorEmail(email);
        if (pessoas.length === 0) {
          return `[RESULTADO] Nenhuma pessoa encontrada no Unodesk com email ${email}.`;
        }
        return `[RESULTADO] ${pessoas.length} pessoa(s) encontrada(s):\n` +
          pessoas.map((p: any) => `- ID: ${p.id} | Nome: ${p.nome} | Email: ${p.email || "-"} | Empresa ID: ${p.empresa_id}`).join("\n");
      }

      case "cadastrar_empresa": {
        const { nome, cnpj, telefone, email } = params;
        if (!nome || !cnpj) return "[ERRO] Nome e CNPJ são obrigatórios para cadastrar empresa.";
        // Check if already exists first
        const existing = await buscarEmpresaPorCnpj(cnpj);
        if (existing.length > 0) {
          return `[RESULTADO] Empresa com CNPJ ${cnpj} já existe no Unodesk (ID: ${existing[0].id}, Nome: ${existing[0].nome}). Não foi necessário cadastrar.`;
        }
        const empresa = await cadastrarEmpresa({ nome, cnpj, telefone, email });
        if (empresa.id) {
          return `[RESULTADO] Empresa cadastrada com sucesso no Unodesk!\n- ID: ${empresa.id}\n- Nome: ${empresa.nome}\n- CNPJ: ${empresa.numero}`;
        }
        return `[ERRO] Falha ao cadastrar empresa: ${JSON.stringify(empresa)}`;
      }

      case "cadastrar_pessoa": {
        const { nome, empresa_id, telefone, email } = params;
        if (!nome || !empresa_id) return "[ERRO] Nome e empresa_id são obrigatórios para cadastrar pessoa.";
        const pessoa = await cadastrarPessoa({ nome, empresaId: Number(empresa_id), telefone, email });
        if (pessoa.id) {
          return `[RESULTADO] Pessoa cadastrada com sucesso no Unodesk!\n- ID: ${pessoa.id}\n- Nome: ${pessoa.nome}\n- Empresa ID: ${pessoa.empresa_id}`;
        }
        return `[ERRO] Falha ao cadastrar pessoa: ${JSON.stringify(pessoa)}`;
      }

      case "criar_chamado": {
        const { title, description, empresa_id, person_id } = params;
        if (!title || !empresa_id || !person_id) return "[ERRO] title, empresa_id e person_id são obrigatórios.";
        const result = await criarChamado({
          code: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          description: description || title,
          empresaId: String(empresa_id),
          personId: String(person_id),
        });
        if (result?.data?.ticket_id) {
          return `[RESULTADO] Chamado criado com sucesso! Ticket ID: ${result.data.ticket_id}`;
        }
        return `[RESULTADO] Chamado enviado. Resposta: ${JSON.stringify(result)}`;
      }

      default:
        return `[ERRO] Ferramenta desconhecida: ${action}`;
    }
  } catch (error: any) {
    console.error(`[AI-Agent] Unodesk tool error (${action}):`, error);
    return `[ERRO] Erro ao executar ${action}: ${error.message || "erro desconhecido"}`;
  }
}

interface SessionContext {
  sessionId: string;
  agentConfigId: string;
  agentName: string;
  systemPrompt: string;
  restrictions: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  departments: string[];
  businessRules: string | null;
  currentStep: string;
  currentDepartment: string | null;
  metadata: Record<string, any>;
  isEntryPoint: boolean;
  routingInstructions: string | null;
  availableAgents: string[]; // names of other agents available for routing
  fallbackModel: string | null;
  trainingEnabled: boolean;
  unodeskEnabled: boolean;
}

// ---- Helpers ----

/** Sleep for the configured response delay (simulates human typing time) */
function applyResponseDelay(delaySec: number): Promise<void> {
  if (!delaySec || delaySec <= 0) return Promise.resolve();
  console.log(`[AI-Agent] Applying response delay: ${delaySec}s`);
  return new Promise(resolve => setTimeout(resolve, delaySec * 1000));
}

// ---- Main Orchestration ----

/**
 * Process an incoming WhatsApp message through the AI pipeline.
 * 1. Find or create session
 * 2. Save incoming message
 * 3. Build context from history
 * 4. Call LLM
 * 5. Parse structured response
 * 6. Update session state
 * 7. Send reply via Evolution API
 */
export async function processIncomingMessage(params: {
  instanceId: string;
  remoteJid: string;
  phone: string;
  content: string;
  messageType?: string;
  externalMsgId?: string;
  contactName?: string;
  conversationId?: string;
}): Promise<{ handled: boolean; reason?: string }> {
  const {
    instanceId, remoteJid, phone, content,
    messageType = "text", externalMsgId, contactName, conversationId,
  } = params;

  // ---- DEDUP: skip if this exact message was already processed ----
  if (externalMsgId && !markMessageProcessed(externalMsgId)) {
    console.log(`[AI-Agent] Dedup: message ${externalMsgId} already processed, skipping`);
    return { handled: false, reason: "duplicate_message" };
  }

  // ---- SESSION LOCK: prevent parallel AI processing for same user ----
  if (!acquireSessionLock(phone, instanceId)) {
    console.log(`[AI-Agent] Lock: session for ${phone} is busy, skipping`);
    return { handled: false, reason: "session_locked" };
  }

  try {
    // 1. Find or create session (may already be with a specific agent)
    let session = await prisma.aiSession.findFirst({
      where: {
        phone,
        instanceId,
        status: { in: ["active", "waiting_human"] },
      },
      include: { agentConfig: true },
    });

    // Check inactivity timeout — close stale sessions automatically
    if (session && session.agentConfig) {
      const inactivityTimeout = (session.agentConfig as any).inactivityTimeout || 0;
      if (inactivityTimeout > 0) {
        const lastActivity = new Date(session.updatedAt).getTime();
        const now = Date.now();
        const minutesSinceActivity = (now - lastActivity) / (1000 * 60);
        if (minutesSinceActivity >= inactivityTimeout) {
          await closeSession(session.id, "inactivity_timeout");
          await saveMessage(session.id, "system", `Sessão encerrada automaticamente por inatividade (${inactivityTimeout} min).`, "text");
          session = null; // will create a new session below
        }
      }
    }

    // Check for close command BEFORE human-mode check so #fim works even in waiting_human
    if (session) {
      const normalizedEarly = content.trim().toLowerCase();
      if (normalizedEarly === "#fim" || normalizedEarly === "#encerrar") {
        await saveMessage(session.id, "client", content, messageType, externalMsgId);
        await closeSession(session.id, "client_requested");
        const closeMsg = "Atendimento encerrado. Obrigado pelo contato! Se precisar de algo mais, é só nos chamar. 😊";
        await sendReply(instanceId, remoteJid, closeMsg);
        await saveMessage(session.id, "system", closeMsg, "text");
        return { handled: true };
      }
    }

    // Check if session is in human/waiting_human mode — skip AI
    if (session && (session.status === "human" || session.status === "waiting_human")) {
      await saveMessage(session.id, "client", content, messageType, externalMsgId);
      return { handled: false, reason: "session_in_human_mode" };
    }

    // 2. Find agent config — use existing session's agent or find entry-point/default
    let agentConfig: any;
    if (session) {
      agentConfig = session.agentConfig;
    } else {
      agentConfig = await findAgentConfigForInstance(instanceId);
      if (!agentConfig) {
        return { handled: false, reason: "no_active_agent" };
      }
    }

    // Get instance owner for session creation
    const instance = await prisma.evolutionInstance.findUnique({
      where: { id: instanceId },
      select: { ownerId: true },
    });
    if (!instance) return { handled: false, reason: "instance_not_found" };

    const isNewSession = !session;
    if (!session) {
      // Close any lingering active/waiting_human sessions for same phone+instance to avoid unique constraint conflict
      await prisma.aiSession.updateMany({
        where: {
          phone,
          instanceId,
          status: { in: ["active", "waiting_human"] },
        },
        data: {
          status: "closed",
          endedAt: new Date(),
          closedReason: "closed_stale",
        },
      });

      session = await prisma.aiSession.create({
        data: {
          phone,
          remoteJid,
          instanceId,
          agentConfigId: agentConfig.id,
          ownerId: instance.ownerId,
          conversationId: conversationId || null,
          status: "active",
          step: "greeting",
          metadata: contactName ? JSON.stringify({ nome: contactName }) : "{}",
        },
        include: { agentConfig: true },
      });
    }

    // 3. Save incoming message
    await saveMessage(session.id, "client", content, messageType, externalMsgId);

    // 4. Send welcome message for new sessions (supports {agentName} placeholder)
    if (isNewSession && agentConfig.welcomeMessage) {
      const welcomeMsg = agentConfig.welcomeMessage.replace(/\{agentName\}/g, agentConfig.name || "Assistente");
      await applyResponseDelay(agentConfig.responseDelay || 0);
      await sendReply(instanceId, remoteJid, welcomeMsg);
      await saveMessage(session.id, "ai", welcomeMsg, "text");
    }

    // 5. Fetch available agents for routing (if entry point or has routing instructions)
    const allAgents = await prisma.aiAgentConfig.findMany({
      where: { active: true, ownerId: instance.ownerId },
      select: { id: true, name: true, departments: true, isEntryPoint: true },
    });
    // If the agent has routingAgentIds set, only include those agents
    const routingAgentIds = safeJsonParse(agentConfig.routingAgentIds) as string[] | null;
    const availableAgents = allAgents
      .filter(a => a.id !== agentConfig.id)
      .filter(a => !routingAgentIds || routingAgentIds.length === 0 || routingAgentIds.includes(a.id))
      .map(a => a.name);

    // 6. Build context and call LLM
    const context = buildSessionContext(session, agentConfig, availableAgents);

    // If this session was transferred from another agent, include parent context
    let history = await getMessageHistory(session.id, 20);
    if (isNewSession && (session as any).parentSessionId) {
      const parentHistory = await getParentSessionContext((session as any).parentSessionId);
      if (parentHistory) {
        history = [...parentHistory, ...history];
      }
    }

    let aiResponse = await callLLM(context, history, content);

    // 6b. TOOL EXECUTION LOOP — if the AI requests a tool, execute it and call LLM again
    const MAX_TOOL_ITERATIONS = 3; // prevent infinite loops
    let toolIteration = 0;
    while (aiResponse.toolAction && context.unodeskEnabled && toolIteration < MAX_TOOL_ITERATIONS) {
      toolIteration++;
      console.log(`[AI-Agent] Tool call #${toolIteration}: ${aiResponse.toolAction}`, aiResponse.toolParams);

      // Send intermediate reply to client (e.g. "Consultando no sistema...")
      if (aiResponse.reply) {
        await applyResponseDelay(agentConfig.responseDelay || 0);
        await sendReply(instanceId, remoteJid, aiResponse.reply);
        await saveMessage(session.id, "ai", aiResponse.reply, "text", undefined,
          JSON.stringify({ toolAction: aiResponse.toolAction, toolParams: aiResponse.toolParams })
        );
      }

      // Execute the tool
      const toolResult = await executeUnodeskTool(aiResponse.toolAction, aiResponse.toolParams || {});
      console.log(`[AI-Agent] Tool result:`, toolResult.slice(0, 200));

      // Save tool result as system message in history
      await saveMessage(session.id, "system", `[Tool: ${aiResponse.toolAction}] ${toolResult}`, "action");

      // Rebuild history with tool result and call LLM again for final response
      history = await getMessageHistory(session.id, 25);
      aiResponse = await callLLM(context, history, `[RESULTADO DA FERRAMENTA "${aiResponse.toolAction}"]:\n${toolResult}\n\nAgora responda ao cliente com base neste resultado.`);
    }

    // 7. CHECK FOR INTER-AGENT ROUTING
    if (aiResponse.routeTo) {
      const routeResult = await routeToAgent({
        routeTo: aiResponse.routeTo,
        currentSession: session,
        instanceId,
        remoteJid,
        phone,
        conversationId: conversationId || session.conversationId || undefined,
        ownerId: instance.ownerId,
        allAgents,
        replyBeforeRoute: aiResponse.reply,
        content,
        messageType,
      });

      if (routeResult.routed) {
        return { handled: true };
      }
      // If routing failed, continue normally (AI's reply will be sent below)
      console.warn(`[AI-Agent] Routing to "${aiResponse.routeTo}" failed: ${routeResult.reason}`);
    }

    // 8. Update session state based on AI response
    const updateData: any = { updatedAt: new Date() };
    if (aiResponse.department && aiResponse.department !== session.department) {
      updateData.department = aiResponse.department;
    }
    if (aiResponse.step && aiResponse.step !== session.step) {
      updateData.step = aiResponse.step;
    }
    if (aiResponse.metadata) {
      const currentMeta = safeJsonParse(session.metadata) || {};
      updateData.metadata = JSON.stringify({ ...currentMeta, ...aiResponse.metadata });
    }

    if (aiResponse.shouldHandoff) {
      updateData.status = "waiting_human";
      updateData.summary = aiResponse.handoffReason || "Cliente solicitou atendimento humano";
    }

    if (aiResponse.shouldClose) {
      updateData.status = "closed";
      updateData.endedAt = new Date();
      updateData.closedReason = aiResponse.closeReason || "resolved";
    }

    await prisma.aiSession.update({
      where: { id: session.id },
      data: updateData,
    });

    // 8b. SEND EMAIL when transferring to human
    if (aiResponse.shouldHandoff) {
      try {
        await sendHandoffEmail({
          sessionId: session.id,
          phone,
          contactName: contactName || (context.metadata as any)?.nome || phone,
          agentName: context.agentName,
          reason: aiResponse.handoffReason || "Cliente solicitou atendimento humano",
          department: aiResponse.department || session.department || "não classificado",
        });
      } catch (emailError) {
        console.error("[AI-Agent] Failed to send handoff email:", emailError);
      }
    }

    // 9. Send reply (with configured delay)
    if (aiResponse.reply) {
      await applyResponseDelay(agentConfig.responseDelay || 0);
      await sendReply(instanceId, remoteJid, aiResponse.reply);
      await saveMessage(session.id, "ai", aiResponse.reply, "text", undefined,
        aiResponse.department || aiResponse.step ? JSON.stringify({
          department: aiResponse.department,
          step: aiResponse.step,
          metadata: aiResponse.metadata,
        }) : undefined
      );
    }

    releaseSessionLock(phone, instanceId);
    return { handled: true };
  } catch (error) {
    releaseSessionLock(phone, instanceId);
    console.error(`[AI-Agent] Error processing message for ${phone}:`, error);
    return { handled: false, reason: "error" };
  }
}

// ---- Agent Config Lookup ----

async function findAgentConfigForInstance(instanceId: string) {
  const configs = await prisma.aiAgentConfig.findMany({
    where: { active: true },
    orderBy: [{ isEntryPoint: "desc" }, { updatedAt: "desc" }],
  });

  // Priority 1: Entry-point agent that matches this instance
  for (const config of configs) {
    if (!config.isEntryPoint) continue;
    if (!config.instanceIds) return config; // applies to all instances
    const ids = config.instanceIds.split(",").map(s => s.trim());
    if (ids.includes(instanceId)) return config;
  }

  // Priority 2: Any agent that matches this instance
  for (const config of configs) {
    if (!config.instanceIds) return config;
    const ids = config.instanceIds.split(",").map(s => s.trim());
    if (ids.includes(instanceId)) return config;
  }

  return null;
}

// Find agent by department/name match for inter-agent routing
async function findAgentByDepartment(
  targetDept: string,
  ownerId: string,
  allAgents: Array<{ id: string; name: string; departments: string; isEntryPoint: boolean }>
): Promise<string | null> {
  const normalized = targetDept.toLowerCase().trim();

  // First: match by agent name (exact or partial)
  for (const agent of allAgents) {
    const agentNameLow = agent.name.toLowerCase();
    if (agentNameLow.includes(normalized) || normalized.includes(agentNameLow)) {
      return agent.id;
    }
  }

  // Second: match by department list
  for (const agent of allAgents) {
    const depts = agent.departments.split(",").map(d => d.trim().toLowerCase());
    if (depts.includes(normalized)) {
      return agent.id;
    }
  }

  // Third: fuzzy match on department keywords
  for (const agent of allAgents) {
    const depts = agent.departments.split(",").map(d => d.trim().toLowerCase());
    for (const dept of depts) {
      if (dept.includes(normalized) || normalized.includes(dept)) {
        return agent.id;
      }
    }
  }

  return null;
}

// ---- LLM Integration ----

function buildSessionContext(
  session: any,
  agentConfig: any,
  availableAgents: string[] = []
): SessionContext {
  const departments = (agentConfig.departments || "comercial,suporte,financeiro").split(",").map((s: string) => s.trim());

  return {
    sessionId: session.id,
    agentConfigId: agentConfig.id,
    agentName: agentConfig.name || "Assistente",
    systemPrompt: agentConfig.systemPrompt,
    restrictions: agentConfig.restrictions || null,
    model: agentConfig.model || "gpt-4o-mini",
    temperature: agentConfig.temperature || 0.7,
    maxTokens: agentConfig.maxTokens || 1024,
    departments,
    businessRules: agentConfig.businessRules || null,
    currentStep: session.step || "greeting",
    currentDepartment: session.department || null,
    metadata: safeJsonParse(session.metadata) || {},
    isEntryPoint: agentConfig.isEntryPoint || false,
    routingInstructions: agentConfig.routingInstructions || null,
    availableAgents,
    fallbackModel: agentConfig.fallbackModel || null,
    trainingEnabled: agentConfig.trainingEnabled || false,
    unodeskEnabled: agentConfig.unodeskEnabled || false,
  };
}

function buildSystemMessage(ctx: SessionContext): string {
  const metaStr = Object.keys(ctx.metadata).length > 0
    ? `\nDados coletados até agora: ${JSON.stringify(ctx.metadata)}`
    : "";

  const rulesStr = ctx.businessRules
    ? `\nRegras de negócio: ${ctx.businessRules}`
    : "";

  const restrictionsStr = ctx.restrictions
    ? `\n\n--- RESTRIÇÕES (O QUE NÃO FAZER/FALAR) ---\n${ctx.restrictions}`
    : "";

  // Build routing instructions if this agent can route to others
  let routingStr = "";
  if (ctx.availableAgents.length > 0) {
    const agentList = ctx.availableAgents.join(", ");
    routingStr = `\n\n--- ROTEAMENTO ENTRE AGENTES ---
Você pode transferir esta conversa para outro agente especializado quando identificar que o cliente precisa de atendimento específico.
Agentes disponíveis para transferência: ${agentList}

Para transferir, inclua o campo "routeTo" na resposta com o nome do agente destino.
Exemplo: "routeTo": "Agente Comercial"

REGRAS DE ROTEAMENTO:
- Só transfira quando tiver certeza de que o cliente precisa de outro departamento/agente.
- Antes de transferir, confirme com o cliente: "Entendi que você precisa de [departamento]. Vou transferir para nosso especialista, ok?"
- Sempre inclua uma mensagem educada no "reply" ao transferir.
- Passe o contexto relevante no campo metadata antes de transferir.`;

    if (ctx.routingInstructions) {
      routingStr += `\n\nInstruções adicionais de roteamento:\n${ctx.routingInstructions}`;
    }
  }

  // Build Unodesk tools instructions
  let unodeskStr = "";
  if (ctx.unodeskEnabled) {
    unodeskStr = `

--- FERRAMENTAS UNODESK (ServiceDesk) ---
Você tem acesso ao sistema Unodesk para consultar e cadastrar empresas/pessoas e abrir chamados.
ATENÇÃO: Este fluxo se aplica a TODAS as filas/departamentos. Para a fila "suporte", o fluxo será idêntico porém com alterações na validação do usuário (a ser implementado).

FERRAMENTAS DISPONÍVEIS:
1. "consultar_cnpj" — Buscar empresa pelo CNPJ. Params: {"cnpj": "XX.XXX.XXX/XXXX-XX"}
2. "consultar_telefone" — Buscar pessoa pelo telefone. Params: {"telefone": "5511999999999", "empresa_id": 123} (empresa_id opcional)
3. "consultar_email" — Buscar pessoa pelo email. Params: {"email": "pessoa@email.com"}
4. "cadastrar_empresa" — Cadastrar nova empresa. Params: {"nome": "RAZÃO SOCIAL", "cnpj": "XX.XXX.XXX/XXXX-XX", "telefone": "(XX) XXXXX-XXXX", "email": "empresa@email.com"}
5. "cadastrar_pessoa" — Cadastrar nova pessoa. Params: {"nome": "NOME", "empresa_id": 123, "telefone": "5511999999999", "email": "pessoa@email.com"}
6. "criar_chamado" — Abrir chamado. Params: {"title": "Título", "description": "TEXTO COMPLETO da conversa, sem resumir nem alterar", "empresa_id": 123, "person_id": 456}

COMO USAR FERRAMENTAS:
- Inclua "toolAction" e "toolParams" na resposta JSON para executar uma ferramenta.
- O campo "reply" deve conter uma mensagem intermediária ao cliente (ex: "Vou verificar seu CNPJ no sistema...").
- Após a execução, você receberá o resultado como mensagem do sistema e deverá responder com base nele.
- Use apenas UMA ferramenta por resposta.

FLUXO OBRIGATÓRIO QUANDO CLIENTE FORNECE CNPJ:
Passo 1: Cliente fornece CNPJ → execute "consultar_cnpj" com reply "Vou verificar seu CNPJ no sistema..."
Passo 2: Com o resultado da consulta:
  - Se empresa ENCONTRADA → confirme com o cliente usando o NOME DELE: "[Nome da pessoa], você está falando da empresa [NOME DA EMPRESA], certo?"
  - Se empresa NÃO encontrada → informe ao cliente e pergunte: nome da empresa, telefone e email para cadastro.
Passo 3: Após confirmação da empresa, peça o email do contato para buscar a pessoa.
Passo 4: Use "consultar_email" para verificar se o contato já existe no Unodesk.
Passo 5: Com base no resultado:
  - Se a pessoa EXISTE no Unodesk → prossiga para abrir o chamado.
  - Se a pessoa NÃO existe → use "cadastrar_pessoa" com os dados fornecidos (nome, empresa_id, telefone, email), depois abra o chamado.
Passo 6: Após ter empresa_id e person_id (seja encontrados ou cadastrados), use "criar_chamado" com:
  - title: resumo objetivo do motivo do contato
  - description: O TEXTO COMPLETO E INTEGRAL de toda a conversa, exatamente como foi conversado, do início ao fim. NUNCA resuma, altere ou omita qualquer parte da conversa. Copie cada mensagem na íntegra.
  - empresa_id: ID da empresa
  - person_id: ID da pessoa/contato

FLUXO QUANDO EMPRESA NÃO EXISTE:
1. Informe que a empresa não foi encontrada
2. Peça: Nome da empresa (razão social), telefone e email
3. Use "cadastrar_empresa" para criar
4. Depois pergunte o nome completo do contato e email
5. Use "cadastrar_pessoa" vinculando à empresa recém-criada
6. Abra o chamado com "criar_chamado"

REGRAS IMPORTANTES:
- NUNCA invente resultados. Sempre use as ferramentas para consultar.
- SEMPRE confirme com o cliente antes de cadastrar algo novo.
- SEMPRE peça o email do contato — é essencial para identificar a pessoa no Unodesk.
- Na description do chamado, SEMPRE inclua a conversa completa e integral, sem resumir ou alterar nenhuma parte.
- Quando receber [RESULTADO], comunique de forma amigável e resumida.
- Quando receber [ERRO], informe que houve um problema e tente novamente ou peça para o cliente entrar em contato por outro canal.
- Use apenas os dados que o cliente forneceu. Nunca assuma ou invente dados.`;
  }

  return `${ctx.systemPrompt}${restrictionsStr}

--- INSTRUÇÕES DO SISTEMA ---
Seu nome é "${ctx.agentName}". Você é um agente de atendimento via WhatsApp da M3Solutions.
Responda de forma profissional, simpática e objetiva.
NUNCA use saudações baseadas em horário como "Bom dia", "Boa tarde" ou "Boa noite" — você não sabe que horas são para o cliente. Use SEMPRE "Olá" ou "Oi" como saudação.
${ctx.currentStep === "greeting" ? `IMPORTANTE: Na primeira mensagem, apresente-se EXATAMENTE assim: "Olá! Sou ${ctx.agentName} da M3Solutions. 😊\\nComo posso ajudá-lo?" — NÃO altere esta saudação, NÃO use "Bom dia/Boa tarde/Boa noite", NÃO mude o formato.` : ""}
Etapa atual: ${ctx.currentStep}
Departamento atual: ${ctx.currentDepartment || "não classificado"}
Departamentos disponíveis: ${ctx.departments.join(", ")}
${metaStr}
${rulesStr}
${routingStr}
${unodeskStr}

--- REGRAS DE COMPORTAMENTO DO AGENTE ---
IMPORTANTE: Você É o agente "${ctx.agentName}". NUNCA diga que vai "encaminhar para o time comercial" ou "transferir para o comercial" se VOCÊ já é o agente comercial. Não se refira a si mesmo em terceira pessoa.
- Quando o cliente precisar de uma demonstração ou apresentação de produto:
  1. VOCÊ NÃO agenda diretamente — solicite ao cliente 3 opções de data e horário para validar com o time técnico.
  2. Diga algo como: "Para agendar a demonstração, preciso de 3 opções de data e horário que funcionem para você. Vou validar com nosso time técnico e retorno em breve com a confirmação."
  3. Nunca diga que "vai encaminhar para outro time" quando se trata de agendamento — VOCÊ é quem coleta as datas e intermedia com o time técnico.
- Quando o assunto for técnico e precisar ser transferido, use o roteamento para o agente de suporte (se disponível). Caso contrário, acione o atendimento humano (shouldHandoff=true).

RESPONDA SEMPRE em formato JSON válido com a seguinte estrutura:
{
  "reply": "sua resposta ao cliente em texto natural",
  "department": "departamento identificado (${ctx.departments.join("|")})",
  "step": "etapa atual (greeting|qualifying|collecting|handoff|resolved)",
  "metadata": {"campo": "valor extraído da conversa"},
  "shouldHandoff": false,
  "handoffReason": "",
  "shouldClose": false${ctx.availableAgents.length > 0 ? ',\n  "routeTo": ""' : ""}${ctx.unodeskEnabled ? ',\n  "toolAction": "",\n  "toolParams": {}' : ""}
}

Se o cliente pedir para falar com um humano/atendente, defina shouldHandoff=true.
Se o problema foi resolvido, defina shouldClose=true.
${ctx.availableAgents.length > 0 ? 'Para transferir para outro agente, defina routeTo com o nome do agente (ex: "routeTo": "Agente Comercial"). NÃO transfira se routeTo for vazio.' : ""}
Sempre extraia informações úteis (nome, email, telefone, empresa, interesse) para o campo metadata.
Nunca invente informações. Se não sabe, pergunte educadamente.`;
}

async function callLLMWithModel(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(LLM_URL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY()}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    });
    if (!response.ok) {
      const errText = await response.text();
      return { ok: false, error: `LLM error ${response.status}: ${errText}` };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: error?.message || "LLM call exception" };
  }
}

async function callLLM(
  ctx: SessionContext,
  history: Array<{ senderType: string; content: string }>,
  currentMessage: string
): Promise<AiResponse> {
  const systemMessage = buildSystemMessage(ctx);

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemMessage },
  ];

  for (const msg of history) {
    messages.push({
      role: msg.senderType === "client" ? "user" : "assistant",
      content: msg.content,
    });
  }
  messages.push({ role: "user", content: currentMessage });

  // Try primary model
  const primary = await callLLMWithModel(ctx.model, messages, ctx.temperature, ctx.maxTokens);

  if (primary.ok) {
    const rawContent = primary.data?.choices?.[0]?.message?.content || "";
    return parseAiResponse(rawContent);
  }

  console.error(`[AI-Agent] Primary model (${ctx.model}) failed: ${primary.error}`);

  // Try fallback model if configured
  if (ctx.fallbackModel) {
    console.log(`[AI-Agent] Retrying with fallback model: ${ctx.fallbackModel}`);
    const fallback = await callLLMWithModel(ctx.fallbackModel, messages, ctx.temperature, ctx.maxTokens);

    if (fallback.ok) {
      const rawContent = fallback.data?.choices?.[0]?.message?.content || "";
      console.log(`[AI-Agent] Fallback model (${ctx.fallbackModel}) succeeded`);
      return parseAiResponse(rawContent);
    }
    console.error(`[AI-Agent] Fallback model (${ctx.fallbackModel}) also failed: ${fallback.error}`);
  }

  // Both models failed – handoff to human
  return {
    reply: "Desculpe, estou com dificuldades técnicas no momento. Um atendente humano será notificado.",
    shouldHandoff: true,
    handoffReason: `LLM error: ${primary.error}${ctx.fallbackModel ? ` | Fallback also failed: ${ctx.fallbackModel}` : ""}`,
  };
}

function parseAiResponse(raw: string): AiResponse {
  try {
    // Try to extract JSON from the response (LLM might wrap it in markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        reply: parsed.reply || raw,
        department: parsed.department || undefined,
        step: parsed.step || undefined,
        metadata: parsed.metadata || undefined,
        shouldHandoff: parsed.shouldHandoff === true,
        handoffReason: parsed.handoffReason || undefined,
        shouldClose: parsed.shouldClose === true,
        closeReason: parsed.closeReason || undefined,
        routeTo: parsed.routeTo && parsed.routeTo.trim() ? parsed.routeTo.trim() : undefined,
        toolAction: parsed.toolAction && parsed.toolAction.trim() ? parsed.toolAction.trim() : undefined,
        toolParams: parsed.toolParams && Object.keys(parsed.toolParams).length > 0 ? parsed.toolParams : undefined,
      };
    }
  } catch {
    // JSON parse failed, use raw text
  }

  // Fallback: use raw text as reply
  return { reply: raw };
}

// ---- Message History ----

async function getMessageHistory(sessionId: string, limit: number = 20) {
  const messages = await prisma.aiSessionMessage.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
    take: limit,
    select: { senderType: true, content: true },
  });
  return messages;
}

async function saveMessage(
  sessionId: string,
  senderType: string,
  content: string,
  messageType: string = "text",
  externalMsgId?: string,
  aiPayload?: string
) {
  return prisma.aiSessionMessage.create({
    data: {
      sessionId,
      senderType,
      content,
      messageType,
      externalMsgId: externalMsgId || null,
      aiPayload: aiPayload || null,
    },
  });
}

// ---- Handoff Email (transfer to human) ----

async function sendHandoffEmail(params: {
  sessionId: string;
  phone: string;
  contactName: string;
  agentName: string;
  reason: string;
  department: string;
}) {
  const { sessionId, phone, contactName, agentName, reason, department } = params;

  try {
    // Get recent message history for context
    const messages = await prisma.aiSessionMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
      take: 30,
    });

    const conversationHtml = messages.map(m => {
      const role = m.senderType === "client" ? "👤 Cliente" : m.senderType === "ai" ? "🤖 IA" : "⚙️ Sistema";
      const time = m.timestamp.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      return `<tr>
        <td style="padding:4px 8px;font-weight:bold;vertical-align:top;white-space:nowrap;color:${m.senderType === "client" ? "#2563eb" : m.senderType === "ai" ? "#16a34a" : "#9ca3af"}">${role}</td>
        <td style="padding:4px 8px;color:#555">${time}</td>
        <td style="padding:4px 8px">${(m.content || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
      </tr>`;
    }).join("");

    const appUrl = process.env.NEXTAUTH_URL || "";
    const chatLink = appUrl ? `${appUrl}/gestor/comunicacao/mensagens` : "";

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
        <div style="background:#ef4444;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:18px;">🚨 Transferência para Atendimento Humano</h2>
        </div>
        <div style="background:#fff;padding:20px;border:1px solid #e5e7eb;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr><td style="padding:4px 0;font-weight:bold;width:150px;">Contato:</td><td>${contactName}</td></tr>
            <tr><td style="padding:4px 0;font-weight:bold;">Telefone:</td><td>${phone}</td></tr>
            <tr><td style="padding:4px 0;font-weight:bold;">Agente IA:</td><td>${agentName}</td></tr>
            <tr><td style="padding:4px 0;font-weight:bold;">Departamento:</td><td>${department}</td></tr>
            <tr><td style="padding:4px 0;font-weight:bold;">Motivo:</td><td>${reason}</td></tr>
            <tr><td style="padding:4px 0;font-weight:bold;">Data/Hora:</td><td>${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td></tr>
          </table>

          <h3 style="margin:16px 0 8px;font-size:15px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Histórico da Conversa</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            ${conversationHtml}
          </table>

          ${chatLink ? `<div style="margin-top:20px;text-align:center;">
            <a href="${chatLink}" style="display:inline-block;padding:10px 24px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
              Ir para o Chat
            </a>
          </div>` : ""}
        </div>
        <p style="text-align:center;color:#888;font-size:12px;margin-top:12px;">
          Este cliente aguarda atendimento humano. Por favor, assuma a conversa o mais rápido possível.
        </p>
      </div>
    `;

    await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_TRANSFERNCIA_PARA_ATENDIMENTO_HUMANO,
        subject: `🚨 [Atendimento Humano] ${contactName} – ${agentName} – ${department}`,
        body: htmlBody,
        is_html: true,
        recipient_email: "gestores@m3solutions.com.br",
        sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : undefined,
      }),
    });

    console.log(`[AI-Agent] Handoff email sent for session ${sessionId} to gestores@m3solutions.com.br`);
  } catch (error) {
    console.error("[AI-Agent] Error sending handoff email:", error);
  }
}

// ---- Training Email ----

async function sendTrainingEmail(sessionId: string, agentName: string) {
  try {
    // Load the session with agent config to check trainingEnabled
    const session = await prisma.aiSession.findUnique({
      where: { id: sessionId },
      include: { agentConfig: { select: { trainingEnabled: true, name: true } } },
    });
    if (!session?.agentConfig?.trainingEnabled) return;

    const messages = await prisma.aiSessionMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
      select: { senderType: true, content: true, messageType: true, timestamp: true },
    });
    if (messages.length === 0) return;

    const appUrl = process.env.NEXTAUTH_URL || "";
    // Include conversationId in the link so the email opens the specific conversation
    const convParam = session.conversationId ? `?conv=${encodeURIComponent(session.conversationId)}` : "";
    const chatLink = `${appUrl}/gestor/comunicacao/mensagens${convParam}`;

    const transcript = messages.map(m => {
      const ts = new Date(m.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const label = m.senderType === "client" ? "👤 Cliente" :
                    m.senderType === "ai" ? "🤖 IA" :
                    m.senderType === "human" ? "👨‍💼 Humano" : "⚙️ Sistema";
      return `<tr><td style="padding:6px 10px;color:#888;white-space:nowrap;vertical-align:top;font-size:12px;">${ts}</td><td style="padding:6px 10px;font-weight:600;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 10px;">${m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td></tr>`;
    }).join("");

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
        <h2 style="color:#f59e0b;border-bottom:2px solid #f59e0b;padding-bottom:10px;">
          🎓 Resumo de Treinamento – ${agentName || session.agentConfig.name}
        </h2>
        <div style="background:#f9fafb;padding:15px;border-radius:8px;margin:15px 0;">
          <p><strong>Sessão:</strong> ${sessionId}</p>
          <p><strong>Telefone:</strong> ${session.phone}</p>
          <p><strong>Agente:</strong> ${agentName || session.agentConfig.name}</p>
          <p><strong>Status:</strong> ${session.status}</p>
        </div>
        <h3 style="margin-top:20px;">Transcrição Completa</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;">
          ${transcript}
        </table>
        <div style="margin-top:20px;text-align:center;">
          <a href="${chatLink}" style="display:inline-block;padding:10px 24px;background:#f59e0b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
            Avaliar Respostas no Chat
          </a>
        </div>
        <p style="color:#666;font-size:12px;margin-top:15px;">
          Este e-mail é gerado automaticamente pelo modo treinamento. Avalie as respostas da IA no painel de mensagens para melhorar o agente.
        </p>
      </div>
    `;

    await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_TREINAMENTO_IA_RESUMO_DE_CONVERSA,
        subject: `[Treinamento IA] Resumo da conversa – ${agentName || session.agentConfig.name} – ${session.phone}`,
        body: htmlBody,
        is_html: true,
        recipient_email: "gestores@m3solutions.com.br",
        sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : undefined,
        sender_alias: "M3 Solutions – Treinamento IA",
      }),
    });

    console.log(`[AI-Agent] Training email sent for session ${sessionId}`);
  } catch (err) {
    console.error("[AI-Agent] Failed to send training email:", err);
  }
}

// ---- Session Management ----

export async function closeSession(sessionId: string, reason: string) {
  // Generate summary before closing
  let summary = "";
  try {
    const messages = await prisma.aiSessionMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
      take: 50,
      select: { senderType: true, content: true },
    });
    const convoText = messages.map(m => `${m.senderType}: ${m.content}`).join("\n");
    summary = await generateSummary(convoText);
  } catch (e) {
    console.error("[AI-Agent] Summary generation failed:", e);
  }

  await prisma.aiSession.update({
    where: { id: sessionId },
    data: {
      status: "closed",
      endedAt: new Date(),
      closedReason: reason,
      summary: summary || `Sessão encerrada: ${reason}`,
    },
  });

  // Send training email asynchronously (fire-and-forget)
  sendTrainingEmail(sessionId, "").catch(() => {});
}

export async function handoffToHuman(sessionId: string, userId?: string) {
  await prisma.aiSession.update({
    where: { id: sessionId },
    data: {
      status: "human",
      assignedTo: userId || null,
    },
  });
}

async function generateSummary(conversationText: string): Promise<string> {
  try {
    const response = await fetch(LLM_URL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Resuma a conversa abaixo em no máximo 2 frases, destacando: departamento, assunto principal e resultado.",
          },
          { role: "user", content: conversationText },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return "";
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
}

// ---- Evolution API Integration ----

async function sendReply(instanceId: string, remoteJid: string, text: string) {
  const instance = await prisma.evolutionInstance.findUnique({
    where: { id: instanceId },
    include: { server: true },
  });

  if (!instance || !instance.instanceToken) {
    console.error(`[AI-Agent] Cannot send reply: instance ${instanceId} not found or no token`);
    return;
  }

  const client = createEvolutionClient({
    apiUrl: instance.server.apiUrl,
    apiKey: instance.server.apiKey,
  });

  // Extract number from remoteJid (e.g., 5511999999999@s.whatsapp.net -> 5511999999999)
  const number = remoteJid.split("@")[0];

  await client.sendText(
    instance.instanceName,
    instance.instanceToken,
    number,
    text
  );
}

// ---- Inter-Agent Routing ----

async function routeToAgent(params: {
  routeTo: string;
  currentSession: any;
  instanceId: string;
  remoteJid: string;
  phone: string;
  conversationId?: string;
  ownerId: string;
  allAgents: Array<{ id: string; name: string; departments: string; isEntryPoint: boolean }>;
  replyBeforeRoute?: string;
  content: string;
  messageType: string;
}): Promise<{ routed: boolean; reason?: string }> {
  const {
    routeTo, currentSession, instanceId, remoteJid, phone,
    conversationId, ownerId, allAgents, replyBeforeRoute, content, messageType,
  } = params;

  try {
    // Find the target agent
    const targetAgentId = await findAgentByDepartment(routeTo, ownerId, allAgents.filter(a => a.id !== currentSession.agentConfigId));
    if (!targetAgentId) {
      return { routed: false, reason: `agent_not_found: ${routeTo}` };
    }

    // Load full target agent config
    const targetAgent = await prisma.aiAgentConfig.findUnique({
      where: { id: targetAgentId },
    });
    if (!targetAgent || !targetAgent.active) {
      return { routed: false, reason: `target_agent_inactive: ${targetAgentId}` };
    }

    console.log(`[AI-Agent] Routing from "${currentSession.agentConfig?.name}" to "${targetAgent.name}" for ${phone}`);

    // 1. Send the transition reply (from current agent)
    if (replyBeforeRoute) {
      await sendReply(instanceId, remoteJid, replyBeforeRoute);
      await saveMessage(currentSession.id, "ai", replyBeforeRoute, "text", undefined,
        JSON.stringify({ routeTo, step: "routing" })
      );
    }

    // 2. Generate a summary of the current conversation for context handover
    const currentHistory = await getMessageHistory(currentSession.id, 30);
    const convoText = currentHistory.map(m => `${m.senderType}: ${m.content}`).join("\n");
    let summary = "";
    try {
      summary = await generateSummary(convoText);
    } catch {}

    // 3. Close current session with routing reason
    const currentMeta = safeJsonParse(currentSession.metadata) || {};
    await prisma.aiSession.update({
      where: { id: currentSession.id },
      data: {
        status: "closed",
        endedAt: new Date(),
        closedReason: `routed_to:${targetAgent.name}`,
        summary: summary || `Transferido para ${targetAgent.name}`,
      },
    });

    // Send training email for the closing session (fire-and-forget)
    sendTrainingEmail(currentSession.id, currentSession.agentConfig?.name || "").catch(() => {});

    // Add system message about routing
    await saveMessage(currentSession.id, "system",
      `Conversa transferida para o agente "${targetAgent.name}"`,
      "action"
    );

    // 4. Close any other active/waiting_human sessions for same phone+instance to avoid unique constraint conflict
    await prisma.aiSession.updateMany({
      where: {
        phone,
        instanceId,
        status: { in: ["active", "waiting_human"] },
        id: { not: currentSession.id },
      },
      data: {
        status: "closed",
        endedAt: new Date(),
        closedReason: "closed_for_routing",
      },
    });

    // Create new session with the target agent
    const newSession = await prisma.aiSession.create({
      data: {
        phone,
        remoteJid,
        instanceId,
        agentConfigId: targetAgent.id,
        ownerId,
        conversationId: conversationId || null,
        status: "active",
        step: "greeting",
        department: routeTo,
        parentSessionId: currentSession.id,
        metadata: JSON.stringify({
          ...currentMeta,
          _routedFrom: currentSession.agentConfig?.name || "Agente anterior",
          _routeSummary: summary,
        }),
      },
    });

    // 5. Save a system context message in the new session so the new agent knows the history
    await saveMessage(newSession.id, "system",
      `[CONTEXTO DE TRANSFERÊNCIA] Esta conversa foi transferida do agente "${currentSession.agentConfig?.name || "anterior"}". ` +
      `Resumo da conversa anterior: ${summary || "Não disponível"}. ` +
      `Dados coletados: ${JSON.stringify(currentMeta)}. ` +
      `O cliente foi informado da transferência.`,
      "action"
    );

    // 6. Send welcome message from the new agent (supports {agentName} placeholder)
    if (targetAgent.welcomeMessage) {
      const welcomeMsg = targetAgent.welcomeMessage.replace(/\{agentName\}/g, targetAgent.name || "Assistente");
      await applyResponseDelay(targetAgent.responseDelay || 0);
      await sendReply(instanceId, remoteJid, welcomeMsg);
      await saveMessage(newSession.id, "ai", welcomeMsg, "text");
    } else {
      // Auto-generate a greeting from the new agent by calling LLM
      const targetRoutingIds = safeJsonParse(targetAgent.routingAgentIds) as string[] | null;
      const newAvailableAgents = allAgents
        .filter(a => a.id !== targetAgent.id)
        .filter(a => !targetRoutingIds || targetRoutingIds.length === 0 || targetRoutingIds.includes(a.id))
        .map(a => a.name);
      const newCtx = buildSessionContext(
        { ...newSession, agentConfig: targetAgent },
        targetAgent,
        newAvailableAgents
      );
      const newHistory = await getMessageHistory(newSession.id, 20);
      const greeting = await callLLM(newCtx, newHistory, content);

      if (greeting.reply) {
        await applyResponseDelay(targetAgent.responseDelay || 0);
        await sendReply(instanceId, remoteJid, greeting.reply);
        await saveMessage(newSession.id, "ai", greeting.reply, "text");
      }

      // Update new session state from greeting
      const updateData: any = { updatedAt: new Date() };
      if (greeting.department) updateData.department = greeting.department;
      if (greeting.step) updateData.step = greeting.step;
      if (greeting.metadata) {
        const meta = safeJsonParse(newSession.metadata) || {};
        updateData.metadata = JSON.stringify({ ...meta, ...greeting.metadata });
      }
      await prisma.aiSession.update({ where: { id: newSession.id }, data: updateData });
    }

    return { routed: true };
  } catch (error) {
    console.error(`[AI-Agent] Routing error:`, error);
    return { routed: false, reason: "routing_error" };
  }
}

// Get parent session messages for context continuity
async function getParentSessionContext(parentSessionId: string): Promise<Array<{ senderType: string; content: string }> | null> {
  try {
    const parentMessages = await prisma.aiSessionMessage.findMany({
      where: { sessionId: parentSessionId },
      orderBy: { timestamp: "asc" },
      take: 15,
      select: { senderType: true, content: true },
    });
    return parentMessages.length > 0 ? parentMessages : null;
  } catch {
    return null;
  }
}

// ---- Utilities ----

function safeJsonParse(str: string | null): any {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
