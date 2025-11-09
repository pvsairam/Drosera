// Adapter for getting prices from Pyth Network
// Totally free to use, no API key needed

import type { OraclePrice } from "@shared/schema";

// Pyth Price Feed IDs (these are public and free to use)
const PYTH_PRICE_IDS: Record<string, string> = {
  'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
  'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC/USD
  'SOL': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', // SOL/USD
  'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', // USDC/USD
};

// Free Pyth Network endpoints
const PYTH_ENDPOINTS = {
  http: 'https://hermes.pyth.network',
  ws: 'wss://hermes.pyth.network/ws'
};

export class PythAdapter {
  /**
   * Fetch latest price from Pyth (FREE public API)
   */
  public async fetchPrice(
    asset: string,
    symbol: string
  ): Promise<OraclePrice | null> {
    try {
      const priceId = PYTH_PRICE_IDS[asset];
      if (!priceId) {
        return null; // Asset not supported
      }

      // Fetch from Pyth HTTP API
      const url = `${PYTH_ENDPOINTS.http}/api/latest_price_feeds?ids[]=${priceId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Pyth API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      const priceData = data[0];
      const price = priceData.price;

      // Pyth returns price with exponent
      const humanPrice = Number(price.price) * Math.pow(10, price.expo);
      const confidence = Number(price.conf) * Math.pow(10, price.expo);
      const publishTime = Number(price.publish_time);

      return {
        chain: 'solana',
        asset,
        symbol,
        price: humanPrice,
        source: 'Pyth',
        timestamp: publishTime * 1000, // Convert to milliseconds
        blockNumber: 0,
        confidence: confidence > 0 ? 1 - (confidence / humanPrice) : 0.99,
        deviation: 0,
        deviationBps: 0
      };

    } catch (error) {
      console.error(`Pyth fetch error (${asset}):`, error);
      return null;
    }
  }

  /**
   * Fetch multiple prices at once (more efficient)
   */
  public async fetchMultiplePrices(assets: string[]): Promise<OraclePrice[]> {
    try {
      const priceIds = assets
        .map(asset => PYTH_PRICE_IDS[asset])
        .filter(Boolean);

      if (priceIds.length === 0) {
        return [];
      }

      // Build URL with multiple price IDs
      const idsParam = priceIds.map(id => `ids[]=${id}`).join('&');
      const url = `${PYTH_ENDPOINTS.http}/api/latest_price_feeds?${idsParam}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Pyth API error: ${response.status}`);
      }

      const data = await response.json();
      const prices: OraclePrice[] = [];

      for (const priceData of data) {
        const price = priceData.price;
        
        // Find asset name from price ID
        const asset = Object.entries(PYTH_PRICE_IDS).find(
          ([_, id]) => id === priceData.id
        )?.[0];

        if (!asset) continue;

        const humanPrice = Number(price.price) * Math.pow(10, price.expo);
        const confidence = Number(price.conf) * Math.pow(10, price.expo);
        const publishTime = Number(price.publish_time);

        prices.push({
          chain: 'solana',
          asset,
          symbol: `${asset}/USD`,
          price: humanPrice,
          source: 'Pyth',
          timestamp: publishTime * 1000,
          blockNumber: 0,
          confidence: confidence > 0 ? 1 - (confidence / humanPrice) : 0.99,
          deviation: 0,
          deviationBps: 0
        });
      }

      return prices;

    } catch (error) {
      console.error('Pyth multi-fetch error:', error);
      return [];
    }
  }

  /**
   * Get all supported assets
   */
  public getSupportedAssets(): string[] {
    return Object.keys(PYTH_PRICE_IDS);
  }

  /**
   * Check if asset is supported
   */
  public isSupported(asset: string): boolean {
    return asset in PYTH_PRICE_IDS;
  }
}

export const pythAdapter = new PythAdapter();
