// Serviço de formatação de conteúdo para redes sociais

export interface SocialPostContent {
  text: string;
  hashtags: string[];
  url?: string;
  imageUrl?: string;
}

export interface LinkedInPostPayload {
  author: string; // URN do autor (urn:li:person:xxx ou urn:li:organization:xxx)
  lifecycleState: "PUBLISHED";
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: "NONE" | "ARTICLE" | "IMAGE";
      media?: Array<{
        status: "READY";
        description?: {
          text: string;
        };
        originalUrl?: string;
        title?: {
          text: string;
        };
      }>;
    };
  };
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" | "CONNECTIONS";
  };
}

// Limites por plataforma
export const PLATFORM_LIMITS = {
  linkedin: {
    maxChars: 3000,
    maxHashtags: 5,
    recommendedHashtags: 3,
    maxImageSize: 8 * 1024 * 1024, // 8MB
    supportedImageTypes: ["image/jpeg", "image/png", "image/gif"]
  },
  twitter: {
    maxChars: 280,
    maxHashtags: 3,
    recommendedHashtags: 2
  },
  facebook: {
    maxChars: 63206,
    maxHashtags: 10,
    recommendedHashtags: 3
  },
  instagram: {
    maxChars: 2200,
    maxHashtags: 30,
    recommendedHashtags: 10
  }
};

/**
 * Formata o conteúdo de um post do blog para publicação no LinkedIn
 */
export function formatForLinkedIn(
  title: string,
  excerpt: string | null,
  postUrl: string,
  hashtags: string[] = [],
  customTemplate?: string
): SocialPostContent {
  const limits = PLATFORM_LIMITS.linkedin;
  
  // Template padrão
  let text = customTemplate || `📝 ${title}\n\n`;
  
  if (!customTemplate) {
    // Adicionar excerpt se existir
    if (excerpt) {
      const cleanExcerpt = excerpt
        .replace(/<[^>]*>/g, "") // Remover HTML
        .replace(/\s+/g, " ") // Normalizar espaços
        .trim();
      
      text += `${cleanExcerpt}\n\n`;
    }
    
    // Adicionar link
    text += `🔗 Leia mais: ${postUrl}\n\n`;
    
    // Adicionar CTA
    text += `💬 O que você achou? Comente abaixo!`;
  }
  
  // Processar hashtags
  const processedHashtags = hashtags
    .slice(0, limits.recommendedHashtags)
    .map(tag => tag.startsWith("#") ? tag : `#${tag}`)
    .map(tag => tag.replace(/\s+/g, "")) // Remover espaços
    .filter(tag => tag.length > 1);
  
  // Adicionar hashtags ao texto
  if (processedHashtags.length > 0) {
    text += `\n\n${processedHashtags.join(" ")}`;
  }
  
  // Garantir que não ultrapasse o limite
  if (text.length > limits.maxChars) {
    text = text.substring(0, limits.maxChars - 3) + "...";
  }
  
  return {
    text,
    hashtags: processedHashtags,
    url: postUrl
  };
}

/**
 * Gera hashtags relevantes baseado no título e categoria
 */
export function generateHashtags(
  title: string,
  category?: string,
  keywords: string[] = []
): string[] {
  const hashtags: string[] = [];
  
  // Hashtags da empresa
  hashtags.push("#M3Solutions");
  hashtags.push("#TI");
  
  // Baseado na categoria
  if (category) {
    const categoryHashtags: Record<string, string[]> = {
      "Tecnologia": ["#Tecnologia", "#Tech"],
      "Segurança": ["#Cibersegurança", "#SegurancaDaInformacao"],
      "Cloud": ["#CloudComputing", "#Nuvem"],
      "Microsoft": ["#Microsoft365", "#Azure"],
      "Infraestrutura": ["#Infraestrutura", "#DataCenter"],
      "Gestão de TI": ["#GestaoTI", "#ITManagement"],
      "LGPD": ["#LGPD", "#ProtecaoDeDados"]
    };
    
    if (categoryHashtags[category]) {
      hashtags.push(...categoryHashtags[category]);
    }
  }
  
  // Baseado em keywords
  keywords.slice(0, 3).forEach(kw => {
    const tag = kw.replace(/\s+/g, "").replace(/[^a-zA-Z0-9à-ú]/gi, "");
    if (tag.length > 2) {
      hashtags.push(`#${tag}`);
    }
  });
  
  // Remover duplicatas e limitar
  return [...new Set(hashtags)].slice(0, PLATFORM_LIMITS.linkedin.recommendedHashtags + 2);
}

