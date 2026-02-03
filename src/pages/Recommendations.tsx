import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingDown, Server, Zap, MapPin } from "lucide-react";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    const { data } = await supabase
      .from("recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      setRecommendations(data);
    } else {
      // Dummy data for demonstration
      setRecommendations([
        {
          id: "1",
          title: "Switch to Gemini Flash",
          description: "Use Gemini 1.5 Flash instead of Pro for tasks requiring lower reasoning but high speed. It consumes significantly less energy per token.",
          recommendation_type: "model_optimization",
          priority: "high",
          estimated_reduction_percent: 45,
        },
        {
          id: "2",
          title: "Migrate to Sweden (eu-north-1)",
          description: "Your current workload is in us-east-1. Moving to eu-north-1, which uses 100% renewable energy, would drastically cut carbon footprint.",
          recommendation_type: "infrastructure",
          priority: "high",
          estimated_reduction_percent: 60,
        },
        {
          id: "3",
          title: "Implement Token Caching",
          description: "Cache common prompts and responses to avoid redundant computation.",
          recommendation_type: "batching",
          priority: "medium",
          estimated_reduction_percent: 25,
        },
        {
          id: "4",
          title: "Use Quantized Models",
          description: "Deploying 8-bit quantized versions of your models can reduce memory bandwidth and energy usage with minimal accuracy loss.",
          recommendation_type: "model_optimization",
          priority: "medium",
          estimated_reduction_percent: 30,
        },
        {
          id: "5",
          title: "Batch Processing for Non-Urgent Tasks",
          description: "Queue requests and process them in batches during off-peak hours when grid carbon intensity is lower.",
          recommendation_type: "batching",
          priority: "low",
          estimated_reduction_percent: 15,
        },
      ]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "model_optimization":
        return <Server className="h-5 w-5" />;
      case "infrastructure":
        return <MapPin className="h-5 w-5" />;
      case "batching":
        return <Zap className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Recommendations</h2>
        <p className="text-muted-foreground">Smart suggestions to reduce your carbon footprint</p>
      </div>

      {recommendations.length === 0 ? (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations yet. Calculate some emissions first to get personalized suggestions!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {getIcon(rec.recommendation_type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                      <CardDescription className="text-sm">{rec.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(rec.priority)} className="shrink-0">
                    {rec.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-eco-green" />
                  <span className="font-semibold text-eco-green">
                    {rec.estimated_reduction_percent}% reduction
                  </span>
                  <span className="text-muted-foreground">potential</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}