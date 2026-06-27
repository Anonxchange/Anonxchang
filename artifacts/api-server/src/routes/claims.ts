import { Router } from "express";
import { db } from "@workspace/db";
import { claimsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res) => {
  const { telegramId, walletAddress, txHash, feePaid, tokenSymbol } = req.body ?? {};
  if (!telegramId || !walletAddress || !txHash || !feePaid || !tokenSymbol) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existing = await db
    .select()
    .from(claimsTable)
    .where(eq(claimsTable.telegramId, String(telegramId)))
    .limit(1);

  if (existing.length > 0) {
    return res.status(400).json({ error: "Already claimed" });
  }

  const tokenAmount = "50000";

  const [claim] = await db
    .insert(claimsTable)
    .values({
      telegramId: String(telegramId),
      walletAddress: String(walletAddress),
      tokenAmount,
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

  return res.status(201).json(formatClaim(claim));
});

router.get("/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const [claim] = await db
    .select()
    .from(claimsTable)
    .where(eq(claimsTable.telegramId, telegramId))
    .limit(1);

  if (!claim) {
    return res.status(404).json({ error: "No claim found" });
  }

  return res.json(formatClaim(claim));
});

function formatClaim(claim: typeof claimsTable.$inferSelect) {
  return {
    id: claim.id,
    telegramId: claim.telegramId,
    walletAddress: claim.walletAddress,
    tokenAmount: claim.tokenAmount,
    feePaid: claim.feePaid,
    txHash: claim.txHash,
    status: claim.status,
    createdAt: claim.createdAt.toISOString(),
  };
}

export default router;
