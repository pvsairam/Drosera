import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, CheckCircle2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChainStatus } from "@shared/schema";

interface ChainStatusBarProps {
  chains: ChainStatus[];
  className?: string;
}

export function ChainStatusBar({ chains, className }: ChainStatusBarProps) {
  const getStatusIcon = (status: ChainStatus) => {
    if (!status.isHealthy || status.rpcStatus === 'disconnected') {
      return <WifiOff className="h-4 w-4 text-destructive" />;
    }
    if (status.rpcStatus === 'degraded') {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-accent" />;
  };

  const getStatusVariant = (status: ChainStatus): "default" | "destructive" | "outline" | "secondary" => {
    if (!status.isHealthy || status.rpcStatus === 'disconnected') return 'destructive';
    if (status.rpcStatus === 'degraded') return 'outline';
    return 'secondary';
  };

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5" />
        <span className="font-semibold uppercase tracking-wider">Networks</span>
      </div>
      
      {chains.map((chain) => (
        <Badge
          key={chain.chain}
          variant={getStatusVariant(chain)}
          className="flex items-center gap-1.5 text-xs font-semibold"
          data-testid={`badge-chain-${chain.chain}`}
        >
          {getStatusIcon(chain)}
          <span className="tracking-wide">{chain.chain.toUpperCase()}</span>
          <span className="opacity-60 font-normal">
            {chain.activeFeeds}
          </span>
          {chain.avgLatencyMs > 0 && (
            <span className="opacity-50 font-mono tabular-nums font-normal">
              {chain.avgLatencyMs.toFixed(0)}ms
            </span>
          )}
        </Badge>
      ))}
    </div>
  );
}
