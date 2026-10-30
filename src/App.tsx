import { useEffect, useState } from "react";
import { BRAND } from "./brand";
import { advance, fmtTime, go, reset, SCENARIOS, set, useStore, type Scenario } from "./store";
import { Booking, Home, Results } from "./Flights";
import { Checkout, Complete, Enter, Gone, Lookup, Passenger, PineStep, Support, TripSummary } from "./Ota";
import { MailApp } from "./Mail";
import { SellerListPage } from "./SellerList";

function useRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  useEffect(() => {
    const f = () => {
      setRoute(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return route;
}

function Page({ route }: { route: string }) {
  if (route === "/") return <Home />;
  if (route === "/results") return <Results />;
  if (route.startsWith("/booking/")) return <Booking id={route.split("/")[2]} ret={route.split("/")[3]} />;
  if (route === "/ota/enter") return <Enter />;
  if (route === "/ota/list") return <SellerListPage />;
  if (route === "/ota/summary") return <TripSummary />;
  if (route === "/ota/passenger") return <Passenger />;
  if (route === "/ota/fare") return <PineStep stage="fare" />;
  if (route === "/ota/bags") return <PineStep stage="bags" />;
  if (route === "/ota/seat") return <PineStep stage="seat" />;
  if (route === "/ota/checkout") return <Checkout />;
  if (route === "/ota/complete") return <Complete />;
  if (route === "/ota/gone") return <Gone />;
  if (route === "/ota/support") return <Support />;
  if (route === "/ota/lookup") return <Lookup />;
  if (route.startsWith("/mail")) return <MailApp id={route.split("/")[2]} />;
  return <Home />;
}

function Panel() {
  const s = useStore();
  // 좁은 화면에서는 패널이 버튼을 가리지 않도록 접어서 시작한다.
  const [open, setOpen] = useState(() => innerWidth > 1100);
  if (!open)
    return (
      <button className="panel-fab" onClick={() => setOpen(true)} aria-label="재현 패널 열기">
        <span className="ms">tune</span>
      </button>
    );
  const pending = s.scheduled.length;
  return (
    <aside className="panel" aria-label="재현 패널">
      <div className="panel-head">
        <b>재현 패널</b>
        <span className="panel-clock">{fmtTime(s.now)}</span>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="재현 패널 접기">
          <span className="ms">close</span>
        </button>
      </div>
      <label className="panel-label" htmlFor="scenario">시나리오</label>
      <select
        id="scenario"
        value={s.scenario}
        onChange={(e) => {
          set({ scenario: e.target.value as Scenario });
          reset();
        }}
      >
        {SCENARIOS.map((x) => (
          <option key={x.id} value={x.id}>{x.label}</option>
        ))}
      </select>
      <p className="panel-hint">{SCENARIOS.find((x) => x.id === s.scenario)?.hint}</p>
      <label className="panel-check">
        <input type="checkbox" checked={s.annotate} onChange={(e) => set({ annotate: e.target.checked })} />
        수법 해설 표시
      </label>
      <div className="panel-label">시간 건너뛰기{pending > 0 && <em> · 대기 중인 알림 {pending}건</em>}</div>
      <div className="panel-row">
        <button onClick={() => advance(15 * 60_000)}>+15분</button>
        <button onClick={() => advance(3 * 3_600_000)}>+3시간</button>
        <button onClick={() => advance(3 * 86_400_000 + 3_600_000)}>+3일</button>
      </div>
      <div className="panel-row">
        <button onClick={() => go("/")}>항공편</button>
        <button onClick={() => go("/mail")}>
          메일{s.mails.some((m) => !m.read) && <i className="dot" />}
        </button>
        <button onClick={() => set({ phoneOpen: !s.phoneOpen })}>휴대폰</button>
      </div>
      <button className="panel-reset" onClick={reset}>처음부터</button>
    </aside>
  );
}

function Phone() {
  const s = useStore();
  if (!s.phoneOpen) return null;
  return (
    <aside className="phone" aria-label="휴대폰 문자">
      <div className="phone-bar">
        <span>{fmtTime(s.now)}</span>
        <button className="icon-btn" onClick={() => set({ phoneOpen: false })} aria-label="휴대폰 닫기">
          <span className="ms">close</span>
        </button>
      </div>
      <h3>{BRAND.payApp} 알림</h3>
      {s.sms.length === 0 && <p className="phone-empty">받은 문자가 없습니다.</p>}
      {s.sms.map((m) => (
        <div className="bubble" key={m.id}>
          {m.body}
          <time>{fmtTime(m.at)}</time>
        </div>
      ))}
    </aside>
  );
}

function Toast() {
  const { toast } = useStore();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => set({ toast: null }), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <button
      className="toast"
      onClick={() => {
        if (toast.href) go(toast.href);
        set({ toast: null });
      }}
    >
      <b>{toast.title}</b>
      <span>{toast.body}</span>
    </button>
  );
}

export function App() {
  const route = useRoute();
  return (
    <>
      <div className="demo-banner">
        재현 데모입니다. 실제 판매·결제가 없고 입력 정보는 어디에도 전송되지 않습니다. 실제 정보를 입력하지 마세요.
      </div>
      <Page key={route.startsWith("/mail") ? "/mail" : route} route={route} />
      <Panel />
      <Phone />
      <Toast />
    </>
  );
}
