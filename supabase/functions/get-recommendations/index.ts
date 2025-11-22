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
    const { calculationId, modelName, tokens, cloudRegion, co2Kg } = await req.json();

    console.log('Generating recommendations for calculation:', calculationId);

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
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    // Parse AI response
    let recommendations;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response, using fallback recommendations');
      // Fallback recommendations
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

    // Store recommendations in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const recommendationsToInsert = recommendations.map((rec: any) => ({
      calculation_id: calculationId,
      recommendation_type: rec.type,
      title: rec.title,
      description: rec.description,
      estimated_reduction_percent: rec.estimated_reduction_percent,
      priority: rec.priority,
    }));

    const { error: dbError } = await supabase
      .from('recommendations')
      .insert(recommendationsToInsert);

    if (dbError) {
      console.error('Database error:', dbError);
    }

    console.log('Recommendations generated:', recommendations.length);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-recommendations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});