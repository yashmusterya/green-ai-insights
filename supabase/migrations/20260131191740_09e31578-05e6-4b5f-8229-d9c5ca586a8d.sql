-- Drop existing public access policies
DROP POLICY IF EXISTS "Allow public insert to prompts" ON public.prompts;
DROP POLICY IF EXISTS "Allow public read access to prompts" ON public.prompts;
DROP POLICY IF EXISTS "Allow public insert to calculations" ON public.calculations;
DROP POLICY IF EXISTS "Allow public read access to calculations" ON public.calculations;
DROP POLICY IF EXISTS "Allow public insert to recommendations" ON public.recommendations;
DROP POLICY IF EXISTS "Allow public read access to recommendations" ON public.recommendations;

-- Create user-scoped RLS policies for prompts
CREATE POLICY "Users can view their own prompts" 
ON public.prompts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts" 
ON public.prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create user-scoped RLS policies for calculations
CREATE POLICY "Users can view their own calculations" 
ON public.calculations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculations" 
ON public.calculations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create user-scoped RLS policies for recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.recommendations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.calculations 
    WHERE calculations.id = recommendations.calculation_id 
    AND calculations.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert recommendations" 
ON public.recommendations 
FOR INSERT 
WITH CHECK (true);