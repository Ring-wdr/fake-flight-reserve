import { useState } from "react";
import { BRAND } from "./brand";
import { AIRPORTS, FLIGHTS, SELLERS, won, type Flight } from "./data";
import { Flag } from "./Flag";
import { go, set, startOrder, useStore } from "./store";

const ROUTE_KEY = "ffr-search";
type Search = { from: string; to: string; date: string };
const DEFAULT_SEARCH: Search = { from: "ICN", to: "BKK", date: "2026-12-10" };

function readSearch(): Search {
  try {
    return { ...DEFAULT_SEARCH, ...JSON.parse(sessionStorage.getItem(ROUTE_KEY) ?? "{}") };
  } catch {
    return DEFAULT_SEARCH;
  }
}

function saveSearch(s: Search) {
  try {
    sessionStorage.setItem(ROUTE_KEY, JSON.stringify(s));
  } catch {}
}

const dateLabel = (d: string) => {
  const t = new Date(d + "T00:00:00");
  return `${t.getMonth() + 1}월 ${t.getDate()}일 (${"일월화수목금토"[t.getDay()]})`;
};

function Header() {
  return (
    <header className="g-head">
      <button className="icon-btn" aria-label="메뉴"><span className="ms">menu</span></button>
      <a className="g-logo" href="#/">{BRAND.search}</a>
      <nav className="g-nav">
        <a><span className="ms">travel_explore</span>살펴보기</a>
        <a className="on" href="#/"><span className="ms">flight</span>항공편</a>
        <a><span className="ms">bed</span>호텔</a>
      </nav>
      <span className="g-grow" />
      <button className="icon-btn" aria-label="앱"><span className="ms">apps</span></button>
      <button className="g-login">로그인</button>
    </header>
  );
}

