/**
 * CoinGecko Adapter
 * 
 * Fetches real-time spot prices from CoinGecko
 * Uses FREE public API - no API keys required, no rate limits for simple calls
 */

import type { OraclePrice } from "@shared/schema";

// CoinGecko API endpoint (public, free, no auth)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// CoinGecko coin IDs
const COIN_IDS: Record<string, string> = {
  'ETH': 'ethereum',
  'BTC': 'bitcoin',
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave'
};

export class CoinGeckoAdapter {
  private lastFetch: number = 0;
  private minFetchInterval: number = 5000; // Rate limit: 5 seconds between calls

  /**
   * Fetch price from CoinGecko (FREE public API)
   */
  public async fetchPrice(
    asset: string,
    symbol: string
  ): Promise<OraclePrice | null> {
    try {
      const coinId = COIN_IDS[asset];
      if (!coinId) {
        return null; // Asset not supported
      }

      // Simple rate limiting (be respectful to free API)
      const now = Date.now();
      if (now - this.lastFetch < this.minFetchInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minFetchInterval - (now - this.lastFetch)));
      }
      this.lastFetch = Date.now();

      const url = `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_last_updated_at=true`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data[coinId] || !data[coinId].usd) {
        return null;
      }

      const price = data[coinId].usd;
      const lastUpdated = data[coinId].last_updated_at || Math.floor(Date.now() / 1000);

      return {
        chain: 'market', // Market price (not chain-specific)
        asset,
        symbol,
        price,
        source: 'CoinGecko',
        timestamp: lastUpdated * 1000,
        blockNumber: 0,
        confidence: 0.95, // Market data is reliable but not oracle-grade
        deviation: 0,
        deviationBps: 0
      };

    } catch (error) {
      console.error(`CoinGecko fetch error (${asset}):`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Fetch multiple prices in one call (more efficient)
   */
  public async fetchMultiplePrices(assets: string[]): Promise<OraclePrice[]> {
    try {
      const coinIds = assets
        .map(asset => COIN_IDS[asset])
        .filter(Boolean);

      if (coinIds.length === 0) {
        return [];
      }

      // Rate limiting
      const now = Date.now();
      if (now - this.lastFetch < this.minFetchInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minFetchInterval - (now - this.lastFetch)));
      }
      this.lastFetch = Date.now();

      const idsParam = coinIds.join(',');
      const url = `${COINGECKO_API}/simple/price?ids=${idsParam}&vs_currencies=usd&include_last_updated_at=true`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const prices: OraclePrice[] = [];

      for (const [asset, coinId] of Object.entries(COIN_IDS)) {
        if (coinId in data && data[coinId].usd) {
          prices.push({
            chain: 'market',
            asset,
            symbol: `${asset}/USD`,
            price: data[coinId].usd,
            source: 'CoinGecko',
            timestamp: (data[coinId].last_updated_at || Math.floor(Date.now() / 1000)) * 1000,
            blockNumber: 0,
            confidence: 0.95,
            deviation: 0,
            deviationBps: 0
          });
        }
      }

      return prices;

    } catch (error) {
      console.error('CoinGecko multi-fetch error:', error);
      return [];
    }
  }

  /**
   * Get all supported assets
   */
  public getSupportedAssets(): string[] {
    return Object.keys(COIN_IDS);
  }

  /**
   * Check if asset is supported
   */
  public isSupported(asset: string): boolean {
    return asset in COIN_IDS;
  }
}

export const coinGeckoAdapter = new CoinGeckoAdapter();
