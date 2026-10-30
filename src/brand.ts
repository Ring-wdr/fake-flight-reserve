// 모든 화면의 이름은 여기서만 바꾼다. 실존 기업 이름과 로고는 쓰지 않는다.
export const BRAND = {
  search: "Skyfinder",
  mail: "Postbox",
  payApp: "OOPay",
};

export type SiteId = "faretrap" | "voyagate" | "pinefly" | "truefare";

export const SITES: Record<SiteId, { name: string; mail: string; serviceLabel: string; service: number; delta: number; timer: number | null; mix: string; honest?: boolean }> = {
  faretrap: { name: "Faretrap", mail: "no-reply@faretrap.example", serviceLabel: "서비스 수수료", service: 18900, delta: 0, timer: 29 * 60 + 58, mix: "가격 인상 → 이탈 유도 메일 → 결제 후 취소" },
  voyagate: { name: "Voyagate", mail: "booking@voyagate.example", serviceLabel: "예약 처리 수수료", service: 24500, delta: 800, timer: null, mix: "1인당 가격 표기 → 이탈 유도 메일 → 가짜 확정 → 발권 지연" },
  pinefly: { name: "Pinefly", mail: "trip@pinefly.example", serviceLabel: "플랫폼 이용료", service: 9900, delta: 1400, timer: 9 * 60 + 58, mix: "단계별 끼워팔기 → 판매 종료로 목록 이동 → 결제 후 취소 → 환불 지연" },
  // 비교 기준이 되는 정상 판매처. 표시 가격이 다른 세 곳의 가격에 필수 수수료를 더한 금액보다도 높다.
  truefare: { name: "Truefare", mail: "ticket@truefare.example", serviceLabel: "", service: 0, delta: 32000, timer: null, mix: "표시 가격 그대로 결제 → 즉시 발권 (정상)", honest: true },
};
