import type { SiteConfig } from "../types";
import "./site.css";

// 비교 기준이 되는 정상 판매처. 표시 가격이 다른 세 곳의 가격에 필수 수수료를 더한 금액보다도 높다.
export const truefare: SiteConfig = {
  id: "truefare",
  name: "Truefare",
  mail: "ticket@truefare.example",
  logoText: "Truefare",
  helpLabel: "고객센터",
  flow: ["passenger"],
  header: "steps",
  enter: "skeleton",
  mix: { price: "none", lure: false, after: "ticket" },
  mixLabel: "표시 가격 그대로 결제 → 즉시 발권 (정상)",
  serviceLabel: "",
  service: 0,
  delta: 32000,
  timer: null,
  extras: [
    { id: "insurance", label: "여행 보험", price: 18000, on: false },
    { id: "bag", label: "위탁 수하물 20kg", price: 45000, on: false },
  ],
  listCopy: { title: "항공권 목록", empty: "조건에 맞는 항공권이 없습니다.", searchLabel: "검색" },
  inlineExtras: true,
  honest: true,
};
