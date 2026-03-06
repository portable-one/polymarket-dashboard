const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

export interface Market {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  volume24hr: number;
  volume1wk?: number;
  liquidity: string;
  active: boolean;
  closed: boolean;
  startDate: string;
  endDate: string;
  image?: string;
  icon?: string;
  description?: string;
  clobTokenIds?: string[];
  negRisk?: boolean;
  featured?: boolean;
  events?: Event[];
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  markets?: Market[];
  volume?: string;
  liquidity?: string;
  startDate?: string;
  endDate?: string;
  tags?: Array<{ id: string; label: string; slug: string }>;
}

export interface PricePoint {
  t: number;
  p: number;
}

export interface PriceHistory {
  history: PricePoint[];
}

export async function fetchTrendingMarkets(limit = 20): Promise<Market[]> {
  const url = `${GAMMA_API}/markets?active=true&closed=false&limit=${limit}&order=volume24hr&ascending=false`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

export async function searchMarkets(query: string, limit = 20): Promise<Market[]> {
  const url = `${GAMMA_API}/markets?active=true&closed=false&limit=${limit}&_c=${encodeURIComponent(query)}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

export async function fetchEventBySlug(slug: string): Promise<Event[]> {
  const url = `${GAMMA_API}/events?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

export async function fetchEventsByTag(tag: string, limit = 10): Promise<Event[]> {
  const url = `${GAMMA_API}/events?tag=${encodeURIComponent(tag)}&active=true&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

// CLOB API has a hard limit of ~15 days per request.
// For longer ranges, we chunk into 14-day windows and stitch results.
const MAX_INTERVAL = 14 * 24 * 3600; // 14 days in seconds

async function fetchPriceHistoryChunk(
  market: string,
  startTs: number,
  endTs: number,
  fidelity: number
): Promise<PricePoint[]> {
  const url = `${CLOB_API}/prices-history?market=${market}&startTs=${startTs}&endTs=${endTs}&fidelity=${fidelity}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
  const data: PriceHistory = await res.json();
  return data.history || [];
}

export async function fetchPriceHistory(
  market: string,
  startTs: number,
  endTs: number,
  fidelity = 60
): Promise<PricePoint[]> {
  const interval = endTs - startTs;
  if (interval <= MAX_INTERVAL) {
    return fetchPriceHistoryChunk(market, startTs, endTs, fidelity);
  }

  // Chunk into MAX_INTERVAL windows
  const chunks: Promise<PricePoint[]>[] = [];
  let chunkStart = startTs;
  while (chunkStart < endTs) {
    const chunkEnd = Math.min(chunkStart + MAX_INTERVAL, endTs);
    chunks.push(fetchPriceHistoryChunk(market, chunkStart, chunkEnd, fidelity));
    chunkStart = chunkEnd;
  }

  const results = await Promise.all(chunks);
  return results.flat().sort((a, b) => a.t - b.t);
}

export async function fetchMarketById(id: string): Promise<Market> {
  const url = `${GAMMA_API}/markets/${id}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

// Iran conflict event slug
export const IRAN_CONFLICT_SLUG = "iran-x-israelus-conflict-ends-by";

// Known Iran/Middle East related tags/slugs
export const IRAN_TAGS = ["iran", "middle-east", "israel", "geopolitics"];
