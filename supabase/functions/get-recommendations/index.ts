import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Input validation
function validateInput(data: unknown): { 
  valid: boolean; 
  error?: string; 
  parsed?: { calculationId: string; modelName: string; tokens: number; cloudRegion: string; co2Kg: number } 
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { calculationId, modelName, tokens, cloudRegion, co2Kg } = data as Record<string, unknown>;

  // Validate calculationId (must be valid UUID)
  if (typeof calculationId !== 'string' || !UUID_REGEX.test(calculationId)) {
    return { valid: false, error: 'calculationId must be a valid UUID' };
  }

  // Validate modelName
  if (typeof modelName !== 'string' || modelName.length === 0 || modelName.length > 100) {
    return { valid: false, error: 'Model name must be a non-empty string (max 100 characters)' };
  }

  // Validate tokens
  if (typeof tokens !== 'number' || !Number.isFinite(tokens) || tokens < 1 || tokens > 1_000_000_000) {
    return { valid: false, error: 'Tokens must be a positive number between 1 and 1,000,000,000' };
  }

  // Validate cloudRegion
  if (typeof cloudRegion !== 'string' || cloudRegion.length === 0 || cloudRegion.length > 50) {
    return { valid: false, error: 'Cloud region must be a non-empty string (max 50 characters)' };
  }

  // Validate co2Kg
  if (typeof co2Kg !== 'number' || !Number.isFinite(co2Kg) || co2Kg < 0 || co2Kg > 1000) {
    return { valid: false, error: 'co2Kg must be a non-negative number up to 1000' };
  }

  // Sanitize string inputs
  const sanitizedModelName = modelName.replace(/[^a-zA-Z0-9-_.]/g, '').slice(0, 100);
  const sanitizedCloudRegion = cloudRegion.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50);

  return { 
    valid: true, 
    parsed: { 
      calculationId, 
      modelName: sanitizedModelName, 
      tokens: Math.floor(tokens), 
      cloudRegion: sanitizedCloudRegion, 
      co2Kg 
    } 
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate user with getUser
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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

    const { calculationId, modelName, tokens, cloudRegion, co2Kg } = validation.parsed;

    console.log('Generating recommendations for calculation:', calculationId, 'userId:', userId);

    // Verify the calculation belongs to the user
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: calculation, error: calcError } = await supabaseAdmin
      .from('calculations')
      .select('user_id')
      .eq('id', calculationId)
      .single();

    if (calcError || !calculation) {
      return new Response(JSON.stringify({ error: 'Calculation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership
    if (calculation.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context for AI
    const context = `Model: ${modelName}, Tokens: ${tokens}, Region: ${cloudRegion}, CO2: ${co2Kg} kg`;

    // Call Lovable AI to generate smart recommendations
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
            content: 'You are a sustainability expert for AI systems. Generate 3-5 specific, actionable recommendations to reduce carbon emissions for this AI workload. For each recommendation, provide: type (model_optimization, infrastructure, batching, or region), title (short), description (1-2 sentences), estimated reduction percentage (realistic number 5-40), and priority (high/medium/low). Return ONLY valid JSON array format.',
          },
          {
            role: 'user',
            content: `Generate carbon reduction recommendations for this AI workload: ${context}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    // Parse AI response
    let recommendations;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response, using fallback recommendations');
      recommendations = [
        {
          type: 'model_optimization',
          title: 'Switch to Smaller Model',
          description: 'Use a more efficient model variant that can handle your use case with lower computational requirements.',
          estimated_reduction_percent: 35,
          priority: 'high',
        },
        {
          type: 'infrastructure',
          title: 'Move to Low-Carbon Region',
          description: 'Deploy your workload in regions with renewable energy sources like EU-West-1 (Ireland).',
          estimated_reduction_percent: 25,
          priority: 'high',
        },
        {
          type: 'batching',
          title: 'Implement Request Batching',
          description: 'Process multiple requests together to reduce overhead and improve GPU utilization.',
          estimated_reduction_percent: 15,
          priority: 'medium',
        },
      ];
    }

    // Validate and sanitize recommendations before storing
    const sanitizedRecommendations = recommendations.slice(0, 5).map((rec: Record<string, unknown>) => ({
      calculation_id: calculationId,
      recommendation_type: String(rec.type || 'general').slice(0, 50).replace(/[^a-zA-Z0-9-_]/g, ''),
      title: String(rec.title || 'Recommendation').slice(0, 200),
      description: String(rec.description || '').slice(0, 1000),
      estimated_reduction_percent: Math.min(100, Math.max(0, Number(rec.estimated_reduction_percent) || 0)),
      priority: ['high', 'medium', 'low'].includes(String(rec.priority)) ? String(rec.priority) : 'medium',
    }));

    const { error: dbError } = await supabaseAdmin
      .from('recommendations')
      .insert(sanitizedRecommendations);

    if (dbError) {
      console.error('Database error:', dbError);
    }

    console.log('Recommendations generated:', sanitizedRecommendations.length);

    return new Response(JSON.stringify({ recommendations: sanitizedRecommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-recommendations:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
