# Execute SQL on Neon Database

Quick guide to run the SQL script on your Neon database.

---

## Method 1: Neon SQL Editor (Easiest - No Tools Needed!)

1. **Go to**: https://console.neon.tech
2. **Select your project** (the one you created for Drosera)
3. Click **"SQL Editor"** in the left sidebar
4. **Copy the entire contents** of `create-tables.sql`
5. **Paste into the SQL editor**
6. Click **"Run"** button (or press Ctrl/Cmd + Enter)
7. **Wait** for execution (should take <10 seconds)

**Expected Output**:
```
✅ Query executed successfully
✅ 6 tables created
✅ 18 rows inserted
```

---

## Method 2: Using psql CLI

If you have PostgreSQL client installed:

```bash
# Set your Neon connection string
export DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/oracledb?sslmode=require"

# Run the SQL file
psql $DATABASE_URL < create-tables.sql
```

---

## Method 3: Using Node.js Script

```bash
# Create a simple script
cat > run-sql.js << 'EOF'
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);
const sqlScript = fs.readFileSync('create-tables.sql', 'utf8');

// Split and execute (simple approach)
const statements = sqlScript
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

for (const statement of statements) {
  try {
    await sql(statement);
    console.log('✅ Executed:', statement.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log('\n🎉 Database setup complete!');
EOF

# Run it
tsx run-sql.js
```

---

## Verify Tables Were Created

After running the SQL, verify in Neon SQL Editor:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Tables**:
- asset_configs
- chain_status
- incidents
- oracle_prices
- simulation_scenarios
- system_config

---

## Check Initial Data

```sql
-- Check asset configurations
SELECT asset, symbol, volatility_class, enabled FROM asset_configs;

-- Check chain status
SELECT chain, is_healthy, active_feeds FROM chain_status;

-- Check system config
SELECT guardian_enabled, detection_enabled, telegram_alerts_enabled FROM system_config;

-- Check simulation scenarios
SELECT name, chain, asset, enabled FROM simulation_scenarios;
```

**Expected Results**:
- ✅ 6 assets configured (ETH, BTC, USDC, USDT, SOL, MATIC)
- ✅ 6 chains initialized (ethereum, arbitrum, optimism, base, polygon, solana)
- ✅ 1 system configuration
- ✅ 5 simulation scenarios

---

## If You Get Errors

### Error: "relation already exists"

**Solution**: Tables already exist! You're good to go.

### Error: "permission denied"

**Solution**: Make sure you're using the database owner credentials (not read-only user).

### Error: "connection timeout"

**Solution**: 
1. Check Neon is not suspended (visit console.neon.tech to wake it)
2. Verify connection string is correct
3. Ensure `?sslmode=require` is at the end

---

## Next Steps

After tables are created:

1. ✅ Update your `DATABASE_URL` in Vercel environment variables
2. ✅ Deploy to Vercel
3. ✅ Your app will now use PostgreSQL instead of in-memory storage!

---

**That's it!** Your Neon database is now ready for production. 🚀
