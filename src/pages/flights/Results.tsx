import { useState } from "react";
import { go } from "../../app/navigation";
import { paths } from "../../app/paths";
import { Flag } from "../../components/Flag";
import { SearchFields } from "../../components/SearchFields";
import { Sk, TopBar, useLoad } from "../../components/Skeleton";
import { AIRPORTS, CABINS, cheapestReturn, dateLabel, FLIGHTS, legPrice, paxLabel, travellers, won, type Flight, type Search } from "../../domain/flights";
import { set, useStore } from "../../state/store";
import { Header } from "./Header";
import { Tail } from "./Tail";

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
  const { search } = useStore();
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
        <SearchFields search={search} onChange={onChange} />
        <div className="g-chips">
          <button className={"g-chip" + (direct ? " on" : "")} onClick={() => setDirect(!direct)}>직항만</button>
          <button className={"g-chip" + (bagOnly ? " on" : "")} onClick={() => setBagOnly(!bagOnly)}>위탁 수하물 포함</button>
        </div>
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
                        else go(out ? paths.booking(out.id, f.id) : paths.booking(f.id));
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
