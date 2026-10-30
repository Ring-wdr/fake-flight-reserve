import { useSyncExternalStore } from "react";
import { BRAND, SITES, type SiteId } from "./brand";
import { DEFAULT_SEARCH, FLIGHTS, seats, won, type Flight, type Search } from "./data";
import { createListing, sellerFare, type Listing } from "./offers";

export { sellerFare };

export type Scenario = "site" | "price" | "lure" | "fake" | "confirm";

export const SCENARIOS: { id: Scenario; label: string; hint: string }[] = [
  { id: "site", label: "판매처별 기본 조합", hint: "판매처마다 다른 수법 조합으로 진행합니다." },
  { id: "price", label: "가짜 가격 변동만", hint: "여권 입력 직후 가격이 오르거나 자사 목록으로 이동" },
  { id: "lure", label: "이탈 유도 메일만", hint: "'원래 가격' 메일을 눌러도 상품이 사라짐" },
  { id: "fake", label: "가짜 상품만", hint: "결제 2~3시간 뒤 일방적 취소" },
  { id: "confirm", label: "가짜 확정 메일만", hint: "확정 메일 뒤에도 조회하면 계속 발권 중이고, 72시간 뒤 지연" },
];

type Mix = { price: "none" | "firstPay" | "firstList" | "alternate"; lure: boolean; after: "cancel" | "delay" };

const SITE_MIX: Record<SiteId, Mix> = {
  faretrap: { price: "firstPay", lure: true, after: "cancel" },
  voyagate: { price: "none", lure: true, after: "delay" },
  pinefly: { price: "firstList", lure: false, after: "cancel" },
};

const FORCED: Record<Exclude<Scenario, "site">, Mix> = {
  price: { price: "alternate", lure: false, after: "cancel" },
  lure: { price: "none", lure: true, after: "cancel" },
  fake: { price: "none", lure: false, after: "cancel" },
  confirm: { price: "none", lure: false, after: "delay" },
};

const mixOf = (site: SiteId) => (state.scenario === "site" ? SITE_MIX[site] : FORCED[state.scenario]);

export type Mail = { id: string; from: string; addr: string; subject: string; preview: string; kind: MailKind; at: number; read: boolean; site: SiteId; order: Order };
export type MailKind = "receipt" | "lure" | "cancel" | "delay";
export type Sms = { id: string; from: string; body: string; at: number };
// 알림은 예약 시점의 주문을 들고 있어, 그 사이 새 주문을 시작해도 내용이 바뀌지 않는다.
type Scheduled = { at: number; type: "lure" | "cancel" | "delay"; order: Order };

export type Extra = { id: string; label: string; price: number; on: boolean };

export type Order = {
  site: SiteId;
  flightId: string;
  retId?: string;
  search: Search;
  fare: number;
  surge: number;
  extras: Extra[];
  pnr?: string;
  paidTotal?: number;
  status: "draft" | "checkout" | "paid" | "cancelled";
};

export type State = {
  scenario: Scenario;
  annotate: boolean;
  now: number;
  search: Search;
  site: SiteId;
  listing: Listing | null;
  order: Order | null;
  focusOrder: Order | null;
  priceHits: Partial<Record<SiteId, number>>;
  lureSent: SiteId[];
  scheduled: Scheduled[];
  mails: Mail[];
  sms: Sms[];
  toast: { title: string; body: string; href?: string } | null;
  notice: string | null;
  phoneOpen: boolean;
};

const KEY = "ffr-state-v3";
const fresh = (scenario: Scenario = "site", annotate = false): State => ({
  scenario,
  annotate,
  now: Date.now(),
  search: DEFAULT_SEARCH,
  site: "faretrap",
  listing: null,
  order: null,
  focusOrder: null,
  priceHits: {},
  lureSent: [],
  scheduled: [],
  mails: [],
  sms: [],
  toast: null,
  notice: null,
  phoneOpen: false,
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {}
  return fresh();
}

let state = load();
const subs = new Set<() => void>();

export function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  subs.forEach((f) => f());
}

export const getState = () => state;
export const useStore = () =>
  useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => state);

export const go = (path: string) => {
  location.hash = path;
};

