import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/constants";
import { 
  formatForLinkedIn, 
  formatForTwitter,
  formatForFacebook,
  formatForInstagram,
  generateHashtags, 
  buildLinkedInPayload,
  isTokenValid 
} from "@/lib/social-media";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Instagram aceita aspect ratio entre 4:5 (0.8) e 1.91:1
const IG_MIN_RATIO = 0.8;
const IG_MAX_RATIO = 1.91;

/**
 * Analisa dimensões de uma imagem JPEG/PNG a partir do buffer.
 * Retorna { width, height } ou null se não conseguir determinar.
 */
function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    // PNG: bytes 16-23 contêm largura e altura (4 bytes cada, big-endian)
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    // JPEG: buscar marcador SOF (0xFF 0xC0 ou 0xC2)
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xFF) break;
      const marker = buffer[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      const segLen = buffer.readUInt16BE(offset + 2);
      offset += 2 + segLen;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Corta o centro de uma imagem JPEG para caber no aspect ratio do Instagram.
 * Usa canvas emulado via dados raw — como não temos sharp/canvas no deploy,
 * fazemos um crop simples recalculando as dimensões e enviando a imagem original
 * com as novas dimensões informadas. Se não conseguir fazer crop real, retorna
 * as dimensões ajustadas para que a API do Instagram aceite.
 *
 * Na prática, para o Instagram o que importa é que a imagem uploadada esteja
 * dentro do ratio. A abordagem mais robusta é adicionar barras (letterbox).
 * Como não temos bibliotecas de imagem, vamos criar um SVG wrapper que
 * adiciona barras pretas e converter para PNG via canvas virtual — MAS na verdade
 * a forma mais simples é simplesmente informar ao chamador que a imagem precisa
 * ser ajustada e deixar a publicação falhar graciosamente com uma mensagem clara.
 *
 * ABORDAGEM FINAL: Não fazer crop (sem libs de imagem), mas tentar com a imagem
 * original mesmo assim. Se a API recusar, retornar erro claro com as dimensões.
 */
function checkInstagramAspectRatio(width: number, height: number): {
  valid: boolean;
  ratio: number;
  suggestion?: string;
} {
  const ratio = width / height;
  if (ratio >= IG_MIN_RATIO && ratio <= IG_MAX_RATIO) {
    return { valid: true, ratio };
  }
  if (ratio > IG_MAX_RATIO) {
    // Imagem muito larga — precisaria cortar laterais ou adicionar barras em cima/baixo
    const newHeight = Math.ceil(width / IG_MAX_RATIO);
    return {
      valid: false,
      ratio,
      suggestion: `Imagem muito larga (${width}x${height}, ratio ${ratio.toFixed(2)}). Instagram aceita até 1.91:1. Sugestão: redimensionar para ${width}x${newHeight}.`
    };
  }
  // Imagem muito alta
  const newWidth = Math.ceil(height * IG_MIN_RATIO);
  return {
    valid: false,
    ratio,
    suggestion: `Imagem muito alta (${width}x${height}, ratio ${ratio.toFixed(2)}). Instagram aceita mínimo 4:5 (0.8). Sugestão: redimensionar para ${newWidth}x${height}.`
  };
}

// Função para fazer upload de imagem externa para o S3 (usando bucket Abacus AI)
async function uploadImageToS3(imageUrl: string): Promise<string | null> {
  try {
    // Baixar a imagem
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status} - ${imageUrl}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    
    if (buffer.length < 1000) {
      console.error("Image too small, likely invalid:", buffer.length);
      return null;
    }
    
    // Usar bucket Abacus AI que tem permissões
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-west-2"
    });

    // Gerar nome único
    const ext = contentType.includes("png") ? "png" : "jpg";
    const folderPrefix = process.env.AWS_FOLDER_PREFIX || "";
    const key = `${folderPrefix}public/social/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Upload para S3
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || "",
      Key: key,
      Body: buffer,
      ContentType: contentType
    }));

    // Retornar URL pública
    const bucketName = process.env.AWS_BUCKET_NAME || "";
    const region = process.env.AWS_REGION || "us-west-2";
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  } catch (error: any) {
    console.error("Error uploading image to S3:", error.message);
    return null;
  }
}

export interface PublishResult {
  platform: string;
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
}

export interface SocialPublishInput {
  blogPostId?: string;
  title: string;
  excerpt: string;
  slug?: string;
  featuredImage?: string | null;
  categoryName?: string;
  keywords?: string[];
  postUrl?: string; // URL completa do post (opcional, se não fornecido será construído a partir do slug)
}

// Função principal para publicar em todas as redes sociais configuradas
// platforms: array opcional para especificar quais plataformas publicar (ex: ["instagram", "linkedin"])
export async function publishToAllSocialMedia(
  input: SocialPublishInput, 
  platforms?: string[]
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];
  const baseUrl = getSiteUrl();
  // postUrl pode vir do input ou ser construído a partir do slug
  const postUrl = input.postUrl || `${baseUrl}/noticias/${input.slug}`;

  // Buscar todas as contas de redes sociais ativas
  const accounts = await prisma.socialMediaAccount.findMany({
    where: {
      isConnected: true,
      active: true,
      // Se platforms foi especificado, filtrar apenas essas plataformas
      ...(platforms && platforms.length > 0 ? { platform: { in: platforms } } : {})
    }
  });

  if (accounts.length === 0) {
    return [{ platform: "all", success: false, error: "Nenhuma rede social configurada" }];
  }

  // Publicar em cada plataforma
  for (const account of accounts) {
    try {
      // Verificar se token está válido
      if (!isTokenValid(account.expiresAt)) {
        results.push({
          platform: account.platform,
          success: false,
          error: "Token expirado"
        });
        continue;
      }

      let result: PublishResult;

      switch (account.platform) {
        case "linkedin":
          result = await publishToLinkedIn(account, input, postUrl);
          break;
        case "twitter":
          result = await publishToTwitter(account, input, postUrl);
          break;
        case "facebook":
          result = await publishToFacebook(account, input, postUrl);
          break;
        case "instagram":
          result = await publishToInstagram(account, input, postUrl);
          break;
        default:
          result = { platform: account.platform, success: false, error: "Plataforma não suportada" };
      }

      results.push(result);

      // Registrar publicação
      await prisma.socialPublication.create({
        data: {
          accountId: account.id,
          blogPostId: input.blogPostId,
          platform: account.platform,
          postId: result.postId,
          postUrl: result.postUrl,
          content: input.title,
          imageUrl: input.featuredImage,
          status: result.success ? "published" : "failed",
          errorMessage: result.error,
          publishedAt: result.success ? new Date() : null
        }
      });

      // Atualizar conta
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: {
          lastUsedAt: new Date(),
          lastError: result.error || null
        }
      });

    } catch (error: any) {
      console.error(`Erro ao publicar em ${account.platform}:`, error);
      results.push({
        platform: account.platform,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

// LinkedIn
async function publishToLinkedIn(
  account: any, 
  input: SocialPublishInput, 
  postUrl: string
): Promise<PublishResult> {
  try {
    const hashtags = generateHashtags(input.title, input.categoryName, input.keywords || []);
    const content = formatForLinkedIn(input.title, input.excerpt, postUrl, hashtags);
    
    const authorUrn = account.postAsOrganization && account.organizationId
      ? `urn:li:organization:${account.organizationId}`
      : `urn:li:person:${account.accountId}`;

    let imageAsset: string | undefined;

    // Upload de imagem se disponível
    if (input.featuredImage) {
      try {
        const registerUploadBody = {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: authorUrn,
            serviceRelationships: [{
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent"
            }]
          }
        };

        const registerResponse = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${account.accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
          },
          body: JSON.stringify(registerUploadBody)
        });

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          const uploadUrl = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
          imageAsset = registerData.value?.asset;

          if (uploadUrl && imageAsset) {
            const imageResponse = await fetch(input.featuredImage);
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer();
              await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${account.accessToken}`,
                  "Content-Type": "application/octet-stream"
                },
                body: imageBuffer
              });
            }
          }
        }
      } catch (e) {
        console.error("LinkedIn image upload error:", e);
      }
    }

    // Montar payload
    let payload: any;
    if (imageAsset) {
      payload = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content.text },
            shareMediaCategory: "IMAGE",
            media: [{ status: "READY", media: imageAsset, title: { text: input.title } }]
          }
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
      };
    } else {
      payload = buildLinkedInPayload(authorUrn, content.text, postUrl, input.title);
    }

    const publishResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify(payload)
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      return { platform: "linkedin", success: false, error: errorData.message || `HTTP ${publishResponse.status}` };
    }

    const responseData = await publishResponse.json();
    const linkedinPostId = responseData.id;
    const linkedinPostUrl = linkedinPostId ? `https://www.linkedin.com/feed/update/${linkedinPostId}` : undefined;

    return { platform: "linkedin", success: true, postId: linkedinPostId, postUrl: linkedinPostUrl };

  } catch (error: any) {
    return { platform: "linkedin", success: false, error: error.message };
  }
}

