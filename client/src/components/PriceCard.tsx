import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OraclePrice } from "@shared/schema";

interface PriceCardProps {
  data: OraclePrice;
  showDeviation?: boolean;
  compact?: boolean;
}

export function PriceCard({ data, showDeviation = true, compact = false }: PriceCardProps) {
  const isStale = Date.now() - data.timestamp > 120000; // 2 minutes
  const hasDeviation = data.deviationBps && Math.abs(data.deviationBps) > 500; // 5%
  
  const deviationColor = !data.deviationBps ? "text-muted-foreground" :
    Math.abs(data.deviationBps) > 1500 ? "text-destructive" :
    Math.abs(data.deviationBps) > 1000 ? "text-primary" :
    "text-muted-foreground";

  return (
    <Card 
      className={cn(
        "border-card-border/50 bg-card/50 backdrop-blur-sm transition-smooth hover-elevate",
        compact ? "p-4" : "p-6",
        hasDeviation && "border-primary/40 bg-primary/5"
      )}
      data-testid={`card-price-${data.chain}-${data.asset}`}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-bold tracking-wider">
              {data.chain.toUpperCase()}
            </Badge>
            {isStale && (
              <Badge variant="destructive" className="text-xs font-semibold">
                <Clock className="h-3 w-3 mr-1" />
                STALE
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{data.symbol}</div>
        </div>

        <div className="text-right">
          {showDeviation && data.deviation !== undefined && (
            <div className={cn("flex items-center justify-end gap-1 text-xs font-bold mb-1", deviationColor)}>
              {data.deviation > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : data.deviation < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              <span className="font-mono tabular-nums">
                {data.deviation > 0 && "+"}{data.deviation.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className="font-mono text-3xl font-black tabular-nums price-update tracking-tight">
          ${data.price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </div>
      </div>

      {!compact && (
        <div className="pt-4 border-t border-border/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <Activity className="h-3 w-3" />
            <span>{data.source}</span>
          </div>
          <div className="font-mono text-muted-foreground">
            {new Date(data.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      )}

      {hasDeviation && (
        <div className="mt-4 flex items-center gap-2 text-xs text-primary font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {Math.abs(data.deviationBps!).toFixed(0)} bps deviation
          </span>
        </div>
      )}
    </Card>
  );
}
