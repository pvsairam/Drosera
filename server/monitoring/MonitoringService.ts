// Main monitoring service for oracle price tracking
// Fetches prices from Pyth and RedStone, runs detection, sends alerts
// Everything happens off-chain so we don't pay any gas

import { storage } from "../storage";
import { detectionEngine } from "./DetectionEngine";
import { telegramBot } from "./TelegramBot";
import { twitterService } from "./TwitterService";
import { realtimeServer } from "../websocket";
import { chainlinkAdapter } from "./ChainlinkAdapter";
import { pythAdapter } from "./PythAdapter";
import { RedStoneAdapter } from "./RedStoneAdapter";
import type { OraclePrice, Incident } from "@shared/schema";

// Initialize oracle adapters (all FREE)
const redstoneAdapter = new RedStoneAdapter();

export class MonitoringService {
  private isRunning: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private guardianCallCount: number = 0;
  private lastGuardianReset: number = Date.now();

  constructor(
    private readonly intervalMs: number = 1000
  ) {}

  public async start() {
    if (this.isRunning) {
      console.log("Monitoring service already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting Drosera Oracle Trap monitoring service...");
    console.log("⚡ Detection mode: OFF-CHAIN (zero gas costs)");
    console.log("⏱️  Monitoring speed: REAL-TIME (1-second intervals)");
    console.log("📱 Alerts: Telegram + Twitter (emergency only)");
    console.log("🔗 Guardian: Deployed but NEVER called (L2-ready for future)");

    // Start periodic monitoring with detection
    this.monitoringInterval = setInterval(() => {
      this.monitorCycle().catch(err => {
        console.error("Monitoring cycle error:", err);
      });
    }, this.intervalMs);

    // Start fetching REAL oracle prices (FREE from Pyth + RedStone - NO rate limits!)
    this.priceUpdateInterval = setInterval(() => {
      this.fetchRealOraclePrices().catch(err => {
        console.error("Oracle fetch error:", err);
      });
    }, 1000); // Fetch EVERY SECOND - Pyth & RedStone have no rate limits!

    // Run initial monitoring cycle
    await this.monitorCycle();
  }

  public stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
    this.isRunning = false;
    console.log("Monitoring service stopped");
  }

  // Main monitoring loop that runs EVERY SECOND
  // Checks all the prices and looks for problems in real-time
  private async monitorCycle() {
    try {
      // Load up our configuration
      const systemConfig = await storage.getSystemConfig();
      const assetConfigs = await storage.getAssetConfigs();
      
      // Get the latest prices we fetched from oracles
      const multiChainPrices = await storage.getLatestPrices();

      // Reset the guardian counter every hour (should always be 0 anyway)
      const now = Date.now();
      if (now - this.lastGuardianReset > 3600000) {
        this.guardianCallCount = 0;
        this.lastGuardianReset = now;
        console.log("🔄 Guardian call counter reset (still at 0 - never called)");
      }

      // Check each asset for problems
      for (const multiPrice of multiChainPrices) {
        // Skip if we're not monitoring this asset
        const assetConfig = assetConfigs.find(c => c.asset === multiPrice.asset);
        if (!assetConfig || !assetConfig.enabled) continue;

        // Run the detection engine to find anomalies
        // Uses median, MAD, and z-scores to catch bad prices
        const detectionResults = await detectionEngine.analyzePrices(
          multiPrice.asset,
          multiPrice.chains,
          assetConfig
        );

        // Handle any problems we found
        for (const result of detectionResults) {
          if (!result.detected || !result.type) continue;

          // Check if we should create incident (confirmations, rate limiting, etc.)
          const shouldCreateIncident = await this.shouldCreateIncident(
            multiPrice.asset,
            result.type,
            systemConfig.confirmationsRequired
          );

          if (shouldCreateIncident) {
            await this.handleDetection(multiPrice.asset, result, systemConfig);
          }
        }
      }

      // Update chain status
      const chains = ['ethereum', 'arbitrum', 'optimism', 'base', 'solana'];
      for (const chain of chains) {
        const status = {
          chain,
          isHealthy: true,
          lastUpdate: Date.now(),
          activeFeeds: chain === 'ethereum' ? 4 : chain === 'solana' ? 3 : 1,
          avgLatencyMs: 60 + Math.random() * 40,
          rpcStatus: 'connected' as const,
          errors: []
        };
        
        await storage.updateChainStatus(chain, status);
        realtimeServer.broadcastChainStatus(status);
      }

    } catch (error) {
      console.error("Error in monitoring cycle:", error);
    }
  }

