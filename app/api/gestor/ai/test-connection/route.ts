export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider, apiKey } = await request.json();

    if (provider === 'abacus') {
      // Test Abacus AI connection
      const abacusApiKey = apiKey || process.env.ABACUSAI_API_KEY;
      
      if (!abacusApiKey) {
        return NextResponse.json({ 
          success: false, 
          message: "API Key do Abacus não configurada" 
        }, { status: 400 });
      }

      const response = await fetch("https://api.abacus.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${abacusApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: "Diga 'OK' se você está funcionando." }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ 
          success: true, 
          message: `Conexão com Abacus AI bem sucedida! Resposta: ${data.choices?.[0]?.message?.content || 'OK'}` 
        });
      } else {
        const error = await response.text();
        return NextResponse.json({ 
          success: false, 
          message: `Erro na API Abacus: ${error}` 
        }, { status: 400 });
      }
    }

    if (provider === 'chatgpt') {
      if (!apiKey) {
        return NextResponse.json({ 
          success: false, 
          message: "API Key do OpenAI não fornecida" 
        }, { status: 400 });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Diga 'OK' se você está funcionando." }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ 
          success: true, 
          message: `Conexão com ChatGPT bem sucedida! Resposta: ${data.choices?.[0]?.message?.content || 'OK'}` 
        });
      } else {
        const error = await response.json();
        return NextResponse.json({ 
          success: false, 
          message: `Erro na API OpenAI: ${error.error?.message || 'Erro desconhecido'}` 
        }, { status: 400 });
      }
    }

    if (provider === 'gemini') {
      if (!apiKey) {
        return NextResponse.json({ 
          success: false, 
          message: "API Key do Gemini não fornecida" 
        }, { status: 400 });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Diga 'OK' se você está funcionando." }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
        return NextResponse.json({ 
          success: true, 
          message: `Conexão com Gemini bem sucedida! Resposta: ${text}` 
        });
      } else {
        const error = await response.json();
        return NextResponse.json({ 
          success: false, 
          message: `Erro na API Gemini: ${error.error?.message || 'Erro desconhecido'}` 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: "Provedor não reconhecido" 
    }, { status: 400 });

  } catch (error: any) {
    console.error("AI test connection error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Erro interno ao testar conexão" 
    }, { status: 500 });
  }
}
