import { useState, useEffect } from "react";

const FALLBACK_PRICE = 0.003316;
const CACHE_TTL_MS = 60_000;

let cachedPrice: number | null = null;
let cachedAt = 0;

export function useNovaPrice() {
  const [price, setPrice] = useState<number>(cachedPrice ?? FALLBACK_PRICE);
  const [loading, setLoading] = useState(!cachedPrice);

  useEffect(() => {
    const now = Date.now();
    if (cachedPrice && now - cachedAt < CACHE_TTL_MS) {
      setPrice(cachedPrice);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=nova-on-bnb&vs_currencies=usd",
      { headers: { Accept: "application/json" } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const live = data?.["nova-on-bnb"]?.usd;
        if (typeof live === "number" && live > 0) {
          cachedPrice = live;
          cachedAt = Date.now();
          setPrice(live);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { price, loading };
}
