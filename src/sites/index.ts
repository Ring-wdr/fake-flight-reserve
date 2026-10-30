import { faretrap } from "./faretrap";
import { pinefly } from "./pinefly";
import { truefare } from "./truefare";
import type { SiteConfig } from "./types";
import { voyagate } from "./voyagate";

export type { Extra, FlowStep, Mix, SiteConfig } from "./types";
export type SiteId = string;

// 판매처 추가는 폴더를 만들고 여기에 등록하는 것으로 끝난다. 이 순서대로 예약 옵션에 나온다.
export const SITE_LIST: SiteConfig[] = [faretrap, voyagate, pinefly, truefare];
export const SITES: Record<SiteId, SiteConfig> = Object.fromEntries(SITE_LIST.map((s) => [s.id, s]));