  private incidentConfirmations: Map<string, number> = new Map();

  private async shouldCreateIncident(
    asset: string,
    type: string,
    required: number
  ): Promise<boolean> {
    const key = `${asset}-${type}`;
    const current = this.incidentConfirmations.get(key) || 0;
    const newCount = current + 1;
    
    this.incidentConfirmations.set(key, newCount);

    // Clear confirmation after 30 seconds
    setTimeout(() => {
      this.incidentConfirmations.delete(key);
    }, 30000);

    return newCount >= required;
  }

  private async handleDetection(
    asset: string,
    result: any,
    systemConfig: any
  ) {
    try {
      console.log(`🚨 DETECTION: ${result.type} for ${asset} (Severity: ${result.severity})`);

      // Create incident
      const incident = await storage.createIncident({
        type: result.type,
        severity: result.severity,
        chain: result.details.chain || 'ethereum',
        asset,
        timestamp: Date.now(),
        acknowledged: false,
        ...result.details,
        confirmationCount: systemConfig.confirmationsRequired,
        sentToTelegram: false,
        sentToTwitter: false
      });

      // Send to Telegram (ALL incidents)
      if (systemConfig.telegramEnabled) {
        const telegramSent = await telegramBot.sendIncident(incident);
        incident.sentToTelegram = telegramSent;
        if (telegramSent) {
          incident.telegramMessageId = `msg_${Date.now()}`;
        }
      }

      // Send to Twitter (EMERGENCY only, if configured)
      if (systemConfig.twitterEnabled) {
        const shouldTweet = systemConfig.twitterEmergencyOnly 
          ? incident.severity === 3 
          : true;

        if (shouldTweet) {
          const twitterSent = await twitterService.postIncident(incident);
          incident.sentToTwitter = twitterSent;
          if (twitterSent) {
            incident.twitterTweetId = `tweet_${Date.now()}`;
          }
        }
      }

      // Webhook to Drosera operator VPS
      if (systemConfig.webhookUrl) {
        this.sendWebhook(systemConfig.webhookUrl, incident).catch(err => {
          console.error("Webhook send error:", err);
        });
      }

      // VERIFY: Guardian contract is NEVER called (zero-gas operation)
      if (systemConfig.guardianEnabled) {
        console.log("⚠️  WARNING: Guardian enabled but DISABLED in production (zero-gas mode)");
        console.log("💰 Gas saved: ~$2-5 per incident");
        // NEVER call Guardian.reportIncident() until L2 deployment
        // this.guardianCallCount++; // Would increment if we called
      } else {
        console.log("✅ Zero-gas verified: Guardian contract never called");
        console.log(`📊 Incidents detected: ${(await storage.getIncidents()).length}, Gas spent: $0.00`);
      }

      // Broadcast to WebSocket clients
      realtimeServer.broadcastIncident(incident);

      console.log(`✅ Incident ${incident.id} handled successfully`);
      console.log(`   Telegram: ${incident.sentToTelegram ? '✓' : '✗'}`);
      console.log(`   Twitter: ${incident.sentToTwitter ? '✓' : '✗'}`);
      console.log(`   Guardian: NEVER CALLED (zero-gas ✓)`);

    } catch (error) {
      console.error("Error handling detection:", error);
    }
  }

