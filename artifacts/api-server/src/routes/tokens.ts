import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/", async (_req, res) => {
  const { data: tokens } = await supabase
    .from("airdrop_tokens")
    .select("*")
    .order("is_featured", { ascending: false });

  return res.json(
    (tokens ?? []).map((t: any) => ({
      id: t.id,
      symbol: t.symbol,
      name: t.name,
      logoUrl: t.logo_url,
      network: t.network,
      totalSupply: t.total_supply,
      airdropAmount: t.airdrop_amount,
      feeRequired: t.fee_required,
      feeToken: t.fee_token,
      claimDeadline: t.claim_deadline ?? null,
      totalParticipants: t.total_participants,
      description: t.description,
      website: t.website ?? null,
      isFeatured: t.is_featured,
    }))
  );
});

export default router;
