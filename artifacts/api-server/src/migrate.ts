import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  await client.connect();
  console.log("Connected to Supabase");

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id VARCHAR(64) NOT NULL UNIQUE,
      username VARCHAR(128),
      first_name VARCHAR(128),
      last_name VARCHAR(128),
      wallet_address VARCHAR(42),
      referral_code VARCHAR(16) NOT NULL UNIQUE,
      referred_by VARCHAR(16),
      claim_status VARCHAR(16) NOT NULL DEFAULT 'pending',
      total_rewards VARCHAR(64) NOT NULL DEFAULT '0',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS claims (
      id SERIAL PRIMARY KEY,
      telegram_id VARCHAR(64) NOT NULL,
      wallet_address VARCHAR(42) NOT NULL,
      token_amount VARCHAR(64) NOT NULL,
      fee_paid VARCHAR(64) NOT NULL,
      tx_hash VARCHAR(66) NOT NULL,
      token_symbol VARCHAR(20) NOT NULL DEFAULT 'NOVA',
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      type VARCHAR(32) NOT NULL,
      title VARCHAR(128) NOT NULL,
      description TEXT NOT NULL,
      reward_amount VARCHAR(64) NOT NULL,
      reward_token VARCHAR(20) NOT NULL,
      required_count INTEGER,
      action_url VARCHAR(256),
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE TABLE IF NOT EXISTS user_tasks (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL,
      telegram_id VARCHAR(64) NOT NULL,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMPTZ,
      proof VARCHAR(256)
    );
    CREATE TABLE IF NOT EXISTS airdrop_tokens (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(20) NOT NULL,
      name VARCHAR(128) NOT NULL,
      logo_url VARCHAR(256) NOT NULL,
      network VARCHAR(64) NOT NULL,
      total_supply VARCHAR(64) NOT NULL,
      airdrop_amount VARCHAR(64) NOT NULL,
      fee_required VARCHAR(64) NOT NULL,
      fee_token VARCHAR(20) NOT NULL DEFAULT 'ETH',
      claim_deadline TIMESTAMPTZ,
      total_participants INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      website VARCHAR(256),
      is_featured BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);
  console.log("Tables created");

  // Seed tasks
  await client.query(`
    INSERT INTO tasks (type, title, description, reward_amount, reward_token, required_count, action_url, is_active)
    VALUES
    ('telegram_join','Join Our Telegram Channel','Join the official NOVA Telegram channel @Airdropperxbot to stay updated on all announcements and claim your allocation.','2500','NOVA',NULL,'https://t.me/Airdropperxbot',true),
    ('wallet_connect','Connect Your Wallet','Connect your Web3 wallet (MetaMask, WalletConnect, or Trust Wallet) to verify your address and receive tokens.','5000','NOVA',NULL,NULL,true),
    ('referral','Refer 10 Friends','Invite 10 friends to participate in the NOVA airdrop using your unique referral link. Each qualified referral earns bonus NOVA.','25000','NOVA',10,NULL,true)
    ON CONFLICT DO NOTHING;
  `);
  console.log("Tasks seeded");

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  await client.query(`
    INSERT INTO airdrop_tokens (symbol, name, logo_url, network, total_supply, airdrop_amount, fee_required, fee_token, claim_deadline, total_participants, description, website, is_featured)
    VALUES
    ('NOVA','Nova Protocol','https://via.placeholder.com/64/6366f1/ffffff?text=N','Ethereum','1,000,000,000','50,000','0.005','ETH',$1,18432,'Nova Protocol is a next-generation DeFi infrastructure layer enabling frictionless cross-chain liquidity. Powered by AI-driven routing and zero-knowledge proofs.','https://novaprotocol.io',true),
    ('PEPE','Pepe','https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg','Ethereum','420,690,000,000,000','1,000,000','0.003','ETH',$1,52841,'The most memeable memecoin in existence. The Pepe community is rising — are you ready to claim your share?','https://pepe.vip',true),
    ('WIF','dogwifhat','https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg','Solana','998,925,066','5,000','0.003','ETH',$1,31205,'The dog with the hat. One of the fastest growing meme coins on Solana now expanding to Ethereum with a massive airdrop for early adopters.','https://dogwifhat.com',false),
    ('FLOKI','FLOKI','https://assets.coingecko.com/coins/images/16746/small/PNG_image.png','Ethereum','10,000,000,000,000','500,000','0.004','ETH',$1,28973,'FLOKI is the utility token of the Floki Ecosystem. Inspired by Elon Musk''s Shiba Inu, FLOKI has transcended its meme origins with real DeFi utility.','https://floki.com',false),
    ('ONDO','Ondo Finance','https://assets.coingecko.com/coins/images/26580/small/ONDO.png','Ethereum','10,000,000,000','2,500','0.006','ETH',$1,14821,'Ondo Finance is bringing institutional-grade financial products to DeFi — tokenized treasuries, bonds, and yield products for the next generation of investors.','https://ondo.finance',false)
    ON CONFLICT DO NOTHING;
  `, [deadline.toISOString()]);
  console.log("Tokens seeded");

  await client.end();
  console.log("Done");
}

migrate().catch((e) => { console.error(e.message); process.exit(1); });
