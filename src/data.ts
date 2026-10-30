export type Flight = {
  id: string;
  airline: string;
  code: string;
  color: string;
  dep: string;
  arr: string;
  plusDay?: boolean;
  duration: string;
  stops: number;
  stopInfo?: string;
  co2: number;
  price: number;
  bag: boolean;
};

export const AIRPORTS: Record<string, string> = {
  ICN: "서울특별시",
  BKK: "방콕",
  NRT: "도쿄",
  SIN: "싱가포르",
  DAD: "다낭",
};

export const FLIGHTS: Flight[] = [
  { id: "f1", airline: "한빛항공", code: "HB 511", color: "#e8590c", dep: "오후 5:05", arr: "오후 9:25", duration: "6시간 20분", stops: 0, co2: 308, price: 273700, bag: false },
  { id: "f2", airline: "푸른하늘항공", code: "BS 207", color: "#1c7ed6", dep: "오후 7:30", arr: "오후 11:50", duration: "6시간 20분", stops: 0, co2: 308, price: 283000, bag: true },
  { id: "f3", airline: "동방에어", code: "DA 828", color: "#c92a2a", dep: "오후 6:25", arr: "오전 1:55", plusDay: true, duration: "9시간 30분", stops: 1, stopInfo: "2시간 25분 PVG", co2: 298, price: 241600, bag: false },
  { id: "f4", airline: "트리니티에어", code: "TR 311", color: "#a9843c", dep: "오전 7:50", arr: "오후 12:10", duration: "6시간 20분", stops: 0, co2: 260, price: 292100, bag: true },
  { id: "f5", airline: "홍콩퀵", code: "HQ 121", color: "#862e9c", dep: "오후 12:25", arr: "오후 7:00", duration: "8시간 35분", stops: 1, stopInfo: "1시간 25분 HKG", co2: 336, price: 235000, bag: false },
];

export const OTHER_SELLERS = [
  { name: "다른여행 A", delta: 8600 },
  { name: "항공사 공식 사이트", delta: 24600 },
];

export const won = (n: number) => "₩" + n.toLocaleString("ko-KR");

export type Cabin = "economy" | "premium" | "business" | "first";
export const CABINS: Record<Cabin, { label: string; factor: number }> = {
  economy: { label: "이코노미", factor: 1 },
  premium: { label: "프리미엄 이코노미", factor: 1.6 },
  business: { label: "비즈니스", factor: 3.2 },
  first: { label: "일등석", factor: 5 },
};

export type Search = {
  trip: "oneway" | "round";
  adults: number;
  children: number;
  infants: number;
  cabin: Cabin;
  from: string;
  to: string;
  date: string;
  returnDate: string;
};

export const DEFAULT_SEARCH: Search = { trip: "oneway", adults: 1, children: 0, infants: 0, cabin: "economy", from: "ICN", to: "BKK", date: "2026-12-10", returnDate: "2026-12-17" };

// 서울-방콕 왕복 축을 1로 둔 노선 거리 계수.
const DISTANCE: Record<string, number> = { ICN: 0, BKK: 1, NRT: 0.55, SIN: 1.15, DAD: 0.8 };

const round100 = (n: number) => Math.round(n / 100) * 100;

function routeFactor(from: string, to: string) {
  return Math.max(0.5, Math.abs(DISTANCE[from] - DISTANCE[to]) || 0.6);
}

// 연말 성수기와 주말 출발에 할증을 붙인다.
function dateFactor(date: string) {
  const d = new Date(date + "T00:00:00");
  let f = 1;
  if (d.getMonth() === 11 && d.getDate() >= 20) f *= 1.25;
  if (d.getDay() === 5 || d.getDay() === 6) f *= 1.08;
  return f;
}

export const seats = (s: Search) => s.adults + s.children;
export const travellers = (s: Search) => s.adults + s.children + s.infants;

export function paxLabel(s: Search) {
  return [`성인 ${s.adults}명`, s.children && `어린이 ${s.children}명`, s.infants && `유아 ${s.infants}명`].filter(Boolean).join(", ");
}

// 승객 구성과 좌석 등급까지 반영한 한 구간의 합계.
export function legPrice(f: Flight, s: Search, leg: "out" | "ret" = "out") {
  const from = leg === "out" ? s.from : s.to;
  const to = leg === "out" ? s.to : s.from;
  const date = leg === "out" ? s.date : s.returnDate;
  const unit = f.price * routeFactor(from, to) * dateFactor(date) * CABINS[s.cabin].factor;
  return round100(unit * (s.adults + s.children * 0.75 + s.infants * 0.1) * (leg === "ret" ? 0.92 : 1));
}

export function cheapestReturn(s: Search) {
  return Math.min(...FLIGHTS.map((f) => legPrice(f, s, "ret")));
}

export const dateLabel = (d: string) => {
  const t = new Date(d + "T00:00:00");
  return `${t.getMonth() + 1}월 ${t.getDate()}일 (${"일월화수목금토"[t.getDay()]})`;
};
