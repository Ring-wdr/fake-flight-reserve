import type { SiteConfig } from "../types";
import "./site.css";

export const voyagate: SiteConfig = {
  id: "voyagate",
  name: "Voyagate",
  mail: "booking@voyagate.example",
  logoText: "VOYAGATE",
  helpLabel: "고객 지원",
  flow: ["summary", "passenger"],
  header: "wizard",
  enter: "spinner",
  mix: { price: "none", lure: true, after: "delay" },
  mixLabel: "1인당 가격 표기 → 이탈 유도 메일 → 가짜 확정 → 발권 지연",
  serviceLabel: "예약 처리 수수료",
  service: 24500,
  delta: 800,
  timer: null,
  extras: [
    { id: "insurance", label: "여행 보호 플랜", price: 27000, on: true },
    { id: "support", label: "프리미엄 고객 지원", price: 15900, on: true },
  ],
  listCopy: { title: "예약 가능한 여행 상품", empty: "조건에 맞는 상품이 없습니다.", searchLabel: "항공편 검색" },
  bottomBar: true,
  inlineExtras: true,
  footer: "대면 지원은 제공되지 않으니 양해 부탁드립니다.",
};
