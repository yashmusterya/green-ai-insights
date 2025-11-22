import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, TrendingDown, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Optimizer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleOptimize = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter a prompt to optimize",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-prompt", {
        body: { prompt },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Optimization Complete",
        description: `Saved ${data.tokensSaved} tokens and ${data.co2SavedKg.toFixed(6)} kg CO₂`,
      });
    } catch (error: any) {
      console.error("Optimization error:", error);
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.optimizedPrompt) {
      await navigator.clipboard.writeText(result.optimizedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Optimized prompt copied to clipboard",
      });
    }
  };

  const savingsPercent = result ? Math.round((result.tokensSaved / result.originalTokens) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Prompt Optimizer</h2>
        <p className="text-muted-foreground">Reduce token usage and emissions with AI-powered optimization</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Original Prompt
            </CardTitle>
            <CardDescription>Enter your prompt to optimize for efficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your AI prompt here. The optimizer will make it more concise while preserving meaning..."
              className="min-h-[200px] resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            {result && (
              <div className="text-sm text-muted-foreground">
                Tokens: <span className="font-semibold text-foreground">{result.originalTokens}</span>
              </div>
            )}
            <Button onClick={handleOptimize} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2 h-4 w-4" />
              Optimize Prompt
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        {result && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Optimized Prompt
                </span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {savingsPercent}% reduction
                </Badge>
              </CardTitle>
              <CardDescription>AI-optimized for efficiency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg min-h-[200px] text-sm relative">
                <p className="whitespace-pre-wrap">{result.optimizedPrompt}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Tokens</div>
                  <div className="font-semibold text-primary">{result.optimizedTokens}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Tokens Saved</div>
                  <div className="font-semibold text-eco-blue">{result.tokensSaved}</div>
                </div>
              </div>
              <Card className="bg-eco-green/5 border-eco-green/20">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-eco-green">
                      {result.co2SavedKg.toFixed(6)} kg CO₂
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Carbon emissions saved</div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}