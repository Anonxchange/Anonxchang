import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.post("/register", async (req, res) => {
  const { telegramId, username, firstName, lastName, referralCode } = req.body ?? {};
  if (!telegramId) return res.status(400).json({ error: "telegramId is required" });

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", String(telegramId))
    .limit(1)
    .single();

  if (existing) return res.status(200).json(formatUser(existing));

  let uniqueCode = generateReferralCode();
  for (let i = 0; i < 5; i++) {
    const { data: conflict } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", uniqueCode)
      .single();
    if (!conflict) break;
    uniqueCode = generateReferralCode();
  }

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      telegram_id: String(telegramId),
      username: username ?? null,
      first_name: firstName ?? null,
      last_name: lastName ?? null,
      referral_code: uniqueCode,
      referred_by: referralCode ?? null,
      claim_status: "pending",
      total_rewards: "0",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(formatUser(user));
});

router.get("/:telegramId", async (req, res) => {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", req.params.telegramId)
    .single();

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(formatUser(user));
});

router.patch("/:telegramId/wallet", async (req, res) => {
  const { walletAddress } = req.body ?? {};
  if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

  const { data: user, error } = await supabase
    .from("users")
    .update({ wallet_address: String(walletAddress) })
    .eq("telegram_id", req.params.telegramId)
    .select()
    .single();

  if (error || !user) return res.status(404).json({ error: "User not found" });
  return res.json(formatUser(user));
});

function formatUser(u: any) {
  return {
    id: u.id,
    telegramId: u.telegram_id,
    username: u.username ?? null,
    firstName: u.first_name ?? null,
    lastName: u.last_name ?? null,
    walletAddress: u.wallet_address ?? null,
    referralCode: u.referral_code,
    referredBy: u.referred_by ?? null,
    claimStatus: u.claim_status,
    totalRewards: u.total_rewards,
    createdAt: u.created_at,
  };
}

export default router;
