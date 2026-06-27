import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId))
    .limit(1);

  if (users.length === 0) return res.status(404).json({ error: "User not found" });
  const user = users[0];

  const referrals = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.referredBy, user.referralCode));

  const qualified = referrals.filter(
    (r) => r.claimStatus === "fee_paid" || r.claimStatus === "claimed"
  );

  const botUsername = process.env.BOT_USERNAME || "Airdropperxbot";

  return res.json({
    telegramId,
    referralCode: user.referralCode,
    referralLink: `https://t.me/${botUsername}?start=${user.referralCode}`,
    totalReferrals: referrals.length,
    qualifiedReferrals: qualified.length,
    pendingReward: String(qualified.length * 90_000),
    claimedReward: "0",
    referrals: referrals.map((r) => ({
      username: r.username ?? null,
      firstName: r.firstName ?? null,
      joinedAt: r.createdAt,
      hasClaimed: r.claimStatus === "fee_paid" || r.claimStatus === "claimed",
    })),
  });
});

export default router;
