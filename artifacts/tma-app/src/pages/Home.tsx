import { useTelegram } from "@/components/TelegramProvider";
import { useGetGlobalStats, useGetUserClaim, useSubmitClaim, useUpdateWallet } from "@workspace/api-client-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Wallet, ChevronRight, Activity, ArrowRight, RefreshCcw, CheckCircle2 } from "lucide-react";
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

export default function Home() {
  const { telegramId, user, isLoading: userLoading } = useTelegram();
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();
  const { data: claimStatus, isLoading: claimLoading } = useGetUserClaim(telegramId, {
    query: {
      enabled: !!telegramId
    }
  });

  const updateWallet = useUpdateWallet();
  const submitClaim = useSubmitClaim();

  // Sync wallet
  useEffect(() => {
    if (isConnected && address && user && user.walletAddress !== address) {
      updateWallet.mutate({
        telegramId,
        data: { walletAddress: address }
      });
    }
  }, [isConnected, address, user, telegramId, updateWallet]);

  const handleClaim = () => {
    setIsClaiming(true);
    // Simulate transaction delay
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

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-b from-primary/20 to-transparent">
        <div className="absolute inset-0 bg-primary/10 blur-xl"></div>
        <Card className="relative glass-card border-none bg-background/40">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-[0_0_20px_rgba(99,102,241,0.5)] mb-4">
              <div className="w-full h-full bg-background/50 rounded-xl backdrop-blur-sm flex items-center justify-center">
                <span className="text-3xl font-bold text-white tracking-tighter">N</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 neon-text">NOVA Airdrop</h1>
            <p className="text-muted-foreground text-sm mb-6 max-w-[250px]">
              The next generation DeFi terminal. Claim your allocation before the deadline.
            </p>
            
            <div className="w-full grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/50 border border-secondary">
                <span className="text-xs text-muted-foreground">Your Allocation</span>
                <span className="text-xl font-bold text-foreground">10,000</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/50 border border-secondary">
                <span className="text-xs text-muted-foreground">Estimated Value</span>
                <span className="text-xl font-bold text-foreground">~$450</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Connect */}
      <Card className="glass-card">
        <CardContent className="p-4">
          {!isConnected ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Connect Wallet</span>
                </div>
                <Button size="sm" onClick={() => open()} className="neon-border">Connect</Button>
              </div>
              <div className="flex gap-2 justify-center opacity-70 mt-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6 grayscale hover:grayscale-0 transition-all" />
                <img src="https://avatars.githubusercontent.com/u/37784886" alt="WalletConnect" className="w-6 h-6 grayscale hover:grayscale-0 transition-all rounded-full" />
                <img src="https://trustwallet.com/assets/images/media/assets/TWT.png" alt="Trust Wallet" className="w-6 h-6 grayscale hover:grayscale-0 transition-all" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Connected Wallet</span>
                  <span className="font-mono text-sm">{address?.slice(0,6)}...{address?.slice(-4)}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => disconnect()}>Disconnect</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim Action */}
      <Card className="glass-card overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <CardHeader>
          <CardTitle className="text-lg">Claim Tokens</CardTitle>
          <CardDescription>Pay gas fee to claim your NOVA allocation</CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="p-4 rounded-xl bg-secondary/50 border border-secondary text-center text-sm text-muted-foreground mb-4">
              Connect your wallet first to proceed with the claim.
            </div>
          ) : claimSuccess || claimStatus?.status === 'confirmed' ? (
            <div className="flex flex-col items-center justify-center p-6 bg-green-500/10 border border-green-500/20 rounded-xl gap-2">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <span className="font-bold text-green-500">Tokens Claimed!</span>
              <span className="text-xs text-muted-foreground font-mono">TX: {claimStatus?.txHash || "0x123...abc"}</span>
            </div>
          ) : (
            <Drawer>
              <DrawerTrigger asChild>
                <Button className="w-full text-md h-12 shadow-[0_0_15px_rgba(99,102,241,0.4)]" size="lg">
                  Initiate Claim
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-card border-card-border">
                <DrawerHeader>
                  <DrawerTitle>Confirm Claim Transaction</DrawerTitle>
                  <DrawerDescription>Network fees are required to process your claim.</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                    <span className="text-muted-foreground">Allocation</span>
                    <span className="font-bold text-lg text-primary">10,000 NOVA</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span className="font-bold">0.005 ETH</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-xl border border-primary/20">
                    <span className="text-muted-foreground">Wallet Balance</span>
                    <span className="font-mono text-sm">0.124 ETH</span>
                  </div>
                </div>
                <DrawerFooter>
                  <Button 
                    onClick={handleClaim} 
                    disabled={isClaiming}
                    className="h-12 w-full shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  >
                    {isClaiming ? (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Payment"
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

      {/* Global Stats */}
      <Card className="glass-card bg-black/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4 text-primary" />
            Network Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-secondary" />
              <Skeleton className="h-4 w-2/3 bg-secondary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold tracking-tight">{stats?.totalParticipants.toLocaleString() || "0"}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Participants</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-primary">{stats?.totalClaimed || "0"}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Tokens Claimed</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Telegram Bot CTA */}
      <a 
        href="https://t.me/your_bot" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/30 text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#229ED9] flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Open in Telegram Bot</span>
            <span className="text-xs opacity-80">Get instant alerts</span>
          </div>
        </div>
        <ArrowRight className="w-5 h-5" />
      </a>
    </div>
  );
}
