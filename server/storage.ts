import type {
  OraclePrice,
  MultiChainPrice,
  Incident,
  AssetConfig,
  SystemConfig,
  ChainStatus,
  ChainConfig,
  SimulationScenario,
  SimulationResult
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Oracle Prices
  getLatestPrices(): Promise<MultiChainPrice[]>;
  updatePrice(price: OraclePrice): Promise<void>;
  
  // Incidents
  getIncidents(limit?: number): Promise<Incident[]>;
  createIncident(incident: Omit<Incident, 'id'>): Promise<Incident>;
  acknowledgeIncident(incidentId: string): Promise<void>;
  
  // Configuration
  getSystemConfig(): Promise<SystemConfig>;
  updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig>;
  getAssetConfigs(): Promise<AssetConfig[]>;
  updateAssetConfig(asset: string, config: Partial<AssetConfig>): Promise<AssetConfig>;
  getChainConfigs(): Promise<ChainConfig[]>;
  
  // Chain Status
  getChainStatus(): Promise<ChainStatus[]>;
  updateChainStatus(chain: string, status: Partial<ChainStatus>): Promise<void>;
  
  // Simulation
  getSimulationScenarios(): Promise<SimulationScenario[]>;
  runSimulation(scenarioId: string): Promise<SimulationResult>;
}

export class MemStorage implements IStorage {
  private prices: Map<string, Map<string, OraclePrice>> = new Map(); // asset -> chain -> price
  private incidents: Map<string, Incident> = new Map();
  private systemConfig: SystemConfig;
  private assetConfigs: Map<string, AssetConfig> = new Map();
  private chainConfigs: Map<string, ChainConfig> = new Map();
  private chainStatus: Map<string, ChainStatus> = new Map();
  private simulationScenarios: Map<string, SimulationScenario> = new Map();

  constructor() {
    // Initialize default system config
    this.systemConfig = {
      guardianEnabled: false,
      guardianNetwork: 'ethereum',
      guardianGasLimit: 200000,
      telegramEnabled: true,
      telegramChatId: undefined,
      twitterEnabled: true,
      twitterEmergencyOnly: true,
      webhookUrl: undefined,
      minSources: 4,
      outlierThreshold: 2.5,
      confirmationsRequired: 3,
      detectionIntervalMs: 5000,
      maxGuardianCallsPerHour: 10,
      currentGuardianCalls: 0,
      lastGuardianCallReset: Date.now()
    };

    // Initialize default asset configs
    const defaultAssets: AssetConfig[] = [
      {
        asset: 'ETH',
        symbol: 'ETH/USD',
        volatilityClass: 'high',
        networks: ['ethereum', 'arbitrum', 'optimism', 'base', 'solana'],
        expectedUpdateInterval: 60,
        enabled: true,
        thresholds: { warning: 10, critical: 15, emergency: 25 }
      },
      {
        asset: 'BTC',
        symbol: 'BTC/USD',
        volatilityClass: 'high',
        networks: ['ethereum', 'solana'],
        expectedUpdateInterval: 60,
        enabled: true,
        thresholds: { warning: 10, critical: 15, emergency: 25 }
      },
      {
        asset: 'SOL',
        symbol: 'SOL/USD',
        volatilityClass: 'veryHigh',
        networks: ['solana'],
        expectedUpdateInterval: 30,
        enabled: true,
        thresholds: { warning: 15, critical: 25, emergency: 40 }
      },
      {
        asset: 'USDC',
        symbol: 'USDC/USD',
        volatilityClass: 'stable',
        networks: ['ethereum'],
        expectedUpdateInterval: 300,
        enabled: true,
        thresholds: { warning: 2, critical: 5, emergency: 10 }
      }
    ];

    defaultAssets.forEach(config => {
      this.assetConfigs.set(config.asset, config);
    });

    // Initialize simulation scenarios
    this.initializeSimulationScenarios();
  }

  private initializeSimulationScenarios() {
    const scenarios: SimulationScenario[] = [
      {
        id: 'scenario-mispricing',
        name: 'Price Manipulation Attack',
        description: 'Simulates 20% price deviation across multiple sources',
        type: 'mispricing',
        asset: 'ETH',
        chain: 'ethereum',
        parameters: { deviationPercent: 20 },
        expectedDetectionTimeMs: 85,
        expectedSeverity: 2
      },
      {
        id: 'scenario-stale',
        name: 'Stale Oracle Exploit',
        description: 'Oracle stops updating for extended period',
        type: 'stale_oracle',
        asset: 'BTC',
        chain: 'ethereum',
        parameters: { staleDurationSeconds: 300 },
        expectedDetectionTimeMs: 45,
        expectedSeverity: 2
      },
      {
        id: 'scenario-flashloan',
        name: 'Flash Loan Attack',
        description: 'Rapid 30% price spike within 12 seconds',
        type: 'flash_loan',
        asset: 'ETH',
        chain: 'ethereum',
        parameters: { priceChangeBps: 3000, timeWindowSeconds: 12 },
        expectedDetectionTimeMs: 30,
        expectedSeverity: 3
      },
      {
        id: 'scenario-divergence',
        name: 'Cross-Chain Divergence',
        description: 'All data sources show conflicting prices',
        type: 'divergence',
        asset: 'ETH',
        chain: 'ethereum',
        parameters: {},
        expectedDetectionTimeMs: 95,
        expectedSeverity: 3
      }
    ];

    scenarios.forEach(scenario => {
      this.simulationScenarios.set(scenario.id, scenario);
    });
  }

