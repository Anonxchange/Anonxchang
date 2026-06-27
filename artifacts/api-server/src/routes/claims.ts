import { Router } from "express";
import { db } from "@workspace/db";
import { claimsTable, usersTable } from "@workspace/db/schema";
import { eq, isNotNull } from "drizzle-orm";

const router = Router();

const REWARD_PER_REFERRAL = 500_000;

router.post("/", async (req, res) => {
  const { telegramId, walletAddress, txHash, feePaid, tokenSymbol } = req.body ?? {};
  if (!telegramId || !walletAddress || !txHash || !feePaid || !tokenSymbol) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existing = await db
    .select({ id: claimsTable.id })
    .from(claimsTable)
    .where(eq(claimsTable.telegramId, String(telegramId)))
    .limit(1);

  if (existing.length > 0) return res.status(400).json({ error: "Already claimed" });

  try {
    const [claim] = await db
      .insert(claimsTable)
      .values({
        telegramId: String(telegramId),
        walletAddress: String(walletAddress),
        tokenAmount: "900000",
        feePaid: String(feePaid),
        txHash: String(txHash),
        tokenSymbol: String(tokenSymbol),
        status: "pending",
      })
      .returning();

    await db
      .update(usersTable)
      .set({ claimStatus: "fee_paid", walletAddress: String(walletAddress) })
      .where(eq(usersTable.telegramId, String(telegramId)));

    await creditReferrer(String(telegramId));

    return res.status(201).json(formatClaim(claim));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function creditReferrer(telegramId: string) {
  const claimer = await db
    .select({ referredBy: usersTable.referredBy })
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId))
    .limit(1);

  if (!claimer[0]?.referredBy) return;

  const referrer = await db
    .select({ id: usersTable.id, totalRewards: usersTable.totalRewards })
    .from(usersTable)
    .where(eq(usersTable.referralCode, claimer[0].referredBy))
    .limit(1);

  if (referrer.length === 0) return;

  const currentRewards = parseInt(referrer[0].totalRewards || "0", 10);
  const newRewards = currentRewards + REWARD_PER_REFERRAL;

  await db
    .update(usersTable)
    .set({ totalRewards: String(newRewards) })
    .where(eq(usersTable.id, referrer[0].id));
}

router.get("/:telegramId", async (req, res) => {
  const claims = await db
    .select()
    .from(claimsTable)
    .where(eq(claimsTable.telegramId, req.params.telegramId))
    .limit(1);

  if (claims.length === 0) return res.status(404).json({ error: "No claim found" });
  return res.json(formatClaim(claims[0]));
});

function formatClaim(c: any) {
  return {
    id: c.id,
    telegramId: c.telegramId,
    walletAddress: c.walletAddress,
    tokenAmount: c.tokenAmount,
    feePaid: c.feePaid,
    txHash: c.txHash,
    status: c.status,
    createdAt: c.createdAt,
  };
}

export default router;
