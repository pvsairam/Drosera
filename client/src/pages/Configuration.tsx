import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Save, AlertTriangle, Send } from "lucide-react";
import { Link } from "wouter";
import type { AssetConfig, SystemConfig } from "@shared/schema";

export default function Configuration() {
  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/config/system'],
  });

  const { data: assetConfigs } = useQuery<AssetConfig[]>({
    queryKey: ['/api/config/assets'],
  });

  const [localConfig, setLocalConfig] = useState<Partial<SystemConfig>>({});

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
                <h1 className="text-3xl font-black tracking-tight">Configuration</h1>
                <p className="text-xs font-medium text-muted-foreground mt-1 tracking-wide uppercase">
                  Thresholds · Alerts · Detection Rules
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button data-testid="button-save-config" className="gap-2 font-semibold">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12 max-w-6xl">
        <Tabs defaultValue="assets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assets" data-testid="tab-assets">
              Assets
            </TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">
              Alerts
            </TabsTrigger>
            <TabsTrigger value="detection" data-testid="tab-detection">
              Detection
            </TabsTrigger>
            <TabsTrigger value="guardian" data-testid="tab-guardian">
              Guardian
            </TabsTrigger>
          </TabsList>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            {assetConfigs?.map((asset) => (
              <Card key={asset.asset} className="p-8 border-card-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-2xl font-bold tracking-tight">{asset.asset}</h3>
                      <Badge variant="outline" className="text-xs font-bold tracking-wider">
                        {asset.symbol}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {asset.volatilityClass.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      {asset.networks.map(n => n.toUpperCase()).join(' · ')}
                    </p>
                  </div>
                  <Switch
                    checked={asset.enabled}
                    data-testid={`switch-asset-${asset.asset}`}
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">
                        Warning Threshold
                      </Label>
                      <span className="text-sm font-mono text-primary">
                        {asset.thresholds.warning}%
                      </span>
                    </div>
                    <Slider
                      defaultValue={[asset.thresholds.warning]}
                      max={50}
                      step={1}
                      className="w-full"
                      data-testid={`slider-warning-${asset.asset}`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">
                        Critical Threshold
                      </Label>
                      <span className="text-sm font-mono text-primary">
                        {asset.thresholds.critical}%
                      </span>
                    </div>
                    <Slider
                      defaultValue={[asset.thresholds.critical]}
                      max={50}
                      step={1}
                      className="w-full"
                      data-testid={`slider-critical-${asset.asset}`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        Emergency Threshold
                      </Label>
                      <span className="text-sm font-mono text-destructive">
                        {asset.thresholds.emergency}%
                      </span>
                    </div>
                    <Slider
                      defaultValue={[asset.thresholds.emergency]}
                      max={50}
                      step={1}
                      className="w-full"
                      data-testid={`slider-emergency-${asset.asset}`}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card className="p-6 glass border-card-border">
              <h3 className="text-lg font-semibold mb-4">Telegram Integration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="telegram-enabled" className="text-sm font-medium">
                      Enable Telegram Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Send all incidents to Telegram (free permanent logging)
                    </p>
                  </div>
                  <Switch
                    id="telegram-enabled"
                    checked={systemConfig?.telegramEnabled}
                    data-testid="switch-telegram"
                  />
                </div>
                <div>
                  <Label htmlFor="telegram-chat" className="text-sm font-medium">
                    Chat ID
                  </Label>
                  <Input
                    id="telegram-chat"
                    placeholder="-1001234567890"
                    defaultValue={systemConfig?.telegramChatId}
                    className="mt-2"
                    data-testid="input-telegram-chat"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 glass border-card-border">
              <h3 className="text-lg font-semibold mb-4">Twitter Integration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twitter-enabled" className="text-sm font-medium">
                      Enable Twitter Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Post public warnings to protect DeFi community
                    </p>
                  </div>
                  <Switch
                    id="twitter-enabled"
                    checked={systemConfig?.twitterEnabled}
                    data-testid="switch-twitter"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twitter-emergency" className="text-sm font-medium">
                      Emergency Only
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only tweet for EMERGENCY level incidents
                    </p>
                  </div>
                  <Switch
                    id="twitter-emergency"
                    checked={systemConfig?.twitterEmergencyOnly}
                    data-testid="switch-twitter-emergency"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 glass border-card-border">
              <h3 className="text-lg font-semibold mb-4">Drosera Operator Webhook</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook" className="text-sm font-medium">
                    Webhook URL
                  </Label>
                  <Input
                    id="webhook"
                    type="url"
                    placeholder="https://your-vps.com/webhook"
                    defaultValue={systemConfig?.webhookUrl}
                    className="mt-2 font-mono text-xs"
                    data-testid="input-webhook"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Real-time alerts sent to your Drosera operator VPS
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Detection Tab */}
          <TabsContent value="detection" className="space-y-4">
            <Card className="p-6 glass border-card-border">
              <h3 className="text-lg font-semibold mb-4">Statistical Detection</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      Minimum Data Sources
                    </Label>
                    <span className="text-sm font-mono text-accent">
                      {systemConfig?.minSources || 4}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[systemConfig?.minSources || 4]}
                    min={3}
                    max={10}
                    step={1}
                    className="w-full"
                    data-testid="slider-min-sources"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    More sources = higher Byzantine fault tolerance
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      Z-Score Outlier Threshold
                    </Label>
                    <span className="text-sm font-mono text-accent">
                      σ = {systemConfig?.outlierThreshold || 2.5}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[(systemConfig?.outlierThreshold || 2.5) * 10]}
                    min={15}
                    max={35}
                    step={1}
                    className="w-full"
                    data-testid="slider-outlier-threshold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      Confirmations Required
                    </Label>
                    <span className="text-sm font-mono text-accent">
                      {systemConfig?.confirmationsRequired || 3}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[systemConfig?.confirmationsRequired || 3]}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                    data-testid="slider-confirmations"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Consecutive violations before triggering alert
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Guardian Tab */}
          <TabsContent value="guardian" className="space-y-4">
            <Card className="p-6 glass border-card-border border-l-4 border-l-primary bg-primary/5">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold">Zero-Gas Mode Active</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Guardian contract deployed on Ethereum mainnet but never called to save gas costs
                  </p>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="guardian-enabled" className="text-sm font-medium">
                      Enable On-Chain Reporting
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Call Guardian contract for incidents (costs ~$2-5 per call)
                    </p>
                  </div>
                  <Switch
                    id="guardian-enabled"
                    checked={systemConfig?.guardianEnabled || false}
                    disabled
                    data-testid="switch-guardian"
                  />
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-md p-4 mt-4">
                  <p className="text-sm text-accent-foreground">
                    <span className="font-semibold">Recommendation:</span> Keep disabled until Drosera launches on Base/Arbitrum where gas costs will be ~$0.01-0.10 per incident instead of $2-5 on mainnet.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Gas Spent</div>
                    <div className="text-2xl font-bold text-accent">$0.00</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Guardian Calls</div>
                    <div className="text-2xl font-bold">0</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass border-card-border">
              <h3 className="text-lg font-semibold mb-4">Rate Limiting</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      Max Guardian Calls per Hour
                    </Label>
                    <span className="text-sm font-mono text-accent">
                      {systemConfig?.maxGuardianCallsPerHour || 10}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[systemConfig?.maxGuardianCallsPerHour || 10]}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                    data-testid="slider-max-calls"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Prevents excessive gas spending during market volatility
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
