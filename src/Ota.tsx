import { useEffect, useRef, useState, type ReactNode } from "react";
import { BRAND } from "./brand";
import { FEES, won } from "./data";
import { Flag } from "./Flag";
import { abandonCheckout, checkoutTotal, fareTotal, flightOf, getState, go, pay, priceOutcome, set, useStore } from "./store";

function OtaHead({ step }: { step: 1 | 2 }) {
  return (
    <header className="o-head">
      <a className="o-logo" href="#/">{BRAND.ota}</a>
      <ol className="o-steps">
        <li className={step === 1 ? "on" : ""}><i>1</i>항공편 정보</li>
        <li className={step === 2 ? "on" : ""}><i>2</i>결제</li>
      </ol>
      <span className="g-grow" />
      <a className="o-help" href="#/ota/support">고객센터</a>
    </header>
  );
}

function Empty() {
  return (
    <div className="o-page"><OtaHead step={1} />
      <main className="o-main"><div className="o-card"><p>진행 중인 예약이 없습니다.</p><a className="o-link" href="#/">항공편 검색으로</a></div></main>
    </div>
  );
}

function Summary({ children }: { children?: ReactNode }) {
  const { order } = useStore();
  const f = flightOf(order);
  if (!order || !f) return null;
  return (
    <aside className="o-side">
      <h3>요금 상세정보</h3>
      <p className="o-line"><span>항공권</span><span>{won(order.fare)}</span></p>
      {order.surge > 0 && <p className="o-line up"><span>가격 변동</span><span>+{won(order.surge)}</span></p>}
      {children}
      <div className="o-side-flight"><b>{f.dep} → {f.arr}</b><small>{f.airline} {f.code}</small></div>
    </aside>
  );
}

const SAMPLE = { email: "sample@example.com", phone: "010-0000-0000", last: "HONG", first: "GILDONG", birth: "1990-01-15", passport: "M00000000" };

