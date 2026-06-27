import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/", async (_req, res) => {
  const [
    { count: totalParticipants },
    { data: claims },
    { count: activeAirdrops },
    { count: totalReferrals },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("claims").select("token_amount, fee_paid"),
    supabase.from("airdrop_tokens").select("*", { count: "exact", head: true }).eq("is_featured", true),
    supabase.from("users").select("*", { count: "exact", head: true }).not("referred_by", "is", null),
  ]);

  const totalClaimed = (claims ?? []).reduce(
    (sum: number, c: any) => sum + parseFloat(c.token_amount || "0"),
    0
  );
  const totalFees = (claims ?? []).reduce(
    (sum: number, c: any) => sum + parseFloat(c.fee_paid || "0"),
    0
  );

  const BASE_PARTICIPANTS = 34000;

  return res.json({
    totalParticipants: (totalParticipants ?? 0) + BASE_PARTICIPANTS,
    totalClaimed: totalClaimed.toString(),
    totalFeesCollected: totalFees.toFixed(6),
    activeAirdrops: activeAirdrops ?? 0,
    totalReferrals: (totalReferrals ?? 0) + BASE_PARTICIPANTS,
  });
});

export default router;
