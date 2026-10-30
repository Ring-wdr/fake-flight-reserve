import type { ReactNode } from "react";
import { Flag } from "../../components/Flag";
import { AIRPORTS, CABINS, dateLabel, paxLabel, seats, travellers, won } from "../../domain/flights";
import { checkoutTotal, feeTotal, flightOf, returnOf, setExtra, type Order } from "../../state/store";
import { useSite, useSiteOrder } from "./SiteLayout";

export function FlightLines({ order }: { order: Order }) {
  const f = flightOf(order)!;
  const r = returnOf(order);
  const s = order.search;
  return (
    <>
      <p className="o-flight"><b>{f.dep}</b> {AIRPORTS[s.from]} {s.from} <span>→</span> <b>{f.arr}</b> {AIRPORTS[s.to]} {s.to}</p>
      <p className="o-muted">{dateLabel(s.date)} · {f.airline} {f.code} · {CABINS[s.cabin].label} · {f.duration}</p>
      {r && <>
        <p className="o-flight"><b>{r.dep}</b> {AIRPORTS[s.to]} {s.to} <span>→</span> <b>{r.arr}</b> {AIRPORTS[s.from]} {s.from}</p>
        <p className="o-muted">{dateLabel(s.returnDate)} · {r.airline} {r.code} · {CABINS[s.cabin].label} · {r.duration}</p>
      </>}
      <p className="o-muted">{paxLabel(s)}</p>
    </>
  );
}

export function Summary({ fees, children }: { fees?: boolean; children?: ReactNode }) {
  const order = useSiteOrder();
  const site = useSite();
  if (!order) return null;
  const n = seats(order.search);
  const on = order.extras.filter((e) => e.on);
  return (
    <aside className="o-side">
      <h3>요금 상세정보</h3>
      <p className="o-line"><span>항공권 ({travellers(order.search)}명)</span><span>{won(order.fare)}</span></p>
      {order.surge > 0 && <p className="o-line up"><span>가격 변동</span><span>+{won(order.surge)}</span></p>}
      {fees && !site.honest && <p className="o-line"><span>{site.serviceLabel}</span><span>{won(feeTotal(order))}</span></p>}
      {on.map((e) => <p className="o-line" key={e.id}><span>{e.label}</span><span>{won(e.price * n)}</span></p>)}
      <p className="o-total"><span>{fees ? "총 금액" : "현재 금액"}</span><b data-testid="total">{won(fees ? checkoutTotal(order) : checkoutTotal(order) - feeTotal(order))}</b></p>
      {children}
    </aside>
  );
}

export const SAMPLE = { email: "sample@example.com", phone: "010-0000-0000", last: "HONG", first: "GILDONG", birth: "1990-01-15", passport: "M00000000" };

export function PassengerCards({ filled, onFill }: { filled: boolean; onFill: () => void }) {
  const order = useSiteOrder();
  const site = useSite();
  const count = travellers(order!.search);
  const v = (k: keyof typeof SAMPLE) => (filled ? SAMPLE[k] : "");
  return (
    <section className="o-card">
      <div className="o-card-head">
        <h2>연락처 및 탑승객 정보</h2>
        <button className="o-sample" onClick={onFill}>샘플 데이터 채우기</button>
      </div>
      <p className="o-muted">재현 데모라 직접 입력할 수 없습니다. 입력한 정보가 여권과 일치해야 합니다.</p>
      <div className="o-form">
        <label>이메일<input readOnly value={v("email")} /></label>
        <label>휴대전화 번호<input readOnly value={v("phone")} /></label>
      </div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <h3 className="o-pax-title">탑승객 {i + 1}</h3>
          <div className="o-form">
            <label>성<input readOnly value={v("last")} /></label>
            <label>이름<input readOnly value={v("first")} /></label>
            <label>생년월일<input readOnly value={v("birth")} /></label>
            <label>여권 번호<input readOnly value={v("passport")} /></label>
          </div>
        </div>
      ))}
      {site.honest
        ? <Flag ok title="가격 유지">여권 정보를 입력해도 앞에서 본 가격이 그대로 유지됩니다.</Flag>
        : <Flag title="정보 먼저, 가격은 나중">민감한 여권 정보를 모두 받은 뒤에야 가격을 '재확인'합니다. 입력에 들인 수고 때문에 인상된 가격도 받아들이기 쉬워집니다.</Flag>}
    </section>
  );
}

export function ExtraRow({ id, note }: { id: string; note?: string }) {
  const order = useSiteOrder();
  const e = order?.extras.find((x) => x.id === id);
  if (!e) return null;
  return (
    <label className="o-extra">
      <input type="checkbox" checked={e.on} onChange={(ev) => setExtra(id, ev.target.checked)} />
      <span>{e.label}{note && <small>{note}</small>}</span>
      <b>{won(e.price)}/인</b>
    </label>
  );
}

// 1인당 가격만 크게 보여 주는 하단 고정 바.
export function BottomBar({ label, onNext }: { label: string; onNext: () => void }) {
  const order = useSiteOrder();
  if (!order) return null;
  return (
    <div className="v-bar">
      <div className="v-bar-in">
        <span className="v-bar-label">{label}</span>
        <span className="v-bar-price"><b data-testid="total">{won(Math.round(order.fare / Math.max(1, seats(order.search))))}</b><small>성인 1인당 가격</small></span>
        <button className="o-pay small" onClick={onNext}>계속</button>
      </div>
    </div>
  );
}
