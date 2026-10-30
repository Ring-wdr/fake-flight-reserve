import { useEffect, useMemo, useState } from "react";
import { Flag } from "../../components/Flag";
import { SearchFields } from "../../components/SearchFields";
import { Sk, TopBar, useLoad } from "../../components/Skeleton";
import { AIRPORTS, CABINS, dateLabel, paxLabel, seats, won, type Search } from "../../domain/flights";
import { buildOffers, createListing } from "../../domain/offers";
import { set, startOrder, useStore } from "../../state/store";
import { Shell } from "./Shell";
import { useSite } from "./SiteLayout";

// 어느 판매사에서나 쓰는 목록 상태: 재검색, 필터, 현재 목록의 가격.
function useSellerList() {
  const { search, listing: stored } = useStore();
  const site = useSite();
  const listing = stored?.site === site.id ? stored : null;
  useEffect(() => {
    if (!listing) set({ listing: createListing(site.id, search) });
  }, [listing, site.id]);
  const [draft, setDraft] = useState<Search>(listing?.search ?? search);
  const [direct, setDirect] = useState(false);
  const [bagOnly, setBagOnly] = useState(false);
  const [error, setError] = useState("");
  const loading = useLoad(1300, listing?.seed);
  const built = useMemo(() => (listing ? buildOffers(listing) : null), [listing]);
  const offers = (built?.offers ?? []).filter((o) => (!direct || o.flight.stops === 0) && (!bagOnly || o.flight.bag));
  const research = () => {
    if (draft.from === draft.to) return setError("출발지와 목적지가 같습니다. 다른 공항을 선택해 주세요.");
    setError("");
    set({ search: draft, notice: null, listing: createListing(site.id, draft) });
  };
  return { site, listing, draft, setDraft, direct, setDirect, bagOnly, setBagOnly, error, loading, offers, anchorIncluded: built?.anchorIncluded, research };
}

export function SellerList() {
  const { notice } = useStore();
  const l = useSellerList();
  const copy = l.site.listCopy;
  const s = l.listing?.search ?? l.draft;
  const onePerson = !!l.site.bottomBar;
  return (
    <Shell stage="list">
      {l.loading && <TopBar />}
      <main className="o-main sl">
        <section className="o-search" aria-label={`${l.site.name} 항공편 검색`}>
          <SearchFields search={l.draft} onChange={l.setDraft} />
          {l.error && <p className="o-error" role="alert">{l.error}</p>}
          <button className="o-pay small sl-search" onClick={l.research}>{copy.searchLabel}</button>
        </section>
        {notice && (
          <div className="sl-notice" role="alert">
            <span className="ms">error</span>{notice}
            <button className="icon-btn" onClick={() => set({ notice: null })} aria-label="알림 닫기"><span className="ms">close</span></button>
          </div>
        )}
        <div className="sl-layout">
          <aside className="sl-filter" aria-label="필터">
            <h3>필터</h3>
            <label><input type="checkbox" checked={l.direct} onChange={(e) => l.setDirect(e.target.checked)} />직항만</label>
            <label><input type="checkbox" checked={l.bagOnly} onChange={(e) => l.setBagOnly(e.target.checked)} />위탁 수하물 포함</label>
          </aside>
          <div>
            <h2 className="sl-title">{copy.title}</h2>
            <p className="o-muted">{AIRPORTS[s.from]} {s.trip === "round" ? "⇄" : "→"} {AIRPORTS[s.to]} · {dateLabel(s.date)} · {CABINS[s.cabin].label} · {paxLabel(s)}</p>
            {l.site.honest && !l.loading && <Flag ok title="일관된 가격">같은 조건이면 몇 번을 검색해도 같은 가격입니다. 세금과 수수료가 모두 포함된 금액입니다.</Flag>}
            {l.listing && !l.loading && !l.site.honest && (
              <Flag title="미끼 후 상위 가격 목록">{`기준가(앞서 본 가격 또는 검색 조건의 최저가) ${won(l.listing.anchor)}은(는) ${l.anchorIncluded ? "이번 목록에 무작위로 포함되었습니다" : "이번 목록에 없습니다"}. 나머지는 전부 그보다 비쌉니다. 같은 조건이어도 검색할 때마다 달라집니다.`}</Flag>
            )}
            <ul className="sl-list" aria-busy={l.loading} data-anchor={l.listing?.anchor} data-anchor-included={String(l.anchorIncluded)}>
              {l.loading
                ? Array.from({ length: 5 }, (_, i) => (
                    <li className="sl-row" key={i} aria-hidden>
                      <Sk w={32} h={32} r={16} />
                      <span className="sl-info"><Sk w="60%" /><Sk w="40%" h={10} style={{ marginTop: 8 }} /></span>
                      <Sk w={90} h={20} />
                    </li>
                  ))
                : l.offers.map((o) => (
                    <li className="sl-row" key={o.id}>
                      <span className="ms sl-plane" style={{ color: o.flight.color }} aria-hidden>flight</span>
                      <span className="sl-info">
                        <b>{o.flight.dep} – {o.flight.arr}{o.flight.plusDay && <sup>+1</sup>}</b>
                        <small>{o.flight.airline} {o.flight.code} · {o.flight.duration} · {o.flight.stops ? `경유 ${o.flight.stops}회` : "직항"}</small>
                        {o.ret && <small>귀국 {o.ret.dep} – {o.ret.arr} · {o.ret.airline}</small>}
                        {o.seatsLeft > 0 && <small className="sl-seats">{o.seatsLeft}석 남음</small>}
                      </span>
                      <span className="sl-price" data-price={o.price}>
                        <b>{won(onePerson ? Math.round(o.price / Math.max(1, seats(s))) : o.price)}</b>
                        <small>{onePerson ? "성인 1인당 가격" : seats(s) > 1 || s.trip === "round" ? `${s.trip === "round" ? "왕복 " : ""}총액` : "1인 총액"}</small>
                      </span>
                      <button className="o-pay small" data-airline={o.flight.airline} onClick={() => startOrder(l.site.id, o.flight.id, o.ret?.id, { fare: o.price })}>선택</button>
                    </li>
                  ))}
            </ul>
            {!l.loading && l.offers.length === 0 && <p className="o-muted" role="status">{copy.empty}</p>}
          </div>
        </div>
      </main>
    </Shell>
  );
}
