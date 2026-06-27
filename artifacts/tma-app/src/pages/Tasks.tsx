import { useTelegram } from "@/components/TelegramProvider";
import { useListTasks, useGetUserTasks, useCompleteTask, getGetUserTasksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Users, Wallet, Share2 } from "lucide-react";
import { FaTelegram, FaTwitter } from "react-icons/fa";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const iconMap: Record<string, React.ElementType> = {
  telegram_join: FaTelegram,
  twitter_follow: FaTwitter,
  referral: Users,
  wallet_connect: Wallet,
  social_share: Share2
};

const colorMap: Record<string, string> = {
  telegram_join: "bg-[#229ED9]/10 text-[#229ED9] border-[#229ED9]/20",
  twitter_follow: "bg-sky-50 text-sky-500 border-sky-200",
  referral: "bg-violet-50 text-violet-600 border-violet-200",
  wallet_connect: "bg-indigo-50 text-indigo-600 border-indigo-200",
  social_share: "bg-pink-50 text-pink-600 border-pink-200",
};

export default function Tasks() {
  const { telegramId } = useTelegram();
  const queryClient = useQueryClient();
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

  const { data: tasks, isLoading: tasksLoading } = useListTasks();
  const { data: userTasks, isLoading: userTasksLoading } = useGetUserTasks(telegramId, {
    query: { enabled: !!telegramId }
  });

  const completeTask = useCompleteTask();

  const handleCompleteTask = (taskId: number, actionUrl?: string | null) => {
    if (actionUrl) window.open(actionUrl, '_blank');
    setCompletingTaskId(taskId);
    const delay = actionUrl ? 3000 : 0;
    setTimeout(() => {
      completeTask.mutate({ telegramId, taskId, data: {} }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserTasksQueryKey(telegramId) });
          toast.success("Task verified! Reward added to your allocation.");
          setCompletingTaskId(null);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error || err?.message || "Could not verify task completion.";
          toast.error(msg);
          setCompletingTaskId(null);
        }
      });
    }, delay);
  };

  const isCompleted = (taskId: number) => {
    return userTasks?.some(ut => ut.taskId === taskId && ut.isCompleted);
  };

  const completedCount = tasks?.filter(t => isCompleted(t.id)).length || 0;
  const totalCount = tasks?.length || 0;

  if (tasksLoading || userTasksLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight mb-1 neon-text">Airdrop Tasks</h1>
        <p className="text-muted-foreground text-sm">Complete tasks to boost your 900,000 NOVA allocation.</p>
      </div>

      {/* Progress summary */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Tasks Completed</div>
          <div className="text-2xl font-black text-indigo-600">{completedCount} <span className="text-base font-semibold text-muted-foreground">/ {totalCount}</span></div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Base Allocation</div>
          <div className="text-xl font-black text-violet-600">900,000 <span className="text-xs font-semibold text-muted-foreground">NOVA</span></div>
        </div>
      </div>

      {/* Invite friends card */}
      <Card className="glass-card overflow-hidden border border-indigo-100 bg-gradient-to-br from-white to-indigo-50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-base">Invite Friends</div>
                <div className="text-xs text-violet-600 font-semibold">+500,000 NOVA per friend</div>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200">
              0 / 10
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Refer 10 qualified friends to unlock the MAX tier bonus of 5,000,000 NOVA.
          </p>
          <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 hover:from-indigo-700 hover:to-violet-700">
            Share Your Link
          </Button>
        </CardContent>
      </Card>

      {/* Task list */}
      <div className="flex flex-col gap-3">
        {tasks?.map(task => {
          const Icon = iconMap[task.type] || CheckCircle2;
          const completed = isCompleted(task.id);
          const isCompleting = completingTaskId === task.id;
          const colorClass = colorMap[task.type] || "bg-indigo-50 text-indigo-600 border-indigo-100";

          return (
            <Card key={task.id} className={`glass-card transition-all border ${completed ? 'opacity-60' : 'hover:shadow-md hover:border-indigo-200'}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${completed ? 'bg-green-100 text-green-600 border-green-200' : colorClass}`}>
                    {completed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{task.title}</div>
                    <div className="text-xs text-muted-foreground">{task.description}</div>
                    <div className="text-xs font-bold text-indigo-600 mt-0.5">
                      +{Number(task.rewardAmount).toLocaleString()} {task.rewardToken}
                    </div>
                  </div>
                </div>

                {completed ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200 flex-shrink-0">Done</span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleCompleteTask(task.id, task.actionUrl)}
                    disabled={isCompleting}
                    className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white border-0 text-xs"
                  >
                    {isCompleting ? "Checking..." : "Go"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
