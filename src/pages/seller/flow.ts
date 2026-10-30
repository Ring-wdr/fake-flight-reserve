import type { FlowStep, SiteConfig } from "../../sites";

// 다음 예약 단계. 마지막 단계에서는 undefined라 가격 재확인 관문으로 넘어간다.
export function nextStep(site: SiteConfig, step: FlowStep): FlowStep | undefined {
  return site.flow[site.flow.indexOf(step) + 1];
}
