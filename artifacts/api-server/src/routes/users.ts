import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, tasksTable, userTasksTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";

const router = Router();

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function creditReferralTasks(referrerCode: string) {
  const referrers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.referralCode, referrerCode))
    .limit(1);
  if (referrers.length === 0) return;
  const referrer = referrers[0];

  const [{ total: referralCount }] = await db
    .select({ total: count() })
    .from(usersTable)
    .where(eq(usersTable.referredBy, referrerCode));

  const referralTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.type, "referral"));

  for (const task of referralTasks) {
    const required = task.requiredCount ?? 1;
    if ((referralCount ?? 0) < required) continue;

    const existing = await db
      .select({ isCompleted: userTasksTable.isCompleted })
      .from(userTasksTable)
      .where(
        and(
          eq(userTasksTable.telegramId, referrer.telegramId),
          eq(userTasksTable.taskId, task.id)
        )
      )
      .limit(1);

    if (existing[0]?.isCompleted) continue;

    if (existing.length > 0) {
      await db
        .update(userTasksTable)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(
          and(
            eq(userTasksTable.telegramId, referrer.telegramId),
            eq(userTasksTable.taskId, task.id)
          )
        );
    } else {
      await db.insert(userTasksTable).values({
        telegramId: referrer.telegramId,
        taskId: task.id,
        isCompleted: true,
        completedAt: new Date(),
      });
    }

    const reward = parseInt(task.rewardAmount || "0", 10);
    if (reward > 0) {
      const current = parseInt(referrer.totalRewards || "0", 10);
      await db
        .update(usersTable)
        .set({ totalRewards: String(current + reward) })
        .where(eq(usersTable.telegramId, referrer.telegramId));
      referrer.totalRewards = String(current + reward);
    }
  }
}

router.post("/register", async (req, res) => {
  const { telegramId, username, firstName, lastName, referralCode } = req.body ?? {};
  if (!telegramId) return res.status(400).json({ error: "telegramId is required" });

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, String(telegramId)))
    .limit(1);

  if (existing.length > 0) return res.status(200).json(formatUser(existing[0]));

  let uniqueCode = generateReferralCode();
  for (let i = 0; i < 5; i++) {
    const conflict = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.referralCode, uniqueCode))
      .limit(1);
    if (conflict.length === 0) break;
    uniqueCode = generateReferralCode();
  }

  try {
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

    if (referralCode) {
      await creditReferralTasks(referralCode).catch(() => {});
    }

    return res.status(201).json(formatUser(user));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:telegramId", async (req, res) => {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, req.params.telegramId))
    .limit(1);

  if (users.length === 0) return res.status(404).json({ error: "User not found" });
  return res.json(formatUser(users[0]));
});

router.patch("/:telegramId/wallet", async (req, res) => {
  const { walletAddress } = req.body ?? {};
  if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

  const updated = await db
    .update(usersTable)
    .set({ walletAddress: String(walletAddress) })
    .where(eq(usersTable.telegramId, req.params.telegramId))
    .returning();

  if (updated.length === 0) return res.status(404).json({ error: "User not found" });
  return res.json(formatUser(updated[0]));
});

function formatUser(u: any) {
  return {
    id: u.id,
    telegramId: u.telegramId,
    username: u.username ?? null,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    walletAddress: u.walletAddress ?? null,
    referralCode: u.referralCode,
    referredBy: u.referredBy ?? null,
    claimStatus: u.claimStatus,
    totalRewards: u.totalRewards,
    createdAt: u.createdAt,
  };
}

export default router;
