import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { realtimeServer } from "./websocket";
import { z } from "zod";
import type {
  OraclePrice,
  Incident,
  AssetConfig,
  SystemConfig,
  ChainStatus
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time updates
  realtimeServer.initialize(httpServer);
  // ============ Oracle Prices ============
  
  app.get("/api/prices", async (req, res) => {
    try {
      const prices = await storage.getLatestPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  // ============ Incidents ============
  
  app.get("/api/incidents", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const incidents = await storage.getIncidents(limit);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.post("/api/incidents/:id/acknowledge", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.acknowledgeIncident(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error acknowledging incident:", error);
      res.status(500).json({ error: "Failed to acknowledge incident" });
    }
  });

  // ============ Configuration ============
  
  app.get("/api/config/system", async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ error: "Failed to fetch system config" });
    }
  });

  app.post("/api/config/system", async (req, res) => {
    try {
      const updated = await storage.updateSystemConfig(req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating system config:", error);
      res.status(500).json({ error: "Failed to update system config" });
    }
  });

  app.get("/api/config/assets", async (req, res) => {
    try {
      const configs = await storage.getAssetConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching asset configs:", error);
      res.status(500).json({ error: "Failed to fetch asset configs" });
    }
  });

  app.post("/api/config/assets/:asset", async (req, res) => {
    try {
      const { asset } = req.params;
      const updated = await storage.updateAssetConfig(asset, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating asset config:", error);
      res.status(500).json({ error: "Failed to update asset config" });
    }
  });

  app.get("/api/config/chains", async (req, res) => {
    try {
      const configs = await storage.getChainConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching chain configs:", error);
      res.status(500).json({ error: "Failed to fetch chain configs" });
    }
  });

  // ============ Chain Status ============
  
  app.get("/api/status/chains", async (req, res) => {
    try {
      const status = await storage.getChainStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching chain status:", error);
      res.status(500).json({ error: "Failed to fetch chain status" });
    }
  });

  // ============ Simulation ============
  
  app.get("/api/simulation/scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getSimulationScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching simulation scenarios:", error);
      res.status(500).json({ error: "Failed to fetch simulation scenarios" });
    }
  });

  app.post("/api/simulation/run", async (req, res) => {
    try {
      const { scenarioId } = req.body;
      if (!scenarioId) {
        return res.status(400).json({ error: "scenarioId is required" });
      }
      
      const result = await storage.runSimulation(scenarioId);
      res.json(result);
    } catch (error) {
      console.error("Error running simulation:", error);
      res.status(500).json({ error: "Failed to run simulation" });
    }
  });

  app.get("/api/simulation/results/:scenarioId", async (req, res) => {
    try {
      const { scenarioId } = req.params;
      const result = await storage.runSimulation(scenarioId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching simulation result:", error);
      res.status(500).json({ error: "Failed to fetch simulation result" });
    }
  });

  // ============ Mock Data Generator (for development) ============
  
  app.post("/api/dev/generate-mock-data", async (req, res) => {
    try {
      // Generate mock prices for all assets
      const assets = await storage.getAssetConfigs();
      const mockPrices: Record<string, number> = {
        'ETH': 2250 + (Math.random() - 0.5) * 100,
        'BTC': 42000 + (Math.random() - 0.5) * 1000,
        'SOL': 95 + (Math.random() - 0.5) * 5,
        'USDC': 1.00 + (Math.random() - 0.5) * 0.02
      };

      for (const asset of assets) {
        if (!asset.enabled) continue;
        
        const basePrice = mockPrices[asset.asset] || 100;
        
        for (const network of asset.networks) {
          // Add slight variation per chain (simulate normal operation)
          const deviation = (Math.random() - 0.5) * 0.02; // ±1% variation
          const price = basePrice * (1 + deviation);
          
          const oraclePrice: OraclePrice = {
            chain: network,
            asset: asset.asset,
            symbol: asset.symbol,
            price,
            source: network === 'solana' ? 'Pyth' : 'Chainlink',
            timestamp: Date.now(),
            blockNumber: Math.floor(Math.random() * 1000000),
            confidence: 0.95 + Math.random() * 0.05,
            deviation: deviation * 100,
            deviationBps: Math.abs(deviation * 10000)
          };
          
          await storage.updatePrice(oraclePrice);
        }
      }

      // Generate mock chain status
      const chains = ['ethereum', 'arbitrum', 'optimism', 'base', 'solana'];
      for (const chain of chains) {
        await storage.updateChainStatus(chain, {
          chain,
          isHealthy: true,
          lastUpdate: Date.now(),
          activeFeeds: chain === 'ethereum' ? 4 : chain === 'solana' ? 3 : 1,
          avgLatencyMs: 50 + Math.random() * 100,
          rpcStatus: 'connected',
          errors: []
        });
      }

      // Generate a few sample incidents
      const incidentTypes: Array<'mispricing' | 'stale_oracle' | 'flash_loan' | 'divergence'> = [
        'mispricing', 'stale_oracle', 'flash_loan', 'divergence'
      ];
      
      for (let i = 0; i < 3; i++) {
        const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
        const severity = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
        
        await storage.createIncident({
          type,
          severity,
          chain: 'ethereum',
          asset: 'ETH',
          timestamp: Date.now() - (i * 3600000), // Stagger by hours
          acknowledged: i > 0, // First one unacknowledged
          deviationBps: type === 'mispricing' ? 1500 : undefined,
          onchainPrice: type === 'mispricing' ? 2300 : undefined,
          referencePrice: type === 'mispricing' ? 2250 : undefined,
          confirmationCount: 3,
          staleDuration: type === 'stale_oracle' ? 180 : undefined,
          lastUpdateTime: type === 'stale_oracle' ? Date.now() - 180000 : undefined,
          expectedUpdateInterval: 60,
          priceChangeBps: type === 'flash_loan' ? 2500 : undefined,
          timeWindowSeconds: type === 'flash_loan' ? 12 : undefined,
          volumeMultiplier: type === 'flash_loan' ? 8 : undefined,
          txHash: type === 'flash_loan' ? '0x' + Math.random().toString(16).slice(2, 66) : undefined,
          standardDeviationBps: type === 'divergence' ? 1800 : undefined,
          sourceCount: type === 'divergence' ? 5 : undefined,
          priceRange: type === 'divergence' ? [2200, 2300] : undefined,
          sentToTelegram: true,
          sentToTwitter: severity === 3,
          telegramMessageId: `msg_${Date.now()}_${i}`,
          twitterTweetId: severity === 3 ? `tweet_${Date.now()}_${i}` : undefined
        });
      }

      res.json({ 
        success: true, 
        message: "Mock data generated successfully",
        stats: {
          pricesGenerated: assets.length * 3,
          chainsUpdated: chains.length,
          incidentsCreated: 3
        }
      });
    } catch (error) {
      console.error("Error generating mock data:", error);
      res.status(500).json({ error: "Failed to generate mock data" });
    }
  });

  return httpServer;
}