export function Passenger() {
  const { order } = useStore();
  const f = flightOf(order);
  const [filled, setFilled] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"none" | "upsell" | "loading" | "pay" | "list">("none");
  const [viewers] = useState(() => 12 + Math.floor(Math.random() * 30));
  if (!order || !f) return <Empty />;
  const v = (k: keyof typeof SAMPLE) => (filled ? SAMPLE[k] : "");

  const verify = (fast: boolean) => {
    set({ order: { ...order, fastTicket: fast, passenger: true } });
    setModal("loading");
    setTimeout(() => {
      const outcome = priceOutcome();
      if (outcome === "none") {
        set({ order: { ...getState().order!, status: "checkout" } });
        go("/ota/checkout");
        return;
      }
      const hits = getState().priceHits + 1;
      if (outcome === "pay") {
        const surge = 38400 + (hits - 1) * 12000;
        set({ priceHits: hits, order: { ...getState().order!, surge } });
      } else {
        set({ priceHits: hits });
      }
      setModal(outcome);
    }, 2600);
  };

  return (
    <div className="o-page">
      <OtaHead step={1} />
      <main className="o-main o-grid">
        <div>
          <section className="o-card">
            <h2>서울 → 방콕</h2>
            <p className="o-flight"><b>{f.dep}</b> 인천국제공항 T1 <span>→</span> <b>{f.arr}</b> 수완나품 공항</p>
            <p className="o-muted">{f.airline} {f.code} · 일반석 · {f.duration}</p>
            <p className="o-urgent"><span className="ms">local_fire_department</span>이 가격으로 9석 남았습니다 · 지금 {viewers}명이 보고 있어요</p>
            <Flag title="가짜 긴급성">좌석 수는 고정값, 시청자 수는 새로고침할 때마다 바뀌는 난수입니다.</Flag>
          </section>
          <section className="o-card">
            <div className="o-card-head">
              <h2>연락처 및 탑승객 정보</h2>
              <button className="o-sample" onClick={() => { setFilled(true); setError(""); }}>샘플 데이터 채우기</button>
            </div>
            <p className="o-muted">재현 데모라 직접 입력할 수 없습니다. 입력한 정보가 여권과 일치해야 합니다.</p>
            <div className="o-form">
              <label>이메일<input readOnly value={v("email")} /></label>
              <label>휴대전화 번호<input readOnly value={v("phone")} /></label>
              <label>성<input readOnly value={v("last")} /></label>
              <label>이름<input readOnly value={v("first")} /></label>
              <label>생년월일<input readOnly value={v("birth")} /></label>
              <label>여권 번호<input readOnly value={v("passport")} /></label>
            </div>
            <Flag title="정보 먼저, 가격은 나중">민감한 여권 정보를 모두 받은 뒤에야 가격을 '재확인'합니다. 입력에 들인 수고 때문에 인상된 가격도 받아들이기 쉬워집니다.</Flag>
            {error && <p className="o-error" role="alert">{error}</p>}
          </section>
          <section className="o-card">
            <h2>추가 서비스</h2>
            <label className="o-extra"><input type="checkbox" checked={order.insurance} onChange={(e) => set({ order: { ...order, insurance: e.target.checked } })} /><span>여행 보험 <small>최대 USD 60,000 보장</small></span><b>{won(FEES.insurance)}</b></label>
            <label className="o-extra"><input type="checkbox" checked={order.seat} onChange={(e) => set({ order: { ...order, seat: e.target.checked } })} /><span>좌석 우선 배정</span><b>{won(FEES.seat)}</b></label>
            <Flag title="끼워팔기">유료 옵션이 미리 체크되어 있습니다. 직접 해제하지 않으면 결제 금액에 포함됩니다.</Flag>
          </section>
          <button
            className="o-pay"
            onClick={() => {
              if (!filled) return setError("'샘플 데이터 채우기'를 먼저 눌러 주세요.");
              setModal("upsell");
            }}
          >
            결제하기
          </button>
        </div>
        <Summary><p className="o-total"><span>항공권 금액</span><b>{won(fareTotal(order))}</b></p></Summary>
      </main>

      {modal === "upsell" && (
        <div className="o-modal" role="dialog" aria-label="초고속 발권">
          <div>
            <h3>결제 후 72시간 이내에 발권될 예정입니다.</h3>
            <p>우선 발권, 1시간 내 신속 발권<br />지금 바로 초고속 발권으로 업그레이드 {won(FEES.fastTicket)}/인</p>
            <Flag title="불안 조성 판매">발권까지 최대 3일이 걸린다는 사실을 결제 직전에야 알리고 유료 옵션을 권합니다.</Flag>
            <div className="o-modal-btns">
              <button className="o-ghost" onClick={() => verify(false)}>필요 없음</button>
              <button className="o-pay small" onClick={() => verify(true)}>추가하고 결제</button>
            </div>
          </div>
        </div>
      )}
      {modal === "loading" && (
        <div className="o-modal" role="status"><div className="o-loading"><i className="o-spin" />좌석과 가격을 확인하고 있습니다.</div></div>
      )}
      {modal === "pay" && (
        <div className="o-modal" role="alertdialog" aria-label="가격 변동">
          <div>
            <h3><span className="ms warn">warning</span>항공사 사정으로 가격이 변동되었습니다</h3>
            <p className="o-compare"><s>{won(order.fare)}</s> → <b>{won(fareTotal(order))}</b></p>
            <p>지금 이 가격으로도 좌석이 빠르게 줄고 있습니다.</p>
            <Flag title="가짜 가격 변동">'9석 남음'이던 좌석이 여권 입력 직후 오른 가격으로 바뀝니다. 이 앞에서 표시한 가격은 미끼였던 셈입니다.</Flag>
            <div className="o-modal-btns">
              <button className="o-ghost" onClick={() => { set({ notice: "선택하신 항공권의 가격이 변경되어 다시 검색했습니다.", order: null }); go("/results"); }}>다른 항공편 보기</button>
              <button className="o-pay small" onClick={() => { set({ order: { ...getState().order!, status: "checkout" } }); go("/ota/checkout"); }}>변동된 가격으로 계속</button>
            </div>
          </div>
        </div>
      )}
      {modal === "list" && (
        <div className="o-modal" role="alertdialog" aria-label="판매 종료">
          <div>
            <h3><span className="ms warn">warning</span>해당 운임의 판매가 종료되었습니다</h3>
            <p>같은 기간과 목적지의 다른 항공편을 안내해 드립니다.</p>
            <Flag title="가짜 가격 변동">조금 전까지 '9석 남음'이던 상품이 정보 입력 직후 사라지고, 입력한 수고는 그대로 사라집니다.</Flag>
            <div className="o-modal-btns">
              <button className="o-pay small" onClick={() => { set({ notice: "선택하신 항공권은 판매가 종료되었습니다. 다른 항공편을 선택해 주세요.", order: null }); go("/results"); }}>항공편 목록으로</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 새로고침하면 다시 30분부터 시작하는 것이 수법의 일부다.
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
  const { order } = useStore();
  const timer = useCountdown(29 * 60 + 58);
  const [paying, setPaying] = useState(false);
  const [card, setCard] = useState(false);
  const paid = useRef(false);
  useEffect(() => {
    const leave = () => { if (!paid.current) abandonCheckout(); };
    addEventListener("pagehide", leave);
    return () => { removeEventListener("pagehide", leave); leave(); };
  }, []);
  const f = flightOf(order);
  if (!order || !f) return <Empty />;
  const total = checkoutTotal(order);
  return (
    <div className="o-page">
      <OtaHead step={2} />
      <main className="o-main o-grid">
        <div>
          <section className="o-card">
            <h2>결제 방법을 선택하세요</h2>
            <p className="o-timer">{timer} 이내에 예약을 완료하세요.</p>
            <Flag title="가짜 긴급성">이 타이머는 새로고침하면 다시 30분으로 돌아갑니다. 만료돼도 실제로 바뀌는 것이 없습니다.</Flag>
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
              setTimeout(() => { paid.current = true; pay(); go("/ota/complete"); }, 1800);
            }}
          >
            {paying ? "결제 처리 중…" : `${won(total)} 지금 결제`}
          </button>
          <button className="o-leave" onClick={() => go("/results")}>결제하지 않고 나가기</button>
        </div>
        <Summary>
          <p className="o-line"><span>서비스 수수료</span><span>{won(FEES.service)}</span></p>
          {order.seat && <p className="o-line"><span>좌석 우선 배정</span><span>{won(FEES.seat)}</span></p>}
          {order.insurance && <p className="o-line"><span>여행 보험</span><span>{won(FEES.insurance)}</span></p>}
          {order.fastTicket && <p className="o-line"><span>초고속 발권</span><span>{won(FEES.fastTicket)}</span></p>}
          <p className="o-total"><span>총 금액</span><b>{won(total)}</b></p>
          <Flag title="숨은 요금">앞 단계에 없던 서비스 수수료가 마지막 결제 화면에서야 나타납니다. 처음 비교한 가격과 달라집니다.</Flag>
        </Summary>
      </main>
    </div>
  );
}

export function Complete() {
  const { order } = useStore();
  if (!order?.pnr) return <Empty />;
  return (
    <div className="o-page">
      <OtaHead step={2} />
      <main className="o-main">
        <section className="o-card o-center">
          <span className="ms ok">check_circle</span>
          <h2>결제가 완료되었습니다</h2>
          <p>예약번호 <b>{order.pnr}</b></p>
          <p className="o-muted">결제 금액 {won(order.paidTotal ?? 0)} · 전자티켓은 72시간 이내에 메일로 보내드립니다.</p>
          <Flag title="가짜 상품">이 시점에 실제 좌석은 확보되어 있지 않습니다. 결제부터 받고, 2~3시간 뒤 일방적으로 취소합니다.</Flag>
          <a className="o-link" href="#/mail">메일함 확인</a>
        </section>
      </main>
    </div>
  );
}

export function Gone() {
  const [left, setLeft] = useState(4);
  useEffect(() => {
    if (left === 0) {
      set({ notice: "선택하신 항공권은 이미 판매가 종료되었습니다.", order: null });
      go("/results");
      return;
    }
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <div className="o-page">
      <OtaHead step={1} />
      <main className="o-main">
        <section className="o-card o-center">
          <span className="ms warn big">event_busy</span>
          <h2>죄송합니다. 이미 판매가 종료된 상품입니다</h2>
          <p className="o-muted">{left}초 뒤 항공편 목록으로 이동합니다.</p>
          <Flag title="이탈 유도 메일">'원래 가격 그대로'라던 메일의 링크가 곧바로 판매 종료 화면으로 이어집니다. 사용자를 다시 불러들이는 미끼입니다.</Flag>
        </section>
      </main>
    </div>
  );
}

const BOT = "문의 내용이 접수되었습니다. 환불은 카드사 사정에 따라 영업일 기준 최대 30일이 소요될 수 있습니다. 추가 문의는 고객센터 메일로 보내 주세요.";

export function Support() {
  const [log, setLog] = useState<{ me: boolean; text: string }[]>([{ me: false, text: `안녕하세요, ${BRAND.ota} AI 상담봇입니다. 무엇을 도와드릴까요?` }]);
  const ask = (text: string) => {
    setLog((l) => [...l, { me: true, text }]);
    setTimeout(() => setLog((l) => [...l, { me: false, text: BOT }]), 900);
  };
  return (
    <div className="o-page">
      <OtaHead step={2} />
      <main className="o-main">
        <section className="o-card o-chat">
          <h2>고객센터</h2>
          <div className="o-log" role="log">
            {log.map((m, i) => <p key={i} className={m.me ? "me" : ""}>{m.text}</p>)}
          </div>
          <Flag title="환불·상담 지연">어떤 질문에도 같은 답을 반복합니다. 상담원 연결 경로가 없고, 환불 기한은 '최대'라는 말로 늘어납니다.</Flag>
          <div className="o-quick">
            <button onClick={() => ask("상담원 연결해 주세요")}>상담원 연결</button>
            <button onClick={() => ask("환불은 언제 되나요?")}>환불 일정 문의</button>
            <button onClick={() => ask("왜 취소됐나요?")}>취소 사유 문의</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export function Lookup() {
  const { order } = useStore();
  const f = flightOf(order);
  const [done, setDone] = useState(false);
  return (
    <div className="l-page">
      <header className="l-head"><span className="ms">flight_takeoff</span>{f?.airline ?? "항공사"} 예약 조회</header>
      <main className="l-main">
        <label>예약번호<input readOnly value={order?.pnr ?? ""} /></label>
        <label>탑승객 성<input readOnly value={SAMPLE.last} /></label>
        <button onClick={() => setDone(true)}>조회</button>
        {done && <p className="l-none" role="alert">일치하는 예약을 찾을 수 없습니다.</p>}
        {done && <Flag title="가짜 확정 메일">'확정' 메일의 예약번호가 항공사에는 존재하지 않습니다. 실제 발권 없이 판매사 내부 번호만 보낸 경우입니다.</Flag>}
      </main>
    </div>
  );
}
