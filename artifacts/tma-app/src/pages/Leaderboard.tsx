import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Crown, Users } from "lucide-react";
import { useTelegram } from "@/components/TelegramProvider";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

async function fetchLeaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json() as Promise<{
    rank: number;
    telegramId: string;
    displayName: string;
    referralCode: string;
    totalRewards: number;
    hasClaimed: boolean;
  }[]>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
      <Crown className="w-4 h-4 text-white" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow flex-shrink-0">
      <Medal className="w-4 h-4 text-white" />
    </div>
  );
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow flex-shrink-0">
      <Medal className="w-4 h-4 text-white" />
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
    </div>
  );
}

export default function Leaderboard() {
  const { telegramId } = useTelegram();
  const { data: board, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 30_000,
  });

  const myRank = board?.find(u => u.telegramId === telegramId);

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight mb-1 neon-text">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">Top NOVA earners by referral rewards.</p>
      </div>

      {/* My rank card */}
      {myRank && (
        <div className="hero-gradient rounded-2xl p-4 text-white flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
            <span className="font-black text-xl">#{myRank.rank}</span>
          </div>
          <div className="flex-1">
            <div className="text-white/70 text-xs uppercase tracking-wider mb-0.5">Your Position</div>
            <div className="font-black text-lg">{myRank.displayName}</div>
            <div className="text-white/80 text-xs">{myRank.totalRewards.toLocaleString()} NOVA earned</div>
          </div>
          {myRank.hasClaimed && (
            <span className="px-2 py-1 rounded-full bg-green-400/20 text-green-300 text-[10px] font-bold border border-green-400/30">
              Claimed
            </span>
          )}
        </div>
      )}

      {/* Top 3 podium */}
      {!isLoading && board && board.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-2 pt-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-slate-300 flex items-center justify-center">
              <span className="font-black text-slate-600 text-sm">{board[1].displayName[0].toUpperCase()}</span>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold truncate max-w-[80px]">{board[1].displayName}</div>
              <div className="text-[10px] text-muted-foreground">{board[1].totalRewards.toLocaleString()} NOVA</div>
            </div>
            <div className="w-full h-16 bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200 rounded-t-xl flex items-center justify-center">
              <span className="font-black text-slate-500 text-xl">2</span>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 border-2 border-yellow-400 flex items-center justify-center shadow-lg">
              <span className="font-black text-white text-base">{board[0].displayName[0].toUpperCase()}</span>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold truncate max-w-[80px]">{board[0].displayName}</div>
              <div className="text-[10px] text-muted-foreground">{board[0].totalRewards.toLocaleString()} NOVA</div>
            </div>
            <div className="w-full h-24 bg-gradient-to-b from-yellow-50 to-yellow-100 border border-yellow-200 rounded-t-xl flex items-center justify-center">
              <span className="font-black text-yellow-500 text-2xl">1</span>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center gap-2 pt-10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 border-2 border-orange-300 flex items-center justify-center">
              <span className="font-black text-orange-700 text-sm">{board[2].displayName[0].toUpperCase()}</span>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold truncate max-w-[80px]">{board[2].displayName}</div>
              <div className="text-[10px] text-muted-foreground">{board[2].totalRewards.toLocaleString()} NOVA</div>
            </div>
            <div className="w-full h-12 bg-gradient-to-b from-orange-50 to-orange-100 border border-orange-200 rounded-t-xl flex items-center justify-center">
              <span className="font-black text-orange-400 text-xl">3</span>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="flex flex-col gap-2">
        {isLoading && (
          <>
            {[1,2,3,4,5].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-8 bg-secondary/50 border border-dashed border-border rounded-2xl text-center">
            <Users className="w-10 h-10 text-muted-foreground opacity-40 mb-2" />
            <span className="text-sm text-muted-foreground">Could not load leaderboard</span>
          </div>
        )}

        {!isLoading && board?.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 bg-secondary/50 border border-dashed border-border rounded-2xl text-center">
            <Trophy className="w-10 h-10 text-muted-foreground opacity-40 mb-2" />
            <span className="text-sm text-muted-foreground">No entries yet — be the first!</span>
            <span className="text-xs text-muted-foreground mt-1">Invite friends to earn NOVA and climb the ranks</span>
          </div>
        )}

        {board?.map((entry) => {
          const isMe = entry.telegramId === telegramId;
          return (
            <Card
              key={entry.rank}
              className={cn(
                "glass-card border transition-all",
                isMe ? "border-indigo-300 bg-indigo-50/60" : "border-border hover:border-indigo-100",
                entry.rank <= 3 ? "shadow-sm" : ""
              )}
            >
              <CardContent className="p-3.5 flex items-center gap-3">
                <RankBadge rank={entry.rank} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold text-sm truncate", isMe && "text-indigo-700")}>
                      {entry.displayName}
                      {isMe && <span className="ml-1 text-xs font-medium text-indigo-500">(You)</span>}
                    </span>
                    {entry.hasClaimed && (
                      <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200">
                        Claimed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {entry.totalRewards > 0
                      ? `${entry.totalRewards.toLocaleString()} NOVA earned`
                      : "No referral rewards yet"}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={cn(
                    "text-sm font-black tabular-nums",
                    entry.rank === 1 ? "text-yellow-500" :
                    entry.rank === 2 ? "text-slate-400" :
                    entry.rank === 3 ? "text-orange-400" : "text-muted-foreground"
                  )}>
                    {entry.totalRewards > 0 ? `+${entry.totalRewards.toLocaleString()}` : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">NOVA</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