function SearchBox({ search, onChange }: { search: Search; onChange: (s: Search) => void }) {
  return (
    <div className="g-search">
      <div className="g-opts">
        <span><span className="ms">east</span>편도<span className="ms sm">arrow_drop_down</span></span>
        <span><span className="ms">person</span>1<span className="ms sm">arrow_drop_down</span></span>
        <span>이코노미<span className="ms sm">arrow_drop_down</span></span>
      </div>
      <div className="g-fields">
        <label className="g-field">
          <span className="ms">radio_button_unchecked</span>
          <select aria-label="출발지" value={search.from} onChange={(e) => onChange({ ...search, from: e.target.value })}>
            {Object.entries(AIRPORTS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
          </select>
        </label>
        <button
          className="g-swap"
          aria-label="출발지와 목적지 바꾸기"
          onClick={() => onChange({ ...search, from: search.to, to: search.from })}
        >
          <span className="ms">swap_horiz</span>
        </button>
        <label className="g-field">
          <span className="ms">location_on</span>
          <select aria-label="목적지" value={search.to} onChange={(e) => onChange({ ...search, to: e.target.value })}>
            {Object.entries(AIRPORTS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
          </select>
        </label>
        <label className="g-field g-date">
          <span className="ms">calendar_month</span>
          <input aria-label="출발일" type="date" value={search.date} onChange={(e) => onChange({ ...search, date: e.target.value })} />
        </label>
      </div>
    </div>
  );
}

export function Home() {
  const [search, setSearch] = useState(readSearch);
  return (
    <div className="g-page">
      <Header />
      <section className="g-hero">
        <div className="g-sky" aria-hidden>
          <span className="ms">flight_takeoff</span>
        </div>
        <h1>항공편</h1>
      </section>
      <main className="g-main">
        <SearchBox search={search} onChange={setSearch} />
        <div className="g-center">
          <button
            className="g-explore"
            onClick={() => {
              saveSearch(search);
              set({ notice: null });
              go("/results");
            }}
          >
            <span className="ms">search</span>검색
          </button>
        </div>
      </main>
    </div>
  );
}

function Tail({ f }: { f: Flight }) {
  return <span className="g-tail" style={{ color: f.color }} aria-hidden><span className="ms">flight</span></span>;
}

function Row({ f, open, onToggle, search }: { f: Flight; open: boolean; onToggle: () => void; search: Search }) {
  return (
    <li className={"g-row" + (open ? " open" : "")}>
      <button className="g-row-main" onClick={onToggle} aria-expanded={open} aria-label={`${f.airline} ${f.dep} 출발 ${won(f.price)} 세부정보`}>
        <Tail f={f} />
        <span className="g-time">
          <b>{f.dep} – {f.arr}{f.plusDay && <sup>+1</sup>}</b>
          <small>{f.airline}</small>
        </span>
        <span className="g-dur"><b>{f.duration}</b><small>{search.from}–{search.to}</small></span>
        <span className="g-stop"><b>{f.stops ? `경유 ${f.stops}회` : "직항"}</b><small>{f.stopInfo ?? ""}</small></span>
        <span className="g-co2"><b>CO2e {f.co2}kg</b><small>평균 배출량</small></span>
        <span className="g-price">{won(f.price)}<small className="g-seats">9석 남음</small></span>
        <span className="ms g-chev">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="g-detail">
          <p><b>{f.dep}</b> · {AIRPORTS[search.from]} {search.from}</p>
          <p className="g-mid">이동 시간: {f.duration} · {f.code} · 이코노미</p>
          <p><b>{f.arr}</b> · {AIRPORTS[search.to]} {search.to}</p>
          <p className="g-bag">{f.bag ? "위탁 수하물 1개 포함" : "위탁 수하물 유료"}</p>
          <button className="g-primary" onClick={() => go(`/booking/${f.id}`)}>항공편 선택</button>
        </div>
      )}
    </li>
  );
}

export function Results() {
  const { notice } = useStore();
  const [search, setSearch] = useState(readSearch);
  const [tab, setTab] = useState<"best" | "cheap">("best");
  const [open, setOpen] = useState<string | null>(null);
  const [direct, setDirect] = useState(false);
  const [bagOnly, setBagOnly] = useState(false);
  const rows = FLIGHTS.filter((f) => (!direct || f.stops === 0) && (!bagOnly || f.bag));
  const list = tab === "cheap" ? [...rows].sort((a, b) => a.price - b.price) : rows;
  const cheapest = Math.min(...FLIGHTS.map((f) => f.price));
  return (
    <div className="g-page">
      <Header />
      <main className="g-main">
        <SearchBox search={search} onChange={(s) => { setSearch(s); saveSearch(s); }} />
        <div className="g-chips">
          <button className={"g-chip" + (direct ? " on" : "")} onClick={() => setDirect(!direct)}>직항만</button>
          <button className={"g-chip" + (bagOnly ? " on" : "")} onClick={() => setBagOnly(!bagOnly)}>위탁 수하물 포함</button>
        </div>
        {notice && (
          <div className="g-notice" role="alert">
            <span className="ms">error</span>{notice}
            <button className="icon-btn" onClick={() => set({ notice: null })} aria-label="알림 닫기"><span className="ms">close</span></button>
          </div>
        )}
        <div className="g-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "best"} className={tab === "best" ? "on" : ""} onClick={() => setTab("best")}>추천</button>
          <button role="tab" aria-selected={tab === "cheap"} className={tab === "cheap" ? "on" : ""} onClick={() => setTab("cheap")}>최저가 <b>{won(cheapest)}</b>부터</button>
        </div>
        <h2 className="g-h2">인기 항공편</h2>
        <p className="g-sub">{dateLabel(search.date)} · 가격에는 성인 1명의 필수 세금과 수수료가 포함됩니다. 선택적인 요금 및 수하물 요금이 부과될 수 있습니다.</p>
        <Flag title="가짜 긴급성">모든 항공편이 언제 봐도 '9석 남음'입니다. 실제 잔여 좌석과 무관한 고정 문구입니다.</Flag>
        <ul className="g-list">
          {list.map((f) => (
            <Row key={f.id} f={f} search={search} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />
          ))}
        </ul>
        {list.length === 0 && <p className="g-sub">조건에 맞는 항공편이 없습니다.</p>}
      </main>
    </div>
  );
}

export function Booking({ id }: { id: string }) {
  const f = FLIGHTS.find((x) => x.id === id) ?? FLIGHTS[0];
  const [hint, setHint] = useState("");
  const search = readSearch();
  return (
    <div className="g-page">
      <Header />
      <main className="g-main">
        <h2 className="g-h2">{AIRPORTS[search.from]} → {AIRPORTS[search.to]}</h2>
        <p className="g-sub">편도 · 이코노미 · 승객 1명</p>
        <div className="g-price-big">{won(f.price)}<small>최저 총 가격</small></div>
        <ul className="g-list"><li className="g-row"><div className="g-row-main static">
          <Tail f={f} />
          <span className="g-time"><b>{f.dep} – {f.arr}</b><small>{dateLabel(search.date)} · {f.airline}</small></span>
          <span className="g-dur"><b>{f.duration}</b><small>{search.from}–{search.to}</small></span>
          <span className="g-stop"><b>{f.stops ? `경유 ${f.stops}회` : "직항"}</b></span>
        </div></li></ul>
        <h2 className="g-h2">예약 옵션</h2>
        <ul className="g-list g-sellers">
          <li>
            <b>{BRAND.ota}에서 예약</b>
            <span className="g-seller-price">{won(f.price)}</span>
            <button className="g-primary" onClick={() => startOrder(f.id)}>계속</button>
          </li>
          {SELLERS.map((s) => (
            <li key={s.name}>
              <b>{s.name}에서 예약</b>
              <span className="g-seller-price">{won(f.price + s.delta)}</span>
              <button className="g-secondary" onClick={() => setHint(`이 데모는 ${BRAND.ota} 흐름만 재현합니다.`)}>계속</button>
            </li>
          ))}
        </ul>
        <p className="g-sub" role="status">{hint}</p>
        <p className="g-sub">티켓은 항공사 또는 여행사가 판매합니다. {BRAND.search}은(는) 통신판매의 중개자이며, 통신판매의 당사자가 아닙니다.</p>
      </main>
    </div>
  );
}
