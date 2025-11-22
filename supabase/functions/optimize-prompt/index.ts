import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    console.log('Optimizing prompt, length:', prompt.length);

    // Count original tokens (rough estimate: 1 token ≈ 4 characters)
    const originalTokens = Math.ceil(prompt.length / 4);

    // Call Lovable AI to optimize the prompt
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a prompt optimization expert. Rewrite the user\'s prompt to be more concise and efficient while preserving its exact meaning and intent. Remove redundancy, use precise language, and maintain all key information. Return ONLY the optimized prompt, nothing else.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const optimizedPrompt = data.choices[0].message.content.trim();
    const optimizedTokens = Math.ceil(optimizedPrompt.length / 4);
    const tokensSaved = originalTokens - optimizedTokens;

    // Estimate CO2 saved (using average of 0.25 kWh per 1M tokens and 450 gCO2/kWh)
    const co2SavedKg = (tokensSaved / 1_000_000) * 0.25 * 450 / 1000;

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('prompts')
      .insert({
        original_prompt: prompt,
        original_tokens: originalTokens,
        optimized_prompt: optimizedPrompt,
        optimized_tokens: optimizedTokens,
        tokens_saved: tokensSaved,
        co2_saved_kg: co2SavedKg,
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});