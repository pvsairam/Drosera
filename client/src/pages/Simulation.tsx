import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Clock, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SimulationScenario, SimulationResult } from "@shared/schema";

export default function Simulation() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: scenarios } = useQuery<SimulationScenario[]>({
    queryKey: ['/api/simulation/scenarios'],
  });

  const { data: result, isLoading: isSimulating } = useQuery<SimulationResult>({
    queryKey: ['/api/simulation/results', selectedScenario],
    enabled: selectedScenario !== null && isRunning,
  });

  const runSimulation = useMutation({
    mutationFn: (scenarioId: string) => 
      apiRequest('POST', '/api/simulation/run', { scenarioId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulation/results'] });
    },
  });

  const handleRun = async (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setIsRunning(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    await runSimulation.mutateAsync(scenarioId);
  };

  const handleReset = () => {
    setSelectedScenario(null);
    setIsRunning(false);
    setProgress(0);
  };

  const scenarioIcons = {
    mispricing: TrendingDown,
    stale_oracle: Clock,
    flash_loan: Zap,
    divergence: AlertTriangle
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/98 backdrop-blur-xl">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                asChild
                data-testid="link-back"
                className="hover-elevate"
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Simulation</h1>
                <p className="text-xs font-medium text-muted-foreground mt-1 tracking-wide uppercase">
                  Test Attack Scenarios · 4 Detection Patterns
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scenario Selection */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Attack Scenarios</h2>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                Select and run oracle attack simulations
              </p>
            </div>
            
            {scenarios?.map((scenario) => {
              const Icon = scenarioIcons[scenario.type];
              const isSelected = selectedScenario === scenario.id;
              
              return (
                <Card
                  key={scenario.id}
                  className={`p-6 border-card-border/50 bg-card/50 backdrop-blur-sm transition-smooth cursor-pointer hover-elevate ${
                    isSelected ? 'border-primary/60 border-2 bg-primary/5' : ''
                  }`}
                  onClick={() => !isRunning && setSelectedScenario(scenario.id)}
                  data-testid={`card-scenario-${scenario.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{scenario.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {scenario.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {scenario.asset}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {scenario.chain.toUpperCase()}
                        </Badge>
                        <Badge 
                          variant={scenario.expectedSeverity === 3 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'][scenario.expectedSeverity]}
                        </Badge>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground font-mono">
                        Expected detection: ~{scenario.expectedDetectionTimeMs}ms
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Simulation Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Simulation Results</h2>
              {selectedScenario && (
                <div className="flex gap-2">
                  {!isRunning ? (
                    <Button
                      onClick={() => handleRun(selectedScenario)}
                      disabled={isSimulating}
                      data-testid="button-run-simulation"
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Run
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsRunning(false)}
                      data-testid="button-pause-simulation"
                      className="gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    data-testid="button-reset-simulation"
                    className="hover-elevate"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {!selectedScenario && (
              <Card className="p-12 text-center glass border-card-border">
                <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Scenario Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select an attack scenario to begin simulation
                </p>
              </Card>
            )}

            {selectedScenario && !isRunning && !result && (
              <Card className="p-12 text-center glass border-card-border">
                <Play className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Ready to Run</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Run" to start the simulation
                </p>
              </Card>
            )}

            {isRunning && (
              <div className="space-y-4">
                <Card className="p-6 glass border-card-border">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Simulation Progress</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {result?.steps.map((step, index) => (
                    <div
                      key={index}
                      className="py-3 border-b border-border/50 last:border-0 animate-fade-in"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{step.description}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-1">
                            {new Date(step.timestamp).toLocaleTimeString()} • 
                            {step.data && Object.keys(step.data).length > 0 && (
                              <span className="ml-1">
                                {JSON.stringify(step.data).slice(0, 50)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>

                {result && result.detected && (
                  <Card className="p-6 glass border-card-border border-l-4 border-l-accent bg-accent/5 animate-slide-in-right">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Attack Detected!</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">Detection Time</div>
                            <div className="font-mono text-accent font-semibold">
                              {result.detectionTimeMs}ms
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Severity</div>
                            <Badge variant="destructive">
                              {['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'][result.severity]}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Confirmations</div>
                            <div className="font-semibold">{result.confirmations}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Steps Executed</div>
                            <div className="font-semibold">{result.steps.length}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
