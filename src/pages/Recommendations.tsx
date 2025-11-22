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

    if (data) {
      setRecommendations(data);
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