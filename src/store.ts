import { useSyncExternalStore } from "react";
import { BRAND } from "./brand";
import { FLIGHTS, won, type Flight } from "./data";

export type Scenario = "full" | "price" | "lure" | "fake" | "confirm";

export const SCENARIOS: { id: Scenario; label: string; hint: string }[] = [
  { id: "full", label: "전체 여정", hint: "가격 변동 → 이탈 유도 메일 → 결제 후 취소" },
  { id: "price", label: "가짜 가격 변동", hint: "여권 입력 직후 가격이 오르거나 목록으로 이동" },
  { id: "lure", label: "이탈 유도 메일", hint: "'원래 가격' 메일을 눌러도 상품이 사라짐" },
  { id: "fake", label: "가짜 상품", hint: "결제 2~3시간 뒤 일방적 취소" },
  { id: "confirm", label: "가짜 확정 메일", hint: "예약번호가 항공사에서 조회되지 않고 발권 지연" },
];

export type Mail = { id: string; from: string; addr: string; subject: string; preview: string; kind: MailKind; at: number; read: boolean; fare?: number; flightId?: string };
export type MailKind = "receipt" | "lure" | "cancel" | "delay";
export type Sms = { id: string; from: string; body: string; at: number };
type Scheduled = { at: number; type: "lure" | "cancel" | "delay" };

export type Order = {
  flightId: string;
  fare: number;
  surge: number;
  insurance: boolean;
  seat: boolean;
  fastTicket: boolean;
  passenger: boolean;
  pnr?: string;
  paidTotal?: number;
  status: "draft" | "checkout" | "paid" | "cancelled" | "gone";
};

export type State = {
  scenario: Scenario;
  annotate: boolean;
  now: number;
  order: Order | null;
  priceHits: number;
  lureSent: boolean;
  scheduled: Scheduled[];
  mails: Mail[];
  sms: Sms[];
  toast: { title: string; body: string; href?: string } | null;
  notice: string | null;
  phoneOpen: boolean;
};

const KEY = "ffr-state-v1";
const fresh = (scenario: Scenario = "full", annotate = false): State => ({
  scenario,
  annotate,
  now: Date.now(),
  order: null,
  priceHits: 0,
  lureSent: false,
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

export function fareTotal(o: Order) {
  return o.fare + o.surge;
}

export function checkoutTotal(o: Order) {
  return fareTotal(o) + 18900 + (o.seat ? 12000 : 0) + (o.insurance ? 20300 : 0) + (o.fastTicket ? 4100 : 0);
}

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${seq++}`;

function addMail(kind: MailKind, subject: string, preview: string, at: number) {
  const mail: Mail = { id: uid("m"), from: BRAND.ota, addr: BRAND.otaMail, subject, preview, kind, at, read: false };
  return mail;
}

export function startOrder(flightId: string) {
  const f = FLIGHTS.find((x) => x.id === flightId)!;
  set({
    order: { flightId, fare: f.price, surge: 0, insurance: true, seat: true, fastTicket: false, passenger: false, status: "draft" },
    notice: null,
  });
  go("/ota/passenger");
}

// 여권 입력 뒤 가격 변동이 발동하는지와 어느 쪽 분기인지 결정한다.
export function priceOutcome(): "none" | "pay" | "list" {
  const { scenario, priceHits } = state;
  if (scenario === "price") return priceHits % 2 === 0 ? "pay" : "list";
  if (scenario === "full" && priceHits === 0) return "pay";
  return "none";
}

export function abandonCheckout() {
  const { order, scenario, lureSent, scheduled, now } = state;
  if (!order || order.status !== "checkout") return;
  if ((scenario !== "lure" && scenario !== "full") || lureSent) return;
  set({ lureSent: true, scheduled: [...scheduled, { at: now + 15 * 60_000, type: "lure" }] });
}

export function pay() {
  const { order, scenario, now, scheduled, mails } = state;
  if (!order) return;
  const pnr = Math.random().toString(36).slice(2, 8).toUpperCase();
  const total = checkoutTotal(order);
  const next: Scheduled[] = [...scheduled.filter((s) => s.type !== "lure")];
  if (scenario === "confirm") next.push({ at: now + 73 * 3_600_000, type: "delay" });
  else next.push({ at: now + 2.5 * 3_600_000, type: "cancel" });
  const receipt = addMail(
    "receipt",
    `[${BRAND.ota}] 예약이 확정되었습니다 (예약번호 ${pnr})`,
    `결제 금액 ${won(total)}. 항공권은 결제 후 72시간 이내에 발권됩니다.`,
    now + 60_000,
  );
  set({
    order: { ...order, status: "paid", pnr, paidTotal: total },
    scheduled: next,
    mails: [receipt, ...mails],
    sms: [
      { id: uid("s"), from: BRAND.payApp, body: `[${BRAND.payApp}] ${won(total)} 결제 승인 (${BRAND.ota})`, at: now },
      ...state.sms,
    ],
    toast: { title: `${BRAND.payApp} · 결제 승인`, body: `${won(total)} ${BRAND.ota}` },
  });
}

function fire(s: Scheduled) {
  const { order, mails, sms } = state;
  if (s.type === "lure") {
    const f = flightOf(order);
    const mail: Mail = {
      ...addMail(
        "lure",
        `결제가 완료되지 않았어요. 지금 결제하면 원래 가격 그대로!`,
        `${f?.airline ?? ""} 항공권이 아직 고객님을 기다리고 있습니다. 좌석이 곧 마감됩니다.`,
        s.at,
      ),
      fare: order?.fare,
      flightId: order?.flightId,
    };
    set({ mails: [mail, ...mails], toast: { title: `${BRAND.mail} · ${BRAND.ota}`, body: mail.subject, href: `/mail/${mail.id}` } });
  }
  if (s.type === "cancel" && order) {
    const mail = addMail(
      "cancel",
      `[${BRAND.ota}] 예약 취소 안내 (예약번호 ${order.pnr})`,
      `항공사 사정으로 좌석이 확보되지 않아 예약이 취소되었습니다. 환불은 영업일 기준 최대 30일이 소요됩니다.`,
      s.at,
    );
    set({
      order: { ...order, status: "cancelled" },
      mails: [mail, ...mails],
      sms: [{ id: uid("s"), from: BRAND.payApp, body: `[${BRAND.payApp}] ${won(order.paidTotal ?? 0)} 승인 취소 접수 (${BRAND.ota})`, at: s.at }, ...sms],
      toast: { title: `${BRAND.payApp} · 승인 취소`, body: `${won(order.paidTotal ?? 0)} ${BRAND.ota}` },
      phoneOpen: true,
    });
  }
  if (s.type === "delay" && order) {
    const mail = addMail(
      "delay",
      `[${BRAND.ota}] 발권이 지연되고 있습니다 (예약번호 ${order.pnr})`,
      `항공사 시스템 사정으로 발권이 지연되고 있습니다. 조금만 더 기다려 주세요.`,
      s.at,
    );
    set({ mails: [mail, ...mails], toast: { title: `${BRAND.mail} · ${BRAND.ota}`, body: mail.subject, href: `/mail/${mail.id}` } });
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
  try {
    sessionStorage.clear();
  } catch {}
  set(fresh(scenario, annotate));
  go("/");
}

export function fmtTime(t: number) {
  return new Date(t).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}
