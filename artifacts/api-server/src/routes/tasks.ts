import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, userTasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.isActive, true));

  const userTasks = await db
    .select()
    .from(userTasksTable)
    .where(eq(userTasksTable.telegramId, telegramId));

  const userTaskMap = new Map(userTasks.map((ut) => [ut.taskId, ut]));

  const result = tasks.map((task) => {
    const ut = userTaskMap.get(task.id);
    return {
      taskId: task.id,
      telegramId,
      isCompleted: ut?.isCompleted ?? false,
      completedAt: ut?.completedAt?.toISOString() ?? null,
      proof: ut?.proof ?? null,
      task: formatTask(task),
    };
  });

  return res.json(result);
});

router.post("/users/:telegramId/tasks/:taskId/complete", async (req, res) => {
  const { telegramId, taskId } = req.params;
  const taskIdNum = parseInt(taskId, 10);
  const proof = req.body?.proof ?? null;

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskIdNum))
    .limit(1);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const existing = await db
    .select()
    .from(userTasksTable)
    .where(
      and(
        eq(userTasksTable.telegramId, telegramId),
        eq(userTasksTable.taskId, taskIdNum)
      )
    )
    .limit(1);

  let userTask;
  if (existing.length > 0) {
    [userTask] = await db
      .update(userTasksTable)
      .set({ isCompleted: true, completedAt: new Date(), proof })
      .where(
        and(
          eq(userTasksTable.telegramId, telegramId),
          eq(userTasksTable.taskId, taskIdNum)
        )
      )
      .returning();
  } else {
    [userTask] = await db
      .insert(userTasksTable)
      .values({
        telegramId,
        taskId: taskIdNum,
        isCompleted: true,
        completedAt: new Date(),
        proof,
      })
      .returning();
  }

  return res.json({
    taskId: userTask.taskId,
    telegramId: userTask.telegramId,
    isCompleted: userTask.isCompleted,
    completedAt: userTask.completedAt?.toISOString() ?? null,
    proof: userTask.proof ?? null,
    task: formatTask(task),
  });
});

function formatTask(task: typeof tasksTable.$inferSelect) {
  return {
    id: task.id,
    type: task.type,
    title: task.title,
    description: task.description,
    rewardAmount: task.rewardAmount,
    rewardToken: task.rewardToken,
    requiredCount: task.requiredCount ?? null,
    actionUrl: task.actionUrl ?? null,
    isActive: task.isActive,
  };
}

export default router;
