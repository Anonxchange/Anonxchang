import { useTelegram } from "@/components/TelegramProvider";
import { useGetGlobalStats, useGetUserClaim, useSubmitClaim, useUpdateWallet } from "@workspace/api-client-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Wallet, Activity, RefreshCcw, CheckCircle2, Zap } from "lucide-react";
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

const TOTAL_ALLOCATION = 3_000_000;
const ESTIMATED_VALUE_PER_TOKEN = 0.00015;

export default function Home() {
  const { telegramId, user, isLoading: userLoading } = useTelegram();
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();
  const { data: claimStatus, isLoading: claimLoading } = useGetUserClaim(telegramId, {
    query: { enabled: !!telegramId }
  });

  const updateWallet = useUpdateWallet();
  const submitClaim = useSubmitClaim();

  useEffect(() => {
    if (isConnected && address && user && user.walletAddress !== address) {
      updateWallet.mutate({ telegramId, data: { walletAddress: address } });
    }
  }, [isConnected, address, user, telegramId, updateWallet]);

  const handleClaim = () => {
    setIsClaiming(true);
    setTimeout(() => {
      submitClaim.mutate({
        data: {
          telegramId,
          walletAddress: address || "",
          txHash: "0x" + Math.random().toString(16).substr(2, 40),
          feePaid: "0.005",
          tokenSymbol: "NOVA"
        }
      }, {
        onSuccess: () => {
          setIsClaiming(false);
          setClaimSuccess(true);
          toast.success("Claim submitted successfully!");
        },
        onError: () => {
          setIsClaiming(false);
          toast.error("Failed to submit claim.");
        }
      });
    }, 2500);
  };

  const estimatedUSD = (TOTAL_ALLOCATION * ESTIMATED_VALUE_PER_TOKEN).toLocaleString("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0
  });

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
              <p className="text-white/70 text-xs">Next-gen DeFi Terminal</p>
            </div>
          </div>

          <p className="text-white/80 text-sm mb-5 leading-relaxed">
            Your allocation is reserved. Connect your wallet and claim before the deadline.
          </p>

          {/* Allocation stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-white/60 text-xs mb-1 uppercase tracking-wider">Your Allocation</div>
              <div className="text-white font-black text-2xl tabular-nums">
                {TOTAL_ALLOCATION.toLocaleString()}
              </div>
              <div className="text-white/70 text-xs mt-0.5">NOVA tokens</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="text-white/60 text-xs mb-1 uppercase tracking-wider">Est. Value</div>
              <div className="text-white font-black text-2xl">{estimatedUSD}</div>
              <div className="text-white/70 text-xs mt-0.5">at listing price</div>
            </div>
          </div>
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
                <span className="text-xs text-muted-foreground">Supported wallets:</span>
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

      {/* ── Claim Card ──────────────────────────────────── */}
      <Card className="glass-card overflow-hidden border border-border">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Claim NOVA Tokens
          </CardTitle>
          <CardDescription className="text-xs">A small gas fee is required to process your claim on-chain.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {!isConnected ? (
            <div className="p-4 rounded-xl bg-secondary text-center text-sm text-muted-foreground">
              Connect your wallet above to proceed.
            </div>
          ) : claimSuccess || claimStatus?.status === 'confirmed' ? (
            <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-xl gap-2">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <span className="font-bold text-green-600">Tokens Claimed!</span>
              <span className="text-xs text-muted-foreground font-mono">TX: {claimStatus?.txHash || "0x123...abc"}</span>
            </div>
          ) : (
            <Drawer>
              <DrawerTrigger asChild>
                <Button className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md border-0">
                  Initiate Claim → 3,000,000 NOVA
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-white border-border">
                <DrawerHeader>
                  <DrawerTitle>Confirm Claim Transaction</DrawerTitle>
                  <DrawerDescription>Network fees are required to process your claim.</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <span className="text-muted-foreground text-sm">Your Allocation</span>
                    <span className="font-black text-lg text-indigo-600">3,000,000 NOVA</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                    <span className="text-muted-foreground text-sm">Est. Value</span>
                    <span className="font-semibold">{estimatedUSD}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                    <span className="text-muted-foreground text-sm">Network Fee</span>
                    <span className="font-semibold">0.005 ETH</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-xl border border-primary/20">
                    <span className="text-muted-foreground text-sm">Wallet</span>
                    <span className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                </div>
                <DrawerFooter>
                  <Button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="h-12 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0"
                  >
                    {isClaiming ? (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : "Confirm & Claim"}
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

      {/* ── Telegram CTA ────────────────────────────────── */}
      <a
        href="https://t.me/your_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/25 hover:bg-[#229ED9]/15 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <FaTelegram className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#229ED9]">Join Telegram Bot</div>
            <div className="text-xs text-[#229ED9]/70">Get instant claim alerts</div>
          </div>
        </div>
        <svg className="w-4 h-4 text-[#229ED9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}
