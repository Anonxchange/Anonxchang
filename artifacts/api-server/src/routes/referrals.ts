import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) return res.status(404).json({ error: "User not found" });

  const { data: referrals } = await supabase
    .from("users")
    .select("*")
    .eq("referred_by", user.referral_code);

  const qualified = (referrals ?? []).filter(
    (r: any) => r.claim_status === "fee_paid" || r.claim_status === "claimed"
  );

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "your_bot";

  return res.json({
    telegramId,
    referralCode: user.referral_code,
    referralLink: `https://t.me/${botUsername}?start=${user.referral_code}`,
    totalReferrals: (referrals ?? []).length,
    qualifiedReferrals: qualified.length,
    pendingReward: String(qualified.length * 5000),
    claimedReward: "0",
    referrals: (referrals ?? []).map((r: any) => ({
      username: r.username ?? null,
      firstName: r.first_name ?? null,
      joinedAt: r.created_at,
      hasClaimed: r.claim_status === "fee_paid" || r.claim_status === "claimed",
    })),
  });
});

export default router;
