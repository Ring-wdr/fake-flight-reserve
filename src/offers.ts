// 판매사 자체 목록의 공통 로직. 화면이나 판매사별 차이를 모르며, 판매처를 추가해도 그대로 쓴다.
import { SITES, type SiteId } from "./brand";
import { FLIGHTS, legPrice, seats, type Flight, type Search } from "./data";

export type Listing = { site: SiteId; search: Search; anchor: number; seed: number; soldId?: string };

export type Offer = {
  id: string;
  flight: Flight;
  ret?: Flight;
  price: number;
  isAnchor: boolean;
  seatsLeft: number;
};

export function sellerFare(site: SiteId, s: Search, outId: string, retId?: string) {
  const out = FLIGHTS.find((f) => f.id === outId)!;
  const ret = FLIGHTS.find((f) => f.id === retId);
  return legPrice(out, s) + (ret ? legPrice(ret, s, "ret") : 0) + SITES[site].delta * seats(s);
}

// 조건을 새로 검색했을 때의 기준가: 시장 최저가에 판매사 차액을 더한 값.
export function marketAnchor(site: SiteId, s: Search) {
  const cheapest = (leg: "out" | "ret") => Math.min(...FLIGHTS.map((f) => legPrice(f, s, leg)));
  return cheapest("out") + (s.trip === "round" ? cheapest("ret") : 0) + SITES[site].delta * seats(s);
}

export function createListing(site: SiteId, search: Search, from: { anchor?: number; soldId?: string } = {}): Listing {
  return {
    site,
    search,
    anchor: from.anchor ?? marketAnchor(site, search),
    soldId: from.soldId,
    seed: Math.floor(Math.random() * 2 ** 31),
  };
}

// 같은 목록은 새로고침해도 같은 결과가 나오도록 시드 기반 난수를 쓴다.
function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round100 = (n: number) => Math.round(n / 100) * 100;

// 기준가는 절반 확률로만 목록에 나오고, 나머지는 모두 기준가보다 비싸다.
export function buildOffers({ search, anchor, seed, soldId }: Listing): { offers: Offer[]; anchorIncluded: boolean } {
  const rng = rngFrom(seed);
  const shuffled = [...FLIGHTS].sort(() => rng() - 0.5);
  const anchorIncluded = rng() < 0.5;
  const anchorFlight = shuffled.find((f) => f.id !== soldId) ?? shuffled[0];
  let step = 1 + 0.03 + rng() * 0.05;
  const offers = shuffled.map((flight): Offer => {
    const isAnchor = anchorIncluded && flight === anchorFlight;
    const price = isAnchor ? round100(anchor) : Math.max(round100(anchor * step), round100(anchor) + 100);
    if (!isAnchor) step += 0.02 + rng() * 0.08;
    return {
      id: `${seed}-${flight.id}`,
      flight,
      ret: search.trip === "round" ? FLIGHTS[Math.floor(rng() * FLIGHTS.length)] : undefined,
      price,
      isAnchor,
      seatsLeft: 1 + Math.floor(rng() * 8),
    };
  });
  return { offers: offers.sort((a, b) => a.price - b.price), anchorIncluded };
}
