import { Router } from "express";
import { db } from "@workspace/db";
import { airdropTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const tokens = await db.select().from(airdropTokensTable);
  return res.json(
    tokens.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      name: t.name,
      logoUrl: t.logoUrl,
      network: t.network,
      totalSupply: t.totalSupply,
      airdropAmount: t.airdropAmount,
      feeRequired: t.feeRequired,
      feeToken: t.feeToken,
      claimDeadline: t.claimDeadline?.toISOString() ?? null,
      totalParticipants: t.totalParticipants,
      description: t.description,
      website: t.website ?? null,
      isFeatured: t.isFeatured,
    }))
  );
});

export default router;
