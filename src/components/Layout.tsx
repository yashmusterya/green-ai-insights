import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { CustomCursor } from "./CustomCursor";
import { Leaf } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomCursor />
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-eco-blue shadow-md">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-eco-blue bg-clip-text text-transparent">
                  Sustainify AI
                </h1>
                <p className="text-xs text-muted-foreground">Intelligence with a Lighter Carbon Footprint</p>
              </div>
            </div>
            <ThemeToggle />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border py-4 px-6 text-center text-sm text-muted-foreground bg-card/30 backdrop-blur-sm">
            <p>© 2025 Sustainify AI — Intelligence with a Lighter Carbon Footprint</p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}