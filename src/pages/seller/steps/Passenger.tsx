import { useState } from "react";
import { go } from "../../../app/navigation";
import { paths } from "../../../app/paths";
import { Flag } from "../../../components/Flag";
import { useLoad } from "../../../components/Skeleton";
import { AIRPORTS } from "../../../domain/flights";
import { flightOf } from "../../../state/store";
import { nextStep } from "../flow";
import { BottomBar, ExtraRow, FlightLines, PassengerCards, Summary } from "../parts";
import { Empty, Shell, StageSkeleton } from "../Shell";
import { useSite, useSiteOrder } from "../SiteLayout";
import { useGate } from "../useGate";

export function Passenger() {
  const order = useSiteOrder();
  const f = flightOf(order);
  const site = useSite();
  const [filled, setFilled] = useState(false);
  const [error, setError] = useState("");
  const [viewers] = useState(() => 12 + Math.floor(Math.random() * 30));
  const gate = useGate(() => go(paths.checkout(site.id)));
  const loading = useLoad(900);
  if (!order || !f) return <Empty />;
  if (loading) return <StageSkeleton stage="passenger" />;
  const onNext = () => {
    if (!filled) return setError("'샘플 데이터 채우기'를 먼저 눌러 주세요.");
    const next = nextStep(site, "passenger");
    if (next) go(paths.step(site.id, next));
    else gate.start();
  };
  const lock = order.extras.find((e) => e.id === "lock");
  return (
    <Shell stage="passenger" bottom={site.bottomBar ? <BottomBar label="총 금액" onNext={onNext} /> : undefined}>
      <main className={"o-main" + (site.bottomBar ? "" : " o-grid")}>
        <div>
          {!site.bottomBar && (
            <section className="o-card">
              <h2>{AIRPORTS[order.search.from]} {order.retId ? "⇄" : "→"} {AIRPORTS[order.search.to]}</h2>
              <FlightLines order={order} />
              {site.urgency && (
                <>
                  <p className="o-urgent"><span className="ms">local_fire_department</span>이 가격으로 9석 남았습니다 · 지금 {viewers}명이 보고 있어요</p>
                  <Flag title="가짜 긴급성">좌석 수는 고정값, 시청자 수는 새로고침할 때마다 바뀌는 난수입니다.</Flag>
                </>
              )}
            </section>
          )}
          {lock && (
            <section className="o-card p-lock">
              <h2>고민할 시간이 더 필요하신가요?</h2>
              <p>3일 동안 이 티켓 가격을 고정할 수 있어요.</p>
              <ExtraRow id="lock" />
              <Flag title="불안 조성 판매">가격이 곧 오를 것처럼 보이게 해 유료 고정 옵션을 권합니다. 재현 흐름에서는 이 옵션을 사도 뒤의 판매 종료를 막지 못합니다.</Flag>
            </section>
          )}
          <PassengerCards filled={filled} onFill={() => { setFilled(true); setError(""); }} />
          {error && <p className="o-error" role="alert">{error}</p>}
          {site.inlineExtras && (
            <section className="o-card">
              <h2>추가 서비스</h2>
              {order.extras.filter((e) => e.id !== site.upsellExtra).map((e) => <ExtraRow key={e.id} id={e.id} />)}
              {site.honest
                ? <Flag ok title="선택 옵션">유료 옵션은 미리 선택되어 있지 않습니다. 직접 고른 것만 결제됩니다.</Flag>
                : <Flag title="끼워팔기">유료 옵션이 미리 체크되어 있습니다. 직접 해제하지 않으면 결제 금액에 포함됩니다.</Flag>}
            </section>
          )}
          {!site.bottomBar && <button className="o-pay" onClick={onNext}>{nextStep(site, "passenger") ? "계속" : "결제하기"}</button>}
        </div>
        {!site.bottomBar && <Summary />}
      </main>
      {gate.modals}
    </Shell>
  );
}