// Twitter/X
// Função para gerar assinatura OAuth 1.0a
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const crypto = require("crypto");
  
  // Ordenar parâmetros alfabeticamente
  const sortedParams = Object.keys(params).sort().map(key => 
    `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
  ).join("&");
  
  // Criar signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join("&");
  
  // Criar signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  // Gerar HMAC-SHA1
  const hmac = crypto.createHmac("sha1", signingKey);
  hmac.update(signatureBaseString);
  return hmac.digest("base64");
}

// Função para gerar header OAuth 1.0a (inclui parâmetros da requisição)
function generateOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
  additionalParams: Record<string, string> = {}
): string {
  const crypto = require("crypto");
  
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0"
  };
  
  // Combinar oauth params com params adicionais para a assinatura
  const allParams = { ...oauthParams, ...additionalParams };
  
  // Gerar assinatura
  const signature = generateOAuthSignature(
    method,
    url,
    allParams,
    consumerSecret,
    accessTokenSecret
  );
  
  oauthParams.oauth_signature = signature;
  
  // Construir header
  const headerParams = Object.keys(oauthParams).sort().map(key =>
    `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`
  ).join(", ");
  
  return `OAuth ${headerParams}`;
}

async function publishToTwitter(
  account: any, 
  input: SocialPublishInput, 
  postUrl: string
): Promise<PublishResult> {
  try {
    // Buscar credenciais do banco
    const { prisma } = await import("@/lib/db");
    
    const apiKeyConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_api_key" }});
    const apiSecretConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_api_secret" }});
    const accessTokenConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_access_token" }});
    const accessSecretConfig = await prisma.siteConfig.findFirst({ where: { key: "twitter_access_token_secret" }});
    
    const apiKey = apiKeyConfig?.value;
    const apiSecret = apiSecretConfig?.value;
    const accessToken = accessTokenConfig?.value;
    const accessTokenSecret = accessSecretConfig?.value;
    
    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return { 
        platform: "twitter", 
        success: false, 
        error: "Credenciais OAuth 1.0a do Twitter não configuradas. Configure API Key, API Secret, Access Token e Access Token Secret." 
      };
    }

    const content = formatForTwitter(input.title, input.excerpt, postUrl, input.categoryName);
    
    // API v2 endpoint com OAuth 1.0a
    const url = "https://api.twitter.com/2/tweets";
    
    // Gerar OAuth header (sem parâmetros adicionais para JSON body)
    const oauthHeader = generateOAuthHeader(
      "POST",
      url,
      apiKey,
      apiSecret,
      accessToken,
      accessTokenSecret
    );

    // Enviar como JSON
    const publishResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": oauthHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: content.text })
    });

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      let errorMessage = `HTTP ${publishResponse.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message;
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }
      return { platform: "twitter", success: false, error: errorMessage };
    }

    const responseData = await publishResponse.json();
    const tweetId = responseData.data?.id;
    // Na API v2, não retorna o username
    const tweetUrl = tweetId ? `https://twitter.com/i/status/${tweetId}` : undefined;

    return { platform: "twitter", success: true, postId: tweetId, postUrl: tweetUrl };

  } catch (error: any) {
    return { platform: "twitter", success: false, error: error.message };
  }
}