/**
 * Monta o payload para a API do LinkedIn (UGC Posts)
 */
export function buildLinkedInPayload(
  personUrn: string,
  text: string,
  articleUrl?: string,
  articleTitle?: string
): LinkedInPostPayload {
  const payload: LinkedInPostPayload = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: text
        },
        shareMediaCategory: articleUrl ? "ARTICLE" : "NONE"
      }
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  };
  
  // Adicionar artigo se URL fornecida
  if (articleUrl) {
    payload.specificContent["com.linkedin.ugc.ShareContent"].media = [
      {
        status: "READY",
        originalUrl: articleUrl,
        title: articleTitle ? { text: articleTitle } : undefined
      }
    ];
  }
  
  return payload;
}

/**
 * Valida se o token ainda é válido
 */
export function isTokenValid(expiresAt: Date | null): boolean {
  if (!expiresAt) return true; // Se não tem data, assume válido
  
  // Considera inválido se expira em menos de 5 minutos
  const bufferMs = 5 * 60 * 1000;
  return new Date(expiresAt).getTime() > Date.now() + bufferMs;
}

// ==========================================
// TWITTER/X FUNCTIONS
// ==========================================

export interface TwitterPostContent {
  text: string;
  hashtags: string[];
  url?: string;
}

/**
 * Formata o conteúdo de um post do blog para publicação no Twitter/X
 */
export function formatForTwitter(
  title: string,
  excerpt: string | null,
  postUrl: string,
  category?: string,
  customTemplate?: string
): TwitterPostContent {
  const limits = PLATFORM_LIMITS.twitter;
  
  // Template padrão otimizado para Twitter
  let text = customTemplate || "";
  
  if (!customTemplate) {
    // Título encurtado se necessário
    const shortTitle = title.length > 100 ? title.substring(0, 97) + "..." : title;
    
    text = `📢 ${shortTitle}\n\n`;
    
    // Adicionar link (Twitter conta ~23 chars para qualquer URL)
    text += `🔗 ${postUrl}`;
  }
  
  // Gerar hashtags para Twitter (mais curtas e relevantes)
  const hashtags = generateTwitterHashtags(title, category);
  
  // Calcular espaço disponível para hashtags
  const hashtagsText = hashtags.join(" ");
  const availableSpace = limits.maxChars - text.length - 2; // -2 para "\n\n"
  
  // Adicionar hashtags se couberem
  if (hashtagsText.length <= availableSpace && hashtags.length > 0) {
    text += `\n\n${hashtagsText}`;
  }
  
  // Garantir que não ultrapasse o limite
  if (text.length > limits.maxChars) {
    text = text.substring(0, limits.maxChars - 3) + "...";
  }
  
  return {
    text,
    hashtags,
    url: postUrl
  };
}

/**
 * Gera hashtags otimizadas para Twitter (curtas e relevantes)
 */
export function generateTwitterHashtags(
  title: string,
  category?: string
): string[] {
  const hashtags: string[] = [];
  
  // Hashtag da empresa
  hashtags.push("#M3Solutions");
  
  // Baseado na categoria (hashtags curtas para Twitter)
  if (category) {
    const categoryHashtags: Record<string, string> = {
      "Tecnologia": "#Tech",
      "Segurança": "#Cyber",
      "Cloud": "#Cloud",
      "Microsoft": "#Microsoft",
      "Infraestrutura": "#IT",
      "Gestão de TI": "#TI",
      "LGPD": "#LGPD"
    };
    
    if (categoryHashtags[category]) {
      hashtags.push(categoryHashtags[category]);
    }
  }
  
  // Limitar a 3 hashtags para Twitter
  return [...new Set(hashtags)].slice(0, PLATFORM_LIMITS.twitter.maxHashtags);
}

