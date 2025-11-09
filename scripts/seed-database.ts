import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

async function main() {
  console.log('🌱 Seeding database with initial configuration...');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  try {
    console.log('📝 Inserting default asset configurations...');
    
    // Insert default asset configs (if they don't exist)
    const assets = [
      {
        asset: 'ETH',
        symbol: 'ETH',
        volatilityClass: 'medium' as const,
        networks: ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon'],
        expectedUpdateInterval: 60000, // 1 minute
        enabled: true,
        thresholds: {
          warning: 500,    // 5%
          critical: 1500,  // 15%
          emergency: 2500  // 25%
        }
      },
      {
        asset: 'BTC',
        symbol: 'BTC',
        volatilityClass: 'medium' as const,
        networks: ['ethereum', 'arbitrum', 'optimism', 'base', 'solana'],
        expectedUpdateInterval: 60000,
        enabled: true,
        thresholds: {
          warning: 500,
          critical: 1500,
          emergency: 2500
        }
      },
      {
        asset: 'USDC',
        symbol: 'USDC',
        volatilityClass: 'stable' as const,
        networks: ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'solana'],
        expectedUpdateInterval: 300000, // 5 minutes
        enabled: true,
        thresholds: {
          warning: 50,     // 0.5%
          critical: 100,   // 1%
          emergency: 200   // 2%
        }
      },
      {
        asset: 'USDT',
        symbol: 'USDT',
        volatilityClass: 'stable' as const,
        networks: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'solana'],
        expectedUpdateInterval: 300000,
        enabled: true,
        thresholds: {
          warning: 50,
          critical: 100,
          emergency: 200
        }
      }
    ];

    console.log(`💾 Seeding ${assets.length} asset configurations...`);

    for (const asset of assets) {
      await sql`
        INSERT INTO asset_configs (
          asset, symbol, volatility_class, networks, 
          expected_update_interval, enabled, thresholds
        ) VALUES (
          ${asset.asset},
          ${asset.symbol},
          ${asset.volatilityClass},
          ${JSON.stringify(asset.networks)},
          ${asset.expectedUpdateInterval},
          ${asset.enabled},
          ${JSON.stringify(asset.thresholds)}
        )
        ON CONFLICT (asset) DO NOTHING
      `;
      console.log(`  ✅ ${asset.symbol} configuration`);
    }

    console.log('');
    console.log('📊 Inserting default system configuration...');

    await sql`
      INSERT INTO system_config (
        id,
        guardian_enabled,
        guardian_network,
        guardian_gas_limit,
        guardian_call_limit_per_hour,
        monitoring_interval,
        detection_enabled,
        telegram_alerts_enabled,
        twitter_alerts_enabled,
        alert_cooldown_minutes,
        min_severity_telegram,
        min_severity_twitter
      ) VALUES (
        1,
        false,
        'ethereum',
        500000,
        10,
        1000,
        true,
        true,
        false,
        5,
        1,
        3
      )
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('  ✅ System configuration');

    console.log('');
    console.log('⛓️  Inserting chain status...');

    const chains = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'solana'];
    for (const chain of chains) {
      await sql`
        INSERT INTO chain_status (
          chain,
          is_healthy,
          last_successful_fetch,
          last_error,
          consecutive_errors,
          active_feeds,
          average_latency
        ) VALUES (
          ${chain},
          true,
          ${Date.now()},
          NULL,
          0,
          8,
          100
        )
        ON CONFLICT (chain) DO NOTHING
      `;
      console.log(`  ✅ ${chain}`);
    }

    console.log('');
    console.log('🎬 Inserting simulation scenarios...');

    const scenarios = [
      {
        name: 'Flash Loan Attack',
        description: 'Simulate a rapid price manipulation attack within 15 seconds',
        chain: 'ethereum',
        asset: 'ETH',
        priceManipulation: 2500,  // 25% price change
        volumeSpike: 5,
        detectionDelay: 15000,
        enabled: true
      },
      {
        name: 'Stale Oracle',
        description: 'Simulate oracle not updating for 1 hour',
        chain: 'arbitrum',
        asset: 'BTC',
        priceManipulation: 0,
        volumeSpike: 1,
        detectionDelay: 3600000,  // 1 hour
        enabled: true
      },
      {
        name: 'Source Divergence',
        description: 'Simulate 20%+ price divergence between oracle sources',
        chain: 'base',
        asset: 'ETH',
        priceManipulation: 2000,  // 20% divergence
        volumeSpike: 1,
        detectionDelay: 5000,
        enabled: true
      }
    ];

    for (const scenario of scenarios) {
      await sql`
        INSERT INTO simulation_scenarios (
          name, description, chain, asset,
          price_manipulation, volume_spike,
          detection_delay, enabled
        ) VALUES (
          ${scenario.name},
          ${scenario.description},
          ${scenario.chain},
          ${scenario.asset},
          ${scenario.priceManipulation},
          ${scenario.volumeSpike},
          ${scenario.detectionDelay},
          ${scenario.enabled}
        )
        ON CONFLICT (name) DO NOTHING
      `;
      console.log(`  ✅ ${scenario.name}`);
    }

    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  - ${assets.length} assets configured`);
    console.log(`  - ${chains.length} chains initialized`);
    console.log(`  - ${scenarios.length} simulation scenarios`);
    console.log('  - System configuration ready');
    console.log('');
    console.log('🎉 Your database is ready for production!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
