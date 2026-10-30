import { useState } from "react";
import { Flag } from "../../components/Flag";
import { won } from "../../domain/flights";
import { countPriceHit, fareTotal, getState, goSellerList, priceOutcome, set, setExtra } from "../../state/store";
import { useSite, useSiteOrder } from "./SiteLayout";

// 정보를 받은 뒤 가격을 '재확인'하는 공통 관문.
export function useGate(onPass: () => void) {
  const [modal, setModal] = useState<"none" | "upsell" | "loading" | "pay" | "list">("none");
  const order = useSiteOrder();
  const site = useSite();
  const verify = () => {
    setModal("loading");
    setTimeout(() => {
      const outcome = priceOutcome();
      if (outcome === "none") {
        set({ order: { ...getState().order!, status: "checkout" } });
        onPass();
        return;
      }
      const o = getState().order!;
      const hits = getState().priceHits[o.site] ?? 0;
      countPriceHit(outcome === "pay" ? Math.round(o.fare * 0.14 / 100) * 100 + hits * 12000 : 0);
      setModal(outcome);
    }, 2600);
  };
  const fast = order?.extras.find((e) => e.id === site.upsellExtra);
  const start = () => (fast ? setModal("upsell") : verify());
  const back = (notice: string) => goSellerList(site.id, notice);
  const modals = (
    <>
      {modal === "upsell" && fast && (
        <div className="o-modal" role="dialog" aria-label="초고속 발권">
          <div>
            <h3>결제 후 72시간 이내에 발권될 예정입니다.</h3>
            <p>우선 발권, 1시간 내 신속 발권<br />지금 바로 초고속 발권으로 업그레이드 {won(fast.price)}/인</p>
            <Flag title="불안 조성 판매">발권까지 최대 3일이 걸린다는 사실을 결제 직전에야 알리고 유료 옵션을 권합니다.</Flag>
            <div className="o-modal-btns">
              <button className="o-ghost" onClick={verify}>필요 없음</button>
              <button className="o-pay small" onClick={() => { setExtra(fast.id, true); verify(); }}>추가하고 결제</button>
            </div>
          </div>
        </div>
      )}
      {modal === "loading" && (
        <div className="o-modal" role="status"><div className="o-loading"><i className="o-spin" />좌석과 가격을 확인하고 있습니다.</div></div>
      )}
      {modal === "pay" && order && (
        <div className="o-modal" role="alertdialog" aria-label="가격 변동">
          <div>
            <h3><span className="ms warn">warning</span>항공사 사정으로 가격이 변동되었습니다</h3>
            <p className="o-compare"><s>{won(order.fare)}</s> → <b>{won(fareTotal(order))}</b></p>
            <p>지금 이 가격으로도 좌석이 빠르게 줄고 있습니다.</p>
            <Flag title="가짜 가격 변동">'9석 남음'이던 좌석이 여권 입력 직후 오른 가격으로 바뀝니다. 앞에서 표시한 가격은 미끼였던 셈입니다.</Flag>
            <div className="o-modal-btns">
              <button className="o-ghost" onClick={() => back("선택하신 항공권의 가격이 변경되어 다시 검색했습니다.")}>다른 항공편 보기</button>
              <button className="o-pay small" onClick={() => { set({ order: { ...getState().order!, status: "checkout" } }); onPass(); }}>변동된 가격으로 계속</button>
            </div>
          </div>
        </div>
      )}
      {modal === "list" && (
        <div className="o-modal" role="alertdialog" aria-label="판매 종료">
          <div>
            <h3><span className="ms warn">warning</span>해당 운임의 판매가 종료되었습니다</h3>
            <p>같은 기간과 목적지의 다른 항공권을 자사 목록에서 안내해 드립니다.</p>
            <Flag title="가짜 가격 변동">조금 전까지 '9석 남음'이던 상품이 정보를 모두 입력한 직후 사라지고, 입력한 수고는 그대로 버려집니다.</Flag>
            <div className="o-modal-btns">
              <button className="o-pay small" onClick={() => back("선택하신 항공권은 판매가 종료되었습니다. 다른 항공편을 선택해 주세요.")}>항공편 목록으로</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
  return { start, modals };
}