export const flightOf = (o: Order | null): Flight | undefined => FLIGHTS.find((f) => f.id === o?.flightId);
export const returnOf = (o: Order | null): Flight | undefined => FLIGHTS.find((f) => f.id === o?.retId);

export function fareTotal(o: Order) {
  return o.fare + o.surge;
}

export function feeTotal(o: Order) {
  return SITES[o.site].service * seats(o.search);
}

export function extrasTotal(o: Order) {
  return o.extras.filter((e) => e.on).reduce((sum, e) => sum + e.price * seats(o.search), 0);
}

export function checkoutTotal(o: Order) {
  return fareTotal(o) + feeTotal(o) + extrasTotal(o);
}

const INITIAL_EXTRAS: Record<SiteId, Extra[]> = {
  faretrap: [
    { id: "insurance", label: "여행 보험", price: 20300, on: true },
    { id: "seat", label: "좌석 우선 배정", price: 12000, on: true },
    { id: "fast", label: "초고속 발권", price: 4100, on: false },
  ],
  voyagate: [
    { id: "insurance", label: "여행 보호 플랜", price: 27000, on: true },
    { id: "support", label: "프리미엄 고객 지원", price: 15900, on: true },
  ],
  pinefly: [
    { id: "lock", label: "3일 가격 고정", price: 29300, on: false },
    { id: "flexi", label: "유연한 티켓", price: 38000, on: true },
    { id: "bag", label: "위탁 수하물 20kg", price: 52000, on: false },
    { id: "seat", label: "좌석 지정", price: 15000, on: true },
  ],
};

