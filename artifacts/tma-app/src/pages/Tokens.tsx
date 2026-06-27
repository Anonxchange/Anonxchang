import { useListTokens } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Drawer, DrawerClose, DrawerContent,
  DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import { Users, Calendar, ArrowUpRight, Globe, Layers, Coins, Clock, CheckCircle2, Hourglass } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import { useState } from "react";
import type { AirdropToken } from "@workspace/api-client-react";

const tokenLogos: Record<string, string> = {
  ETH:  "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BNB:  "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  PEPE: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
  WIF:  "https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg",
  FLOKI:"https://assets.coingecko.com/coins/images/16746/small/PNG_image.png",
  ONDO: "https://assets.coingecko.com/coins/images/26580/small/ONDO.png",
  NOVA: "https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png",
};

// Static coming-soon tokens shown regardless of DB
const COMING_SOON_TOKENS: AirdropToken[] = [
  {
    id: -1,
    symbol: "PEPE",
    name: "Pepe",
    logoUrl: tokenLogos.PEPE,
    network: "Ethereum",
    totalSupply: "420,690,000,000,000",
    airdropAmount: "TBA",
    feeRequired: "0",
    feeToken: "ETH",
    claimDeadline: null,
    totalParticipants: 0,
    description: "Pepe is a community meme coin on Ethereum. Airdrop details coming soon.",
    website: null,
    isFeatured: false,
  },
  {
    id: -2,
    symbol: "WIF",
    name: "dogwifhat",
    logoUrl: tokenLogos.WIF,
    network: "Solana",
    totalSupply: "998,925,000",
    airdropAmount: "TBA",
    feeRequired: "0",
    feeToken: "SOL",
    claimDeadline: null,
    totalParticipants: 0,
    description: "dogwifhat (WIF) is a popular meme coin on Solana. Airdrop campaign launching soon.",
    website: null,
    isFeatured: false,
  },
  {
    id: -3,
    symbol: "FLOKI",
    name: "FLOKI",
    logoUrl: tokenLogos.FLOKI,
    network: "BNB Chain",
    totalSupply: "10,000,000,000,000",
    airdropAmount: "TBA",
    feeRequired: "0",
    feeToken: "BNB",
    claimDeadline: null,
    totalParticipants: 0,
    description: "FLOKI is the utility token of the Floki ecosystem, available on BSC and Ethereum. Distribution date TBA.",
    website: null,
    isFeatured: false,
  },
  {
    id: -4,
    symbol: "ONDO",
    name: "Ondo Finance",
    logoUrl: tokenLogos.ONDO,
    network: "Ethereum",
    totalSupply: "10,000,000,000",
    airdropAmount: "TBA",
    feeRequired: "0",
    feeToken: "ETH",
    claimDeadline: null,
    totalParticipants: 0,
    description: "Ondo Finance is a leading real-world asset protocol. Community airdrop coming soon.",
    website: null,
    isFeatured: false,
  },
  {
    id: -5,
    symbol: "BNB",
    name: "BNB",
    logoUrl: tokenLogos.BNB,
    network: "BNB Chain",
    totalSupply: "145,800,000",
    airdropAmount: "TBA",
    feeRequired: "0",
    feeToken: "BNB",
    claimDeadline: null,
    totalParticipants: 0,
    description: "BNB is the native token of BNB Smart Chain. Special community airdrop event coming soon.",
    website: null,
    isFeatured: false,
  },
  {
    id: -6,
    symbol: "ETH",
    name: "Ethereum",
    logoUrl: tokenLogos.ETH,
    network: "Ethereum",
    totalSupply: "120,000,000",
    airdropAmount: "TBA",
    feeRequired: "0",
    feeToken: "ETH",
    claimDeadline: null,
    totalParticipants: 0,
    description: "Ethereum is the leading smart contract platform. Exclusive ETH community distribution event — date to be announced.",
    website: null,
    isFeatured: false,
  },
];

function getStatus(token: AirdropToken): "active" | "coming_soon" | "ended" {
  if (token.symbol === "NOVA") return "active";
  return "coming_soon";
}

