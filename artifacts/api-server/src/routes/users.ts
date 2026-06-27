import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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
  if (!telegramId) {
    return res.status(400).json({ error: "telegramId is required" });
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, String(telegramId)))
    .limit(1);

  if (existing.length > 0) {
    return res.status(200).json(formatUser(existing[0]));
  }

  let uniqueCode = generateReferralCode();
  let attempts = 0;
  while (attempts < 5) {
    const conflict = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, uniqueCode))
      .limit(1);
    if (conflict.length === 0) break;
    uniqueCode = generateReferralCode();
    attempts++;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      telegramId: String(telegramId),
      username: username ?? null,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      referralCode: uniqueCode,
      referredBy: referralCode ?? null,
      claimStatus: "pending",
      totalRewards: "0",
    })
    .returning();

  return res.status(201).json(formatUser(user));
});

router.get("/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(formatUser(user));
});

router.patch("/:telegramId/wallet", async (req, res) => {
  const { walletAddress } = req.body ?? {};
  if (!walletAddress || typeof walletAddress !== "string" || walletAddress.length !== 42) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  const { telegramId } = req.params;
  const [user] = await db
    .update(usersTable)
    .set({ walletAddress })
    .where(eq(usersTable.telegramId, telegramId))
    .returning();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(formatUser(user));
});

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    walletAddress: user.walletAddress ?? null,
    referralCode: user.referralCode,
    referredBy: user.referredBy ?? null,
    claimStatus: user.claimStatus,
    totalRewards: user.totalRewards,
    createdAt: user.createdAt.toISOString(),
  };
}

export default router;
