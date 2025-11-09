-- ============================================
-- Drosera Oracle Trap - Database Schema
-- PostgreSQL Tables for Neon Database
-- ============================================

-- Drop existing tables if they exist (careful with this in production!)
DROP TABLE IF EXISTS simulation_results CASCADE;
DROP TABLE IF EXISTS simulation_scenarios CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS oracle_prices CASCADE;
DROP TABLE IF EXISTS chain_status CASCADE;
DROP TABLE IF EXISTS asset_configs CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

-- ============================================
-- Table 1: Oracle Prices
-- ============================================
CREATE TABLE oracle_prices (
  id SERIAL PRIMARY KEY,
  chain VARCHAR(50) NOT NULL,
  asset VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  price DECIMAL(30, 8) NOT NULL,
  source VARCHAR(100) NOT NULL,
  timestamp BIGINT NOT NULL,
  block_number BIGINT,
  confidence DECIMAL(5, 4) NOT NULL,
  deviation DECIMAL(10, 4),
  deviation_bps INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes separately
CREATE INDEX idx_oracle_prices_chain_asset ON oracle_prices(chain, asset);
CREATE INDEX idx_oracle_prices_timestamp ON oracle_prices(timestamp DESC);
CREATE INDEX idx_oracle_prices_source ON oracle_prices(source);

-- ============================================
-- Table 2: Incidents
-- ============================================
CREATE TABLE incidents (
  id VARCHAR(100) PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('mispricing', 'stale_oracle', 'flash_loan', 'divergence')),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 0 AND 3),
  chain VARCHAR(50) NOT NULL,
  asset VARCHAR(50) NOT NULL,
  timestamp BIGINT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  
  -- Mispricing specific
  onchain_price DECIMAL(30, 8),
  reference_price DECIMAL(30, 8),
  deviation_bps INTEGER,
  confirmation_count INTEGER,
  
  -- Stale oracle specific  
  last_update_time BIGINT,
  expected_update_interval BIGINT,
  stale_duration BIGINT,
  
  -- Flash loan specific
  price_change_bps INTEGER,
  time_window_seconds INTEGER,
  volume_multiplier DECIMAL(10, 2),
  tx_hash VARCHAR(100),
  
  -- Divergence specific
  standard_deviation_bps INTEGER,
  source_count INTEGER,
  price_range_min DECIMAL(30, 8),
  price_range_max DECIMAL(30, 8),
  
  -- Alert status
  sent_to_telegram BOOLEAN DEFAULT FALSE,
  sent_to_twitter BOOLEAN DEFAULT FALSE,
  telegram_message_id VARCHAR(100),
  twitter_tweet_id VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes separately
CREATE INDEX idx_incidents_timestamp ON incidents(timestamp DESC);
CREATE INDEX idx_incidents_chain_asset ON incidents(chain, asset);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_acknowledged ON incidents(acknowledged);

-- ============================================
-- Table 3: Asset Configurations
-- ============================================
CREATE TABLE asset_configs (
  asset VARCHAR(50) PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  volatility_class VARCHAR(20) NOT NULL CHECK (volatility_class IN ('stable', 'low', 'medium', 'high', 'veryHigh')),
  networks JSONB NOT NULL,
  expected_update_interval BIGINT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  thresholds JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table 4: System Configuration
-- ============================================
CREATE TABLE system_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- Guardian settings
  guardian_enabled BOOLEAN DEFAULT FALSE,
  guardian_network VARCHAR(50) DEFAULT 'ethereum',
  guardian_gas_limit INTEGER DEFAULT 500000,
  guardian_call_limit_per_hour INTEGER DEFAULT 10,
  
  -- Monitoring settings
  monitoring_interval INTEGER DEFAULT 1000,
  detection_enabled BOOLEAN DEFAULT TRUE,
  
  -- Alert settings
  telegram_alerts_enabled BOOLEAN DEFAULT TRUE,
  twitter_alerts_enabled BOOLEAN DEFAULT FALSE,
  alert_cooldown_minutes INTEGER DEFAULT 5,
  min_severity_telegram INTEGER DEFAULT 1,
  min_severity_twitter INTEGER DEFAULT 3,
  
  -- Detection settings
  min_sources INTEGER DEFAULT 3,
  outlier_threshold INTEGER DEFAULT 1500,
  confirmations_required INTEGER DEFAULT 3,
  
  -- Rate limiting
  current_guardian_calls INTEGER DEFAULT 0,
  last_guardian_call_reset BIGINT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure only one row
  CONSTRAINT single_row CHECK (id = 1)
);

