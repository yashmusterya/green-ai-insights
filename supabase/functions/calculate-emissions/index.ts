import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Carbon intensity values by cloud region (gCO2/kWh)
const CARBON_INTENSITY: Record<string, number> = {
  'us-west-1': 350,      // California
  'us-east-1': 450,      // Virginia
  'eu-west-1': 280,      // Ireland
  'eu-central-1': 420,   // Germany
  'ap-southeast-1': 700, // Singapore
  'ap-northeast-1': 550, // Tokyo
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelName, tokens, gpuType, cloudRegion } = await req.json();

    console.log('Calculating emissions for:', { modelName, tokens, gpuType, cloudRegion });

    // Get carbon intensity
    const carbonIntensity = CARBON_INTENSITY[cloudRegion] || 450;
    
    // Get base energy consumption
    const baseEnergy = MODEL_ENERGY[modelName] || 0.25;
    
    // Calculate total energy in kWh
    const energyKwh = (tokens / 1_000_000) * baseEnergy;
    
    // Calculate CO2 in kg
    const co2Kg = (energyKwh * carbonIntensity) / 1000;
    
    // Calculate sustainability score (0-100)
    const maxCo2 = 0.5; // Maximum expected CO2 for scoring
    const sustainabilityScore = Math.max(0, Math.min(100, Math.round((1 - (co2Kg / maxCo2)) * 100)));

    // Store calculation in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: calculation, error: dbError } = await supabase
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
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});