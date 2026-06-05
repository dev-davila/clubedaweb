/**
 * Evolution API v2 Client
 * Handles all communication with Evolution API servers
 */

export interface EvolutionServerConfig {
  apiUrl: string;
  apiKey: string;
}

class EvolutionClient {
  private apiUrl: string;
  private apiKey: string;
  private defaultTimeoutMs: number;

  constructor(config: EvolutionServerConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.defaultTimeoutMs = 8000; // 8 second timeout for all API calls
  }

  private async request(path: string, options: RequestInit = {}, timeoutMs?: number) {
    const url = `${this.apiUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs || this.defaultTimeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Evolution API error ${res.status}: ${text}`);
      }
      return res.json();
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === 'AbortError') {
        throw new Error(`Evolution API timeout after ${timeoutMs || this.defaultTimeoutMs}ms: ${path}`);
      }
      throw err;
    }
  }

  // Instance management
  async createInstance(instanceName: string, qrcode = true) {
    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode,
        rejectCall: false,
        groupsIgnore: false,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false,
      }),
    });
  }

  async connectInstance(instanceName: string) {
    return this.request(`/instance/connect/${instanceName}`);
  }

  async getConnectionState(instanceName: string) {
    return this.request(`/instance/connectionState/${instanceName}`);
  }

  async fetchInstances() {
    return this.request('/instance/fetchInstances');
  }

  async logoutInstance(instanceName: string) {
    return this.request(`/instance/logout/${instanceName}`, { method: 'DELETE' });
  }

  async deleteInstance(instanceName: string) {
    return this.request(`/instance/delete/${instanceName}`, { method: 'DELETE' });
  }

  async restartInstance(instanceName: string) {
    return this.request(`/instance/restart/${instanceName}`, { method: 'PUT' });
  }

  // Helper: fetch with timeout and instance token
  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs?: number) {
    const controller = new AbortController();
    const ms = timeoutMs || this.defaultTimeoutMs;
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      if (err?.name === 'AbortError') {
        throw new Error(`Evolution API timeout after ${ms}ms: ${url}`);
      }
      throw err;
    }
  }

  // Messaging (uses instance token)
  async sendText(instanceName: string, instanceToken: string, number: string, text: string) {
    const r = await this.fetchWithTimeout(`${this.apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceToken },
      body: JSON.stringify({ number, text }),
    }, 15000); // 15s for sends
    if (!r.ok) throw new Error(`Send error ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async sendMedia(instanceName: string, instanceToken: string, number: string, media: { mediatype: string; caption?: string; media: string; fileName?: string }) {
    const r = await this.fetchWithTimeout(`${this.apiUrl}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceToken },
      body: JSON.stringify({ number, ...media }),
    }, 30000); // 30s for media
    if (!r.ok) throw new Error(`Send media error ${r.status}: ${await r.text()}`);
    return r.json();
  }

  // Chat operations
  async findChats(instanceName: string, instanceToken: string) {
    const r = await this.fetchWithTimeout(`${this.apiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceToken },
    });
    if (!r.ok) throw new Error(`Find chats error ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async findContacts(instanceName: string, instanceToken: string) {
    const r = await this.fetchWithTimeout(`${this.apiUrl}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceToken },
      body: JSON.stringify({}),
    }, 8000);
    if (!r.ok) throw new Error(`Find contacts error ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async findMessages(instanceName: string, instanceToken: string, remoteJid: string, limit = 50) {
    const r = await this.fetchWithTimeout(`${this.apiUrl}/chat/findMessages/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceToken },
      body: JSON.stringify({ where: { key: { remoteJid } }, limit }),
    }, 6000); // 6s timeout for message sync - fast fail
    if (!r.ok) throw new Error(`Find messages error ${r.status}: ${await r.text()}`);
    return r.json();
  }

  // Webhook management (uses global API key)
  async setWebhook(instanceName: string, webhookUrl: string, events: string[] = []) {
    return this.request(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: events.length > 0 ? events : [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'SEND_MESSAGE',
          ],
        },
      }),
    });
  }

  async findWebhook(instanceName: string) {
    return this.request(`/webhook/find/${instanceName}`).catch(() => null);
  }

  // Get base64 media from a message
  async getBase64FromMedia(instanceName: string, instanceToken: string, messageId: string, convertToMp4 = false) {
    try {
      const r = await this.fetchWithTimeout(`${this.apiUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': instanceToken },
        body: JSON.stringify({ message: { key: { id: messageId } }, convertToMp4 }),
      }, 15000); // 15s for media download
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
  }

  async getProfilePicture(instanceName: string, instanceToken: string, number: string) {
    try {
      const r = await this.fetchWithTimeout(`${this.apiUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': instanceToken },
        body: JSON.stringify({ number }),
      });
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
  }
}

export function createEvolutionClient(config: EvolutionServerConfig): EvolutionClient {
  return new EvolutionClient(config);
}
