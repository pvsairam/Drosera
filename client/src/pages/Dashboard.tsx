import { useQuery } from "@tanstack/react-query";
import { MultiChainPriceGrid } from "@/components/MultiChainPriceGrid";
import { AlertPanel } from "@/components/AlertPanel";
import { ChainStatusBar } from "@/components/ChainStatusBar";
import { LiveIndicator } from "@/components/LiveIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, PlayCircle, Github } from "lucide-react";
import { Link } from "wouter";
import type { MultiChainPrice, Incident, ChainStatus } from "@shared/schema";

export default function Dashboard() {
  const { data: pricesData, isLoading: pricesLoading } = useQuery<MultiChainPrice[]>({
    queryKey: ['/api/prices'],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: incidentsData } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
    refetchInterval: 10000,
  });

  const { data: chainStatus } = useQuery<ChainStatus[]>({
    queryKey: ['/api/status/chains'],
    refetchInterval: 15000,
  });

  const handleAcknowledge = async (incidentId: string) => {
    // TODO: Implement in backend integration phase
    console.log('Acknowledging incident:', incidentId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Precision Header - Steve Jobs would approve */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/98 backdrop-blur-xl">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                  Drosera
                </h1>
                <p className="text-xs font-medium text-muted-foreground mt-0.5 tracking-wide uppercase">
                  Oracle Security Network
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                <LiveIndicator isLive={true} />
                <span className="text-sm font-semibold text-accent">MONITORING</span>
              </div>
              
              <div className="h-6 w-px bg-border/50" />
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  data-testid="link-github"
                  className="hover-elevate"
                >
                  <a 
                    href="https://github.com/drosera-network" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  data-testid="link-simulation"
                  className="hover-elevate"
                >
                  <Link href="/simulation">
                    <PlayCircle className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  data-testid="link-config"
                  className="hover-elevate"
                >
                  <Link href="/config">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Refined Chain Status */}
          {chainStatus && chainStatus.length > 0 && (
            <ChainStatusBar chains={chainStatus} />
          )}
        </div>
      </header>

      {/* Commanding Main Content */}
      <main className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Price Grid - 2 columns, more breathing room */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Oracle Prices</h2>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  Ethereum · Arbitrum · Optimism · Base · Polygon · Solana
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black font-mono text-foreground">
                  {pricesData?.length || 0}
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assets
                </div>
              </div>
            </div>

            <MultiChainPriceGrid data={pricesData || []} isLoading={pricesLoading} />

            {/* Premium System Metrics */}
            <Card className="p-8 border-card-border/50 bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-6 tracking-tight">System Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Gas Spent
                  </div>
                  <div className="text-3xl font-black text-accent">$0</div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Zero ongoing cost
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Latency
                  </div>
                  <div className="text-3xl font-black font-mono">&lt;100<span className="text-lg">ms</span></div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Detection speed
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Incidents
                  </div>
                  <div className="text-3xl font-black text-primary">{incidentsData?.length || 0}</div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Total detected
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </div>
                  <div className="text-sm font-bold text-accent uppercase tracking-wide">
                    {pricesData && pricesData.length > 0 ? 'OPERATIONAL' : 'STARTING'}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Trap deployed
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Alert Panel - Refined prominence */}
          <div className="lg:col-span-1">
            <AlertPanel
              incidents={incidentsData || []}
              onAcknowledge={handleAcknowledge}
              className="sticky top-32"
            />
          </div>
        </div>
      </main>

      {/* Minimal, confident footer */}
      <footer className="border-t border-border/30 mt-24">
        <div className="container mx-auto px-8 py-8 text-center">
          <p className="text-xs font-medium text-muted-foreground tracking-wide">
            Powered by <span className="font-bold text-accent">Drosera Network</span>
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Zero-gas oracle security infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}
