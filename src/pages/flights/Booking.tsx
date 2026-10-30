import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Flag } from "../../components/Flag";
import { Sk, TopBar, useLoad } from "../../components/Skeleton";
import { AIRPORTS, CABINS, dateLabel, FLIGHTS, OTHER_SELLERS, paxLabel, seats, won } from "../../domain/flights";
import { SITE_LIST } from "../../sites";
import { BRAND } from "../../sites/brand";
import { sellerFare, startOrder, useStore } from "../../state/store";
import { Header } from "./Header";
import { Tail } from "./Tail";

const SELLER_COUNT = SITE_LIST.length + OTHER_SELLERS.length;

export function Booking() {
  const { outId: id, retId: ret } = useParams();
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
  const base = Math.min(...SITE_LIST.map((x) => sellerFare(x.id, search, f.id, r?.id)));
  return (
    <div className="g-page">
      {(loading || arrived < SELLER_COUNT) && <TopBar />}
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
        <ul className="g-list g-sellers" aria-busy={arrived < SELLER_COUNT}>
          {SITE_LIST.map(({ id: site, name }, i) => (
            <li key={site}>
              <b>{name}에서 예약</b>
              {arrived > i ? <span className="g-seller-price">{won(sellerFare(site, search, f.id, r?.id))}</span> : <Sk w={90} h={16} />}
              <button className="g-primary" disabled={arrived <= i} data-site={site} onClick={() => startOrder(site, f.id, r?.id)}>계속</button>
            </li>
          ))}
          {OTHER_SELLERS.map((s, i) => (
            <li key={s.name}>
              <b>{s.name}에서 예약</b>
              {arrived > i + SITE_LIST.length ? <span className="g-seller-price">{won(base + s.delta * seats(search))}</span> : <Sk w={90} h={16} />}
              <button className="g-secondary" onClick={() => setHint(`이 데모는 ${SITE_LIST.map((x) => x.name).join(", ")} 흐름만 제공합니다.`)}>계속</button>
            </li>
          ))}
        </ul>
        <Flag title="판매처별 조합">{SITE_LIST.map((x) => `${x.name}: ${x.mixLabel}`).join(" / ")}</Flag>
        <p className="g-sub" role="status">{hint}</p>
        <p className="g-sub">티켓은 항공사 또는 여행사가 판매합니다. {BRAND.search}은(는) 통신판매의 중개자이며, 통신판매의 당사자가 아닙니다.</p>
      </main>
    </div>
  );
}
