/**
 * Kraken Adapter
 * 
 * Fetches real-time spot prices from Kraken
 * Uses FREE public API - no API keys required
 */

import type { OraclePrice } from "@shared/schema";

// Kraken API endpoint (public, free, no auth)
const KRAKEN_API = 'https://api.kraken.com/0/public';

// Kraken trading pairs
const KRAKEN_PAIRS: Record<string, string> = {
  'ETH': 'XETHZUSD',
  'BTC': 'XXBTZUSD',
  'SOL': 'SOLUSD',
  'USDC': 'USDCUSD',
  'LINK': 'LINKUSD',
  'UNI': 'UNIUSD',
  'AAVE': 'AAVEUSD'
};

export class KrakenAdapter {
  /**
   * Fetch price from Kraken (FREE public API)
   */
  public async fetchPrice(
    asset: string,
    symbol: string
  ): Promise<OraclePrice | null> {
    try {
      const pair = KRAKEN_PAIRS[asset];
      if (!pair) {
        return null;
      }

      const url = `${KRAKEN_API}/Ticker?pair=${pair}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Kraken API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error && data.error.length > 0) {
        throw new Error(`Kraken API error: ${data.error.join(', ')}`);
      }

      if (!data.result || !data.result[pair]) {
        return null;
      }

      const ticker = data.result[pair];
      const price = parseFloat(ticker.c[0]); // Last trade price

      // For USDC, price should be close to $1
      const adjustedPrice = asset === 'USDC' ? 1.0 : price;

      return {
        chain: 'exchange', // Exchange price
        asset,
        symbol,
        price: adjustedPrice,
        source: 'Kraken',
        timestamp: Date.now(),
        blockNumber: 0,
        confidence: 0.98,
        deviation: 0,
        deviationBps: 0
      };

    } catch (error) {
      console.error(`Kraken fetch error (${asset}):`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Fetch multiple prices (Kraken supports multiple pairs in one request)
   */
  public async fetchMultiplePrices(assets: string[]): Promise<OraclePrice[]> {
    try {
      const pairs = assets
        .map(asset => KRAKEN_PAIRS[asset])
        .filter(Boolean);

      if (pairs.length === 0) {
        return [];
      }

      // Kraken supports comma-separated pairs
      const pairsList = pairs.join(',');
      const url = `${KRAKEN_API}/Ticker?pair=${pairsList}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Kraken API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error && data.error.length > 0) {
        throw new Error(`Kraken API error: ${data.error.join(', ')}`);
      }

      const prices: OraclePrice[] = [];

      for (const [asset, krakenPair] of Object.entries(KRAKEN_PAIRS)) {
        if (krakenPair in data.result) {
          const ticker = data.result[krakenPair];
          const price = parseFloat(ticker.c[0]);
          const adjustedPrice = asset === 'USDC' ? 1.0 : price;

          prices.push({
            chain: 'exchange',
            asset,
            symbol: `${asset}/USD`,
            price: adjustedPrice,
            source: 'Kraken',
            timestamp: Date.now(),
            blockNumber: 0,
            confidence: 0.98,
            deviation: 0,
            deviationBps: 0
          });
        }
      }

      return prices;

    } catch (error) {
      console.error('Kraken multi-fetch error:', error);
      return [];
    }
  }

  /**
   * Get all supported assets
   */
  public getSupportedAssets(): string[] {
    return Object.keys(KRAKEN_PAIRS);
  }

  /**
   * Check if asset is supported
   */
  public isSupported(asset: string): boolean {
    return asset in KRAKEN_PAIRS;
  }
}

export const krakenAdapter = new KrakenAdapter();
