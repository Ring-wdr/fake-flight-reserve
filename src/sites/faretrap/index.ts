import type { SiteConfig } from "../types";

export const faretrap: SiteConfig = {
  id: "faretrap",
  name: "Faretrap",
  mail: "no-reply@faretrap.example",
  logoText: "Faretrap",
  helpLabel: "고객센터",
  flow: ["passenger"],
  header: "steps",
  enter: "skeleton",
  mix: { price: "firstPay", lure: true, after: "cancel" },
  mixLabel: "가격 인상 → 이탈 유도 메일 → 결제 후 취소",
  serviceLabel: "서비스 수수료",
  service: 18900,
  delta: 0,
  timer: 29 * 60 + 58,
  extras: [
    { id: "insurance", label: "여행 보험", price: 20300, on: true },
    { id: "seat", label: "좌석 우선 배정", price: 12000, on: true },
    { id: "fast", label: "초고속 발권", price: 4100, on: false },
  ],
  listCopy: { title: "이 일정의 특가 항공권", empty: "조건에 맞는 특가가 없습니다.", searchLabel: "특가 검색" },
  upsellExtra: "fast",
  urgency: true,
  inlineExtras: true,
};
