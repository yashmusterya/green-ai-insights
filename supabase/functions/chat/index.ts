import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract history and last message
    // Gemini history format: { role: 'user' | 'model', parts: [{ text: string }] }
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const lastMessage = messages[messages.length - 1];

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: {
        parts: [{
          text: `You are SustainAI-IQ's helpful assistant, an expert in AI sustainability and carbon emissions. You help users:
- Understand AI carbon footprints and how they're calculated
- Optimize their AI prompts for efficiency
- Choose more sustainable AI models and cloud regions
- Implement best practices for green AI

Keep answers clear, concise, and actionable. Use markdown formatting for better readability.` }]
      }
    });

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    // Create a stream that transforms Gemini chunks to OpenAI SSE format
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              // Format as OpenAI delta
              const sseData = JSON.stringify({
                choices: [{
                  delta: { content: chunkText }
                }]
              });
              controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          console.error("Stream error:", e);
          const errorData = JSON.stringify({ error: "Stream failed" });
          try {
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } catch (ignore) { }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
