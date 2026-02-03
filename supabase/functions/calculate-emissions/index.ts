import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Carbon intensity values by cloud region (gCO2/kWh)
const CARBON_INTENSITY: Record<string, number> = {
  'us-west-1': 350,
  'us-east-1': 450,
  'eu-west-1': 280,
  'eu-central-1': 420,
  'ap-southeast-1': 700,
  'ap-northeast-1': 550,
};

// Energy consumption per token by model type (kWh per 1M tokens)
const MODEL_ENERGY: Record<string, number> = {
  'gpt-4': 0.47,
  'gpt-3.5-turbo': 0.06,
  'claude-3-opus': 0.45,
  'claude-3-sonnet': 0.15,
  'gemini-pro': 0.12,
  'llama-2-70b': 0.35,
  'mistral-large': 0.28,
};

// Input validation
function validateInput(data: unknown): { 
  valid: boolean; 
  error?: string; 
  parsed?: { modelName: string; tokens: number; gpuType: string; cloudRegion: string } 
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { modelName, tokens, gpuType, cloudRegion } = data as Record<string, unknown>;

  // Validate modelName
  if (typeof modelName !== 'string' || modelName.length === 0 || modelName.length > 100) {
    return { valid: false, error: 'Model name must be a non-empty string (max 100 characters)' };
  }

  // Validate tokens
  if (typeof tokens !== 'number' || !Number.isFinite(tokens) || tokens < 1 || tokens > 1_000_000_000) {
    return { valid: false, error: 'Tokens must be a positive integer between 1 and 1,000,000,000' };
  }

  // Validate gpuType (optional but sanitize)
  const sanitizedGpuType = typeof gpuType === 'string' ? gpuType.slice(0, 50).replace(/[^a-zA-Z0-9-_]/g, '') : '';

  // Validate cloudRegion
  if (typeof cloudRegion !== 'string' || cloudRegion.length === 0 || cloudRegion.length > 50) {
    return { valid: false, error: 'Cloud region must be a non-empty string (max 50 characters)' };
  }

  // Sanitize modelName (allow only safe characters)
  const sanitizedModelName = modelName.replace(/[^a-zA-Z0-9-_.]/g, '').slice(0, 100);
  const sanitizedCloudRegion = cloudRegion.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50);

  return { 
    valid: true, 
    parsed: { 
      modelName: sanitizedModelName, 
      tokens: Math.floor(tokens), 
      gpuType: sanitizedGpuType, 
      cloudRegion: sanitizedCloudRegion 
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

    const token = authHeader.replace('Bearer ', '').trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate user with getUser (Lovable Cloud requires passing token explicitly)
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

    const { modelName, tokens, gpuType, cloudRegion } = validation.parsed;

    console.log('Calculating emissions for:', { modelName, tokens, gpuType, cloudRegion, userId });

    // Get carbon intensity (use default if region not in list)
    const carbonIntensity = CARBON_INTENSITY[cloudRegion] || 450;
    
    // Get base energy consumption (use default if model not in list)
    const baseEnergy = MODEL_ENERGY[modelName] || 0.25;
    
    // Calculate total energy in kWh
    const energyKwh = (tokens / 1_000_000) * baseEnergy;
    
    // Calculate CO2 in kg
    const co2Kg = (energyKwh * carbonIntensity) / 1000;
    
    // Calculate sustainability score (0-100)
    const maxCo2 = 0.5;
    const sustainabilityScore = Math.max(0, Math.min(100, Math.round((1 - (co2Kg / maxCo2)) * 100)));

    // Use service role key for database insert
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: calculation, error: dbError } = await supabaseAdmin
      .from('calculations')
      .insert({
        model_name: modelName,
        tokens,
        gpu_type: gpuType,
        cloud_region: cloudRegion,
        carbon_intensity: carbonIntensity,
        energy_kwh: energyKwh,
        co2_kg: co2Kg,
        sustainability_score: sustainabilityScore,
        user_id: userId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to save calculation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calculation stored:', calculation.id);

    return new Response(JSON.stringify({
      calculationId: calculation.id,
      energyKwh,
      co2Kg,
      sustainabilityScore,
      carbonIntensity,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calculate-emissions:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