  async getLatestPrices(): Promise<MultiChainPrice[]> {
    const multiPrices: MultiChainPrice[] = [];

    this.prices.forEach((chainPrices, asset) => {
      const chains = Array.from(chainPrices.values());
      
      if (chains.length === 0) return;

      const prices = chains.map((c: OraclePrice) => c.price);
      const referencePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      const deviations = chains.map((c: OraclePrice) => Math.abs((c.price - referencePrice) / referencePrice * 10000));
      const maxDeviationBps = Math.max(...deviations);

      multiPrices.push({
        asset,
        symbol: chains[0].symbol,
        chains,
        referencePrice,
        maxDeviation: maxDeviationBps / 100,
        maxDeviationBps,
        timestamp: Math.max(...chains.map((c: OraclePrice) => c.timestamp))
      });
    });

    return multiPrices;
  }

  async updatePrice(price: OraclePrice): Promise<void> {
    if (!this.prices.has(price.asset)) {
      this.prices.set(price.asset, new Map());
    }
    this.prices.get(price.asset)!.set(price.chain, price);
  }

  async getIncidents(limit: number = 100): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async createIncident(incident: Omit<Incident, 'id'>): Promise<Incident> {
    const id = randomUUID();
    const newIncident: Incident = { ...incident, id };
    this.incidents.set(id, newIncident);
    return newIncident;
  }

  async acknowledgeIncident(incidentId: string): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      incident.acknowledged = true;
    }
  }

  async getSystemConfig(): Promise<SystemConfig> {
    return { ...this.systemConfig };
  }

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    this.systemConfig = { ...this.systemConfig, ...config };
    return this.systemConfig;
  }

  async getAssetConfigs(): Promise<AssetConfig[]> {
    return Array.from(this.assetConfigs.values());
  }

  async updateAssetConfig(asset: string, config: Partial<AssetConfig>): Promise<AssetConfig> {
    const existing = this.assetConfigs.get(asset);
    if (!existing) {
      throw new Error(`Asset config not found: ${asset}`);
    }
    const updated = { ...existing, ...config };
    this.assetConfigs.set(asset, updated);
    return updated;
  }

  async getChainConfigs(): Promise<ChainConfig[]> {
    return Array.from(this.chainConfigs.values());
  }

  async getChainStatus(): Promise<ChainStatus[]> {
    return Array.from(this.chainStatus.values());
  }

  async updateChainStatus(chain: string, status: Partial<ChainStatus>): Promise<void> {
    const existing = this.chainStatus.get(chain) || {
      chain,
      isHealthy: true,
      lastUpdate: Date.now(),
      activeFeeds: 0,
      avgLatencyMs: 0,
      rpcStatus: 'connected' as const,
      errors: []
    };
    
    this.chainStatus.set(chain, { ...existing, ...status });
  }

  async getSimulationScenarios(): Promise<SimulationScenario[]> {
    return Array.from(this.simulationScenarios.values());
  }

  async runSimulation(scenarioId: string): Promise<SimulationResult> {
    const scenario = this.simulationScenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    // Simulate detection
    const startTime = Date.now();
    const steps = [
      {
        timestamp: startTime,
        description: 'Simulation started',
        data: { scenarioId }
      },
      {
        timestamp: startTime + 20,
        description: 'Monitoring oracle feeds',
        data: { sources: 5 }
      },
      {
        timestamp: startTime + 40,
        description: 'Statistical analysis in progress',
        data: { method: 'weighted median + MAD' }
      },
      {
        timestamp: startTime + scenario.expectedDetectionTimeMs,
        description: 'Attack pattern detected!',
        data: { type: scenario.type, severity: scenario.expectedSeverity }
      }
    ];

    return {
      scenarioId,
      detected: true,
      detectionTimeMs: scenario.expectedDetectionTimeMs,
      severity: scenario.expectedSeverity,
      confirmations: this.systemConfig.confirmationsRequired,
      steps
    };
  }
}

export const storage = new MemStorage();