function StatusBadge({ status }: { status: "active" | "coming_soon" | "ended" }) {
  if (status === "active") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200 uppercase tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
      Live
    </span>
  );
  if (status === "coming_soon") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 uppercase tracking-wide">
      <Hourglass className="w-2.5 h-2.5" />
      Coming Soon
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 uppercase tracking-wide">
      Ended
    </span>
  );
}

function TokenDetailDrawer({ token, open, onClose }: { token: AirdropToken | null; open: boolean; onClose: () => void }) {
  if (!token) return null;
  const status = token.symbol === "NOVA" ? "active" : getStatus(token);
  const logo = tokenLogos[token.symbol] || token.logoUrl;
  const deadline = token.claimDeadline ? new Date(token.claimDeadline) : null;

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DrawerContent className="bg-white border-border max-h-[90vh] overflow-y-auto">
        <DrawerHeader className="pb-0">
          {/* Token identity */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border shadow flex-shrink-0 bg-secondary">
              <img src={logo} alt={token.symbol} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/64x64/6366f1/white?text=${token.symbol[0]}`; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-xl font-black">{token.name}</DrawerTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm font-mono text-indigo-600 font-semibold">${token.symbol}</span>
                <StatusBadge status={status} />
                {token.isFeatured && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 uppercase tracking-wide">Featured</span>
                )}
              </div>
            </div>
          </div>

          {/* Airdrop status banner */}
          {status === "active" && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-green-800">Airdrop is Live — Claim Now</div>
                {deadline && (
                  <div className="text-xs text-green-600">Closes {deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                )}
              </div>
            </div>
          )}
          {status === "coming_soon" && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
              <Hourglass className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-800">Coming Soon</div>
                <div className="text-xs text-amber-600">Airdrop date not yet announced. Stay tuned.</div>
              </div>
            </div>
          )}
          {status === "ended" && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-slate-500">Airdrop Ended</div>
                <div className="text-xs text-slate-400">This distribution has closed.</div>
              </div>
            </div>
          )}
        </DrawerHeader>

        <div className="px-4 pb-6 flex flex-col gap-4">
          {/* Description */}
          {token.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{token.description}</p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-secondary flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Coins className="w-3.5 h-3.5" /> Airdrop Amount
              </div>
              <div className="font-bold text-sm">{token.airdropAmount} <span className="text-xs font-mono text-indigo-600">{token.symbol}</span></div>
            </div>
            <div className="p-3 rounded-xl bg-secondary flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Users className="w-3.5 h-3.5" /> Participants
              </div>
              <div className="font-bold text-sm">{token.totalParticipants > 0 ? token.totalParticipants.toLocaleString() : "TBA"}</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Layers className="w-3.5 h-3.5" /> Network
              </div>
              <div className="font-bold text-sm">{token.network}</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Calendar className="w-3.5 h-3.5" /> {deadline ? "Deadline" : "Status"}
              </div>
              <div className="font-bold text-sm">
                {deadline ? deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBA"}
              </div>
            </div>
          </div>

          {/* Gas fee note */}
          {token.feeRequired && Number(token.feeRequired) > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
              <span className="font-bold">Network fee required:</span> A standard blockchain gas fee will be charged when claiming. The exact amount depends on network congestion at the time of claim.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-1">
            {status === "active" && token.symbol === "NOVA" ? (
              <a href="https://t.me/Airdropperxbot" target="_blank" rel="noopener noreferrer">
                <Button className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0">
                  <FaTelegram className="mr-2 w-4 h-4" />
                  Claim on Telegram
                </Button>
              </a>
            ) : status === "active" ? (
              <Button className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0" disabled>
                Claim Airdrop
              </Button>
            ) : status === "coming_soon" ? (
              <Button variant="outline" className="w-full h-11 border-amber-200 text-amber-700 hover:bg-amber-50" disabled>
                <Hourglass className="mr-2 w-4 h-4" />
                Coming Soon
              </Button>
            ) : (
              <Button variant="outline" className="w-full h-11" disabled>
                Airdrop Ended
              </Button>
            )}

            {token.website && (
              <a href={token.website} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" className="w-full h-9 text-xs text-indigo-600 hover:bg-indigo-50 border border-indigo-100">
                  <Globe className="mr-1.5 w-3.5 h-3.5" />
                  Visit Website
                </Button>
              </a>
            )}
          </div>

          <DrawerClose asChild>
            <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground">Close</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function Tokens() {
  const { data: dbTokens, isLoading } = useListTokens();
  const [selected, setSelected] = useState<AirdropToken | null>(null);

  const novaToken: AirdropToken = {
    id: 0,
    symbol: "NOVA",
    name: "NOVA Token",
    logoUrl: "https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png",
    network: "BNB Chain",
    totalSupply: "—",
    airdropAmount: "900,000",
    feeRequired: "0.005",
    feeToken: "BNB",
    claimDeadline: "2026-07-25T23:59:59Z",
    totalParticipants: 167,
    description: "NOVA is the next-gen DeFi terminal token. This exclusive airdrop distributes 900,000 NOVA to eligible participants who complete tasks and pay a small gas fee. NOVA is live on CoinGecko and actively traded.",
    website: "https://t.me/Airdropperxbot",
    isFeatured: true,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Merge DB tokens (excluding NOVA) with static coming-soon list
  const dbOther = (dbTokens ?? []).filter(t => t.symbol !== "NOVA");
  const dbSymbols = new Set(dbOther.map(t => t.symbol));
  const staticTokens = COMING_SOON_TOKENS.filter(t => !dbSymbols.has(t.symbol));
  const allOtherTokens = [...dbOther, ...staticTokens];

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight mb-1 neon-text">Discover Airdrops</h1>
        <p className="text-muted-foreground text-sm">Curated token distribution events — live & upcoming.</p>
      </div>

      {/* Featured NOVA banner — tappable */}
      <button
        onClick={() => setSelected(novaToken)}
        className="w-full text-left hero-gradient rounded-2xl p-5 text-white flex items-center gap-4 shadow-md hover:opacity-95 transition-opacity"
      >
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/30 shadow-lg flex-shrink-0">
          <img src="https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png" alt="NOVA" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-black text-lg">NOVA Token</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold border border-white/30 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Live
            </span>
          </div>
          <div className="text-white/70 text-xs">Your allocation: <span className="text-white font-bold">900,000 NOVA</span></div>
          <div className="text-white/60 text-xs mt-0.5">Tap to view details →</div>
        </div>
      </button>

      {/* Coming soon label */}
      <div className="flex items-center gap-2">
        <Hourglass className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Coming Soon</span>
        <div className="flex-1 h-px bg-amber-100" />
      </div>

      {/* Other token cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allOtherTokens.map(token => {
          const status = getStatus(token);
          const logo = tokenLogos[token.symbol] || token.logoUrl;
          return (
            <Card
              key={token.id}
              className="glass-card overflow-hidden flex flex-col hover:shadow-md hover:border-amber-100 transition-all cursor-pointer"
              onClick={() => setSelected(token)}
            >
              {/* Banner */}
              <div className="h-14 relative w-full bg-gradient-to-br from-amber-50 to-orange-50 border-b border-border/50">
                <div className="absolute top-2 right-2">
                  <StatusBadge status={status} />
                </div>
              </div>

              <CardContent className="p-3 flex-1 flex flex-col relative pt-0">
                {/* Logo */}
                <div className="w-11 h-11 rounded-full bg-white border-2 border-border absolute -top-5 left-3 overflow-hidden shadow-md">
                  <img src={logo} alt={token.symbol} className="w-full h-full rounded-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/44x44/6366f1/white?text=${token.symbol[0]}`; }}
                  />
                </div>

                <div className="mt-7 flex flex-col flex-1">
                  <h3 className="font-bold text-sm truncate leading-tight">{token.name}</h3>
                  <span className="text-xs font-mono text-indigo-600 mb-2">${token.symbol}</span>

                  <div className="flex flex-col gap-1.5 mt-auto text-xs text-muted-foreground bg-secondary/60 p-2 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Network</span>
                      <span className="font-semibold text-foreground truncate max-w-[60px] text-right">{token.network.split(" ")[0]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</span>
                      <span className="font-semibold text-amber-600">TBA</span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 border border-amber-100">
                    Details <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail drawer */}
      <TokenDetailDrawer
        token={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
