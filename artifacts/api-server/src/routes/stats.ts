import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, claimsTable, airdropTokensTable } from "@workspace/db/schema";
import { eq, isNotNull, sql, count } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const [
    [{ total: totalParticipants }],
    claims,
    [{ total: activeAirdrops }],
    [{ total: totalReferrals }],
  ] = await Promise.all([
    db.select({ total: count() }).from(usersTable),
    db.select({ tokenAmount: claimsTable.tokenAmount, feePaid: claimsTable.feePaid }).from(claimsTable),
    db.select({ total: count() }).from(airdropTokensTable).where(eq(airdropTokensTable.isFeatured, true)),
    db.select({ total: count() }).from(usersTable).where(isNotNull(usersTable.referredBy)),
  ]);

  const totalClaimed = claims.reduce(
    (sum, c) => sum + parseFloat(c.tokenAmount || "0"),
    0
  );
  const totalFees = claims.reduce(
    (sum, c) => sum + parseFloat(c.feePaid || "0"),
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
