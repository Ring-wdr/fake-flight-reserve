import { go } from "../../../app/navigation";
import { paths } from "../../../app/paths";
import { Flag } from "../../../components/Flag";
import { useLoad } from "../../../components/Skeleton";
import { AIRPORTS } from "../../../domain/flights";
import { nextStep } from "../flow";
import { BottomBar, FlightLines } from "../parts";
import { Empty, Shell, StageSkeleton } from "../Shell";
import { useSite, useSiteOrder } from "../SiteLayout";

export function TripSummary() {
  const order = useSiteOrder();
  const site = useSite();
  const loading = useLoad(900);
  if (!order) return <Empty />;
  if (loading) return <StageSkeleton stage="summary" />;
  return (
    <Shell stage="summary" bottom={<BottomBar label="총 금액" onNext={() => go(paths.step(site.id, nextStep(site, "summary")!))} />}>
      <main className="o-main">
        <h1 className="v-title">{AIRPORTS[order.search.from]} {order.retId ? "⇄" : "→"} {AIRPORTS[order.search.to]}</h1>
        <section className="v-hero">
          <div>
            <h2>고객님이 선택한 여행 상품</h2>
            <FlightLines order={order} />
            <p className="o-muted">수하물: 기내 수하물 1개 포함</p>
            <p className="o-urgent"><span className="ms">schedule</span>이 요금으로 예약 가능한 좌석 9석</p>
          </div>
          <div className="v-photo">
            <ul>
              <li><span className="ms">check</span>폭넓은 선택</li>
              <li><span className="ms">check</span>수많은 승객이 선택한 서비스</li>
              <li><span className="ms">check</span>오랜 예약 노하우</li>
            </ul>
          </div>
        </section>
        <Flag title="숨은 요금">'총 금액' 자리에 성인 1인당 항공권 가격만 표시합니다. 수수료와 옵션은 마지막 단계에서야 합산됩니다.</Flag>
      </main>
    </Shell>
  );
}
