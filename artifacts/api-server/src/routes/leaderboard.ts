import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { desc, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const users = await db
      .select({
        telegramId: usersTable.telegramId,
        username: usersTable.username,
        firstName: usersTable.firstName,
        referralCode: usersTable.referralCode,
        totalRewards: usersTable.totalRewards,
        claimStatus: usersTable.claimStatus,
      })
      .from(usersTable)
      .orderBy(desc(sql`CAST(${usersTable.totalRewards} AS NUMERIC)`))
      .limit(50);

    const leaderboard = users.map((u, idx) => ({
      rank: idx + 1,
      telegramId: u.telegramId,
      displayName: u.firstName || u.username || `User ${u.telegramId.slice(-4)}`,
      referralCode: u.referralCode,
      totalRewards: parseFloat(u.totalRewards || "0"),
      hasClaimed: u.claimStatus === "fee_paid" || u.claimStatus === "confirmed",
    }));

    return res.json(leaderboard);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