// Facebook
async function publishToFacebook(
  account: any, 
  input: SocialPublishInput, 
  postUrl: string
): Promise<PublishResult> {
  try {
    const content = formatForFacebook(input.title, input.excerpt, postUrl, input.categoryName);
    const pageId = account.accountId;

    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.text,
          link: postUrl,
          access_token: account.accessToken
        })
      }
    );

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      return { platform: "facebook", success: false, error: errorData.error?.message || `HTTP ${publishResponse.status}` };
    }

    const responseData = await publishResponse.json();
    const postId = responseData.id;
    const fbPostUrl = postId ? `https://www.facebook.com/${postId}` : undefined;

    return { platform: "facebook", success: true, postId, postUrl: fbPostUrl };

  } catch (error: any) {
    return { platform: "facebook", success: false, error: error.message };
  }
}

// Instagram
async function publishToInstagram(
  account: any, 
  input: SocialPublishInput, 
  postUrl: string
): Promise<PublishResult> {
  try {
    // Instagram requer imagem
    if (!input.featuredImage) {
      return { platform: "instagram", success: false, error: "Instagram requer imagem" };
    }

    const baseUrl = getSiteUrl();
    
    // Buscar URL configurada da bio
    const bioLinkConfig = await prisma.siteConfig.findFirst({
      where: { key: "instagram_bio_link_url" }
    });
    const bioLinkPath = bioLinkConfig?.value || "/noticias";
    const bioLinkUrl = `${baseUrl}${bioLinkPath.startsWith("/") ? bioLinkPath : "/" + bioLinkPath}`;

    const content = formatForInstagram(
      input.title, 
      input.excerpt, 
      postUrl,
      input.categoryName,
      undefined,
      bioLinkUrl
    );
    const igAccountId = account.instagramAccountId || account.accountId;

    // Instagram precisa de uma URL de imagem publicamente acessível
    // Converter caminhos relativos para URLs absolutas
    let imageUrl = input.featuredImage;
    if (imageUrl.startsWith("/")) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }
    
    // Verificar aspect ratio da imagem antes de enviar
    try {
      const imgResp = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "image/*,*/*;q=0.8"
        }
      });
      if (imgResp.ok) {
        const imgBuffer = Buffer.from(await imgResp.arrayBuffer());
        const dims = getImageDimensions(imgBuffer);
        if (dims) {
          const ratioCheck = checkInstagramAspectRatio(dims.width, dims.height);
          if (!ratioCheck.valid) {
            console.warn(`Instagram: Aspect ratio inválido - ${ratioCheck.suggestion}`);
            // Tentar corrigir via FFmpeg API (Abacus AI)
            const apiKey = process.env.ABACUSAI_API_KEY;
            if (apiKey) {
              try {
                // Primeiro, fazer upload da imagem original para ter uma URL pública
                const tempS3Url = await uploadImageToS3(imageUrl);
                if (tempS3Url) {
                  // Calcular dimensões de crop (center crop)
                  let cropW = dims.width;
                  let cropH = dims.height;
                  if (ratioCheck.ratio > IG_MAX_RATIO) {
                    cropW = Math.floor(dims.height * IG_MAX_RATIO);
                  } else {
                    cropH = Math.floor(dims.width / IG_MIN_RATIO);
                  }
                  const cropX = Math.floor((dims.width - cropW) / 2);
                  const cropY = Math.floor((dims.height - cropH) / 2);

                  // Criar request FFmpeg
                  const createResp = await fetch("https://apps.abacus.ai/api/createRunFfmpegCommandRequest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      deployment_token: apiKey,
                      input_files: { in_img: tempS3Url },
                      output_files: { out_img: "cropped.jpg" },
                      ffmpeg_command: `-i {{in_img}} -vf "crop=${cropW}:${cropH}:${cropX}:${cropY}" -q:v 2 {{out_img}}`
                    })
                  });

                  if (createResp.ok) {
                    const { request_id } = await createResp.json();
                    if (request_id) {
                      // Poll para resultado (máx 60s)
                      for (let att = 0; att < 30; att++) {
                        await new Promise(r => setTimeout(r, 2000));
                        const statusResp = await fetch("https://apps.abacus.ai/api/getRunFfmpegCommandStatus", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ request_id, deployment_token: apiKey })
                        });
                        const statusData = await statusResp.json();
                        if (statusData.status === "SUCCESS" && statusData.result?.result) {
                          const croppedUrl = statusData.result.result["out_img"];
                          if (croppedUrl) {
                            imageUrl = croppedUrl;
                            console.log(`Instagram: Imagem recortada via FFmpeg para ${cropW}x${cropH}:`, croppedUrl);
                          }
                          break;
                        } else if (statusData.status === "FAILED") {
                          console.error("Instagram: FFmpeg falhou:", statusData.result?.error);
                          break;
                        }
                      }
                    }
                  } else {
                    console.error("Instagram: FFmpeg request falhou:", await createResp.text().catch(() => ""));
                  }
                }
              } catch (ffErr: any) {
                console.error("Instagram: Erro ao recortar imagem via FFmpeg:", ffErr.message);
              }
            } else {
              // Sem API key — retornar erro descritivo
              return {
                platform: "instagram",
                success: false,
                error: `Aspect ratio incompatível (${dims.width}x${dims.height}, ratio ${(dims.width/dims.height).toFixed(2)}). Instagram aceita entre 4:5 e 1.91:1.`
              };
            }
          }
        }
      }
    } catch (e: any) {
      console.error("Instagram: Erro ao verificar aspect ratio:", e.message);
    }

    // Upload da imagem para S3 para garantir acessibilidade pública
    console.log("Instagram: Uploading image to S3 for public access...", imageUrl);
    const s3Url = await uploadImageToS3(imageUrl);
    if (s3Url) {
      imageUrl = s3Url;
      console.log("Instagram: Image uploaded to S3:", s3Url);
    } else {
      console.error("Instagram: S3 upload failed for:", imageUrl);
      return { platform: "instagram", success: false, error: "Não foi possível processar a imagem para o Instagram. Verifique se a URL da imagem está acessível." };
    }

    // 1. Criar container de mídia (usando Graph API v25.0)
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption: content.text,
      access_token: account.accessToken
    });

    const createMediaResponse = await fetch(
      `https://graph.facebook.com/v25.0/${igAccountId}/media`,
      {
        method: "POST",
        body: containerParams
      }
    );

    if (!createMediaResponse.ok) {
      const errorData = await createMediaResponse.json().catch(() => ({}));
      console.error("Instagram create media error:", createMediaResponse.status, errorData);
      return { platform: "instagram", success: false, error: errorData.error?.message || `HTTP ${createMediaResponse.status}` };
    }

    const mediaData = await createMediaResponse.json();
    const creationId = mediaData.id;

    if (!creationId) {
      console.error("Instagram: No creation ID returned:", mediaData);
      return { platform: "instagram", success: false, error: "Media ID não retornado pela API do Instagram" };
    }

    // Aguardar processamento da imagem com polling de status
    let mediaReady = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await fetch(
        `https://graph.facebook.com/v25.0/${creationId}?fields=status_code&access_token=${account.accessToken}`
      );
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Instagram media status (attempt ${attempt + 1}):`, statusData.status_code);
        
        if (statusData.status_code === "FINISHED") {
          mediaReady = true;
          break;
        }
        if (statusData.status_code === "ERROR") {
          return { platform: "instagram", success: false, error: "Instagram rejeitou a mídia. Verifique o formato e tamanho da imagem." };
        }
        // IN_PROGRESS - continue polling
      }
    }

    if (!mediaReady) {
      return { platform: "instagram", success: false, error: "Tempo esgotado aguardando processamento da imagem pelo Instagram" };
    }

    // 2. Publicar o container
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: account.accessToken
    });

    const publishResponse = await fetch(
      `https://graph.facebook.com/v25.0/${igAccountId}/media_publish`,
      {
        method: "POST",
        body: publishParams
      }
    );

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json().catch(() => ({}));
      console.error("Instagram publish error:", publishResponse.status, errorData);
      return { platform: "instagram", success: false, error: errorData.error?.message || `HTTP ${publishResponse.status}` };
    }

    const responseData = await publishResponse.json();
    const postId = responseData.id;
    
    // Buscar permalink
    let igPostUrl: string | undefined;
    try {
      const permalinkResponse = await fetch(
        `https://graph.facebook.com/v25.0/${postId}?fields=permalink&access_token=${account.accessToken}`
      );
      if (permalinkResponse.ok) {
        const permalinkData = await permalinkResponse.json();
        igPostUrl = permalinkData.permalink;
      }
    } catch (e) {
      console.error("Erro ao buscar permalink:", e);
    }
    
    if (!igPostUrl) {
      const igUsername = account.accountName || "m3solutionsbr";
      igPostUrl = `https://www.instagram.com/${igUsername}/`;
    }

    return { platform: "instagram", success: true, postId, postUrl: igPostUrl };

  } catch (error: any) {
    console.error("Instagram publish exception:", error);
    return { platform: "instagram", success: false, error: error.message };
  }
}

// Função auxiliar para atualizar Chronicle com URLs das publicações
export async function updateChronicleWithSocialUrls(
  chronicleId: string, 
  results: PublishResult[]
): Promise<void> {
  const updateData: any = {};

  for (const result of results) {
    if (result.success && result.postUrl) {
      switch (result.platform) {
        case "linkedin":
          updateData.linkedinPostUrl = result.postUrl;
          break;
        case "twitter":
          updateData.twitterPostUrl = result.postUrl;
          break;
        case "facebook":
          updateData.facebookPostUrl = result.postUrl;
          break;
        case "instagram":
          updateData.instagramPostUrl = result.postUrl;
          break;
      }
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.chronicle.update({
      where: { id: chronicleId },
      data: updateData
    });
  }
}
