import { useListTokens } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Users, Calendar, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fallback images defined in spec
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
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold mb-4">Featured Airdrops</h1>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2 neon-text">Discover Airdrops</h1>
        <p className="text-muted-foreground text-sm">Top curated token distribution events.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tokens?.map(token => (
          <Card key={token.id} className="glass-card overflow-hidden flex flex-col hover:border-primary/40 transition-colors">
            <div className="h-16 relative w-full bg-gradient-to-br from-secondary to-background border-b border-border/50">
              {token.isFeatured && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                  Featured
                </div>
              )}
            </div>
            
            <CardContent className="p-3 flex-1 flex flex-col relative pt-0">
              <div className="w-12 h-12 rounded-full bg-background border-2 border-border absolute -top-6 left-3 overflow-hidden shadow-lg p-0.5">
                {token.symbol === 'NOVA' ? (
                   <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold tracking-tighter">N</div>
                ) : (
                  <img src={tokenLogos[token.symbol] || token.logoUrl} alt={token.symbol} className="w-full h-full rounded-full object-cover" />
                )}
              </div>
              
              <div className="mt-8 flex flex-col flex-1">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-bold text-base truncate">{token.name}</h3>
                </div>
                <span className="text-xs font-mono text-primary mb-3">${token.symbol}</span>
                
                <div className="flex flex-col gap-2 mt-auto text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Users</span>
                    <span className="font-medium text-foreground">{token.totalParticipants.toLocaleString()}</span>
                  </div>
                  {token.claimDeadline && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ends</span>
                      <span className="font-medium text-foreground">{new Date(token.claimDeadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <Button variant="ghost" className="w-full mt-3 h-8 text-xs border-primary/20 hover:bg-primary/10 hover:text-primary">
                  View Details <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
