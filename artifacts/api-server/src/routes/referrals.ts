import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

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

  const referrals = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.referredBy, user.referralCode));

  const qualifiedReferrals = referrals.filter(
    (r) => r.claimStatus === "fee_paid" || r.claimStatus === "claimed"
  );

  const rewardPerReferral = 5000;
  const pendingReward = (qualifiedReferrals.length * rewardPerReferral).toString();

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "your_bot";
  const referralLink = `https://t.me/${botUsername}?start=${user.referralCode}`;

  return res.json({
    telegramId,
    referralCode: user.referralCode,
    referralLink,
    totalReferrals: referrals.length,
    qualifiedReferrals: qualifiedReferrals.length,
    pendingReward,
    claimedReward: "0",
    referrals: referrals.map((r) => ({
      username: r.username ?? null,
      firstName: r.firstName ?? null,
      joinedAt: r.createdAt.toISOString(),
      hasClaimed: r.claimStatus === "fee_paid" || r.claimStatus === "claimed",
    })),
  });
});

export default router;
