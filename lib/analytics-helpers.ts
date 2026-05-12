// Helpers para detecção de browser, OS, device, canal de tráfego e bots

const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
  /facebookexternalhit/i, /linkedinbot/i, /twitterbot/i,
  /whatsapp/i, /telegrambot/i, /bingpreview/i, /googlebot/i,
  /yandexbot/i, /baiduspider/i, /duckduckbot/i, /semrushbot/i,
  /ahrefsbot/i, /mj12bot/i, /dotbot/i, /petalbot/i,
  /applebot/i, /bytespider/i, /gptbot/i, /claudebot/i,
  /headlesschrome/i, /phantomjs/i, /lighthouse/i, /pagespeed/i,
  /pingdom/i, /uptimerobot/i, /python-requests/i, /curl/i, /wget/i,
  /go-http-client/i, /java\//i, /okhttp/i, /axios/i, /node-fetch/i,
];

export function isBot(ua: string): boolean {
  if (!ua) return true;
  return BOT_PATTERNS.some(p => p.test(ua));
}

export function parseBrowser(ua: string): { name: string; version: string } {
  if (!ua) return { name: 'Desconhecido', version: '' };
  const browsers: [RegExp, string][] = [
    [/Edg[\/\s]([\d.]+)/, 'Edge'],
    [/OPR[\/\s]([\d.]+)/, 'Opera'],
    [/Vivaldi[\/\s]([\d.]+)/, 'Vivaldi'],
    [/Brave[\/\s]([\d.]+)/, 'Brave'],
    [/SamsungBrowser[\/\s]([\d.]+)/, 'Samsung Internet'],
    [/UCBrowser[\/\s]([\d.]+)/, 'UC Browser'],
    [/Firefox[\/\s]([\d.]+)/, 'Firefox'],
    [/Chrome[\/\s]([\d.]+)/, 'Chrome'],
    [/Safari[\/\s]([\d.]+)/, 'Safari'],
    [/MSIE\s([\d.]+)/, 'IE'],
    [/Trident.*rv:([\d.]+)/, 'IE'],
  ];
  for (const [regex, name] of browsers) {
    const match = ua.match(regex);
    if (match) return { name, version: match[1]?.split('.')[0] || '' };
  }
  return { name: 'Outro', version: '' };
}

export function parseOS(ua: string): string {
  if (!ua) return 'Desconhecido';
  if (/Windows NT 10/i.test(ua)) return 'Windows';
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X/i.test(ua)) return 'Macintosh';
  if (/Android/i.test(ua)) return 'Android';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/CrOS/i.test(ua)) return 'Chrome OS';
  return 'Outro';
}

export function parseDeviceType(ua: string): string {
  if (!ua) return 'desktop';
  if (/iPad|tablet|Kindle|PlayBook/i.test(ua)) return 'tablet';
  if (/Mobile|Android.*Mobile|iPhone|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function parseReferrerDomain(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function classifyChannel(referrer: string | null | undefined, referrerDomain: string | null | undefined): string {
  if (!referrer || !referrerDomain) return 'Direct';

  const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex', 'ecosia', 'ask.com'];
  const socialNetworks = ['facebook', 'instagram', 'twitter', 'x.com', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'reddit', 'threads.net', 'wa.me', 'whatsapp', 't.me'];

  const domain = referrerDomain.toLowerCase();

  if (searchEngines.some(se => domain.includes(se))) return 'Organic Search';
  if (socialNetworks.some(sn => domain.includes(sn))) return 'Organic Social';
  if (domain.includes('mail') || domain.includes('outlook') || domain.includes('gmail')) return 'Email';

  return 'Referral';
}
