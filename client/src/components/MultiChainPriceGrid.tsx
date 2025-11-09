import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceCard } from "./PriceCard";
import { Loader2, TrendingUp } from "lucide-react";
import type { MultiChainPrice } from "@shared/schema";

interface MultiChainPriceGridProps {
  data: MultiChainPrice[];
  isLoading?: boolean;
}

export function MultiChainPriceGrid({ data, isLoading }: MultiChainPriceGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-12 text-center glass border-card-border">
        <div className="text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No oracle data yet</h3>
          <p className="text-sm">
            Monitoring will begin once the system connects to oracle feeds
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {data.map((multiPrice) => (
        <div key={multiPrice.asset} className="space-y-6">
          <div className="flex items-end justify-between pb-4 border-b border-border/30">
            <div>
              <h3 className="text-4xl font-black tracking-tight">{multiPrice.asset}</h3>
              <p className="text-sm text-muted-foreground font-medium mt-1">{multiPrice.symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Reference
              </div>
              <div className="font-mono text-3xl font-black text-accent">
                ${multiPrice.referencePrice.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              {multiPrice.maxDeviationBps > 500 && (
                <Badge variant="outline" className="mt-3 text-xs font-semibold">
                  Deviation: {multiPrice.maxDeviationBps.toFixed(0)} bps
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {multiPrice.chains.map((price) => (
              <PriceCard
                key={`${price.chain}-${price.asset}`}
                data={price}
                showDeviation={true}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