export function setExtra(id: string, on: boolean) {
  const o = state.order;
  if (o) set({ order: { ...o, extras: o.extras.map((e) => (e.id === id ? { ...e, on } : e)) } });
}

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${seq++}`;

function addMail(order: Order, kind: MailKind, subject: string, preview: string, at: number): Mail {
  const { name, mail } = SITES[order.site];
  return { id: uid("m"), from: name, addr: mail, subject, preview, kind, at, read: false, site: order.site, order };
}

// 메타 검색에서 들어오면 전환 화면을, 자사 목록에서 고르면 바로 첫 단계를 보여 준다.
export function startOrder(site: SiteId, flightId: string, retId?: string, fromList?: { fare: number }) {
  const search = state.search;
  set({
    site,
    order: { site, flightId, retId, search, fare: fromList?.fare ?? sellerFare(site, search, flightId, retId), surge: 0, extras: INITIAL_EXTRAS[site].map((e) => ({ ...e })), status: "draft" },
    notice: null,
  });
  go(!fromList ? "/ota/enter" : site === "voyagate" ? "/ota/summary" : "/ota/passenger");
}

// 판매사 자체 목록으로 보낸다. 사용자가 보던 가격이 새 목록의 기준가가 된다.
export function goSellerList(notice: string | null = null, from?: Order | null) {
  const o = from ?? state.order;
  const site = o?.site ?? state.site;
  const search = o?.search ?? state.search;
  set({
    site,
    search,
    order: null,
    focusOrder: null,
    notice,
    listing: createListing(site, search, o ? { anchor: o.fare, soldId: o.flightId } : {}),
  });
  go("/ota/list");
}

export function leaveToList() {
  abandonCheckout();
  goSellerList();
}

// 여권 입력 뒤 가격 변동이 발동하는지와 어느 쪽 분기인지 결정한다.
export function priceOutcome(): "none" | "pay" | "list" {
  const site = state.order?.site;
  if (!site) return "none";
  const hits = state.priceHits[site] ?? 0;
  const rule = mixOf(site).price;
  if (rule === "alternate") return hits % 2 === 0 ? "pay" : "list";
  if (rule === "firstPay" && hits === 0) return "pay";
  if (rule === "firstList" && hits === 0) return "list";
  return "none";
}

export function countPriceHit(surge: number) {
  const o = state.order;
  if (!o) return;
  set({
    priceHits: { ...state.priceHits, [o.site]: (state.priceHits[o.site] ?? 0) + 1 },
    order: { ...o, surge },
  });
}

export function abandonCheckout() {
  const { order, lureSent, scheduled, now } = state;
  if (!order || order.status !== "checkout") return;
  if (!mixOf(order.site).lure || lureSent.includes(order.site)) return;
  set({ lureSent: [...lureSent, order.site], scheduled: [...scheduled, { at: now + 15 * 60_000, type: "lure", order }] });
}

export function pay() {
  const { order, now, scheduled, mails } = state;
  if (!order) return;
  const pnr = Math.random().toString(36).slice(2, 8).toUpperCase();
  const total = checkoutTotal(order);
  const name = SITES[order.site].name;
  const paid: Order = { ...order, status: "paid", pnr, paidTotal: total };
  const next: Scheduled[] = [...scheduled.filter((s) => s.type !== "lure")];
  if (mixOf(order.site).after === "delay") next.push({ at: now + 73 * 3_600_000, type: "delay", order: paid });
  else next.push({ at: now + 2.5 * 3_600_000, type: "cancel", order: paid });
  const receipt = addMail(
    paid,
    "receipt",
    `[${name}] 예약이 확정되었습니다 (예약번호 ${pnr})`,
    `결제 금액 ${won(total)}. 항공권은 결제 후 72시간 이내에 발권됩니다.`,
    now + 60_000,
  );
  set({
    order: paid,
    scheduled: next,
    mails: [receipt, ...mails],
    sms: [{ id: uid("s"), from: BRAND.payApp, body: `[${BRAND.payApp}] ${won(total)} 결제 승인 (${name})`, at: now }, ...state.sms],
    toast: { title: `${BRAND.payApp} · 결제 승인`, body: `${won(total)} ${name}` },
  });
}

function fire(s: Scheduled) {
  const { mails, sms } = state;
  const order = s.order;
  const name = SITES[order.site].name;
  if (s.type === "lure") {
    const f = flightOf(order);
    const mail = addMail(
      order,
      "lure",
      `결제가 완료되지 않았어요. 지금 결제하면 원래 가격 그대로!`,
      `${f?.airline ?? ""} 항공권이 아직 고객님을 기다리고 있습니다. 좌석이 곧 마감됩니다.`,
      s.at,
    );
    set({ mails: [mail, ...mails], toast: { title: `${BRAND.mail} · ${name}`, body: mail.subject, href: `/mail/${mail.id}` } });
  }
  if (s.type === "cancel") {
    const cancelled: Order = { ...order, status: "cancelled" };
    const mail = addMail(
      cancelled,
      "cancel",
      `[${name}] 예약 취소 안내 (예약번호 ${order.pnr})`,
      `항공사 사정으로 좌석이 확보되지 않아 예약이 취소되었습니다. 환불은 영업일 기준 최대 30일이 소요됩니다.`,
      s.at,
    );
    set({
      order: state.order?.pnr === order.pnr ? cancelled : state.order,
      mails: [mail, ...mails],
      sms: [{ id: uid("s"), from: BRAND.payApp, body: `[${BRAND.payApp}] ${won(order.paidTotal ?? 0)} 승인 취소 접수 (${name})`, at: s.at }, ...sms],
      toast: { title: `${BRAND.payApp} · 승인 취소`, body: `${won(order.paidTotal ?? 0)} ${name}` },
      phoneOpen: true,
    });
  }
  if (s.type === "delay") {
    const mail = addMail(
      order,
      "delay",
      `[${name}] 발권이 지연되고 있습니다 (예약번호 ${order.pnr})`,
      `항공사 시스템 사정으로 발권이 지연되고 있습니다. 조금만 더 기다려 주세요.`,
      s.at,
    );
    set({ mails: [mail, ...mails], toast: { title: `${BRAND.mail} · ${name}`, body: mail.subject, href: `/mail/${mail.id}` } });
  }
}

export function advance(ms: number) {
  const target = state.now + ms;
  const due = state.scheduled.filter((s) => s.at <= target).sort((a, b) => a.at - b.at);
  set({ now: target, scheduled: state.scheduled.filter((s) => s.at > target) });
  due.forEach(fire);
}

export function reset() {
  const { scenario, annotate } = state;
  set(fresh(scenario, annotate));
  go("/");
}

export function fmtTime(t: number) {
  return new Date(t).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}
