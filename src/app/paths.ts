import type { FlowStep } from "../sites/types";

// 모든 경로는 여기서 만든다. 화면 코드에 경로 문자열을 직접 쓰지 않는다.
const site = (id: string) => `/sites/${id}`;

export const paths = {
  home: "/",
  results: "/results",
  booking: (outId: string, retId?: string) => `/booking/${outId}${retId ? `/${retId}` : ""}`,
  mail: (id?: string) => (id ? `/mail/${id}` : "/mail"),
  lookup: "/lookup",
  enter: (id: string) => `${site(id)}/enter`,
  list: (id: string) => `${site(id)}/list`,
  step: (id: string, step: FlowStep) => `${site(id)}/book/${step}`,
  checkout: (id: string) => `${site(id)}/checkout`,
  complete: (id: string) => `${site(id)}/complete`,
  gone: (id: string) => `${site(id)}/gone`,
  support: (id: string) => `${site(id)}/support`,
};
