import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/", async (_req, res) => {
  const { data: users, error } = await supabase
    .from("users")
    .select("telegram_id, username, first_name, referral_code, total_rewards, claim_status")
    .order("total_rewards", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  const leaderboard = (users || []).map((u: any, idx: number) => ({
    rank: idx + 1,
    telegramId: u.telegram_id,
    displayName: u.first_name || u.username || `User ${u.telegram_id.slice(-4)}`,
    referralCode: u.referral_code,
    totalRewards: parseFloat(u.total_rewards || "0"),
    hasClaimed: u.claim_status === "fee_paid" || u.claim_status === "confirmed",
  }));

  return res.json(leaderboard);
});

export default router;
