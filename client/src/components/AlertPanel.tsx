import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Info, 
  Zap, 
  Clock, 
  X, 
  CheckCircle2, 
  TrendingDown,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Incident } from "@shared/schema";

interface AlertPanelProps {
  incidents: Incident[];
  onAcknowledge?: (incidentId: string) => void;
  onSendToTelegram?: (incidentId: string) => void;
  className?: string;
}

export function AlertPanel({ 
  incidents, 
  onAcknowledge, 
  onSendToTelegram,
  className 
}: AlertPanelProps) {
  const [filter, setFilter] = useState<'all' | 'active'>('active');
  
  const filtered = filter === 'active' 
    ? incidents.filter(i => !i.acknowledged)
    : incidents;

  const severityConfig = {
    0: { label: "INFO", icon: Info, variant: "secondary", color: "text-blue-500" },
    1: { label: "WARNING", icon: AlertTriangle, variant: "outline", color: "text-yellow-500" },
    2: { label: "CRITICAL", icon: Zap, variant: "destructive", color: "text-orange-500" },
    3: { label: "EMERGENCY", icon: AlertTriangle, variant: "destructive", color: "text-red-500" }
  } as const;

  const typeIcons = {
    mispricing: TrendingDown,
    stale_oracle: Clock,
    flash_loan: Zap,
    divergence: AlertTriangle
  };

  return (
    <Card className={cn("flex flex-col h-full border-card-border/50 bg-card/50 backdrop-blur-sm", className)}>
      <div className="p-6 border-b border-border/40">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Real-time alerts</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black font-mono" data-testid="badge-alert-count">
              {filtered.length}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {filter === 'active' ? 'Active' : 'Total'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('active')}
            data-testid="button-filter-active"
            className="flex-1 font-semibold"
          >
            Active
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            data-testid="button-filter-all"
            className="flex-1 font-semibold"
          >
            All
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-accent opacity-50" />
            <h3 className="text-lg font-semibold mb-2">All Systems Operational</h3>
            <p className="text-sm text-muted-foreground">
              No alerts at this time. Monitoring {incidents.length} historical incidents.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((incident) => {
              const config = severityConfig[incident.severity];
              const Icon = config.icon;
              const TypeIcon = typeIcons[incident.type];

              return (
                <Card
                  key={incident.id}
                  className={cn(
                    "p-4 border-l-4 transition-smooth animate-slide-in-right",
                    incident.severity === 3 && "border-l-destructive bg-destructive/5",
                    incident.severity === 2 && "border-l-primary bg-primary/5",
                    incident.severity === 1 && "border-l-yellow-500 bg-yellow-500/5",
                    incident.severity === 0 && "border-l-accent bg-accent/5",
                    incident.acknowledged && "opacity-60"
                  )}
                  data-testid={`card-incident-${incident.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={config.variant as any} className="text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {incident.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {incident.chain.toUpperCase()}
                        </Badge>
                      </div>

                      <div>
                        <div className="font-semibold text-sm">
                          {incident.asset} Oracle Alert
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {incident.type === 'mispricing' && incident.deviationBps && (
                            <>Deviation: {incident.deviationBps.toFixed(0)} bps</>
                          )}
                          {incident.type === 'stale_oracle' && incident.staleDuration && (
                            <>Stale for {Math.floor(incident.staleDuration / 60)}m</>
                          )}
                          {incident.type === 'flash_loan' && incident.priceChangeBps && (
                            <>Price spike: {incident.priceChangeBps.toFixed(0)} bps</>
                          )}
                          {incident.type === 'divergence' && incident.standardDeviationBps && (
                            <>Sources diverged: {incident.standardDeviationBps.toFixed(0)} bps</>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground font-mono">
                        {new Date(incident.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {incident.sentToTelegram && (
                          <Badge variant="outline" className="text-xs">
                            <Send className="h-3 w-3 mr-1" />
                            Telegram
                          </Badge>
                        )}
                        {incident.sentToTwitter && (
                          <Badge variant="outline" className="text-xs">
                            <Send className="h-3 w-3 mr-1" />
                            Twitter
                          </Badge>
                        )}
                      </div>
                    </div>

                    {!incident.acknowledged && onAcknowledge && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAcknowledge(incident.id)}
                        data-testid={`button-acknowledge-${incident.id}`}
                        className="hover-elevate h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
