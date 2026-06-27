import { useTelegram } from "@/components/TelegramProvider";
import { useGetReferralStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTelegram } from "react-icons/fa";
import { Copy, UserPlus, Gift, Trophy } from "lucide-react";
import { toast } from "sonner";

const MAX_REFERRALS = 10;
const REWARD_PER_REFERRAL = 90_000;
const MAX_TIER_BONUS = 900_000;

export default function Referral() {
  const { telegramId, user } = useTelegram();
  const { data: stats, isLoading } = useGetReferralStats(telegramId, {
    query: { enabled: !!telegramId }
  });

  const handleCopy = () => {
    const link = stats?.referralLink || `https://t.me/Airdropperxbot?start=${user?.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const qualified = stats?.qualifiedReferrals || 0;
  const progress = Math.min((qualified / MAX_REFERRALS) * 100, 100);
  const earned = qualified * REWARD_PER_REFERRAL;
  const remaining = Math.max(0, MAX_TIER_BONUS - earned);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const referralLink = stats?.referralLink || `https://t.me/Airdropperxbot?start=${user?.referralCode || ""}`;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black tracking-tight mb-0.5 neon-text">Referrals</h1>
        <p className="text-muted-foreground text-xs">Invite friends · earn up to 900,000 extra NOVA</p>
      </div>

      {/* Reward progress card */}
      <Card className="glass-card overflow-hidden border border-violet-100">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
        <CardContent className="p-4">

          {/* Earned amount */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Referral Rewards Earned</div>
              <div className="text-xl font-black text-violet-600 leading-tight">
                {earned.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">NOVA</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress to MAX Tier</span>
              <span className="font-bold text-indigo-600">{qualified} / {MAX_REFERRALS}</span>
            </div>
            <Progress value={progress} className="h-2 bg-indigo-50 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-violet-500" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>+{REWARD_PER_REFERRAL.toLocaleString()} NOVA / friend</span>
              <span>{remaining.toLocaleString()} left to unlock</span>
            </div>
          </div>

          {qualified >= MAX_REFERRALS && (
            <div className="mt-3 p-2.5 rounded-xl bg-green-50 border border-green-200 text-center text-xs font-semibold text-green-700">
              🎉 MAX Tier Unlocked! +900,000 NOVA bonus applied.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral link card */}
      <Card className="glass-card border border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FaTelegram className="w-4 h-4 text-[#229ED9]" />
            Your Referral Link
          </CardTitle>
          <CardDescription className="text-[11px]">
            Earn +{REWARD_PER_REFERRAL.toLocaleString()} NOVA for every qualified friend
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-4 pb-4">
          {/* Link row */}
          <div className="flex gap-2 items-stretch">
            <div className="flex-1 min-w-0 bg-secondary rounded-xl px-3 py-2 font-mono text-[11px] overflow-hidden text-ellipsis whitespace-nowrap border border-border text-muted-foreground self-center">
              {referralLink}
            </div>
            <Button
              onClick={handleCopy}
              size="icon"
              variant="outline"
              className="shrink-0 h-10 w-10 border-indigo-200 hover:bg-indigo-50"
            >
              <Copy className="w-4 h-4 text-indigo-600" />
            </Button>
          </div>
          {/* Share button */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("🚀 Join NOVA Airdrop and claim 900,000 NOVA tokens for free!")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#229ED9] text-white text-sm font-semibold hover:bg-[#1a8bbf] transition-colors"
          >
            <FaTelegram className="w-4 h-4 flex-shrink-0" />
            Share via Telegram
          </a>
        </CardContent>
      </Card>

      {/* Tier legend — compact horizontal chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {[
          { n: 1,  label: "1 friend",   reward: "90K",    color: "border-slate-200 bg-slate-50   text-slate-600" },
          { n: 3,  label: "3 friends",  reward: "270K",   color: "border-blue-200  bg-blue-50    text-blue-700"  },
          { n: 5,  label: "5 friends",  reward: "450K",   color: "border-violet-200 bg-violet-50 text-violet-700"},
          { n: 10, label: "10 friends", reward: "900K MAX", color: "border-yellow-300 bg-yellow-50 text-yellow-700"},
        ].map(tier => (
          <div
            key={tier.n}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-center min-w-[72px] ${tier.color} ${qualified >= tier.n ? "ring-1 ring-indigo-400" : ""}`}
          >
            <span className="text-[10px] font-semibold">{tier.label}</span>
            <span className="text-xs font-black">{tier.reward}</span>
            <span className="text-[9px] opacity-70">NOVA</span>
            {qualified >= tier.n && <span className="text-[9px] text-green-600 font-bold mt-0.5">✓</span>}
          </div>
        ))}
      </div>

      {/* Invites list */}
      <div>
        <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Your Invites
          {stats?.referrals && stats.referrals.length > 0 && (
            <span className="ml-auto text-[10px] text-muted-foreground font-normal">{stats.referrals.length} total</span>
          )}
        </h3>

        {(!stats?.referrals || stats.referrals.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-8 bg-secondary/50 border border-dashed border-border rounded-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-2">
              <UserPlus className="w-6 h-6 text-muted-foreground opacity-50" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">No referrals yet</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Share your link to start earning</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.referrals.map((ref, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 flex-shrink-0">
                  {(ref.firstName?.[0] || ref.username?.[0] || "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{ref.firstName || ref.username || "Anonymous"}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(ref.joinedAt).toLocaleDateString()}</div>
                </div>
                {ref.hasClaimed ? (
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200">Qualified</span>
                    <span className="text-[10px] text-green-600 mt-0.5 font-medium">+{REWARD_PER_REFERRAL.toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold border border-yellow-200 flex-shrink-0">Pending</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