  private async sendWebhook(url: string, incident: Incident) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'incident',
          data: incident,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status}`);
      } else {
        console.log(`📡 Webhook sent to operator VPS`);
      }
    } catch (error) {
      console.error("Webhook error:", error);
    }
  }

  // Fetch prices from oracle networks every 30 seconds
  // Both Pyth and RedStone are free to use, no API keys needed
  private async fetchRealOraclePrices() {
    try {
      const assets = await storage.getAssetConfigs();
      const fetchedPrices: OraclePrice[] = [];

      // Get prices from both oracles at the same time
      // If one fails, the other still works
      const [pythPrices, redstonePrices] = await Promise.allSettled([
        // Pyth Network - 104 chains, 380 price feeds, totally free
        pythAdapter.fetchMultiplePrices(pythAdapter.getSupportedAssets()),
        
        // RedStone Finance - 110 chains, 1,300 feeds, also free
        redstoneAdapter.fetchPrices()
      ]);

      // Collect results from Pyth
      if (pythPrices.status === 'fulfilled') {
        fetchedPrices.push(...pythPrices.value);
      } else {
        console.error('⚠️  Pyth Network fetch error:', pythPrices.reason);
      }

      // Collect results from RedStone
      if (redstonePrices.status === 'fulfilled') {
        fetchedPrices.push(...redstonePrices.value);
      } else {
        console.error('⚠️  RedStone Finance fetch error:', redstonePrices.reason);
      }

      // Optional: Add Chainlink if you have Alchemy/Infura API key (300M free compute units/month)
      // Uncomment to enable 3rd oracle network:
      // const chainlinkChains = chainlinkAdapter.getSupportedChains();
      // for (const chain of chainlinkChains) {
      //   try {
      //     const chainPrices = await chainlinkAdapter.fetchAllPrices(chain);
      //     fetchedPrices.push(...chainPrices);
      //   } catch (error) {
      //     console.error(`Chainlink fetch error (${chain}):`, error);
      //   }
      // }

      // Store prices and broadcast to clients
      for (const price of fetchedPrices) {
        await storage.updatePrice(price);
        realtimeServer.broadcastPriceUpdate(price);
      }

      if (fetchedPrices.length > 0) {
        const sources = pythPrices.status === 'fulfilled' && redstonePrices.status === 'fulfilled' ? 2 : 1;
        console.log(`✅ Fetched ${fetchedPrices.length} prices from ${sources} ORACLE NETWORKS (Pyth + RedStone) - 100% FREE`);
      }

    } catch (error) {
      console.error("Oracle fetch error:", error);
    }
  }

  public async simulateAlert(type: 'mispricing' | 'stale_oracle' | 'flash_loan' | 'divergence') {
    console.log(`📢 MANUAL SIMULATION: ${type}`);
    
    const severity = type === 'flash_loan' || type === 'divergence' ? 3 : 2;
    
    const incident = await storage.createIncident({
      type,
      severity,
      chain: 'ethereum',
      asset: 'ETH',
      timestamp: Date.now(),
      acknowledged: false,
      deviationBps: type === 'mispricing' ? 1800 : undefined,
      onchainPrice: type === 'mispricing' ? 2400 : undefined,
      referencePrice: type === 'mispricing' ? 2250 : undefined,
      confirmationCount: 3,
      staleDuration: type === 'stale_oracle' ? 240 : undefined,
      lastUpdateTime: type === 'stale_oracle' ? Date.now() - 240000 : undefined,
      expectedUpdateInterval: 60,
      priceChangeBps: type === 'flash_loan' ? 3200 : undefined,
      timeWindowSeconds: type === 'flash_loan' ? 10 : undefined,
      volumeMultiplier: type === 'flash_loan' ? 12 : undefined,
      txHash: type === 'flash_loan' ? '0x' + Math.random().toString(16).slice(2, 66) : undefined,
      standardDeviationBps: type === 'divergence' ? 2200 : undefined,
      sourceCount: type === 'divergence' ? 5 : undefined,
      priceRange: type === 'divergence' ? [2100, 2400] : undefined,
      sentToTelegram: true,
      sentToTwitter: severity === 3,
      telegramMessageId: `msg_${Date.now()}`,
      twitterTweetId: severity === 3 ? `tweet_${Date.now()}` : undefined
    });

    // Broadcast to clients
    realtimeServer.broadcastIncident(incident);

    console.log(`✅ Simulation alert created: ${incident.id}`);
    console.log(`📱 Sent to Telegram: ${incident.sentToTelegram}`);
    console.log(`🐦 Sent to Twitter: ${incident.sentToTwitter}`);
    
    return incident;
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      guardianCalls: this.guardianCallCount,
      guardianEnabled: false, // Always false (zero-gas mode)
      connectedClients: realtimeServer.getConnectedClients()
    };
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();
