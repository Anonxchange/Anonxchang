import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, claimsTable } from "@workspace/db";
import { airdropTokensTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const [userCount] = await db
    .select({ count: count() })
    .from(usersTable);

  const [claimStats] = await db
    .select({
      totalClaimed: sql<string>`coalesce(sum(cast(token_amount as numeric)), 0)::text`,
      totalFees: sql<string>`coalesce(sum(cast(fee_paid as numeric)), 0)::text`,
    })
    .from(claimsTable);

  const [tokenCount] = await db
    .select({ count: count() })
    .from(airdropTokensTable)
    .where(eq(airdropTokensTable.isFeatured, true));

  const [referralCount] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(sql`referred_by is not null`);

  return res.json({
    totalParticipants: userCount.count,
    totalClaimed: claimStats.totalClaimed ?? "0",
    totalFeesCollected: claimStats.totalFees ?? "0",
    activeAirdrops: tokenCount.count,
    totalReferrals: referralCount.count,
  });
});

export default router;
