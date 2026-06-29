import { useTelegram } from "@/components/TelegramProvider";
import { useListTasks, useGetUserTasks, useCompleteTask, useUpdateWallet, useGetReferralStats, getGetUserTasksQueryKey, getGetUserQueryKey, getGetReferralStatsQueryKey } from "@workspace/api-client-react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Users, Wallet, Share2 } from "lucide-react";
import { FaTelegram, FaTwitter } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNovaPrice } from "@/hooks/useNovaPrice";
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
  const { telegramId, user } = useTelegram();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

  const { price: novaPrice } = useNovaPrice();
  const { data: tasks, isLoading: tasksLoading } = useListTasks();
  const { data: userTasks, isLoading: userTasksLoading } = useGetUserTasks(telegramId, {
    query: { enabled: !!telegramId, queryKey: getGetUserTasksQueryKey(telegramId) }
  });
  const { data: referralStats } = useGetReferralStats(telegramId, {
    query: { enabled: !!telegramId, queryKey: getGetReferralStatsQueryKey(telegramId) }
  });

  const completeTask = useCompleteTask();
  const updateWallet = useUpdateWallet();

  const TIER1_REFERRALS = 10;
  const TIER2_REFERRALS = 50;
  const qualifiedReferrals = referralStats?.qualifiedReferrals ?? 0;
  const taskEarnings = parseInt(user?.totalRewards || "0", 10);

  const walletTask = tasks?.find(t => t.type === "wallet_connect");

  // Auto-complete wallet_connect task when wallet connects on this page
  useEffect(() => {
    if (!isConnected || !address || !telegramId || !walletTask) return;

    const doComplete = () => {
      completeTask.mutate({ telegramId, taskId: walletTask.id, data: {} }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserTasksQueryKey(telegramId) });
          queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
          toast.success("✅ Wallet connected — task reward added!");
        },
        onError: () => { /* already completed, silently ignore */ },
      });
    };

    if (!user || user.walletAddress !== address) {
      updateWallet.mutate({ telegramId, data: { walletAddress: address } }, {
        onSuccess: doComplete,
      });
    } else {
      doComplete();
    }
  }, [isConnected, address, telegramId, walletTask?.id]);

  const handleCompleteTask = (taskId: number, taskType: string, actionUrl?: string | null) => {
    // Wallet connect task — open the wallet modal
    if (taskType === "wallet_connect") {
      open();
      return;
    }

    // If task has an action URL, open it and prompt user to complete it
    if (actionUrl) {
      window.open(actionUrl, "_blank");
      toast.info("Please complete the task, then return here to verify your reward.", {
        duration: 4000,
      });
      setCompletingTaskId(taskId);
      // Give user 2 seconds after opening the link before verifying
      setTimeout(() => {
        completeTask.mutate({ telegramId, taskId, data: {} }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetUserTasksQueryKey(telegramId) });
            queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
            toast.success("✅ Task verified! Reward added to your balance.");
            setCompletingTaskId(null);
          },
          onError: (err: any) => {
            const msg = err?.response?.data?.error || "Could not verify task. Make sure you completed it.";
            toast.error(msg);
            setCompletingTaskId(null);
          }
        });
      }, 2000);
      return;
    }

    // No action URL — complete directly
    setCompletingTaskId(taskId);
    completeTask.mutate({ telegramId, taskId, data: {} }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserTasksQueryKey(telegramId) });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
        toast.success("✅ Task verified! Reward added to your balance.");
        setCompletingTaskId(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || "Could not verify task.";
        toast.error(msg);
        setCompletingTaskId(null);
      }
    });
  };

  const isCompleted = (taskId: number) =>
    userTasks?.some(ut => ut.taskId === taskId && ut.isCompleted);

  const completedCount = tasks?.filter(t => isCompleted(t.id)).length || 0;
  const totalCount = tasks?.length || 0;

  const referralLink =
    referralStats?.referralLink ||
    `https://t.me/Airdropperxbot?start=${user?.referralCode || ""}`;

  const handleShareReferral = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("🚀 Join NOVA Airdrop and claim 900,000 NOVA tokens for free!")}`;
    window.open(shareUrl, "_blank");
  };

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

      {/* NOVA Earnings Balance */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <img src="https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png" alt="NOVA" className="w-5 h-5 rounded-full border border-white/30" />
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Your NOVA Balance</span>
        </div>
        <div className="text-3xl font-black tabular-nums">
          {taskEarnings.toLocaleString()}
          <span className="text-base font-semibold text-white/60 ml-1.5">NOVA</span>
        </div>
        <div className="text-white/50 text-[10px] mt-0.5">
          ≈ {(taskEarnings * novaPrice).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })} at current price
        </div>
        <div className="flex gap-3 mt-3 pt-3 border-t border-white/20 text-xs">
          <div className="flex-1">
            <div className="text-white/50 uppercase tracking-wider mb-0.5">From Tasks</div>
            <div className={`font-bold ${taskEarnings > 0 ? "text-green-300" : "text-white/40"}`}>
              {taskEarnings > 0 ? `+${taskEarnings.toLocaleString()}` : "0"}
            </div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex-1">
            <div className="text-white/50 uppercase tracking-wider mb-0.5">All Tasks</div>
            <div className="font-bold">= 900K</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex-1 text-right">
            <div className="text-white/50 uppercase tracking-wider mb-0.5">Tasks Done</div>
            <div className="font-bold">{completedCount} / {totalCount}</div>
          </div>
        </div>
      </div>

      {/* Invite friends card */}
      <Card className="glass-card overflow-hidden border border-indigo-100 bg-gradient-to-br from-white to-indigo-50">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base">Invite Friends</div>
              <div className="text-xs text-muted-foreground">{qualifiedReferrals} referral{qualifiedReferrals !== 1 ? "s" : ""} so far</div>
            </div>
          </div>

          {/* Tier progress */}
          <div className="flex flex-col gap-2 mb-4">
            {/* Tier 1 */}
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-violet-700">Tier 1 — Refer {TIER1_REFERRALS} People</span>
                <span className="text-xs font-black text-violet-700">+300,000 NOVA</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-violet-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${Math.min(100, (qualifiedReferrals / TIER1_REFERRALS) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-violet-500 mt-0.5">{Math.min(qualifiedReferrals, TIER1_REFERRALS)} / {TIER1_REFERRALS}</div>
            </div>

            {/* Tier 2 */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-indigo-700">Tier 2 — Refer {TIER2_REFERRALS} People</span>
                <span className="text-xs font-black text-indigo-700">+400,000 NOVA</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min(100, (qualifiedReferrals / TIER2_REFERRALS) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-indigo-500 mt-0.5">{Math.min(qualifiedReferrals, TIER2_REFERRALS)} / {TIER2_REFERRALS}</div>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 hover:from-indigo-700 hover:to-violet-700"
            onClick={handleShareReferral}
          >
            <FaTelegram className="w-4 h-4 mr-2 flex-shrink-0" />
            Share Your Referral Link
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
          const isWalletTask = task.type === "wallet_connect";

          // wallet_connect task is effectively done when wallet is connected
          const effectivelyCompleted = completed || (isWalletTask && isConnected);

          let buttonLabel = "Go";
          if (isCompleting) buttonLabel = "Checking...";
          else if (isWalletTask && !isConnected) buttonLabel = "Connect";

          return (
            <Card
              key={task.id}
              className={`glass-card transition-all border ${
                effectivelyCompleted
                  ? "opacity-60"
                  : "hover:shadow-md hover:border-indigo-200"
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                    effectivelyCompleted
                      ? "bg-green-100 text-green-600 border-green-200"
                      : colorClass
                  }`}>
                    {effectivelyCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{task.title}</div>
                    {task.description && <div className="text-xs text-muted-foreground">{task.description}</div>}
                    <div className="text-xs font-bold text-indigo-600 mt-0.5">
                      +{Number(task.rewardAmount).toLocaleString()} {task.rewardToken}
                    </div>
                  </div>
                </div>

                {effectivelyCompleted ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200 flex-shrink-0">Done</span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleCompleteTask(task.id, task.type, task.actionUrl)}
                    disabled={isCompleting}
                    className={`flex-shrink-0 text-white border-0 text-xs ${
                      isWalletTask
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {buttonLabel}
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
