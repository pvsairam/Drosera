import type { OraclePrice } from '../../shared/schema.js';

interface RedStoneResponse {
  value: number;
  timestamp: number;
  liteEvmSignature?: string;
}

export class RedStoneAdapter {
  private readonly baseUrl = 'https://api.redstone.finance/prices';
  
  private readonly assetMap: Record<string, string> = {
    'ETH': 'ETH',
    'BTC': 'BTC', 
    'SOL': 'SOL',
    'USDC': 'USDC',
    'USDT': 'USDT',
    'LINK': 'LINK',
    'UNI': 'UNI',
    'AAVE': 'AAVE'
  };

  private readonly chainMap: Record<string, string> = {
    'ethereum': 'ethereum',
    'arbitrum': 'arbitrum',
    'optimism': 'optimism',
    'base': 'base',
    'polygon': 'polygon',
    'solana': 'solana'
  };

  async fetchPrices(): Promise<OraclePrice[]> {
    try {
      const prices: OraclePrice[] = [];
      const assets = Object.keys(this.assetMap);

      // RedStone API supports bulk queries
      const symbols = assets.map(a => this.assetMap[a]).join(',');
      const url = `${this.baseUrl}?symbols=${symbols}&provider=redstone`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`RedStone API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json() as Record<string, RedStoneResponse>;

      // RedStone provides unified prices across chains (pull-based oracle)
      // We'll create entries for each chain since RedStone is multi-chain
      const chains = Object.keys(this.chainMap);

      for (const asset of assets) {
        const redstoneAsset = this.assetMap[asset];
        const priceData = data[redstoneAsset];

        if (!priceData || !priceData.value) {
          continue;
        }

        // RedStone is multi-chain, so we create one entry per chain
        // (in production, you'd verify chain-specific deployment)
        for (const chain of chains) {
          prices.push({
            chain: chain,
            asset: asset,
            symbol: asset,
            price: priceData.value,
            timestamp: priceData.timestamp || Date.now(),
            source: 'redstone',
            confidence: 95, // RedStone has high confidence (200+ data sources)
            deviation: 0
          });
        }
      }

      console.log(`✅ RedStone: Fetched ${prices.length} prices from oracle network`);
      return prices;

    } catch (error) {
      console.error('RedStone adapter error:', error);
      return [];
    }
  }

  async fetchPrice(asset: string, chain: string): Promise<OraclePrice | null> {
    const redstoneAsset = this.assetMap[asset];
    if (!redstoneAsset) return null;

    try {
      const url = `${this.baseUrl}?symbols=${redstoneAsset}&provider=redstone`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as Record<string, RedStoneResponse>;
      const priceData = data[redstoneAsset];

      if (!priceData || !priceData.value) {
        return null;
      }

      return {
        chain,
        asset,
        symbol: asset,
        price: priceData.value,
        timestamp: priceData.timestamp || Date.now(),
        source: 'redstone',
        confidence: 95,
        deviation: 0
      };

    } catch (error) {
      console.error(`RedStone error for ${asset}:`, error);
      return null;
    }
  }
}
