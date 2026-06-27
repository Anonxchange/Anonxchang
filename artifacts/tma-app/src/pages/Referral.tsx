import { useTelegram } from "@/components/TelegramProvider";
import { useGetReferralStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTelegram } from "react-icons/fa";
import { Copy, Users, UserPlus, Gift, Trophy } from "lucide-react";
import { toast } from "sonner";

const MAX_REFERRALS = 10;
const REWARD_PER_REFERRAL = 500_000;
const MAX_TIER_BONUS = 5_000_000;

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
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight mb-1 neon-text">Referrals</h1>
        <p className="text-muted-foreground text-sm">Invite friends and earn up to 5,000,000 extra NOVA.</p>
      </div>

      {/* Reward card */}
      <Card className="glass-card overflow-hidden border border-violet-100">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Referral Rewards Earned</div>
              <div className="text-2xl font-black text-violet-600">
                {earned.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">NOVA</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to MAX Tier</span>
              <span className="font-bold text-indigo-600">{qualified} / {MAX_REFERRALS} friends</span>
            </div>
            <Progress value={progress} className="h-2.5 bg-indigo-50 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-violet-500" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>+{REWARD_PER_REFERRAL.toLocaleString()} NOVA per qualified friend</span>
              <span>{remaining.toLocaleString()} NOVA left to unlock</span>
            </div>
          </div>

          {qualified >= MAX_REFERRALS && (
            <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-center text-sm font-semibold text-green-700">
              🎉 MAX Tier Unlocked! +5,000,000 NOVA bonus applied.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral link */}
      <Card className="glass-card border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FaTelegram className="w-4 h-4 text-[#229ED9]" />
            Your Referral Link
          </CardTitle>
          <CardDescription className="text-xs">Share via Telegram to earn +{REWARD_PER_REFERRAL.toLocaleString()} NOVA per qualified friend</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1 bg-secondary rounded-xl px-3 py-2.5 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap border border-border text-muted-foreground">
              {stats?.referralLink || `https://t.me/Airdropperxbot?start=${user?.referralCode || "DEMO"}`}
            </div>
            <Button onClick={handleCopy} size="icon" variant="outline" className="shrink-0 border-indigo-200 hover:bg-indigo-50">
              <Copy className="w-4 h-4 text-indigo-600" />
            </Button>
          </div>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(stats?.referralLink || `https://t.me/Airdropperxbot?start=${user?.referralCode || ""}`)}&text=${encodeURIComponent("🚀 Join NOVA Airdrop and claim 900,000 NOVA tokens for free!")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#229ED9] text-white text-sm font-semibold hover:bg-[#1a8bbf] transition-colors"
          >
            <FaTelegram className="w-4 h-4" />
            Share via Telegram
          </a>
        </CardContent>
      </Card>

      {/* Referral breakdown */}
      <div>
        <h3 className="font-bold text-base flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Your Invites
        </h3>

        {(!stats?.referrals || stats.referrals.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-8 bg-secondary/50 border border-dashed border-border rounded-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
              <UserPlus className="w-7 h-7 text-muted-foreground opacity-50" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">No referrals yet</span>
            <span className="text-xs text-muted-foreground mt-1">Share your link to start earning</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.referrals.map((ref, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-border hover:border-indigo-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
                    {(ref.firstName?.[0] || ref.username?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{ref.firstName || ref.username || "Anonymous"}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(ref.joinedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {ref.hasClaimed ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200">Qualified</span>
                    <span className="text-[10px] text-green-600 mt-0.5 font-medium">+{REWARD_PER_REFERRAL.toLocaleString()} NOVA</span>
                  </div>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold border border-yellow-200">Pending</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
