import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Activity, Award, Lightbulb } from "lucide-react";

const uspItems = [
  {
    icon: Sparkles,
    title: "Carbon-Aware Prompt Optimization",
    description: "Reduce token waste and CO₂ emissions instantly.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Activity,
    title: "Real-Time Emission Tracking",
    description: "Monitor AI energy + carbon footprint on every request.",
    color: "text-eco-blue",
    bgColor: "bg-eco-blue/10",
  },
  {
    icon: Award,
    title: "Sustainability Intelligence Score",
    description: "A unified 0–100 rating for any AI workload.",
    color: "text-eco-lime",
    bgColor: "bg-eco-lime/10",
  },
  {
    icon: Lightbulb,
    title: "AI-Powered Carbon Reduction Suggestions",
    description: "Smart recommendations that cut energy use by up to 60%.",
    color: "text-eco-yellow",
    bgColor: "bg-eco-yellow/10",
  },
];

export function USPSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Why Sustainify AI?</h3>
        <p className="text-muted-foreground">Leading the future of responsible AI development</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {uspItems.map((item) => (
          <Card
            key={item.title}
            className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
          >
            <CardHeader className="space-y-3">
              <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}