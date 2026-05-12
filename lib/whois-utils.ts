/**
 * Utilitários para consultas WHOIS
 * Fase 3: Enriquecimento de Domínios com Dados WHOIS
 * 
 * Regras de Negócio:
 * - RN05: Rate limiting (5s intervalo, 10/min, 300/hora, 3-8s jitter)
 * - RN06: Retry exponencial (5s, 15s, 60s) com máx 5 falhas
 * - RN07: Captura de dados WHOIS incluindo contatos técnicos
 */

import dns from 'dns';
import net from 'net';
import { promisify } from 'util';

const resolveTxtAsync = promisify(dns.resolveTxt);

/**
 * Configurações de Rate Limiting (RN05)
 */
export const WHOIS_RATE_LIMITS = {
  MIN_INTERVAL_MS: 5000,     // 5 segundos entre consultas
  MAX_PER_MINUTE: 10,        // Máx 10 por minuto
  MAX_PER_HOUR: 300,         // Máx 300 por hora
  JITTER_MIN_MS: 3000,       // Jitter mínimo 3s
  JITTER_MAX_MS: 8000,       // Jitter máximo 8s
};

/**
 * Configurações de Retry (RN06)
 */
export const WHOIS_RETRY_CONFIG = {
  DELAYS: [5000, 15000, 60000], // 5s, 15s, 60s
  MAX_FAILURES: 5,
};

/**
 * Servidores WHOIS por TLD
 */
const WHOIS_SERVERS: Record<string, string> = {
  'br': 'whois.registro.br',
  'com': 'whois.verisign-grs.com',
  'net': 'whois.verisign-grs.com',
  'org': 'whois.pir.org',
  'io': 'whois.nic.io',
  'co': 'whois.nic.co',
  'info': 'whois.afilias.net',
  'biz': 'whois.biz',
  'default': 'whois.iana.org',
};

/**
 * Estrutura de dados WHOIS parseados
 */
export interface WhoisData {
  dominio: string;
  status: string | null;
  dataCriacao: string | null;
  dataExpiracao: string | null;
  dataAtualizacao: string | null;
  titularNome: string | null;
  titularEmail: string | null;
  titularDocumento: string | null;
  titularEndereco: string | null;
  titularCidade: string | null;
  titularUf: string | null;
  titularPais: string | null;
  contatoAdminNome: string | null;
  contatoAdminEmail: string | null;
  contatoTecNome: string | null;
  contatoTecEmail: string | null;
  nameservers: string[];
  registrador: string | null;
  rawData: string;
}

/**
 * Resultado de consulta WHOIS
 */
export interface WhoisResult {
  success: boolean;
  domain: string;
  data: WhoisData | null;
  duration: number;
  error?: string;
}

/**
 * Obtém servidor WHOIS para um domínio
 */
export function getWhoisServer(domain: string): string {
  const parts = domain.toLowerCase().split('.');
  const tld = parts[parts.length - 1];
  
  // Para domínios .com.br, .org.br, etc.
  if (parts.length >= 2 && parts[parts.length - 1] === 'br') {
    return WHOIS_SERVERS['br'];
  }
  
  return WHOIS_SERVERS[tld] || WHOIS_SERVERS['default'];
}

/**
 * Gera delay com jitter para rate limiting
 */
export function getJitteredDelay(): number {
  const { JITTER_MIN_MS, JITTER_MAX_MS, MIN_INTERVAL_MS } = WHOIS_RATE_LIMITS;
  const jitter = Math.floor(Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS + 1)) + JITTER_MIN_MS;
  return MIN_INTERVAL_MS + jitter;
}

/**
 * Calcula delay para retry exponencial
 */
export function getRetryDelay(retryCount: number): number {
  const { DELAYS } = WHOIS_RETRY_CONFIG;
  const index = Math.min(retryCount, DELAYS.length - 1);
  return DELAYS[index];
}

/**
 * Consulta WHOIS via socket TCP
 */