// ==========================================
// FACEBOOK FUNCTIONS
// ==========================================

export interface FacebookPostContent {
  text: string;
  hashtags: string[];
  url?: string;
}

/**
 * Formata o conteúdo de um post do blog para publicação no Facebook
 */
export function formatForFacebook(
  title: string,
  excerpt: string | null,
  postUrl: string,
  category?: string,
  customTemplate?: string
): FacebookPostContent {
  const limits = PLATFORM_LIMITS.facebook;
  
  // Template padrão otimizado para Facebook
  let text = customTemplate || "";
  
  if (!customTemplate) {
    // Emoji + título
    text = `📢 ${title}\n\n`;
    
    // Adicionar excerpt se existir
    if (excerpt) {
      const cleanExcerpt = excerpt
        .replace(/<[^>]*>/g, "") // Remover HTML
        .replace(/\s+/g, " ") // Normalizar espaços
        .trim();
      
      // Limitar excerpt a ~300 caracteres
      const shortExcerpt = cleanExcerpt.length > 300 
        ? cleanExcerpt.substring(0, 297) + "..." 
        : cleanExcerpt;
      
      text += `${shortExcerpt}\n\n`;
    }
    
    // Adicionar link
    text += `🔗 Leia mais: ${postUrl}\n\n`;
    
    // Adicionar CTA
    text += `💬 Curta, comente e compartilhe!`;
  }
  
  // Gerar hashtags para Facebook
  const hashtags = generateFacebookHashtags(title, category);
  
  // Adicionar hashtags ao texto
  if (hashtags.length > 0) {
    text += `\n\n${hashtags.join(" ")}`;
  }
  
  // Garantir que não ultrapasse o limite
  if (text.length > limits.maxChars) {
    text = text.substring(0, limits.maxChars - 3) + "...";
  }
  
  return {
    text,
    hashtags,
    url: postUrl
  };
}

/**
 * Gera hashtags otimizadas para Facebook
 */
export function generateFacebookHashtags(
  title: string,
  category?: string
): string[] {
  const hashtags: string[] = [];
  
  // Hashtag da empresa
  hashtags.push("#M3Solutions");
  hashtags.push("#TI");
  
  // Baseado na categoria
  if (category) {
    const categoryHashtags: Record<string, string[]> = {
      "Tecnologia": ["#Tecnologia", "#Tech"],
      "Segurança": ["#Cibersegurança", "#SegurançaDaInformação"],
      "Cloud": ["#CloudComputing", "#Nuvem"],
      "Microsoft": ["#Microsoft365", "#Azure"],
      "Infraestrutura": ["#Infraestrutura", "#DataCenter"],
      "Gestão de TI": ["#GestãoTI", "#TIEmpresarial"],
      "LGPD": ["#LGPD", "#ProteçãoDeDados"]
    };
    
    if (categoryHashtags[category]) {
      hashtags.push(...categoryHashtags[category]);
    }
  }
  
  // Limitar a 5 hashtags para Facebook (menos spam)
  return [...new Set(hashtags)].slice(0, PLATFORM_LIMITS.facebook.recommendedHashtags + 2);
}

// ==========================================
// INSTAGRAM FUNCTIONS
// ==========================================

export interface InstagramPostContent {
  text: string;
  hashtags: string[];
  url?: string;
  imageUrl?: string;
}

/**
 * Formata o conteúdo de um post do blog para publicação no Instagram
 * Instagram tem limite de 2200 caracteres e suporta até 30 hashtags
 */
