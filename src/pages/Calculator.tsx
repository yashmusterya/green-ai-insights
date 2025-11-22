import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Leaf, Zap, CloudRain, Award } from "lucide-react";

export default function Calculator() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    modelName: "",
    tokens: "",
    gpuType: "",
    cloudRegion: "",
  });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = async () => {
    if (!formData.modelName || !formData.tokens || !formData.cloudRegion) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-emissions", {
        body: {
          modelName: formData.modelName,
          tokens: parseInt(formData.tokens),
          gpuType: formData.gpuType,
          cloudRegion: formData.cloudRegion,
        },
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "✅ Calculation Complete",
        description: "Your emissions have been calculated successfully",
      });
    } catch (error: any) {
      console.error("Calculation error:", error);
      toast({
        title: "❌ Calculation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Emissions Calculator</h2>
        <p className="text-muted-foreground">Calculate the carbon footprint of your AI workloads</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Workload Details</CardTitle>
          <CardDescription>Enter your AI model and infrastructure information</CardDescription>
        </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelName">AI Model *</Label>
              <Select value={formData.modelName} onValueChange={(value) => setFormData({ ...formData, modelName: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  <SelectItem value="llama-2-70b">Llama 2 70B</SelectItem>
                  <SelectItem value="mistral-large">Mistral Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokens">Number of Tokens *</Label>
              <Input
                id="tokens"
                type="number"
                placeholder="e.g., 1000000"
                value={formData.tokens}
                onChange={(e) => setFormData({ ...formData, tokens: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpuType">GPU Type (Optional)</Label>
              <Input
                id="gpuType"
                placeholder="e.g., A100, V100"
                value={formData.gpuType}
                onChange={(e) => setFormData({ ...formData, gpuType: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudRegion">Cloud Region *</Label>
              <Select value={formData.cloudRegion} onValueChange={(value) => setFormData({ ...formData, cloudRegion: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-west-1">US West (California)</SelectItem>
                  <SelectItem value="us-east-1">US East (Virginia)</SelectItem>
                  <SelectItem value="eu-west-1">EU West (Ireland)</SelectItem>
                  <SelectItem value="eu-central-1">EU Central (Germany)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                  <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCalculate} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Calculate Emissions
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CO₂ Emissions</CardTitle>
                <Leaf className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{results.co2Kg.toFixed(4)} kg</div>
                <p className="text-xs text-muted-foreground mt-1">Carbon dioxide equivalent</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-eco-blue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Energy Consumption</CardTitle>
                <Zap className="h-4 w-4 text-eco-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-eco-blue">{results.energyKwh.toFixed(6)} kWh</div>
                <p className="text-xs text-muted-foreground mt-1">Kilowatt-hours consumed</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-eco-yellow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carbon Intensity</CardTitle>
                <CloudRain className="h-4 w-4 text-eco-yellow" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-eco-yellow">{results.carbonIntensity} g/kWh</div>
                <p className="text-xs text-muted-foreground mt-1">Regional carbon intensity</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sustainability Score</CardTitle>
                <Award className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{results.sustainabilityScore}/100</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {results.sustainabilityScore >= 80
                    ? "Excellent"
                    : results.sustainabilityScore >= 60
                    ? "Good"
                    : results.sustainabilityScore >= 40
                    ? "Fair"
                    : "Needs Improvement"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}