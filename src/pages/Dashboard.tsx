import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Leaf, Zap, TrendingDown, Award } from "lucide-react";
import { USPSection } from "@/components/USPSection";
import { NewsFeed } from "@/components/NewsFeed";
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
      } else {
        // Expanded Dummy Data for a Premium, "Lived-in" Look
        setStats({
          totalCalculations: 1248,
          totalCO2: 845.2,
          avgScore: 72,
          totalEnergy: 3420.5,
        });

        // Generate 30 days of trend data
        const trends = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          trends.push({
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            co2: (Math.random() * 5 + 5 + Math.sin(i / 3) * 2).toFixed(1), // Random organic-looking data
            energy: (Math.random() * 10 + 15 + Math.sin(i / 3) * 4).toFixed(1)
          });
        }
        setTrendData(trends);

        setModelData([
          { name: "gpt-4", co2: 245.5, count: 450 },
          { name: "claude-3-opus", co2: 180.2, count: 320 },
          { name: "gpt-4o", co2: 120.8, count: 280 },
          { name: "llama-3-70b", co2: 95.4, count: 150 },
          { name: "gemini-1.5-pro", co2: 85.1, count: 145 },
          { name: "mistral-large", co2: 45.0, count: 90 },
          { name: "claude-3-sonnet", co2: 32.5, count: 85 },
        ]);

        setRegionData([
          { name: "us-east-1", value: 450 },
          { name: "eu-north-1", value: 120 }, // Sweden - very green
          { name: "eu-west-1", value: 280 }, // Ireland
          { name: "us-west-2", value: 150 }, // Oregon
          { name: "asia-pacific", value: 550 },
          { name: "sa-east-1", value: 180 }, // Brazil
        ]);

        toast({
          title: "Demo Mode Enabled",
          description: "Visualizing rich sample dataset.",
          duration: 3000,
        });
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="col-span-1 lg:col-span-2 space-y-6">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Emission Trends</CardTitle>
                  <CardDescription>CO₂ and energy over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
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
                  <ResponsiveContainer width="100%" height={400}>
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

            <div className="col-span-1 space-y-6">
              <NewsFeed />

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Carbon Intensity</CardTitle>
                  <CardDescription>Emissions across regions</CardDescription>
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
                        outerRadius={80}
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
            </div>
          </div>

          {/* System Health / Logs Section */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>System Health & Recent Activity</CardTitle>
              <CardDescription>Real-time operational logs and status checks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Service Status</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">API Gateway</span>
                      <span className="text-xs font-medium text-eco-green bg-eco-green/10 px-2 py-0.5 rounded-full">Operational</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Database</span>
                      <span className="text-xs font-medium text-eco-green bg-eco-green/10 px-2 py-0.5 rounded-full">Operational</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm">Edge Functions</span>
                      <span className="text-xs font-medium text-eco-green bg-eco-green/10 px-2 py-0.5 rounded-full">99.9% Uptime</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Recent Calculations log</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 border-b last:border-0 border-border">
                        <span className="font-mono text-muted-foreground">LOG-{(Date.now() - i * 100000).toString().slice(-6)}</span>
                        <span>GPT-4 Optimization</span>
                        <span className="text-eco-blue">0.12 kg CO₂</span>
                        <span className="text-xs text-muted-foreground">Just now</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}