import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Newspaper, Rocket, Globe, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type NewsItem = {
    id: string;
    title: string;
    category: "product" | "industry" | "research" | "alert";
    timestamp: Date;
    link?: string;
    summary: string;
};

const MOCK_NEWS: NewsItem[] = [
    {
        id: "1",
        title: "Sustainify AI v1.2 Released",
        category: "product",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        summary: "New dashboard features and improved calculation accuracy for Llama 3 models.",
    },
    {
        id: "2",
        title: "EU AI Act: Energy Transparency Mandates",
        category: "industry",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        summary: "New regulations require foundation model providers to disclose detailed energy consumption metrics.",
    },
    {
        id: "3",
        title: "Research: Quantization Reduces Energy by 40%",
        category: "research",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        summary: "Latest paper from Green AI Lab demonstrates significant efficiency gains with 4-bit quantization.",
    },
    {
        id: "4",
        title: "Grid Alert: High Carbon Intensity in US-East",
        category: "alert",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        summary: "Current grid mix is coal-heavy. Recommend shifting non-urgent workloads to EU-North.",
    },
    {
        id: "5",
        title: "New Partnership with CleanCompute",
        category: "product",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        summary: "We are partnering to provide certified green cloud credits for AI workloads.",
    },
];

export function NewsFeed() {
    const [items, setItems] = useState<NewsItem[]>(MOCK_NEWS);

    // Simulate "auto-update" by adding a new item periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const newUpdate: NewsItem = {
                id: Date.now().toString(),
                title: "Live Update: Grid Intensity Change",
                category: "alert",
                timestamp: new Date(),
                summary: "Renewable energy mix in your preferred region has just increased to 65%.",
            };

            setItems((prev) => [newUpdate, ...prev]);
        }, 3000000); // Add fake update every 5 seconds for demo (ok 3000 actually 3 seconds, let's do 30s or on mount maybe?) 
        // actually user said "auto update", let's simulate a live feel.
        // 30 seconds is good.
        return () => clearInterval(interval);
    }, []);

    const getIcon = (category: string) => {
        switch (category) {
            case "product": return <Rocket className="h-4 w-4 text-primary" />;
            case "industry": return <Globe className="h-4 w-4 text-blue-500" />;
            case "research": return <Newspaper className="h-4 w-4 text-purple-500" />;
            case "alert": return <Bell className="h-4 w-4 text-amber-500" />;
            default: return <Bell className="h-4 w-4" />;
        }
    };

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 h-full flex flex-col">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Live Updates
                    </CardTitle>
                    <Badge variant="outline" className="animate-pulse bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Live
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-4 group">
                                <div className="mt-1 relative">
                                    <div className="absolute top-4 bottom-[-24px] left-1/2 w-px bg-border group-last:hidden"></div>
                                    <div className="relative z-10 p-1.5 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                        {getIcon(item.category)}
                                    </div>
                                </div>
                                <div className="flex-1 pb-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            {item.category}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-medium leading-none mb-1.5 group-hover:text-primary transition-colors cursor-pointer">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {item.summary}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
