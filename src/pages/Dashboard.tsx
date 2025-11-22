import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Leaf, Zap, TrendingDown, Award } from "lucide-react";
import { USPSection } from "@/components/USPSection";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalculations: 0,
    totalCO2: 0,
    avgScore: 0,
    totalEnergy: 0,
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [modelData, setModelData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: calculations, error } = await supabase
        .from("calculations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        toast({
          title: "Error Loading Data",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (calculations && calculations.length > 0) {
        const totalCO2 = calculations.reduce((sum, c) => sum + Number(c.co2_kg), 0);
        const totalEnergy = calculations.reduce((sum, c) => sum + Number(c.energy_kwh), 0);
        const avgScore = Math.round(
          calculations.reduce((sum, c) => sum + c.sustainability_score, 0) / calculations.length
        );

        setStats({
          totalCalculations: calculations.length,
          totalCO2: Number(totalCO2.toFixed(3)),
          avgScore,
          totalEnergy: Number(totalEnergy.toFixed(3)),
        });

        const trend = calculations
          .slice(0, 7)
          .reverse()
          .map((c) => ({
            date: new Date(c.created_at).toLocaleDateString(),
            co2: Number(c.co2_kg),
            energy: Number(c.energy_kwh),
          }));
        setTrendData(trend);

        const modelMap = new Map();
        calculations.forEach((c) => {
          const existing = modelMap.get(c.model_name) || { name: c.model_name, co2: 0, count: 0 };
          modelMap.set(c.model_name, {
            name: c.model_name,
            co2: existing.co2 + Number(c.co2_kg),
            count: existing.count + 1,
          });
        });
        setModelData(Array.from(modelMap.values()).slice(0, 5));

        const regionMap = new Map();
        calculations.forEach((c) => {
          const existing = regionMap.get(c.cloud_region) || { name: c.cloud_region, value: 0 };
          regionMap.set(c.cloud_region, {
            name: c.cloud_region,
            value: existing.value + Number(c.co2_kg),
          });
        });
        setRegionData(Array.from(regionMap.values()));
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--eco-blue))', 'hsl(var(--accent))', 'hsl(var(--eco-yellow))', 'hsl(var(--secondary))'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Monitor your AI sustainability metrics in real-time</p>
      </div>

      <USPSection />

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calculations</CardTitle>
                <Leaf className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCalculations}</div>
                <p className="text-xs text-muted-foreground">AI workloads analyzed</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-eco-blue hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CO₂ Emissions</CardTitle>
                <TrendingDown className="h-4 w-4 text-eco-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-eco-blue">{stats.totalCO2} kg</div>
                <p className="text-xs text-muted-foreground">Total carbon footprint</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Energy Usage</CardTitle>
                <Zap className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.totalEnergy} kWh</div>
                <p className="text-xs text-muted-foreground">Total consumption</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                <Award className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{stats.avgScore}/100</div>
                <p className="text-xs text-muted-foreground">
                  {stats.avgScore >= 80
                    ? "Excellent"
                    : stats.avgScore >= 60
                    ? "Good"
                    : stats.avgScore >= 40
                    ? "Fair"
                    : "Needs Improvement"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Emission Trends</CardTitle>
                <CardDescription>CO₂ and energy over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="co2" stroke="hsl(var(--primary))" name="CO₂ (kg)" strokeWidth={2} />
                    <Line type="monotone" dataKey="energy" stroke="hsl(var(--eco-blue))" name="Energy (kWh)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Model Comparison</CardTitle>
                <CardDescription>CO₂ emissions by AI model</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={modelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="co2" fill="hsl(var(--primary))" name="CO₂ (kg)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Carbon Intensity by Region</CardTitle>
              <CardDescription>Distribution of emissions across cloud regions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}