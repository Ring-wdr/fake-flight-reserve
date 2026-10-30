import { useEffect } from "react";
import { go } from "../../app/navigation";
import { paths } from "../../app/paths";
import { CardSkeleton, Sk } from "../../components/Skeleton";
import { AIRPORTS, dateLabel, travellers } from "../../domain/flights";
import { Empty, Logo, Shell } from "./Shell";
import { useSite, useSiteOrder } from "./SiteLayout";

// 판매사 사이트로 넘어올 때 보이는 전환 화면.
export function Enter() {
  const order = useSiteOrder();
  const site = useSite();
  const s = order?.search;
  useEffect(() => {
    if (!order) return;
    const t = setTimeout(() => go(paths.step(site.id, site.flow[0])), site.enter === "ticket" ? 2600 : 1400);
    return () => clearTimeout(t);
  }, []);
  if (!order || !s) return <Empty />;
  if (site.enter === "ticket")
    return (
      <div className={`o-page site-${site.id}`}>
        <header className="o-head"><span className="o-logo"><Logo /></span><span className="g-grow" /><Sk w={70} h={24} r={6} /></header>
        <main className="p-enter">
          <span className="ms p-ticket" aria-hidden>airplane_ticket</span>
          <h2>수많은 여행객의 선택</h2>
          <p className="o-muted">항공권 정보를 확인하고 있습니다.</p>
          <div className="p-enter-card">
            <i className="p-progress" />
            <b>{AIRPORTS[s.from]} → {AIRPORTS[s.to]}</b>
            <small>{dateLabel(s.date)} · {travellers(s)}명</small>
          </div>
        </main>
      </div>
    );
  if (site.enter === "spinner")
    return (
      <div className={`o-page site-${site.id}`}>
        <header className="o-head"><span className="o-logo"><Logo /></span></header>
        <main className="v-enter" role="status"><i className="o-spin" />불러오는 중...</main>
      </div>
    );
  return (
    <Shell stage="passenger">
      <main className="o-main o-grid" role="status" aria-label="불러오는 중">
        <div><CardSkeleton lines={3} /><CardSkeleton lines={5} /></div>
        <aside className="o-side"><Sk w="60%" h={18} /><Sk style={{ marginTop: 16 }} /><Sk w="70%" style={{ marginTop: 10 }} /></aside>
      </main>
    </Shell>
  );
}
