-- Drop the overly permissive insert policy for recommendations
DROP POLICY IF EXISTS "Service role can insert recommendations" ON public.recommendations;

-- Create a more restrictive policy - service role bypasses RLS anyway
-- For recommendations, we allow insert only if user owns the related calculation
CREATE POLICY "Users can insert recommendations for their calculations" 
ON public.recommendations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.calculations 
    WHERE calculations.id = recommendations.calculation_id 
    AND calculations.user_id = auth.uid()
  )
);