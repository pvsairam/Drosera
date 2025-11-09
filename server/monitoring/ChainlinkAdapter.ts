/**
 * Chainlink Adapter
 * 
 * Fetches real-time prices from Chainlink price feeds
 * Uses FREE public RPC endpoints - no API keys required
 */

import { ethers } from 'ethers';
import type { OraclePrice } from "@shared/schema";

// Chainlink Price Feed Addresses (Mainnet)
const CHAINLINK_FEEDS: Record<string, Record<string, string>> = {
  ethereum: {
    'ETH': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH/USD
    'BTC': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', // BTC/USD
    'USDC': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', // USDC/USD
  },
  arbitrum: {
    'ETH': '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612', // ETH/USD
    'BTC': '0x6ce185860a4963106506C203335A2910413708e9', // BTC/USD
  },
  optimism: {
    'ETH': '0x13e3Ee699D1909E989722E753853AE30b17e08c5', // ETH/USD
    'BTC': '0xD702DD976Fb76Fffc2D3963D037dfDae5b04E593', // BTC/USD
  },
  base: {
    'ETH': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70', // ETH/USD
  }
};

// Free Public RPC Endpoints (no API keys required)
const PUBLIC_RPC_URLS: Record<string, string> = {
  ethereum: 'https://cloudflare-eth.com', // Cloudflare's free Ethereum RPC
  arbitrum: 'https://arb1.arbitrum.io/rpc', // Official Arbitrum RPC
  optimism: 'https://mainnet.optimism.io', // Official Optimism RPC
  base: 'https://mainnet.base.org' // Official Base RPC
};

// Chainlink Aggregator ABI (minimal - just what we need)
const AGGREGATOR_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() external view returns (uint8)"
];

export class ChainlinkAdapter {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  /**
   * Get or create provider for a chain
   */
  private getProvider(chain: string): ethers.JsonRpcProvider | null {
    const rpcUrl = PUBLIC_RPC_URLS[chain];
    if (!rpcUrl) return null;

    if (!this.providers.has(chain)) {
      this.providers.set(chain, new ethers.JsonRpcProvider(rpcUrl));
    }

    return this.providers.get(chain)!;
  }

  /**
   * Fetch price from Chainlink oracle (FREE - reads public contract)
   */
  public async fetchPrice(
    chain: string,
    asset: string,
    symbol: string
  ): Promise<OraclePrice | null> {
    try {
      const feedAddress = CHAINLINK_FEEDS[chain]?.[asset];
      const provider = this.getProvider(chain);

      if (!feedAddress || !provider) {
        return null; // Chain or asset not supported
      }

      // Create contract instance
      const contract = new ethers.Contract(feedAddress, AGGREGATOR_ABI, provider);

      // Fetch latest round data and decimals in parallel
      const [roundData, decimals] = await Promise.all([
        contract.latestRoundData(),
        contract.decimals()
      ]);

      // Extract values from roundData tuple
      const answer = roundData[1]; // int256 answer
      const updatedAt = Number(roundData[3]); // uint256 updatedAt

      // Convert to human-readable price
      const price = Number(answer) / Math.pow(10, Number(decimals));

      return {
        chain,
        asset,
        symbol,
        price,
        source: 'Chainlink',
        timestamp: updatedAt * 1000, // Convert to milliseconds
        blockNumber: 0, // Not needed for price feeds
        confidence: 0.99, // Chainlink is highly reliable
        deviation: 0,
        deviationBps: 0
      };

    } catch (error) {
      console.error(`Chainlink fetch error (${chain}/${asset}):`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Fetch prices for all supported assets on a chain
   */
  public async fetchAllPrices(chain: string): Promise<OraclePrice[]> {
    const prices: OraclePrice[] = [];
    const assets = Object.keys(CHAINLINK_FEEDS[chain] || {});

    // Fetch all prices in parallel for efficiency
    const results = await Promise.allSettled(
      assets.map(asset => this.fetchPrice(chain, asset, `${asset}/USD`))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        prices.push(result.value);
      }
    }

    return prices;
  }

  /**
   * Get supported chains
   */
  public getSupportedChains(): string[] {
    return Object.keys(CHAINLINK_FEEDS);
  }

  /**
   * Get supported assets for a chain
   */
  public getSupportedAssets(chain: string): string[] {
    return Object.keys(CHAINLINK_FEEDS[chain] || {});
  }
}

export const chainlinkAdapter = new ChainlinkAdapter();
