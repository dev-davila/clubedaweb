export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { validateRequest, handleAPIError, getClientIP, checkRateLimit, RateLimitError, AuthenticationError } from "@/lib/api-utils";
import { generateAIImageSchema } from "@/lib/validation-schemas";

// Helper to read API secrets from environment
function getApiKey(service: string, keyName: string): string | null {
  // Map service names to environment variable names
  const serviceMap: Record<string, string> = {
    "leonardo ai": "LEONARDO_AI_API_KEY",
    "openai": "OPENAI_API_KEY"
  };
  
  const envKey = serviceMap[service.toLowerCase()];
  return envKey ? (process.env[envKey] || null) : null;
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (5 requests per minute for AI image generation)
    const ip = getClientIP(request);
    if (!checkRateLimit(`ai-image-${ip}`, 5, 60000)) {
      throw new RateLimitError();
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AuthenticationError();
    }

    // Validar requisição
    const body = await request.json();
    const validatedData = generateAIImageSchema.parse(body);
    const { prompt, style, provider = "leonardo" } = validatedData;

    // Enhanced prompt for better corporate images
    const enhancedPrompt = `Corporate professional image for IT company website: ${prompt}. ${style || "Modern, clean, professional style, high quality"}. 16:9 aspect ratio.`;

    let imageUrl = "";
    let usedProvider = provider;

    // Try Leonardo AI first
    const leonardoKey = getApiKey("leonardo ai", "api_key");
    if (leonardoKey && (provider === "leonardo" || !provider)) {
      try {
        // Create generation
        const genResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${leonardoKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3", // Leonardo Creative
            width: 1024,
            height: 576,
            num_images: 1,
            guidance_scale: 7
          })
        });

        if (genResponse.ok) {
          const genData = await genResponse.json();
          const generationId = genData.sdGenerationJob?.generationId;
          
          if (generationId) {
            // Poll for result
            for (let i = 0; i < 30; i++) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const checkResponse = await fetch(
                `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
                {
                  headers: { "Authorization": `Bearer ${leonardoKey}` }
                }
              );
              
              if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                if (checkData.generations_by_pk?.status === "COMPLETE") {
                  imageUrl = checkData.generations_by_pk?.generated_images?.[0]?.url || "";
                  usedProvider = "leonardo";
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Leonardo AI error:", error);
      }
    }

    // Fallback to OpenAI DALL-E
    if (!imageUrl) {
      const openaiKey = getApiKey("openai", "api_key");
      if (openaiKey) {
        try {
          const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: enhancedPrompt,
              n: 1,
              size: "1792x1024",
              quality: "standard"
            })
          });

          if (dalleResponse.ok) {
            const dalleData = await dalleResponse.json();
            imageUrl = dalleData.data?.[0]?.url || "";
            usedProvider = "openai";
          }
        } catch (error) {
          console.error("OpenAI DALL-E error:", error);
        }
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Não foi possível gerar a imagem. Verifique as configurações de API." },
        { status: 500 }
      );
    }

    // Save to media library
    const media = await prisma.mediaLibrary.create({
      data: {
        url: imageUrl,
        alt: prompt.substring(0, 100),
        filename: `ai-generated-${Date.now()}.png`,
        mimeType: "image/png",
        width: usedProvider === "openai" ? 1792 : 1024,
        height: usedProvider === "openai" ? 1024 : 576,
        generatedByAI: true,
        aiPrompt: prompt,
        aiProvider: usedProvider,
        category: "ai-generated"
      }
    });

    // Log AI usage
    await prisma.aIUsageLog.create({
      data: {
        operation: "image_generation",
        model: usedProvider,
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 1,
        cost: usedProvider === "openai" ? 0.04 : 0.02
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: media.id,
        url: imageUrl,
        provider: usedProvider
      }
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
