import { useListTokens } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaTelegram } from "react-icons/fa";

const tokenLogos: Record<string, string> = {
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  PEPE: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
  WIF: "https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg",
  FLOKI: "https://assets.coingecko.com/coins/images/16746/small/PNG_image.png",
  ONDO: "https://assets.coingecko.com/coins/images/26580/small/ONDO.png",
};

export default function Tokens() {
  const { data: tokens, isLoading } = useListTokens();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight mb-1 neon-text">Discover Airdrops</h1>
        <p className="text-muted-foreground text-sm">Top curated token distribution events.</p>
      </div>

      {/* Featured NOVA */}
      <div className="hero-gradient rounded-2xl p-5 text-white flex items-center gap-4 shadow-md">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/30 shadow-lg flex-shrink-0">
          <img
            src="https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png"
            alt="NOVA"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-black text-lg">NOVA Token</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider border border-white/30">Active</span>
          </div>
          <div className="text-white/70 text-xs mb-1">Your allocation: <span className="text-white font-bold">3,000,000 NOVA</span></div>
        </div>
        <a
          href="https://t.me/your_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 text-white text-xs font-semibold border border-white/30 hover:bg-white/30 transition-colors flex-shrink-0"
        >
          <FaTelegram className="w-3.5 h-3.5" />
          Claim
        </a>
      </div>

      {/* Token grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tokens?.filter(t => t.symbol !== 'NOVA').map(token => (
          <Card key={token.id} className="glass-card overflow-hidden flex flex-col hover:shadow-md hover:border-indigo-100 transition-all">
            {/* Card banner */}
            <div className="h-14 relative w-full bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-border/50">
              {token.isFeatured && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                  Featured
                </div>
              )}
            </div>

            <CardContent className="p-3 flex-1 flex flex-col relative pt-0">
              {/* Token logo */}
              <div className="w-11 h-11 rounded-full bg-white border-2 border-border absolute -top-5 left-3 overflow-hidden shadow-md">
                <img
                  src={tokenLogos[token.symbol] || token.logoUrl}
                  alt={token.symbol}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/44x44/6366f1/white?text=${token.symbol[0]}`;
                  }}
                />
              </div>

              <div className="mt-7 flex flex-col flex-1">
                <h3 className="font-bold text-sm truncate leading-tight">{token.name}</h3>
                <span className="text-xs font-mono text-indigo-600 mb-2">${token.symbol}</span>

                <div className="flex flex-col gap-1.5 mt-auto text-xs text-muted-foreground bg-secondary/60 p-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Users</span>
                    <span className="font-semibold text-foreground">{token.totalParticipants.toLocaleString()}</span>
                  </div>
                  {token.claimDeadline && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ends</span>
                      <span className="font-semibold text-foreground">{new Date(token.claimDeadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 border border-indigo-100">
                  View <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
