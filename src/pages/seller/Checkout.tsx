import { useEffect, useRef, useState } from "react";
import { go } from "../../app/navigation";
import { paths } from "../../app/paths";
import { Flag } from "../../components/Flag";
import { useLoad } from "../../components/Skeleton";
import { won } from "../../domain/flights";
import { abandonCheckout, checkoutTotal, flightOf, leaveToList, pay } from "../../state/store";
import { Summary } from "./parts";
import { Empty, Shell, StageSkeleton } from "./Shell";
import { useSite, useSiteOrder } from "./SiteLayout";

// 새로고침하면 처음부터 다시 시작하는 것이 수법의 일부다.
function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return `00:${m}:${s}`;
}

export function Checkout() {
  const order = useSiteOrder();
  const site = useSite();
  const seconds = site.timer;
  const timer = useCountdown(seconds ?? 0);
  const [paying, setPaying] = useState(false);
  const [card, setCard] = useState(false);
  const paid = useRef(false);
  const loading = useLoad(1000);
  useEffect(() => {
    const leave = () => { if (!paid.current) abandonCheckout(); };
    addEventListener("pagehide", leave);
    return () => { removeEventListener("pagehide", leave); leave(); };
  }, []);
  if (!order || !flightOf(order)) return <Empty />;
  if (loading) return <StageSkeleton stage="checkout" />;
  const total = checkoutTotal(order);
  return (
    <Shell stage="checkout">
      <main className="o-main o-grid">
        <div>
          <section className="o-card">
            <h2>결제 방법을 선택하세요</h2>
            {seconds && (
              <>
                <p className="o-timer">{timer} 이내에 예약을 완료하세요.</p>
                <Flag title="가짜 긴급성">이 타이머는 새로고침하면 처음으로 돌아갑니다. 만료돼도 실제로 바뀌는 것이 없습니다.</Flag>
              </>
            )}
            <div className="o-method on"><span className="ms">credit_card</span>신용카드/체크카드</div>
            <div className="o-card-demo">
              <div className="o-form">
                <label>카드 번호<input readOnly value={card ? "0000 0000 0000 0000" : ""} /></label>
                <label>유효기간<input readOnly value={card ? "00/00" : ""} /></label>
              </div>
              <button className="o-sample" onClick={() => setCard(true)}>샘플 카드 채우기</button>
            </div>
            <div className="o-method disabled"><span className="ms">smartphone</span>앱카드</div>
          </section>
          <button
            className="o-pay"
            disabled={!card || paying}
            onClick={() => {
              setPaying(true);
              setTimeout(() => { paid.current = true; pay(); go(paths.complete(site.id)); }, 1800);
            }}
          >
            {paying ? "결제 처리 중…" : `${won(total)} 지금 결제`}
          </button>
          <button className="o-leave" onClick={() => leaveToList(site.id)}>결제하지 않고 나가기</button>
        </div>
        <Summary fees>
          {site.honest && <Flag ok title="숨은 요금 없음">세금과 수수료가 포함된 가격입니다. 앞 단계에서 본 금액과 같습니다.</Flag>}
          {!site.honest && <Flag title="숨은 요금">{`앞 단계에 없던 ${site.serviceLabel}가 마지막 결제 화면에서야 나타납니다. 처음 비교한 가격과 달라집니다.`}</Flag>}
        </Summary>
      </main>
    </Shell>
  );
}
