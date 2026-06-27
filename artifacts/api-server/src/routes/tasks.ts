import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, userTasksTable, usersTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { tgCall } from "../lib/telegram";

const router = Router();

router.get("/", async (_req, res) => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.isActive, true));

  return res.json(tasks.map(formatTask));
});

router.get("/users/:telegramId/tasks", async (req, res) => {
  const { telegramId } = req.params;

  const [tasks, userTasks] = await Promise.all([
    db.select().from(tasksTable).where(eq(tasksTable.isActive, true)),
    db.select().from(userTasksTable).where(eq(userTasksTable.telegramId, telegramId)),
  ]);

  const userTaskMap = new Map(userTasks.map((ut) => [ut.taskId, ut]));

  return res.json(
    tasks.map((task) => {
      const ut = userTaskMap.get(task.id);
      return {
        taskId: task.id,
        telegramId,
        isCompleted: ut?.isCompleted ?? false,
        completedAt: ut?.completedAt ?? null,
        proof: ut?.proof ?? null,
        task: formatTask(task),
      };
    })
  );
});

router.post("/users/:telegramId/tasks/:taskId/complete", async (req, res) => {
  const { telegramId, taskId } = req.params;
  const taskIdNum = parseInt(taskId, 10);
  const proof = req.body?.proof ?? null;

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskIdNum))
    .limit(1);

  if (tasks.length === 0) return res.status(404).json({ error: "Task not found" });
  const task = tasks[0];

  const existingCompletions = await db
    .select({ id: userTasksTable.id, isCompleted: userTasksTable.isCompleted })
    .from(userTasksTable)
    .where(
      and(
        eq(userTasksTable.telegramId, telegramId),
        eq(userTasksTable.taskId, taskIdNum)
      )
    )
    .limit(1);

  const existingCompletion = existingCompletions[0];

  if (existingCompletion?.isCompleted) {
    return res.status(400).json({ error: "Task already completed" });
  }

  const verificationError = await verifyTask(task, telegramId);
  if (verificationError) {
    return res.status(400).json({ error: verificationError });
  }

  let userTask: any;
  if (existingCompletion) {
    const updated = await db
      .update(userTasksTable)
      .set({ isCompleted: true, completedAt: new Date(), proof })
      .where(
        and(
          eq(userTasksTable.telegramId, telegramId),
          eq(userTasksTable.taskId, taskIdNum)
        )
      )
      .returning();
    userTask = updated[0];
  } else {
    const inserted = await db
      .insert(userTasksTable)
      .values({ telegramId, taskId: taskIdNum, isCompleted: true, completedAt: new Date(), proof })
      .returning();
    userTask = inserted[0];
  }

  const rewardAmount = parseInt(task.rewardAmount || "0", 10);
  if (rewardAmount > 0) {
    const users = await db
      .select({ totalRewards: usersTable.totalRewards })
      .from(usersTable)
      .where(eq(usersTable.telegramId, telegramId))
      .limit(1);

    if (users.length > 0) {
      const current = parseInt(users[0].totalRewards || "0", 10);
      await db
        .update(usersTable)
        .set({ totalRewards: String(current + rewardAmount) })
        .where(eq(usersTable.telegramId, telegramId));
    }
  }

  return res.json({
    taskId: userTask.taskId,
    telegramId: userTask.telegramId,
    isCompleted: userTask.isCompleted,
    completedAt: userTask.completedAt ?? null,
    proof: userTask.proof ?? null,
    task: formatTask(task),
  });
});

async function verifyTask(task: any, telegramId: string): Promise<string | null> {
  switch (task.type) {
    case "wallet_connect": {
      const users = await db
        .select({ walletAddress: usersTable.walletAddress })
        .from(usersTable)
        .where(eq(usersTable.telegramId, telegramId))
        .limit(1);
      if (!users[0]?.walletAddress) {
        return "Connect your wallet in the home screen first, then try again.";
      }
      return null;
    }

    case "telegram_join": {
      if (!task.actionUrl) return null;
      const channelUsername = task.actionUrl.replace("https://t.me/", "").replace(/\/$/, "");
      try {
        const result = await tgCall("getChatMember", {
          chat_id: `@${channelUsername}`,
          user_id: Number(telegramId),
        });
        const status = result?.result?.status;
        if (!status || ["left", "kicked"].includes(status)) {
          return `Join @${channelUsername} on Telegram first, then tap Go again.`;
        }
      } catch {
        return null;
      }
      return null;
    }

    case "referral": {
      const requiredCount = task.requiredCount ?? 1;
      const users = await db
        .select({ referralCode: usersTable.referralCode })
        .from(usersTable)
        .where(eq(usersTable.telegramId, telegramId))
        .limit(1);
      if (!users[0]?.referralCode) return "User not found.";
      const [{ total }] = await db
        .select({ total: count() })
        .from(usersTable)
        .where(eq(usersTable.referredBy, users[0].referralCode));
      const actual = total ?? 0;
      if (actual < requiredCount) {
        return `You need ${requiredCount} referrals to complete this task. You currently have ${actual}.`;
      }
      return null;
    }

    case "twitter_follow":
    case "social_share":
      return null;

    default:
      return null;
  }
}

function formatTask(t: any) {
  return {
    id: t.id,
    type: t.type,
    title: t.title,
    description: t.description,
    rewardAmount: t.rewardAmount,
    rewardToken: t.rewardToken,
    requiredCount: t.requiredCount ?? null,
    actionUrl: t.actionUrl ?? null,
    isActive: t.isActive,
  };
}

export default router;
