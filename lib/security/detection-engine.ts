// Engine de Detecção de Ameaças

import { SecurityContext, DetectionResult, SecuritySettings } from './types';

// Padrões de SQL Injection
const SQL_INJECTION_PATTERNS = [
  /union\s+(all\s+)?select/i,
  /'\s*or\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /'\s*or\s+['"]?\w+['"]?\s*=\s*['"]?\w+/i,
  /;\s*(drop|delete|update|insert|alter|create|truncate)\s/i,
  /sleep\s*\(/i,
  /benchmark\s*\(/i,
  /waitfor\s+delay/i,
  /information_schema/i,
  /sys\.tables/i,
  /char\s*\(\s*\d+/i,
  /concat\s*\(/i,
  /0x[0-9a-f]+/i,
  /\/\*.*\*\//i,
  /--\s*$/m,
  /;\s*--/,
  /load_file\s*\(/i,
  /into\s+(out|dump)file/i,
];

// Padrões de XSS
const XSS_PATTERNS = [
  /<script[^>]*>/i,
  /<\/script>/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /on(error|load|click|mouse|focus|blur|change|submit|key|touch)\s*=/i,
  /<iframe[^>]*>/i,
  /<object[^>]*>/i,
  /<embed[^>]*>/i,
  /<svg[^>]*on\w+=/i,
  /expression\s*\(/i,
  /url\s*\(\s*['"]?javascript/i,
  /<img[^>]+src\s*=\s*['"]?javascript/i,
  /document\.(cookie|domain|write)/i,
  /window\.(location|open)/i,
  /eval\s*\(/i,
  /alert\s*\(/i,
  /prompt\s*\(/i,
  /confirm\s*\(/i,
];

// Padrões de Path Traversal
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.[\\\/]/,
  /%2e%2e[\\\/]/i,
  /\.\.\.[\\\/]/,
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /\/proc\/self/i,
  /\/var\/log/i,
  /\.env/,
  /wp-config\.php/i,
  /web\.config/i,
  /\.htaccess/i,
  /\.htpasswd/i,
  /boot\.ini/i,
  /win\.ini/i,
  /\.git\//i,
  /\.svn\//i,
  /%00/,  // Null byte
  /%c0%ae/i, // UTF-8 encoded ..
];

function checkPatterns(input: string, patterns: RegExp[]): { match: boolean; pattern?: string } {
  for (const pattern of patterns) {
    if (pattern.test(input)) {
      return { match: true, pattern: pattern.source };
    }
  }
  return { match: false };
}

function getSearchableContent(context: SecurityContext): string {
  const parts: string[] = [
    context.url,
    context.userAgent || '',
  ];
  
  if (context.query) {
    parts.push(JSON.stringify(context.query));
  }
  
  if (context.body) {
    parts.push(JSON.stringify(context.body));
  }
  
  return parts.join(' ');
}

export function detectSQLInjection(context: SecurityContext): DetectionResult {
  const content = getSearchableContent(context);
  const result = checkPatterns(content, SQL_INJECTION_PATTERNS);
  
  if (result.match) {
    return {
      detected: true,
      eventType: 'sql_injection_attempt',
      reason: `Padrão de SQL Injection detectado: ${result.pattern}`,
      payload: content.substring(0, 200),
      severity: 'high',
    };
  }
  
  return { detected: false };
}

export function detectXSS(context: SecurityContext): DetectionResult {
  const content = getSearchableContent(context);
  const result = checkPatterns(content, XSS_PATTERNS);
  
  if (result.match) {
    return {
      detected: true,
      eventType: 'xss_attempt',
      reason: `Padrão de XSS detectado: ${result.pattern}`,
      payload: content.substring(0, 200),
      severity: 'high',
    };
  }
  
  return { detected: false };
}

export function detectPathTraversal(context: SecurityContext): DetectionResult {
  const content = getSearchableContent(context);
  const result = checkPatterns(content, PATH_TRAVERSAL_PATTERNS);
  
  if (result.match) {
    return {
      detected: true,
      eventType: 'path_traversal_attempt',
      reason: `Padrão de Path Traversal detectado: ${result.pattern}`,
      payload: context.url,
      severity: 'medium',
    };
  }
  
  return { detected: false };
}

export function detectBotScan(context: SecurityContext, settings: SecuritySettings): DetectionResult {
  const url = context.url.toLowerCase();
  
  for (const route of settings.suspicious_routes) {
    if (url.includes(route.toLowerCase())) {
      return {
        detected: true,
        eventType: 'bot_scan_attempt',
        reason: `Acesso a rota suspeita: ${route}`,
        payload: context.url,
        severity: 'low',
      };
    }
  }
  
  return { detected: false };
}

export function validateUpload(
  filename: string,
  mimeType: string,
  settings: SecuritySettings
): DetectionResult {
  const lowerFilename = filename.toLowerCase();
  
  // Verifica extensão dupla (ex: arquivo.jpg.php)
  const parts = lowerFilename.split('.');
  if (parts.length > 2) {
    for (const ext of settings.forbidden_extensions) {
      if (parts.some(p => `.${p}` === ext.toLowerCase())) {
        return {
          detected: true,
          eventType: 'malicious_upload_attempt',
          reason: `Extensão dupla suspeita detectada: ${filename}`,
          payload: `filename: ${filename}, mime: ${mimeType}`,
          severity: 'critical',
        };
      }
    }
  }
  
  // Verifica extensão proibida
  for (const ext of settings.forbidden_extensions) {
    if (lowerFilename.endsWith(ext.toLowerCase())) {
      return {
        detected: true,
        eventType: 'malicious_upload_attempt',
        reason: `Extensão de arquivo proibida: ${ext}`,
        payload: `filename: ${filename}, mime: ${mimeType}`,
        severity: 'critical',
      };
    }
  }
  
  // Verifica inconsistência MIME type
  const mimeExtensionMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/zip': ['.zip'],
  };
  
  const expectedExtensions = mimeExtensionMap[mimeType];
  if (expectedExtensions) {
    const hasValidExt = expectedExtensions.some(ext => lowerFilename.endsWith(ext));
    if (!hasValidExt) {
      return {
        detected: true,
        eventType: 'malicious_upload_attempt',
        reason: `MIME type inconsistente: ${mimeType} para ${filename}`,
        payload: `filename: ${filename}, mime: ${mimeType}`,
        severity: 'high',
      };
    }
  }
  
  return { detected: false };
}

export function runAllDetections(
  context: SecurityContext,
  settings: SecuritySettings
): DetectionResult[] {
  const results: DetectionResult[] = [];
  
  // SQL Injection
  if (settings.rule_sql_injection_enabled) {
    const sqlResult = detectSQLInjection(context);
    if (sqlResult.detected) results.push(sqlResult);
  }
  
  // XSS
  if (settings.rule_xss_enabled) {
    const xssResult = detectXSS(context);
    if (xssResult.detected) results.push(xssResult);
  }
  
  // Path Traversal
  if (settings.rule_path_traversal_enabled) {
    const pathResult = detectPathTraversal(context);
    if (pathResult.detected) results.push(pathResult);
  }
  
  // Bot Scan
  if (settings.rule_bot_scan_enabled) {
    const botResult = detectBotScan(context, settings);
    if (botResult.detected) results.push(botResult);
  }
  
  return results;
}