async function queryWhoisServer(domain: string, server: string, port: number = 43): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const chunks: Buffer[] = [];
    
    socket.setTimeout(30000); // 30s timeout
    
    socket.on('connect', () => {
      // Para whois.verisign-grs.com, precisa de prefixo "="
      const query = server.includes('verisign') ? `=${domain}\r\n` : `${domain}\r\n`;
      socket.write(query);
    });
    
    socket.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    socket.on('close', () => {
      const rawBuffer = Buffer.concat(chunks);
      // Try UTF-8 first; if it contains replacement chars, fall back to Latin-1
      const utf8Text = rawBuffer.toString('utf-8');
      if (utf8Text.includes('\ufffd')) {
        // Data is likely Latin-1/ISO-8859-1 encoded
        resolve(rawBuffer.toString('latin1'));
      } else {
        resolve(utf8Text);
      }
    });
    
    socket.on('error', (err) => {
      reject(err);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('WHOIS query timeout'));
    });
    
    socket.connect(port, server);
  });
}

/**
 * Extrai valor de uma linha WHOIS
 */
function extractValue(raw: string, ...patterns: string[]): string | null {
  for (const pattern of patterns) {
    const regex = new RegExp(`^\\s*${pattern}\\s*[:.]\\s*(.+)$`, 'im');
    const match = raw.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extrai emails de uma string
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

/**
 * Parse dados WHOIS para domínios .br (Registro.br)
 */
function parseWhoisBr(raw: string, domain: string): WhoisData {
  const data: WhoisData = {
    dominio: domain,
    status: null,
    dataCriacao: null,
    dataExpiracao: null,
    dataAtualizacao: null,
    titularNome: null,
    titularEmail: null,
    titularDocumento: null,
    titularEndereco: null,
    titularCidade: null,
    titularUf: null,
    titularPais: 'BR',
    contatoAdminNome: null,
    contatoAdminEmail: null,
    contatoTecNome: null,
    contatoTecEmail: null,
    nameservers: [],
    registrador: null,
    rawData: raw,
  };

  // Status
  data.status = extractValue(raw, 'status');
  
  // Datas
  data.dataCriacao = extractValue(raw, 'created', 'criado em', 'creation date');
  data.dataExpiracao = extractValue(raw, 'expires', 'expira em', 'expiration date');
  data.dataAtualizacao = extractValue(raw, 'changed', 'alterado em', 'updated date');
  
  // Titular (owner)
  data.titularNome = extractValue(raw, 'owner', 'titular', 'owner-c');
  data.titularDocumento = extractValue(raw, 'ownerid', 'cpf/cnpj', 'document');
  
  // Contato Admin
  data.contatoAdminNome = extractValue(raw, 'admin-c', 'contato administrativo');
  
  // Contato Técnico
  data.contatoTecNome = extractValue(raw, 'tech-c', 'contato técnico');
  
  // Nameservers
  const nsRegex = /^\s*nserver\s*:\s*(.+)$/gim;
  let nsMatch;
  while ((nsMatch = nsRegex.exec(raw)) !== null) {
    data.nameservers.push(nsMatch[1].trim());
  }
  
  // Extrair emails do raw data
  const emails = extractEmails(raw);
  if (emails.length > 0) {
    data.titularEmail = emails[0];
    if (emails.length > 1) data.contatoAdminEmail = emails[1];
    if (emails.length > 2) data.contatoTecEmail = emails[2];
  }
  
  return data;
}

/**
 * Parse dados WHOIS genérico (internacional)
 */
function parseWhoisGeneric(raw: string, domain: string): WhoisData {
  const data: WhoisData = {
    dominio: domain,
    status: null,
    dataCriacao: null,
    dataExpiracao: null,
    dataAtualizacao: null,
    titularNome: null,
    titularEmail: null,
    titularDocumento: null,
    titularEndereco: null,
    titularCidade: null,
    titularUf: null,
    titularPais: null,
    contatoAdminNome: null,
    contatoAdminEmail: null,
    contatoTecNome: null,
    contatoTecEmail: null,
    nameservers: [],
    registrador: null,
    rawData: raw,
  };

  // Status
  data.status = extractValue(raw, 'Domain Status', 'Status');
  
  // Datas
  data.dataCriacao = extractValue(raw, 'Creation Date', 'Created On', 'Created', 'Registration Time');
  data.dataExpiracao = extractValue(raw, 'Registry Expiry Date', 'Expiration Date', 'Expires On', 'Expiry Date');
  data.dataAtualizacao = extractValue(raw, 'Updated Date', 'Last Updated', 'Last Modified');
  
  // Registrador
  data.registrador = extractValue(raw, 'Registrar', 'Sponsoring Registrar', 'Registrar Name');
  
  // Titular
  data.titularNome = extractValue(raw, 'Registrant Name', 'Registrant Organization', 'Owner Name');
  data.titularEmail = extractValue(raw, 'Registrant Email');
  data.titularEndereco = extractValue(raw, 'Registrant Street', 'Registrant Address');
  data.titularCidade = extractValue(raw, 'Registrant City');
  data.titularUf = extractValue(raw, 'Registrant State/Province', 'Registrant State');
  data.titularPais = extractValue(raw, 'Registrant Country');
  
  // Contato Admin
  data.contatoAdminNome = extractValue(raw, 'Admin Name', 'Admin Organization');
  data.contatoAdminEmail = extractValue(raw, 'Admin Email');
  
  // Contato Técnico
  data.contatoTecNome = extractValue(raw, 'Tech Name', 'Tech Organization');
  data.contatoTecEmail = extractValue(raw, 'Tech Email');
  
  // Nameservers
  const nsRegex = /^\s*Name\s*Server\s*:\s*(.+)$/gim;
  let nsMatch;
  while ((nsMatch = nsRegex.exec(raw)) !== null) {
    const ns = nsMatch[1].trim().toLowerCase();
    if (ns && !data.nameservers.includes(ns)) {
      data.nameservers.push(ns);
    }
  }
  
  // Se não encontrou emails nos campos, tenta extrair do raw
  if (!data.titularEmail || !data.contatoAdminEmail || !data.contatoTecEmail) {
    const emails = extractEmails(raw);
    if (!data.titularEmail && emails.length > 0) data.titularEmail = emails[0];
    if (!data.contatoAdminEmail && emails.length > 1) data.contatoAdminEmail = emails[1];
    if (!data.contatoTecEmail && emails.length > 2) data.contatoTecEmail = emails[2];
  }
  
  return data;
}

/**
 * Realiza consulta WHOIS completa para um domínio
 */
export async function whoisLookup(domain: string): Promise<WhoisResult> {
  const startTime = Date.now();
  const result: WhoisResult = {
    success: false,
    domain,
    data: null,
    duration: 0,
  };

  try {
    // Determinar servidor WHOIS
    const server = getWhoisServer(domain);
    
    // Consultar
    const rawData = await queryWhoisServer(domain, server);
    
    if (!rawData || rawData.trim().length === 0) {
      result.error = 'Empty WHOIS response';
      result.duration = Date.now() - startTime;
      return result;
    }
    
    // Verificar se domínio existe
    if (rawData.toLowerCase().includes('no match') || 
        rawData.toLowerCase().includes('not found') ||
        rawData.toLowerCase().includes('no entries found')) {
      result.error = 'Domain not found in WHOIS';
      result.duration = Date.now() - startTime;
      return result;
    }
    
    // Parse baseado no TLD
    const isBrDomain = domain.toLowerCase().endsWith('.br');
    result.data = isBrDomain 
      ? parseWhoisBr(rawData, domain)
      : parseWhoisGeneric(rawData, domain);
    
    result.success = true;
    
  } catch (err: unknown) {
    result.error = err instanceof Error ? err.message : 'Unknown WHOIS error';
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Extrai todos os emails únicos de dados WHOIS
 */
export function extractAllEmails(data: WhoisData): string[] {
  const emails = new Set<string>();
  
  if (data.titularEmail) emails.add(data.titularEmail.toLowerCase());
  if (data.contatoAdminEmail) emails.add(data.contatoAdminEmail.toLowerCase());
  if (data.contatoTecEmail) emails.add(data.contatoTecEmail.toLowerCase());
  
  // Extrair emails adicionais do rawData
  const rawEmails = extractEmails(data.rawData);
  rawEmails.forEach(email => emails.add(email.toLowerCase()));
  
  return Array.from(emails);
}

/**
 * Sleep utilitário
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
