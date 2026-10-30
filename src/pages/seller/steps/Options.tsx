import { go } from "../../../app/navigation";
import { paths } from "../../../app/paths";
import { Flag } from "../../../components/Flag";
import { useLoad } from "../../../components/Skeleton";
import { won } from "../../../domain/flights";
import { setExtra } from "../../../state/store";
import { nextStep } from "../flow";
import { ExtraRow, Summary } from "../parts";
import { Empty, Shell, StageSkeleton } from "../Shell";
import { useSite, useSiteOrder } from "../SiteLayout";
import { useGate } from "../useGate";

export function Options({ step: stage }: { step: "fare" | "bags" | "seat" }) {
  const order = useSiteOrder();
  const site = useSite();
  const gate = useGate(() => go(paths.checkout(site.id)));
  const loading = useLoad(800, stage);
  if (!order) return <Empty />;
  if (loading) return <StageSkeleton stage={stage} />;
  const flexi = order.extras.find((e) => e.id === "flexi")!;
  const seat = order.extras.find((e) => e.id === "seat")!;
  return (
    <Shell stage={stage}>
      <main className="o-main o-grid">
        <div>
          {stage === "fare" && (
            <section className="o-card">
              <h2>티켓 요금 선택</h2>
              <div className="p-tiers">
                <button className={!flexi.on ? "on" : ""} aria-pressed={!flexi.on} onClick={() => setExtra("flexi", false)}><b>세이버</b><small>변경·환불 불가</small><span>추가 요금 없음</span></button>
                <button className={flexi.on ? "on" : ""} aria-pressed={flexi.on} onClick={() => setExtra("flexi", true)}><i>추천</i><b>유연한 티켓</b><small>일정 변경 1회</small><span>+{won(flexi.price)}/인</span></button>
              </div>
              <Flag title="끼워팔기">비싼 요금제가 '추천'으로 미리 선택되어 있습니다.</Flag>
            </section>
          )}
          {stage === "bags" && (
            <section className="o-card">
              <h2>수하물</h2>
              <p className="o-muted">기내 수하물 1개가 포함되어 있습니다. 공항에서 추가하면 더 비쌀 수 있습니다.</p>
              <ExtraRow id="bag" />
            </section>
          )}
          {stage === "seat" && (
            <section className="o-card">
              <h2>좌석</h2>
              <div className="p-tiers">
                <button className={!seat.on ? "on" : ""} aria-pressed={!seat.on} onClick={() => setExtra("seat", false)}><b>임의 배정</b><small>일행과 떨어질 수 있습니다</small><span>추가 요금 없음</span></button>
                <button className={seat.on ? "on" : ""} aria-pressed={seat.on} onClick={() => setExtra("seat", true)}><b>좌석 지정</b><small>일행과 나란히</small><span>+{won(seat.price)}/인</span></button>
              </div>
              <Flag title="끼워팔기">무료 선택지에 '떨어질 수 있다'는 경고를 붙이고, 유료 선택지를 미리 골라 둡니다.</Flag>
            </section>
          )}
          <button className="o-pay" onClick={() => {
            const next = nextStep(site, stage);
            if (next) go(paths.step(site.id, next));
            else gate.start();
          }}>계속</button>
        </div>
        <Summary />
      </main>
      {gate.modals}
    </Shell>
  );
}
