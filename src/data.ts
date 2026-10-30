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

export const SELLERS = [
  { name: "다른여행 A", delta: 8600 },
  { name: "다른여행 B", delta: 9100 },
  { name: "항공사 공식 사이트", delta: 24600 },
];

export const FEES = { service: 18900, seat: 12000, insurance: 20300, fastTicket: 4100 };
export const won = (n: number) => "₩" + n.toLocaleString("ko-KR");
