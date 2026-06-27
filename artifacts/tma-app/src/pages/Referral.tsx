import { useTelegram } from "@/components/TelegramProvider";
import { useGetReferralStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Users, UserPlus, Gift, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function Referral() {
  const { telegramId, user } = useTelegram();
  const { data: stats, isLoading } = useGetReferralStats(telegramId, {
    query: { enabled: !!telegramId }
  });

  const handleCopy = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      toast.success("Referral link copied!");
    }
  };

  const progress = Math.min((stats?.qualifiedReferrals || 0) / 10 * 100, 100);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold mb-2">Referrals</h1>
        <Skeleton className="h-40 w-full rounded-xl bg-secondary" />
        <Skeleton className="h-64 w-full rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2 neon-text">Referrals</h1>
        <p className="text-muted-foreground text-sm">Build your network to earn more rewards.</p>
      </div>

      <Card className="glass-card relative overflow-hidden border-primary/30">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 blur-2xl rounded-full"></div>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Gift className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Pending Reward</span>
              <span className="text-2xl font-bold text-foreground">{stats?.pendingReward || "0"} NOVA</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Path to MAX Tier</span>
              <span className="font-mono font-bold text-primary">{stats?.qualifiedReferrals || 0} / 10</span>
            </div>
            <Progress value={progress} className="h-2 bg-secondary" />
            <p className="text-xs text-muted-foreground text-center">
              Earn an extra 5,000 NOVA when you reach 10 qualified referrals.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Your Referral Link</CardTitle>
          <CardDescription className="text-xs">Share this link to invite friends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 bg-secondary rounded-lg px-3 py-3 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap border border-border">
              {stats?.referralLink || `https://t.me/novabot?start=${user?.referralCode}`}
            </div>
            <Button onClick={handleCopy} size="icon" className="shrink-0 neon-border">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-lg flex items-center gap-2 mt-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Your Invites
        </h3>
        
        {(!stats?.referrals || stats.referrals.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-8 bg-secondary/30 border border-dashed border-border rounded-xl text-center">
            <UserPlus className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            <span className="text-sm text-muted-foreground">No referrals yet</span>
            <span className="text-xs text-muted-foreground mt-1">Share your link to get started</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.referrals.map((ref, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted-foreground font-semibold text-xs border border-border">
                    {(ref.firstName?.[0] || ref.username?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{ref.firstName || ref.username || "Anonymous User"}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(ref.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {ref.hasClaimed ? (
                  <span className="text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-500 font-medium">Qualified</span>
                ) : (
                  <span className="text-[10px] px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 font-medium">Pending</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
