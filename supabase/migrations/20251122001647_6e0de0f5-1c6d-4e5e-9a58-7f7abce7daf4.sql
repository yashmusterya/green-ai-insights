-- Create calculations table to store emission calculations
CREATE TABLE public.calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  model_name TEXT NOT NULL,
  tokens BIGINT NOT NULL,
  gpu_type TEXT,
  cloud_region TEXT NOT NULL,
  carbon_intensity DECIMAL(10, 4) NOT NULL,
  energy_kwh DECIMAL(10, 6) NOT NULL,
  co2_kg DECIMAL(10, 6) NOT NULL,
  sustainability_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompts table to store prompt optimizations
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  original_prompt TEXT NOT NULL,
  original_tokens INTEGER NOT NULL,
  optimized_prompt TEXT NOT NULL,
  optimized_tokens INTEGER NOT NULL,
  tokens_saved INTEGER NOT NULL,
  co2_saved_kg DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recommendations table to store AI suggestions
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calculation_id UUID REFERENCES public.calculations(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_reduction_percent INTEGER NOT NULL,
  priority TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (making tables publicly accessible for demo purposes)
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Create public access policies for demo (allow anyone to read/write)
CREATE POLICY "Allow public read access to calculations"
ON public.calculations FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to calculations"
ON public.calculations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public read access to prompts"
ON public.prompts FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to prompts"
ON public.prompts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public read access to recommendations"
ON public.recommendations FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to recommendations"
ON public.recommendations FOR INSERT
WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_calculations_created_at ON public.calculations(created_at DESC);
CREATE INDEX idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX idx_recommendations_calculation_id ON public.recommendations(calculation_id);