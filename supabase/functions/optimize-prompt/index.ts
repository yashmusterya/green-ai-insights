import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Maximum prompt length (10KB)
const MAX_PROMPT_LENGTH = 10000;

// Input validation
function validateInput(data: unknown): {
  valid: boolean;
  error?: string;
  parsed?: { prompt: string }
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { prompt } = data as Record<string, unknown>;

  // Validate prompt
  if (typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a string' };
  }

  if (prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` };
  }

  return {
    valid: true,
    parsed: { prompt: prompt.trim() }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Parse and validate input
    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.valid || !validation.parsed) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt } = validation.parsed;

    console.log('Optimizing prompt, length:', prompt.length, 'userId:', userId);

    // Count original tokens (rough estimate: 1 token ≈ 4 characters)
    const originalTokens = Math.ceil(prompt.length / 4);

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini AI to optimize the prompt
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a prompt optimization expert. Rewrite the user's prompt to be more concise and efficient while preserving its exact meaning and intent. Remove redundancy, use precise language, and maintain all key information. Return ONLY the optimized prompt, nothing else.\n\nUser Prompt:\n${prompt}`
          }]
        }]
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text());
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    // Parse Gemini response
    const optimizedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!optimizedPrompt) {
      throw new Error("No response from AI");
    }

    const optimizedTokens = Math.ceil(optimizedPrompt.length / 4);
    const tokensSaved = originalTokens - optimizedTokens;

    // Estimate CO2 saved (using average of 0.25 kWh per 1M tokens and 450 gCO2/kWh)
    const co2SavedKg = (tokensSaved / 1_000_000) * 0.25 * 450 / 1000;

    // Use service role key for database insert
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabaseAdmin
      .from('prompts')
      .insert({
        original_prompt: prompt,
        original_tokens: originalTokens,
        optimized_prompt: optimizedPrompt,
        optimized_tokens: optimizedTokens,
        tokens_saved: tokensSaved,
        co2_saved_kg: co2SavedKg,
        user_id: userId,
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    console.log('Optimization complete:', { originalTokens, optimizedTokens, tokensSaved });

    return new Response(JSON.stringify({
      originalPrompt: prompt,
      optimizedPrompt,
      originalTokens,
      optimizedTokens,
      tokensSaved,
      co2SavedKg,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in optimize-prompt:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
