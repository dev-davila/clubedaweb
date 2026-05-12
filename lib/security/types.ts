// Tipos do Módulo de Proteção da Aplicação

export type SecurityEventType =
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'path_traversal_attempt'
  | 'brute_force_attempt'
  | 'bot_scan_attempt'
  | 'rate_limit_exceeded'
  | 'malicious_upload_attempt'
  | 'suspicious_request';

export type SecurityAction =
  | 'allowed'
  | 'logged'
  | 'rate_limited'
  | 'blocked_temp'
  | 'blocked_hard';

export interface SecurityContext {
  ip: string;
  method: string;
  url: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface DetectionResult {
  detected: boolean;
  eventType?: SecurityEventType;
  reason?: string;
  payload?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecuritySettings {
  // Rate limits
  rate_limit_requests_per_minute: number;
  rate_limit_login_attempts: number;
  rate_limit_login_window_minutes: number;
  rate_limit_api_requests_per_minute: number;
  
  // Bloqueios
  block_duration_minutes: number;
  block_escalation_multiplier: number;
  max_block_duration_hours: number;
  
  // Regras ativas (modo observação = apenas log)
  rule_sql_injection_enabled: boolean;
  rule_xss_enabled: boolean;
  rule_path_traversal_enabled: boolean;
  rule_brute_force_enabled: boolean;
  rule_bot_scan_enabled: boolean;
  rule_rate_limit_enabled: boolean;
  rule_upload_validation_enabled: boolean;
  
  // Modo de operação
  observation_mode: boolean; // true = apenas log, não bloqueia
  
  // Rotas suspeitas (bots/scanners)
  suspicious_routes: string[];
  
  // Extensões proibidas para upload
  forbidden_extensions: string[];
  
  // Rotas excluídas da inspeção
  excluded_routes: string[];
}

export const DEFAULT_SETTINGS: SecuritySettings = {
  // Rate limits generosos para Fase 1
  rate_limit_requests_per_minute: 120,
  rate_limit_login_attempts: 10,
  rate_limit_login_window_minutes: 10,
  rate_limit_api_requests_per_minute: 60,
  
  // Bloqueios
  block_duration_minutes: 15,
  block_escalation_multiplier: 2,
  max_block_duration_hours: 24,
  
  // Todas as regras ativas para log
  rule_sql_injection_enabled: true,
  rule_xss_enabled: true,
  rule_path_traversal_enabled: true,
  rule_brute_force_enabled: true,
  rule_bot_scan_enabled: true,
  rule_rate_limit_enabled: true,
  rule_upload_validation_enabled: true,
  
  // FASE 1: Modo observação ativo
  observation_mode: true,
  
  // Rotas suspeitas (típicas de bots/scanners)
  suspicious_routes: [
    '/wp-admin',
    '/wp-login.php',
    '/wp-content',
    '/wp-includes',
    '/xmlrpc.php',
    '/.git',
    '/.env',
    '/.htaccess',
    '/phpmyadmin',
    '/pma',
    '/vendor',
    '/cgi-bin',
    '/admin.php',
    '/administrator',
    '/config.php',
    '/install.php',
    '/setup.php',
    '/phpinfo.php',
    '/test.php',
    '/shell.php',
    '/backup',
    '/db',
    '/database',
    '/sql',
    '/mysql',
    '/.aws',
    '/.ssh',
    '/id_rsa',
    '/etc/passwd',
    '/proc/self',
  ],
  
  // Extensões proibidas para upload
  forbidden_extensions: [
    '.php', '.phtml', '.phar', '.php3', '.php4', '.php5', '.php7',
    '.exe', '.sh', '.bat', '.cmd', '.com', '.msi',
    '.js', '.vbs', '.wsf', '.wsh',
    '.asp', '.aspx', '.asa', '.asax',
    '.jsp', '.jspx',
    '.cgi', '.pl', '.py', '.rb',
    '.htaccess', '.htpasswd',
    '.config', '.ini',
  ],
  
  // Rotas excluídas da inspeção profunda (admin autenticado)
  excluded_routes: [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
};
