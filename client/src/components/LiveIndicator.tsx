import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  isLive?: boolean;
  className?: string;
}

export function LiveIndicator({ isLive = true, className }: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} data-testid="live-indicator">
      <div className="relative flex h-2.5 w-2.5">
        {isLive && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent shadow-lg shadow-accent/50"></span>
          </>
        )}
        {!isLive && (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-muted"></span>
        )}
      </div>
    </div>
  );
}
