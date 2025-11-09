// Detection engine that looks for oracle problems
// Checks for bad prices, stale feeds, flash loan attacks, and source disagreements

import type { OraclePrice, AssetConfig, Incident, AlertSeverity } from '@shared/schema';

export interface DetectionResult {
  detected: boolean;
  type: 'mispricing' | 'stale_oracle' | 'flash_loan' | 'divergence' | null;
  severity: typeof AlertSeverity[keyof typeof AlertSeverity];
  details: any;
}

export class DetectionEngine {
  private priceHistory: Map<string, OraclePrice[]> = new Map(); // asset+chain -> history
  private readonly HISTORY_SIZE = 100;
  private readonly FLASH_LOAN_WINDOW_MS = 15000; // 15 seconds

  // Main detection function - checks prices for all types of problems
  public async analyzePrices(
    asset: string,
    prices: OraclePrice[],
    config: AssetConfig
  ): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    // Check if any oracles stopped updating
    // Like if Chainlink is stuck at $2000 for 10 minutes
    for (const price of prices) {
      const staleResult = this.detectStaleOracle(price, config);
      if (staleResult.detected) {
        results.push(staleResult);
      }
    }

    // Look for flash loan attacks
    // Price jumping from $2000 to $2600 and back in 15 seconds
    for (const price of prices) {
      const flashLoanResult = this.detectFlashLoan(price, asset);
      if (flashLoanResult.detected) {
        results.push(flashLoanResult);
      }
    }

    // Run statistical checks if we have enough data sources
    // Need at least 3 to properly calculate median and spot outliers
    if (prices.length >= 3) {
      const statisticalResults = this.performStatisticalAnalysis(prices, config);
      results.push(...statisticalResults);
    }

    return results;
  }

  /**
   * Detect stale oracle (not updating)
   */
  private detectStaleOracle(
    price: OraclePrice,
    config: AssetConfig
  ): DetectionResult {
    const timeSinceUpdate = Date.now() - price.timestamp;
    const expectedInterval = config.expectedUpdateInterval * 1000; // Convert to ms
    const staleDuration = timeSinceUpdate - expectedInterval;

    if (staleDuration > expectedInterval * 2) {
      // More than 2x expected interval
      const severity = staleDuration > expectedInterval * 5 ? 2 : 1; // Critical if 5x over

      return {
        detected: true,
        type: 'stale_oracle',
        severity,
        details: {
          staleDuration: staleDuration / 1000, // Convert to seconds
          lastUpdateTime: price.timestamp,
          expectedUpdateInterval: config.expectedUpdateInterval
        }
      };
    }

    return { detected: false, type: null, severity: 0, details: {} };
  }

  /**
   * Detect flash loan attacks (rapid price manipulation)
   */
  private detectFlashLoan(
    currentPrice: OraclePrice,
    asset: string
  ): DetectionResult {
    const key = `${asset}-${currentPrice.chain}`;
    const history = this.priceHistory.get(key) || [];

    // Add current price to history
    history.push(currentPrice);
    if (history.length > this.HISTORY_SIZE) {
      history.shift();
    }
    this.priceHistory.set(key, history);

    // Check for rapid price change in recent window
    const recentPrices = history.filter(
      p => currentPrice.timestamp - p.timestamp < this.FLASH_LOAN_WINDOW_MS
    );

    if (recentPrices.length < 2) {
      return { detected: false, type: null, severity: 0, details: {} };
    }

    const prices = recentPrices.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceChangeBps = ((maxPrice - minPrice) / minPrice) * 10000;

    // Flash loan detected if >20% change in <15 seconds
    if (priceChangeBps > 2000) {
      return {
        detected: true,
        type: 'flash_loan',
        severity: 3, // Always EMERGENCY
        details: {
          priceChangeBps,
          timeWindowSeconds: this.FLASH_LOAN_WINDOW_MS / 1000,
          minPrice,
          maxPrice,
          volumeMultiplier: 0 // TODO: Add volume tracking
        }
      };
    }

    return { detected: false, type: null, severity: 0, details: {} };
  }

  /**
   * Statistical analysis: weighted median, MAD, outlier detection
   */
  private performStatisticalAnalysis(
    prices: OraclePrice[],
    config: AssetConfig
  ): DetectionResult[] {
    const results: DetectionResult[] = [];

    // Calculate statistics
    const values = prices.map(p => p.price);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // Calculate MAD (Median Absolute Deviation)
    const deviationsFromMedian = values.map(v => Math.abs(v - median));
    const sortedDeviations = [...deviationsFromMedian].sort((a, b) => a - b);
    const mad = sortedDeviations[Math.floor(sortedDeviations.length / 2)];

    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const stdDevBps = (stdDev / mean) * 10000;

    // Check for divergence (high std deviation across sources)
    if (stdDevBps > 1000) { // >10% divergence
      const severity = stdDevBps > 2000 ? 3 : stdDevBps > 1500 ? 2 : 1;

      results.push({
        detected: true,
        type: 'divergence',
        severity,
        details: {
          standardDeviationBps: stdDevBps,
          sourceCount: prices.length,
          priceRange: [Math.min(...values), Math.max(...values)]
        }
      });
    }

    // Check each price for mispricing (outliers)
    const zScoreThreshold = 2.5;
    
    prices.forEach(price => {
      const deviationFromMedian = Math.abs(price.price - median);
      const zScore = mad > 0 ? deviationFromMedian / mad : 0;
      const deviationBps = ((price.price - median) / median) * 10000;

      // Check against configured thresholds
      const absDeviationPercent = Math.abs(deviationBps) / 100;

      if (absDeviationPercent > config.thresholds.warning || zScore > zScoreThreshold) {
        let severity: 0 | 1 | 2 | 3 = 1; // WARNING
        
        if (absDeviationPercent > config.thresholds.emergency) {
          severity = 3; // EMERGENCY
        } else if (absDeviationPercent > config.thresholds.critical) {
          severity = 2; // CRITICAL
        }

        results.push({
          detected: true,
          type: 'mispricing',
          severity,
          details: {
            onchainPrice: price.price,
            referencePrice: median,
            deviationBps: Math.abs(deviationBps),
            chain: price.chain,
            zScore
          }
        });
      }
    });

    return results;
  }

  /**
   * Clear history (useful for testing)
   */
  public clearHistory() {
    this.priceHistory.clear();
  }
}

export const detectionEngine = new DetectionEngine();
