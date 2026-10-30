export type FlowStep = "summary" | "passenger" | "fare" | "bags" | "seat";

export type Extra = { id: string; label: string; price: number; on: boolean };

// 판매처가 쓰는 수법 조합. 정상 판매처는 어떤 패널 시나리오에서도 이 값을 그대로 쓴다.
export type Mix = {
  price: "none" | "firstPay" | "firstList" | "alternate";
  lure: boolean;
  after: "cancel" | "delay" | "ticket";
};

// 판매처 하나를 정의하는 전체 정보. 라우트와 단계 이동은 flow에서 자동으로 만들어진다.
export type SiteConfig = {
  id: string;
  name: string;
  mail: string;
  logoText: string;
  logoIcon?: string;
  helpLabel: string;
  // 결제 전에 거치는 예약 단계. 순서대로 진행하고 마지막 단계에서 가격을 재확인한다.
  flow: FlowStep[];
  header: "steps" | "wizard" | "stepper";
  enter: "skeleton" | "spinner" | "ticket";
  mix: Mix;
  mixLabel: string;
  serviceLabel: string;
  service: number;
  delta: number;
  timer: number | null;
  extras: Extra[];
  listCopy: { title: string; empty: string; searchLabel: string };
  upsellExtra?: string;
  urgency?: boolean;
  bottomBar?: boolean;
  inlineExtras?: boolean;
  footer?: string;
  honest?: boolean;
};
