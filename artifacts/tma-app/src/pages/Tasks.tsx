import { useTelegram } from "@/components/TelegramProvider";
import { useListTasks, useGetUserTasks, useCompleteTask, getGetUserTasksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ChevronRight, Twitter, Send, Users, Wallet, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const iconMap: Record<string, React.ElementType> = {
  telegram_join: Send,
  twitter_follow: Twitter,
  referral: Users,
  wallet_connect: Wallet,
  social_share: Share2
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
    if (actionUrl) {
      window.open(actionUrl, '_blank');
    }
    
    setCompletingTaskId(taskId);
    
    // Simulate verification delay
    setTimeout(() => {
      completeTask.mutate({
        telegramId,
        taskId,
        data: {}
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserTasksQueryKey(telegramId) });
          toast.success("Task completed!");
          setCompletingTaskId(null);
        },
        onError: () => {
          toast.error("Could not verify task completion.");
          setCompletingTaskId(null);
        }
      });
    }, 2000);
  };

  const isCompleted = (taskId: number) => {
    return userTasks?.some(ut => ut.taskId === taskId && ut.isCompleted);
  };

  if (tasksLoading || userTasksLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold mb-2">Airdrop Tasks</h1>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2 neon-text">Airdrop Tasks</h1>
        <p className="text-muted-foreground text-sm">Complete tasks to increase your allocation.</p>
      </div>

      {/* Special Referral Card */}
      <Card className="glass-card bg-primary/10 border-primary/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Users className="w-24 h-24" />
        </div>
        <CardContent className="p-5 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="font-bold text-lg">Invite Friends</span>
              <span className="text-sm text-primary font-semibold">+500 NOVA per friend</span>
            </div>
            <div className="px-3 py-1 bg-background/50 rounded-full text-xs font-mono border border-primary/20">
              0 / 10
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
            Invite 10 friends to unlock the maximum referral bonus.
          </p>
          <Button className="w-full shadow-[0_0_10px_rgba(99,102,241,0.3)]">
            Share Link
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {tasks?.map(task => {
          const Icon = iconMap[task.type] || CheckCircle2;
          const completed = isCompleted(task.id);
          const isCompleting = completingTaskId === task.id;

          return (
            <Card key={task.id} className={`glass-card transition-all ${completed ? 'opacity-60 grayscale' : 'hover:border-primary/50'}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${completed ? 'bg-green-500/20 text-green-500' : 'bg-secondary text-primary'}`}>
                    {completed ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{task.title}</span>
                    <span className="text-xs text-muted-foreground">{task.description}</span>
                    <span className="text-xs font-bold text-primary mt-1">+{task.rewardAmount} {task.rewardToken}</span>
                  </div>
                </div>
                
                {!completed && (
                  <Button 
                    size="sm" 
                    variant={isCompleting ? "outline" : "default"}
                    onClick={() => handleCompleteTask(task.id, task.actionUrl)}
                    disabled={isCompleting}
                    className={isCompleting ? "" : "neon-border"}
                  >
                    {isCompleting ? "Verifying..." : "Start"}
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
