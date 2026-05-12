export interface GoogleSearchConsoleCredentials {
  clientId: string;
  clientSecret: string;
}

export interface BingWebmasterCredentials {
  apiKey: string;
}

export function getGoogleSearchConsoleCredentials(): GoogleSearchConsoleCredentials | null {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return null;
  }
  
  return {
    clientId,
    clientSecret,
  };
}

export function getBingWebmasterCredentials(): BingWebmasterCredentials | null {
  const apiKey = process.env.BING_WEBMASTER_API_KEY;
  
  if (!apiKey) {
    return null;
  }
  
  return {
    apiKey,
  };
}
