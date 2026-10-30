import { useEffect, useRef, useState } from "react";
import { BRAND, SITES, type SiteId } from "./brand";
import { AIRPORTS, CABINS, cheapestReturn, dateLabel, FLIGHTS, legPrice, OTHER_SELLERS, paxLabel, seats, travellers, won, type Cabin, type Flight, type Search } from "./data";
import { Flag } from "./Flag";
import { Sk, TopBar, useLoad } from "./Skeleton";
import { go, sellerFare, set, startOrder, useStore } from "./store";

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

function Counter({ label, sub, value, min, max, onChange }: { label: string; sub: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="g-count">
      <span>{label}<small>{sub}</small></span>
      <button aria-label={`${label} 줄이기`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <b aria-label={`${label} ${value}명`}>{value}</b>
      <button aria-label={`${label} 늘리기`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function PaxPicker({ search, onChange }: { search: Search; onChange: (s: Search) => void }) {
  const [open, setOpen] = useState(false);
  const room = 9 - travellers(search);
  return (
    <div className="g-pax">
      <button className="g-opt" aria-expanded={open} aria-label={`승객 ${travellers(search)}명, 승객 수 변경`} onClick={() => setOpen(!open)}>
        <span className="ms">person</span>{travellers(search)}<span className="ms sm">arrow_drop_down</span>
      </button>
      {open && (
        <div className="g-pax-pop">
          <Counter label="성인" sub="12세 이상" value={search.adults} min={1} max={search.adults + room}
            onChange={(n) => onChange({ ...search, adults: n, infants: Math.min(search.infants, n) })} />
          <Counter label="어린이" sub="2~11세" value={search.children} min={0} max={search.children + room}
            onChange={(n) => onChange({ ...search, children: n })} />
          <Counter label="유아" sub="2세 미만, 성인 1명당 1명" value={search.infants} min={0} max={Math.min(search.adults, search.infants + room)}
            onChange={(n) => onChange({ ...search, infants: n })} />
          <button className="g-pax-done" onClick={() => setOpen(false)}>완료</button>
        </div>
      )}
    </div>
  );
}

function SearchBox({ search, onChange }: { search: Search; onChange: (s: Search) => void }) {
  return (
    <div className="g-search">
      <div className="g-opts">
        <label className="g-opt">
          <span className="ms">{search.trip === "round" ? "sync_alt" : "east"}</span>
          <select aria-label="여정 유형" value={search.trip} onChange={(e) => onChange({ ...search, trip: e.target.value as Search["trip"] })}>
            <option value="round">왕복</option>
            <option value="oneway">편도</option>
          </select>
        </label>
        <PaxPicker search={search} onChange={onChange} />
        <label className="g-opt">
          <select aria-label="좌석 등급" value={search.cabin} onChange={(e) => onChange({ ...search, cabin: e.target.value as Cabin })}>
            {Object.entries(CABINS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      </div>
      <div className="g-fields">
        <label className="g-field">
          <span className="ms">radio_button_unchecked</span>
          <select aria-label="출발지" value={search.from} onChange={(e) => onChange({ ...search, from: e.target.value })}>
            {Object.entries(AIRPORTS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
          </select>
        </label>
        <button className="g-swap" aria-label="출발지와 목적지 바꾸기" onClick={() => onChange({ ...search, from: search.to, to: search.from })}>
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
          <input aria-label="출발일" type="date" value={search.date}
            onChange={(e) => e.target.value && onChange({ ...search, date: e.target.value, returnDate: search.returnDate < e.target.value ? e.target.value : search.returnDate })} />
        </label>
        {search.trip === "round" && (
          <label className="g-field g-date">
            <span className="ms">calendar_month</span>
            <input aria-label="돌아오는 날" type="date" min={search.date} value={search.returnDate}
              onChange={(e) => e.target.value && onChange({ ...search, returnDate: e.target.value })} />
          </label>
        )}
      </div>
    </div>
  );
}

export function Home() {
  const { search } = useStore();
  return (
    <div className="g-page">
      <Header />
      <section className="g-hero">
        <div className="g-sky" aria-hidden><span className="ms">flight_takeoff</span></div>
        <h1>항공편</h1>
      </section>
      <main className="g-main">
        <SearchBox search={search} onChange={(s) => set({ search: s })} />
        <div className="g-center">
          <button className="g-explore" onClick={() => { set({ notice: null }); go("/results"); }}>
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

function Row({ f, price, from, to, date, cabin, open, onToggle, onSelect, caption }: { f: Flight; price: number; from: string; to: string; date: string; cabin: string; open: boolean; onToggle: () => void; onSelect: () => void; caption: string }) {
  return (
    <li className={"g-row" + (open ? " open" : "")}>
      <button className="g-row-main" onClick={onToggle} aria-expanded={open} aria-label={`${f.airline} ${f.dep} 출발 ${won(price)} 세부정보`}>
        <Tail f={f} />
        <span className="g-time">
          <b>{f.dep} – {f.arr}{f.plusDay && <sup>+1</sup>}</b>
          <small>{f.airline}</small>
        </span>
        <span className="g-dur"><b>{f.duration}</b><small>{from}–{to}</small></span>
        <span className="g-stop"><b>{f.stops ? `경유 ${f.stops}회` : "직항"}</b><small>{f.stopInfo ?? ""}</small></span>
        <span className="g-co2"><b>CO2e {f.co2}kg</b><small>평균 배출량</small></span>
        <span className="g-price" data-testid="row-price">{won(price)}<small className="g-cap">{caption}</small><small className="g-seats">9석 남음</small></span>
        <span className="ms g-chev">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="g-detail">
          <p><b>{f.dep}</b> · {AIRPORTS[from]} {from} · {dateLabel(date)}</p>
          <p className="g-mid">이동 시간: {f.duration} · {f.code} · {cabin}</p>
          <p><b>{f.arr}</b> · {AIRPORTS[to]} {to}</p>
          <p className="g-bag">{f.bag ? "위탁 수하물 1개 포함" : "위탁 수하물 유료"}</p>
          <button className="g-primary" onClick={onSelect}>항공편 선택</button>
        </div>
      )}
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className="g-row">
      <div className="g-row-main static-sk" aria-hidden>
        <Sk w={32} h={32} r={16} />
        <span><Sk w="70%" /><Sk w="40%" h={10} style={{ marginTop: 8 }} /></span>
        <span className="g-dur"><Sk w="80%" /><Sk w="50%" h={10} style={{ marginTop: 8 }} /></span>
        <span className="g-stop"><Sk w="60%" /></span>
        <span className="g-co2"><Sk w="80%" /><Sk w="50%" h={10} style={{ marginTop: 8 }} /></span>
        <Sk w="80%" h={18} style={{ justifySelf: "end" }} />
      </div>
    </li>
  );
}

export function Results() {
  const { notice, search } = useStore();
  const [tab, setTab] = useState<"best" | "cheap">("best");
  const [open, setOpen] = useState<string | null>(null);
  const [direct, setDirect] = useState(false);
  const [bagOnly, setBagOnly] = useState(false);
  const [outbound, setOutbound] = useState<string | null>(null);
  const loading = useLoad(1500, JSON.stringify(search) + outbound);
  const onChange = (s: Search) => {
    set({ search: s });
    setOutbound(null);
    setOpen(null);
  };
  const round = search.trip === "round";
  const out = FLIGHTS.find((f) => f.id === outbound);
  const stageRet = round && !!out;
  const priceOf = (f: Flight) => {
    if (stageRet) return legPrice(out!, search) + legPrice(f, search, "ret");
    return legPrice(f, search) + (round ? cheapestReturn(search) : 0);
  };
  const rows = FLIGHTS.filter((f) => (!direct || f.stops === 0) && (!bagOnly || f.bag));
  const list = tab === "cheap" ? [...rows].sort((a, b) => priceOf(a) - priceOf(b)) : rows;
  const cheapest = Math.min(...FLIGHTS.map(priceOf));
  const invalid = search.from === search.to;
  const caption = `${round ? "왕복" : "편도"}${travellers(search) > 1 ? ` · ${travellers(search)}명 합계` : ""}`;
  return (
    <div className="g-page">
      {loading && <TopBar />}
      <Header />
      <main className="g-main">
        <SearchBox search={search} onChange={onChange} />
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
          <button role="tab" aria-selected={tab === "cheap"} className={tab === "cheap" ? "on" : ""} onClick={() => setTab("cheap")}>
            최저가 {loading ? <i className="g-mini-spin" aria-label="결과를 가져오는 중" /> : <><b>{won(cheapest)}</b>부터</>}
          </button>
        </div>
        <h2 className="g-h2">{stageRet ? "돌아오는 항공편" : round ? "출발 항공편" : "인기 항공편"}</h2>
        <p className="g-sub">
          {dateLabel(stageRet ? search.returnDate : search.date)} · {CABINS[search.cabin].label} · {paxLabel(search)} · 가격에는 필수 세금과 수수료가 포함됩니다. 선택적인 요금 및 수하물 요금이 부과될 수 있습니다.
        </p>
        {stageRet && out && <p className="g-sub g-picked">출발편 선택됨: {out.airline} {out.dep} – {out.arr} <button className="g-link" onClick={() => setOutbound(null)}>변경</button></p>}
        <Flag title="가짜 긴급성">모든 항공편이 언제 봐도 '9석 남음'입니다. 실제 잔여 좌석과 무관한 고정 문구입니다.</Flag>
        {invalid ? (
          <p className="g-sub" role="status">출발지와 목적지가 같습니다. 다른 공항을 선택해 주세요.</p>
        ) : (
          <>
            <ul className="g-list" aria-busy={loading}>
              {loading
                ? list.map((f) => <RowSkeleton key={f.id} />)
                : list.map((f) => (
                    <Row key={f.id} f={f} price={priceOf(f)} caption={caption}
                      from={stageRet ? search.to : search.from} to={stageRet ? search.from : search.to}
                      date={stageRet ? search.returnDate : search.date} cabin={CABINS[search.cabin].label}
                      open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)}
                      onSelect={() => {
                        if (round && !out) { setOutbound(f.id); setOpen(null); window.scrollTo(0, 0); }
                        else go(`/booking/${out ? out.id : f.id}${out ? `/${f.id}` : ""}`);
                      }} />
                  ))}
            </ul>
            {!loading && list.length === 0 && <p className="g-sub">조건에 맞는 항공편이 없습니다.</p>}
          </>
        )}
      </main>
    </div>
  );
}

const SITE_ORDER: SiteId[] = ["faretrap", "voyagate", "pinefly"];

export function Booking({ id, ret }: { id: string; ret?: string }) {
  const { search } = useStore();
  const f = FLIGHTS.find((x) => x.id === id) ?? FLIGHTS[0];
  const r = FLIGHTS.find((x) => x.id === ret);
  const loading = useLoad(1000);
  // 판매처 가격이 한 곳씩 도착하는 모습을 재현한다.
  const [arrived, setArrived] = useState(0);
  const timer = useRef<number>();
  useEffect(() => {
    if (loading) return;
    timer.current = window.setInterval(() => setArrived((n) => n + 1), 450);
    return () => clearInterval(timer.current);
  }, [loading]);
  const [hint, setHint] = useState("");
  const base = sellerFare("faretrap", search, f.id, r?.id);
  return (
    <div className="g-page">
      {(loading || arrived < 5) && <TopBar />}
      <Header />
      <main className="g-main">
        <h2 className="g-h2">{AIRPORTS[search.from]} {r ? "⇄" : "→"} {AIRPORTS[search.to]}</h2>
        <p className="g-sub">{r ? "왕복" : "편도"} · {CABINS[search.cabin].label} · {paxLabel(search)}</p>
        <div className="g-price-big">{loading ? <Sk w={140} h={28} style={{ marginLeft: "auto" }} /> : won(base)}<small>최저 총 가격</small></div>
        <ul className="g-list"><li className="g-row"><div className="g-row-main static">
          <Tail f={f} />
          <span className="g-time"><b>{f.dep} – {f.arr}</b><small>{dateLabel(search.date)} · {f.airline}</small></span>
          <span className="g-dur"><b>{f.duration}</b><small>{search.from}–{search.to}</small></span>
          <span className="g-stop"><b>{f.stops ? `경유 ${f.stops}회` : "직항"}</b></span>
        </div></li>
        {r && <li className="g-row"><div className="g-row-main static">
          <Tail f={r} />
          <span className="g-time"><b>{r.dep} – {r.arr}</b><small>{dateLabel(search.returnDate)} · {r.airline}</small></span>
          <span className="g-dur"><b>{r.duration}</b><small>{search.to}–{search.from}</small></span>
          <span className="g-stop"><b>{r.stops ? `경유 ${r.stops}회` : "직항"}</b></span>
        </div></li>}</ul>
        <h2 className="g-h2">예약 옵션</h2>
        <ul className="g-list g-sellers" aria-busy={arrived < 5}>
          {SITE_ORDER.map((site, i) => (
            <li key={site}>
              <b>{SITES[site].name}에서 예약</b>
              {arrived > i ? <span className="g-seller-price">{won(sellerFare(site, search, f.id, r?.id))}</span> : <Sk w={90} h={16} />}
              <button className="g-primary" disabled={arrived <= i} data-site={site} onClick={() => startOrder(site, f.id, r?.id)}>계속</button>
            </li>
          ))}
          {OTHER_SELLERS.map((s, i) => (
            <li key={s.name}>
              <b>{s.name}에서 예약</b>
              {arrived > i + 3 ? <span className="g-seller-price">{won(base + s.delta * seats(search))}</span> : <Sk w={90} h={16} />}
              <button className="g-secondary" onClick={() => setHint(`이 데모는 ${SITE_ORDER.map((x) => SITES[x].name).join(", ")} 흐름만 재현합니다.`)}>계속</button>
            </li>
          ))}
        </ul>
        <Flag title="판매처별 조합">{SITE_ORDER.map((x) => `${SITES[x].name}: ${SITES[x].mix}`).join(" / ")}</Flag>
        <p className="g-sub" role="status">{hint}</p>
        <p className="g-sub">티켓은 항공사 또는 여행사가 판매합니다. {BRAND.search}은(는) 통신판매의 중개자이며, 통신판매의 당사자가 아닙니다.</p>
      </main>
    </div>
  );
}