export function formatForInstagram(
  title: string,
  excerpt: string | null,
  postUrl: string,
  category?: string,
  customTemplate?: string,
  bioLinkUrl?: string
): InstagramPostContent {
  const limits = PLATFORM_LIMITS.instagram;
  
  // Template padrão otimizado para Instagram
  let text = customTemplate || "";
  
  if (!customTemplate) {
    // Emoji + título chamativo
    text = `📢 ${title}\n\n`;
    
    // Adicionar excerpt se existir
    if (excerpt) {
      const cleanExcerpt = excerpt
        .replace(/<[^>]*>/g, "") // Remover HTML
        .replace(/\s+/g, " ") // Normalizar espaços
        .trim();
      
      // Limitar excerpt a ~400 caracteres para Instagram
      const shortExcerpt = cleanExcerpt.length > 400 
        ? cleanExcerpt.substring(0, 397) + "..." 
        : cleanExcerpt;
      
      text += `${shortExcerpt}\n\n`;
    }
    
    // CTA com emoji - usar URL da bio configurada ou a URL completa do post
    const displayUrl = bioLinkUrl || postUrl;
    text += `🔗 Link na bio!\n`;
    text += `📖 Acesse: ${displayUrl}\n\n`;
    
    // Separador visual antes das hashtags
    text += `.\n.\n.\n`;
  }
  
  // Gerar hashtags para Instagram (mais hashtags = mais alcance)
  const hashtags = generateInstagramHashtags(title, category);
  
  // Adicionar hashtags ao texto
  if (hashtags.length > 0) {
    text += `\n${hashtags.join(" ")}`;
  }
  
  // Garantir que não ultrapasse o limite
  if (text.length > limits.maxChars) {
    text = text.substring(0, limits.maxChars - 3) + "...";
  }
  
  return {
    text,
    hashtags,
    url: postUrl
  };
}

/**
 * Gera hashtags otimizadas para Instagram
 * Instagram permite até 30 hashtags, recomenda-se 10-15
 */
export function generateInstagramHashtags(
  title: string,
  category?: string
): string[] {
  const hashtags: string[] = [];
  
  // Hashtags da empresa e marca
  hashtags.push("#M3Solutions");
  hashtags.push("#M3Digital");
  hashtags.push("#TI");
  hashtags.push("#TecnologiaDaInformacao");
  
  // Hashtags gerais de negócios/tech
  hashtags.push("#Tecnologia");
  hashtags.push("#Inovacao");
  hashtags.push("#TransformacaoDigital");
  hashtags.push("#TIBrasil");
  
  // Baseado na categoria
  if (category) {
    const categoryHashtags: Record<string, string[]> = {
      "Tecnologia": ["#Tech", "#TechNews", "#Novidades"],
      "Segurança": ["#Ciberseguranca", "#SegurancaDaInformacao", "#CyberSecurity", "#InfoSec", "#ProtecaoDeDados"],
      "Cloud": ["#CloudComputing", "#Nuvem", "#Cloud", "#AWS", "#Azure", "#GoogleCloud"],
      "Microsoft": ["#Microsoft365", "#Azure", "#Microsoft", "#Office365", "#MicrosoftPartner"],
      "Infraestrutura": ["#Infraestrutura", "#DataCenter", "#Servidores", "#Networking", "#InfraestruturaDigital"],
      "Gestão de TI": ["#GestaoTI", "#ITManagement", "#Outsourcing", "#TerceirizacaoTI", "#GestaoEmpresas"],
      "LGPD": ["#LGPD", "#ProtecaoDeDados", "#Privacidade", "#Compliance", "#DadosPessoais"]
    };
    
    if (categoryHashtags[category]) {
      hashtags.push(...categoryHashtags[category]);
    }
  }
  
  // Hashtags de engajamento
  hashtags.push("#DicasTI");
  hashtags.push("#Empresas");
  hashtags.push("#Negocios");
  
  // Remover duplicatas e limitar a 15 hashtags (ponto ideal)
  return [...new Set(hashtags)].slice(0, PLATFORM_LIMITS.instagram.recommendedHashtags + 5);
}
