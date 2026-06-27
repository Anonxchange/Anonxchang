import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

const REWARD_PER_REFERRAL = 500_000;

router.post("/", async (req, res) => {
  const { telegramId, walletAddress, txHash, feePaid, tokenSymbol } = req.body ?? {};
  if (!telegramId || !walletAddress || !txHash || !feePaid || !tokenSymbol) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { data: existing } = await supabase
    .from("claims")
    .select("id")
    .eq("telegram_id", String(telegramId))
    .single();

  if (existing) return res.status(400).json({ error: "Already claimed" });

  const { data: claim, error } = await supabase
    .from("claims")
    .insert({
      telegram_id: String(telegramId),
      wallet_address: String(walletAddress),
      token_amount: "3000000",
      fee_recipient: "0x2674b6DD25b98b86ba62a1d81Fa698161633B0cD",
      fee_paid: String(feePaid),
      tx_hash: String(txHash),
      token_symbol: String(tokenSymbol),
      status: "pending",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from("users")
    .update({ claim_status: "fee_paid", wallet_address: String(walletAddress) })
    .eq("telegram_id", String(telegramId));

  await creditReferrer(String(telegramId));

  return res.status(201).json(formatClaim(claim));
});

async function creditReferrer(telegramId: string) {
  const { data: claimer } = await supabase
    .from("users")
    .select("referred_by")
    .eq("telegram_id", telegramId)
    .single();

  if (!claimer?.referred_by) return;

  const { data: referrer } = await supabase
    .from("users")
    .select("id, total_rewards")
    .eq("referral_code", claimer.referred_by)
    .single();

  if (!referrer) return;

  const currentRewards = parseInt(referrer.total_rewards || "0", 10);
  const newRewards = currentRewards + REWARD_PER_REFERRAL;

  await supabase
    .from("users")
    .update({ total_rewards: String(newRewards) })
    .eq("id", referrer.id);
}

router.get("/:telegramId", async (req, res) => {
  const { data: claim } = await supabase
    .from("claims")
    .select("*")
    .eq("telegram_id", req.params.telegramId)
    .single();

  if (!claim) return res.status(404).json({ error: "No claim found" });
  return res.json(formatClaim(claim));
});

function formatClaim(c: any) {
  return {
    id: c.id,
    telegramId: c.telegram_id,
    walletAddress: c.wallet_address,
    tokenAmount: c.token_amount,
    feePaid: c.fee_paid,
    txHash: c.tx_hash,
    status: c.status,
    createdAt: c.created_at,
  };
}

export default router;
