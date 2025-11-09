import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============ Enums ============

export const AlertSeverity = {
  INFO: 0,
  WARNING: 1,
  CRITICAL: 2,
  EMERGENCY: 3
} as const;

export const IncidentType = {
  MISPRICING: 'mispricing',
  STALE_ORACLE: 'stale_oracle',
  FLASH_LOAN: 'flash_loan',
  DIVERGENCE: 'divergence'
} as const;

export const ChainType = {
  ETHEREUM: 'ethereum',
  ARBITRUM: 'arbitrum',
  OPTIMISM: 'optimism',
  BASE: 'base',
  POLYGON: 'polygon',
  SOLANA: 'solana'
} as const;

// ============ Oracle Price Data ============

export interface OraclePrice {
  chain: string;
  asset: string;
  symbol: string;
  price: number;
  source: string;
  timestamp: number;
  blockNumber?: number;
  confidence: number;
  deviation?: number;
  deviationBps?: number;
}

export interface MultiChainPrice {
  asset: string;
  symbol: string;
  chains: OraclePrice[];
  referencePrice: number;
  maxDeviation: number;
  maxDeviationBps: number;
  timestamp: number;
}

// ============ Incidents ============

export interface Incident {
  id: string;
  type: typeof IncidentType[keyof typeof IncidentType];
  severity: typeof AlertSeverity[keyof typeof AlertSeverity];
  chain: string;
  asset: string;
  timestamp: number;
  acknowledged: boolean;
  
  // Mispricing specific
  onchainPrice?: number;
  referencePrice?: number;
  deviationBps?: number;
  confirmationCount?: number;
  
  // Stale oracle specific
  lastUpdateTime?: number;
  expectedUpdateInterval?: number;
  staleDuration?: number;
  
  // Flash loan specific
  priceChangeBps?: number;
  timeWindowSeconds?: number;
  volumeMultiplier?: number;
  txHash?: string;
  
  // Divergence specific
  standardDeviationBps?: number;
  sourceCount?: number;
  priceRange?: [number, number];
  
  // Telegram/Twitter status
  sentToTelegram: boolean;
  sentToTwitter: boolean;
  telegramMessageId?: string;
  twitterTweetId?: string;
}

// ============ Configuration ============

export interface AssetConfig {
  asset: string;
  symbol: string;
  volatilityClass: 'stable' | 'low' | 'medium' | 'high' | 'veryHigh';
  networks: string[];
  expectedUpdateInterval: number;
  enabled: boolean;
  thresholds: {
    warning: number;
    critical: number;
    emergency: number;
  };
}

export interface ChainConfig {
  chain: string;
  chainId: number;
  enabled: boolean;
  rpcUrls: string[];
  guardianContract?: string;
  websocketEnabled: boolean;
}

export interface SystemConfig {
  // Guardian settings
  guardianEnabled: boolean;
  guardianNetwork: string;
  guardianGasLimit: number;
  
  // Alert settings
  telegramEnabled: boolean;
  telegramChatId?: string;
  twitterEnabled: boolean;
  twitterEmergencyOnly: boolean;
  webhookUrl?: string;
  
  // Detection settings
  minSources: number;
  outlierThreshold: number;
  confirmationsRequired: number;
  detectionIntervalMs: number;
  
  // Rate limiting
  maxGuardianCallsPerHour: number;
  currentGuardianCalls: number;
  lastGuardianCallReset: number;
}

// ============ Chain Status ============

export interface ChainStatus {
  chain: string;
  isHealthy: boolean;
  lastUpdate: number;
  activeFeeds: number;
  avgLatencyMs: number;
  rpcStatus: 'connected' | 'degraded' | 'disconnected';
  errors: string[];
}

// ============ Statistics ============

export interface StatisticalResult {
  median: number;
  weightedMedian: number;
  mean: number;
  standardDeviation: number;
  mad: number;
  outliers: string[];
  confidenceInterval: [number, number];
  bollingerBands: [number, number];
}

// ============ Simulation ============

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  type: typeof IncidentType[keyof typeof IncidentType];
  asset: string;
  chain: string;
  parameters: {
    deviationPercent?: number;
    staleDurationSeconds?: number;
    priceChangeBps?: number;
    timeWindowSeconds?: number;
  };
  expectedDetectionTimeMs: number;
  expectedSeverity: typeof AlertSeverity[keyof typeof AlertSeverity];
}

export interface SimulationResult {
  scenarioId: string;
  detected: boolean;
  detectionTimeMs: number;
  severity: typeof AlertSeverity[keyof typeof AlertSeverity];
  confirmations: number;
  steps: {
    timestamp: number;
    description: string;
    data: any;
  }[];
}

// ============ Zod Schemas for Validation ============

export const oraclePriceSchema = z.object({
  chain: z.string(),
  asset: z.string(),
  symbol: z.string(),
  price: z.number().positive(),
  source: z.string(),
  timestamp: z.number(),
  blockNumber: z.number().optional(),
  confidence: z.number().min(0).max(1),
  deviation: z.number().optional(),
  deviationBps: z.number().optional()
});

export const assetConfigSchema = z.object({
  asset: z.string(),
  symbol: z.string(),
  volatilityClass: z.enum(['stable', 'low', 'medium', 'high', 'veryHigh']),
  networks: z.array(z.string()),
  expectedUpdateInterval: z.number().positive(),
  enabled: z.boolean(),
  thresholds: z.object({
    warning: z.number().positive(),
    critical: z.number().positive(),
    emergency: z.number().positive()
  })
});

export const systemConfigSchema = z.object({
  guardianEnabled: z.boolean(),
  guardianNetwork: z.string(),
  guardianGasLimit: z.number().positive(),
  telegramEnabled: z.boolean(),
  telegramChatId: z.string().optional(),
  twitterEnabled: z.boolean(),
  twitterEmergencyOnly: z.boolean(),
  webhookUrl: z.string().url().optional(),
  minSources: z.number().min(3),
  outlierThreshold: z.number().positive(),
  confirmationsRequired: z.number().min(1),
  detectionIntervalMs: z.number().positive(),
  maxGuardianCallsPerHour: z.number().positive(),
  currentGuardianCalls: z.number().nonnegative(),
  lastGuardianCallReset: z.number()
});

export type OraclePriceInput = z.infer<typeof oraclePriceSchema>;
export type AssetConfigInput = z.infer<typeof assetConfigSchema>;
export type SystemConfigInput = z.infer<typeof systemConfigSchema>;