-- ============================================
-- Table 5: Chain Status
-- ============================================
CREATE TABLE chain_status (
  chain VARCHAR(50) PRIMARY KEY,
  is_healthy BOOLEAN DEFAULT TRUE,
  last_successful_fetch BIGINT NOT NULL,
  last_error TEXT,
  consecutive_errors INTEGER DEFAULT 0,
  active_feeds INTEGER DEFAULT 0,
  average_latency INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table 6: Simulation Scenarios
-- ============================================
CREATE TABLE simulation_scenarios (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  chain VARCHAR(50) NOT NULL,
  asset VARCHAR(50) NOT NULL,
  price_manipulation INTEGER NOT NULL,
  volume_spike DECIMAL(5, 2) DEFAULT 1.0,
  detection_delay BIGINT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Insert Default System Configuration
-- ============================================
INSERT INTO system_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Insert Default Asset Configurations
-- ============================================
INSERT INTO asset_configs (asset, symbol, volatility_class, networks, expected_update_interval, enabled, thresholds)
VALUES
  ('ETH', 'ETH', 'medium', '["ethereum", "arbitrum", "optimism", "base", "polygon"]', 60000, true, 
   '{"warning": 500, "critical": 1500, "emergency": 2500}'),
  
  ('BTC', 'BTC', 'medium', '["ethereum", "arbitrum", "optimism", "base", "solana"]', 60000, true,
   '{"warning": 500, "critical": 1500, "emergency": 2500}'),
  
  ('USDC', 'USDC', 'stable', '["ethereum", "arbitrum", "optimism", "base", "polygon", "solana"]', 300000, true,
   '{"warning": 50, "critical": 100, "emergency": 200}'),
  
  ('USDT', 'USDT', 'stable', '["ethereum", "arbitrum", "optimism", "polygon", "solana"]', 300000, true,
   '{"warning": 50, "critical": 100, "emergency": 200}'),
   
  ('SOL', 'SOL', 'high', '["solana"]', 60000, true,
   '{"warning": 700, "critical": 2000, "emergency": 3000}'),
   
  ('MATIC', 'MATIC', 'medium', '["ethereum", "polygon"]', 60000, true,
   '{"warning": 600, "critical": 1800, "emergency": 2800}')
ON CONFLICT (asset) DO NOTHING;

-- ============================================
-- Insert Chain Status Records
-- ============================================
INSERT INTO chain_status (chain, is_healthy, last_successful_fetch, active_feeds, average_latency)
VALUES
  ('ethereum', true, EXTRACT(EPOCH FROM NOW()) * 1000, 8, 100),
  ('arbitrum', true, EXTRACT(EPOCH FROM NOW()) * 1000, 8, 80),
  ('optimism', true, EXTRACT(EPOCH FROM NOW()) * 1000, 8, 80),
  ('base', true, EXTRACT(EPOCH FROM NOW()) * 1000, 8, 70),
  ('polygon', true, EXTRACT(EPOCH FROM NOW()) * 1000, 8, 90),
  ('solana', true, EXTRACT(EPOCH FROM NOW()) * 1000, 8, 120)
ON CONFLICT (chain) DO NOTHING;

-- ============================================
-- Insert Simulation Scenarios
-- ============================================
INSERT INTO simulation_scenarios (name, description, chain, asset, price_manipulation, volume_spike, detection_delay, enabled)
VALUES
  ('Flash Loan Attack', 'Simulate a rapid 25% price manipulation attack within 15 seconds', 
   'ethereum', 'ETH', 2500, 5.0, 15000, true),
   
  ('Stale Oracle', 'Simulate oracle not updating for 1 hour', 
   'arbitrum', 'BTC', 0, 1.0, 3600000, true),
   
  ('Source Divergence', 'Simulate 20% price divergence between oracle sources', 
   'base', 'ETH', 2000, 1.0, 5000, true),
   
  ('Stablecoin Depeg', 'Simulate USDC dropping to $0.90 (10% depeg)', 
   'ethereum', 'USDC', 1000, 1.5, 10000, true),
   
  ('High Volatility Spike', 'Simulate SOL experiencing 30% rapid price increase', 
   'solana', 'SOL', 3000, 3.0, 8000, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Create Update Trigger for updated_at columns
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asset_configs_updated_at
BEFORE UPDATE ON asset_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON system_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chain_status_updated_at
BEFORE UPDATE ON chain_status
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify tables were created successfully:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM asset_configs;
-- SELECT * FROM system_config;
-- SELECT * FROM chain_status;
-- SELECT * FROM simulation_scenarios;

-- ============================================
-- Success!
-- ============================================
-- All tables created successfully
-- Total tables: 6
-- Initial data seeded:
--   - 6 asset configurations (ETH, BTC, USDC, USDT, SOL, MATIC)
--   - 6 chain status records
--   - 5 simulation scenarios
--   - 1 system configuration
