import { Router } from "express";
import { supabase } from "../lib/supabase";
import { tgCall } from "../lib/telegram";

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

  const { data: existingCompletion } = await supabase
    .from("user_tasks")
    .select("id, is_completed")
    .eq("telegram_id", telegramId)
    .eq("task_id", taskIdNum)
    .single();

  if (existingCompletion?.is_completed) {
    return res.status(400).json({ error: "Task already completed" });
  }

  const verificationError = await verifyTask(task, telegramId);
  if (verificationError) {
    return res.status(400).json({ error: verificationError });
  }

  let userTask: any;
  if (existingCompletion) {
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

  const rewardAmount = parseInt(task.reward_amount || "0", 10);
  if (rewardAmount > 0) {
    const { data: user } = await supabase
      .from("users")
      .select("total_rewards")
      .eq("telegram_id", telegramId)
      .single();

    if (user) {
      const current = parseInt(user.total_rewards || "0", 10);
      await supabase
        .from("users")
        .update({ total_rewards: String(current + rewardAmount) })
        .eq("telegram_id", telegramId);
    }
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

async function verifyTask(task: any, telegramId: string): Promise<string | null> {
  switch (task.type) {
    case "wallet_connect": {
      const { data: user } = await supabase
        .from("users")
        .select("wallet_address")
        .eq("telegram_id", telegramId)
        .single();
      if (!user?.wallet_address) {
        return "Connect your wallet in the home screen first, then try again.";
      }
      return null;
    }

    case "telegram_join": {
      if (!task.action_url) return null;
      const channelUsername = task.action_url.replace("https://t.me/", "").replace(/\/$/, "");
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
      const requiredCount = task.required_count ?? 1;
      const { data: user } = await supabase
        .from("users")
        .select("referral_code")
        .eq("telegram_id", telegramId)
        .single();
      if (!user?.referral_code) return "User not found.";
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user.referral_code);
      const actual = count ?? 0;
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
    rewardAmount: t.reward_amount,
    rewardToken: t.reward_token,
    requiredCount: t.required_count ?? null,
    actionUrl: t.action_url ?? null,
    isActive: t.is_active,
  };
}

export default router;
