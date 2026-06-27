import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/", async (_req, res) => {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_active", true);

  return res.json((tasks ?? []).map(formatTask));
});

router.get("/users/:telegramId/tasks", async (req, res) => {
  const { telegramId } = req.params;

  const [{ data: tasks }, { data: userTasks }] = await Promise.all([
    supabase.from("tasks").select("*").eq("is_active", true),
    supabase.from("user_tasks").select("*").eq("telegram_id", telegramId),
  ]);

  const userTaskMap = new Map((userTasks ?? []).map((ut: any) => [ut.task_id, ut]));

  return res.json(
    (tasks ?? []).map((task: any) => {
      const ut = userTaskMap.get(task.id) as any;
      return {
        taskId: task.id,
        telegramId,
        isCompleted: ut?.is_completed ?? false,
        completedAt: ut?.completed_at ?? null,
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

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskIdNum)
    .single();

  if (!task) return res.status(404).json({ error: "Task not found" });

  const { data: existing } = await supabase
    .from("user_tasks")
    .select("id")
    .eq("telegram_id", telegramId)
    .eq("task_id", taskIdNum)
    .single();

  let userTask: any;
  if (existing) {
    const { data } = await supabase
      .from("user_tasks")
      .update({ is_completed: true, completed_at: new Date().toISOString(), proof })
      .eq("telegram_id", telegramId)
      .eq("task_id", taskIdNum)
      .select()
      .single();
    userTask = data;
  } else {
    const { data } = await supabase
      .from("user_tasks")
      .insert({ telegram_id: telegramId, task_id: taskIdNum, is_completed: true, completed_at: new Date().toISOString(), proof })
      .select()
      .single();
    userTask = data;
  }

  return res.json({
    taskId: userTask.task_id,
    telegramId: userTask.telegram_id,
    isCompleted: userTask.is_completed,
    completedAt: userTask.completed_at ?? null,
    proof: userTask.proof ?? null,
    task: formatTask(task),
  });
});

function formatTask(t: any) {
  return {
    id: t.id,
    type: t.type,
    title: t.title,
    description: t.description,
    rewardAmount: t.reward_amount,
    rewardToken: t.reward_token,
    requiredCount: t.required_count ?? null,
    actionUrl: t.action_url ?? null,
    isActive: t.is_active,
  };
}

export default router;
