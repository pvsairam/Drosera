/**
 * Binance Adapter
 * 
 * Fetches real-time spot prices from Binance
 * Uses FREE public API - no API keys required
 */

import type { OraclePrice } from "@shared/schema";

// Binance API endpoint (public, free, no auth)
const BINANCE_API = 'https://api.binance.com/api/v3';

// Binance trading pairs
const BINANCE_PAIRS: Record<string, string> = {
  'ETH': 'ETHUSDT',
  'BTC': 'BTCUSDT',
  'SOL': 'SOLUSDT',
  'USDC': 'USDCUSDT',
  'LINK': 'LINKUSDT',
  'UNI': 'UNIUSDT',
  'AAVE': 'AAVEUSDT'
};

export class BinanceAdapter {
  /**
   * Fetch price from Binance (FREE public API)
   */
  public async fetchPrice(
    asset: string,
    symbol: string
  ): Promise<OraclePrice | null> {
    try {
      const pair = BINANCE_PAIRS[asset];
      if (!pair) {
        return null; // Asset not supported
      }

      const url = `${BINANCE_API}/ticker/price?symbol=${pair}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.price) {
        return null;
      }

      const price = parseFloat(data.price);

      // For USDC/USDT pairs, adjust to get actual USD price
      const adjustedPrice = asset === 'USDC' ? 1.0 : price;

      return {
        chain: 'exchange', // Exchange price (not chain-specific)
        asset,
        symbol,
        price: adjustedPrice,
        source: 'Binance',
        timestamp: Date.now(), // Binance doesn't provide timestamp in price endpoint
        blockNumber: 0,
        confidence: 0.98, // Exchange data is highly reliable
        deviation: 0,
        deviationBps: 0
      };

    } catch (error) {
      console.error(`Binance fetch error (${asset}):`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Fetch multiple prices using batch endpoint (more efficient)
   */
  public async fetchMultiplePrices(assets: string[]): Promise<OraclePrice[]> {
    try {
      const pairs = assets
        .map(asset => BINANCE_PAIRS[asset])
        .filter(Boolean);

      if (pairs.length === 0) {
        return [];
      }

      // Binance allows batch ticker requests
      const url = `${BINANCE_API}/ticker/price`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();
      const prices: OraclePrice[] = [];

      // Filter to our pairs
      const relevantData = data.filter((item: any) => pairs.includes(item.symbol));

      for (const item of relevantData) {
        // Find asset from pair
        const asset = Object.entries(BINANCE_PAIRS).find(
          ([_, pair]) => pair === item.symbol
        )?.[0];

        if (!asset) continue;

        const price = parseFloat(item.price);
        const adjustedPrice = asset === 'USDC' ? 1.0 : price;

        prices.push({
          chain: 'exchange',
          asset,
          symbol: `${asset}/USD`,
          price: adjustedPrice,
          source: 'Binance',
          timestamp: Date.now(),
          blockNumber: 0,
          confidence: 0.98,
          deviation: 0,
          deviationBps: 0
        });
      }

      return prices;

    } catch (error) {
      console.error('Binance multi-fetch error:', error);
      return [];
    }
  }

  /**
   * Get all supported assets
   */
  public getSupportedAssets(): string[] {
    return Object.keys(BINANCE_PAIRS);
  }

  /**
   * Check if asset is supported
   */
  public isSupported(asset: string): boolean {
    return asset in BINANCE_PAIRS;
  }
}

export const binanceAdapter = new BinanceAdapter();
