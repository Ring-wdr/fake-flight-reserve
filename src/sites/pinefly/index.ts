import type { SiteConfig } from "../types";
import "./site.css";

export const pinefly: SiteConfig = {
  id: "pinefly",
  name: "Pinefly",
  mail: "trip@pinefly.example",
  logoText: "pinefly",
  logoIcon: "forest",
  helpLabel: "도움말 및 고객 지원",
  flow: ["passenger", "fare", "bags", "seat"],
  header: "stepper",
  enter: "ticket",
  mix: { price: "firstList", lure: false, after: "cancel" },
  mixLabel: "단계별 끼워팔기 → 판매 종료로 목록 이동 → 결제 후 취소 → 환불 지연",
  serviceLabel: "플랫폼 이용료",
  service: 9900,
  delta: 1400,
  timer: 9 * 60 + 58,
  extras: [
    { id: "lock", label: "3일 가격 고정", price: 29300, on: false },
    { id: "flexi", label: "유연한 티켓", price: 38000, on: true },
    { id: "bag", label: "위탁 수하물 20kg", price: 52000, on: false },
    { id: "seat", label: "좌석 지정", price: 15000, on: true },
  ],
  listCopy: { title: "추천 항공권", empty: "조건에 맞는 항공권이 없습니다.", searchLabel: "검색" },
};
