import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { SITES, type SiteId } from "./brand";
import { AIRPORTS, CABINS, dateLabel, paxLabel, seats, travellers, won } from "./data";
import { Flag } from "./Flag";
import { CardSkeleton, Sk, useLoad } from "./Skeleton";
import { abandonCheckout, checkoutTotal, countPriceHit, fareTotal, feeTotal, flightOf, getState, go, goSellerList, leaveToList, pay, priceOutcome, returnOf, set, setExtra, useStore, type Order } from "./store";

type Stage = "list" | "summary" | "passenger" | "fare" | "bags" | "seat" | "checkout" | "done";

const PINE_STEPS: [Stage | "search", string][] = [["search", "검색"], ["passenger", "탑승객 세부정보"], ["fare", "티켓 요금"], ["bags", "수하물"], ["seat", "좌석"], ["checkout", "요약 & 결제"]];
const VOY_STEP: Partial<Record<Stage, number>> = { summary: 1, passenger: 2, checkout: 3, done: 3 };

const useSite = (): SiteId => useStore().site;

export function Shell({ stage, children, bottom }: { stage: Stage; children: ReactNode; bottom?: ReactNode }) {
  const site = useSite();
  const name = SITES[site].name;
  const toList = (e: MouseEvent) => {
    e.preventDefault();
    leaveToList();
  };
  return (
    <div className={`o-page site-${site}`}>
      {site === "faretrap" && (
        <header className="o-head">
          <a className="o-logo" href="#/ota/list" onClick={toList}>{name}</a>
          <ol className="o-steps">
            <li className={stage === "checkout" || stage === "done" ? "" : "on"}><i>1</i>항공편 정보</li>
            <li className={stage === "checkout" || stage === "done" ? "on" : ""}><i>2</i>결제</li>
          </ol>
          <span className="g-grow" />
          <a className="o-help" href="#/ota/support">고객센터</a>
        </header>
      )}
      {site === "voyagate" && (
        <>
          <header className="o-head">
            <a className="o-logo" href="#/ota/list" onClick={toList}>{name.toUpperCase()}</a>
            <span className="g-grow" />
            <a className="o-help" href="#/ota/support">고객 지원</a>
            <span className="o-help">내 예약</span>
          </header>
          {stage !== "list" && <p className="v-step">단계 {VOY_STEP[stage] ?? 1}/3</p>}
        </>
      )}
      {site === "pinefly" && (
        <>
          <header className="o-head">
            <a className="o-logo" href="#/ota/list" onClick={toList}><span className="ms">forest</span>{name.toLowerCase()}</a>
            <span className="g-grow" />
            <a className="o-help" href="#/ota/support">도움말 및 고객 지원</a>
          </header>
          <ol className="p-steps">
            {PINE_STEPS.map(([k, label], i) => {
              const cur = PINE_STEPS.findIndex(([x]) => x === (stage === "done" ? "checkout" : stage === "list" ? "search" : stage));
              return <li key={k} className={i < cur ? "done" : i === cur ? "on" : ""}><i>{i < cur ? "✓" : i + 1}</i><span>{label}</span></li>;
            })}
          </ol>
        </>
      )}
      {children}
      {site === "voyagate" && <p className="v-foot">대면 지원은 제공되지 않으니 양해 부탁드립니다.</p>}
      {bottom}
    </div>
  );
}

function Empty() {
  return (
    <Shell stage="passenger">
      <main className="o-main"><div className="o-card"><p>진행 중인 예약이 없습니다.</p><a className="o-link" href="#/">항공편 검색으로</a></div></main>
    </Shell>
  );
}

// 판매사 사이트로 넘어올 때 보이는 전환 화면.
export function Enter() {
  const { order } = useStore();
  const site = useSite();
  const s = order?.search;
  useEffect(() => {
    if (!order) return;
    const t = setTimeout(() => go(site === "voyagate" ? "/ota/summary" : "/ota/passenger"), site === "pinefly" ? 2600 : 1400);
    return () => clearTimeout(t);
  }, []);
  if (!order || !s) return <Empty />;
  if (site === "pinefly")
    return (
      <div className="o-page site-pinefly">
        <header className="o-head"><span className="o-logo"><span className="ms">forest</span>pinefly</span><span className="g-grow" /><Sk w={70} h={24} r={6} /></header>
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
  if (site === "voyagate")
    return (
      <div className="o-page site-voyagate">
        <header className="o-head"><span className="o-logo">VOYAGATE</span></header>
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

function FlightLines({ order }: { order: Order }) {
  const f = flightOf(order)!;
  const r = returnOf(order);
  const s = order.search;
  return (
    <>
      <p className="o-flight"><b>{f.dep}</b> {AIRPORTS[s.from]} {s.from} <span>→</span> <b>{f.arr}</b> {AIRPORTS[s.to]} {s.to}</p>
      <p className="o-muted">{dateLabel(s.date)} · {f.airline} {f.code} · {CABINS[s.cabin].label} · {f.duration}</p>
      {r && <>
        <p className="o-flight"><b>{r.dep}</b> {AIRPORTS[s.to]} {s.to} <span>→</span> <b>{r.arr}</b> {AIRPORTS[s.from]} {s.from}</p>
        <p className="o-muted">{dateLabel(s.returnDate)} · {r.airline} {r.code} · {CABINS[s.cabin].label} · {r.duration}</p>
      </>}
      <p className="o-muted">{paxLabel(s)}</p>
    </>
  );
}

function Summary({ fees, children }: { fees?: boolean; children?: ReactNode }) {
  const { order } = useStore();
  if (!order) return null;
  const n = seats(order.search);
  const on = order.extras.filter((e) => e.on);
  return (
    <aside className="o-side">
      <h3>요금 상세정보</h3>
      <p className="o-line"><span>항공권 ({travellers(order.search)}명)</span><span>{won(order.fare)}</span></p>
      {order.surge > 0 && <p className="o-line up"><span>가격 변동</span><span>+{won(order.surge)}</span></p>}
      {fees && <p className="o-line"><span>{SITES[order.site].serviceLabel}</span><span>{won(feeTotal(order))}</span></p>}
      {on.map((e) => <p className="o-line" key={e.id}><span>{e.label}</span><span>{won(e.price * n)}</span></p>)}
      <p className="o-total"><span>{fees ? "총 금액" : "현재 금액"}</span><b data-testid="total">{won(fees ? checkoutTotal(order) : checkoutTotal(order) - feeTotal(order))}</b></p>
      {children}
    </aside>
  );
}

const SAMPLE = { email: "sample@example.com", phone: "010-0000-0000", last: "HONG", first: "GILDONG", birth: "1990-01-15", passport: "M00000000" };

// 정보를 받은 뒤 가격을 '재확인'하는 공통 관문.
function useGate(onPass: () => void) {
  const [modal, setModal] = useState<"none" | "upsell" | "loading" | "pay" | "list">("none");
  const { order } = useStore();
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
  const start = () => (order?.site === "faretrap" ? setModal("upsell") : verify());
  const back = (notice: string) => goSellerList(notice);
  const fast = order?.extras.find((e) => e.id === "fast");
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
              <button className="o-pay small" onClick={() => { setExtra("fast", true); verify(); }}>추가하고 결제</button>
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

function PassengerCards({ filled, onFill }: { filled: boolean; onFill: () => void }) {
  const { order } = useStore();
  const count = travellers(order!.search);
  const v = (k: keyof typeof SAMPLE) => (filled ? SAMPLE[k] : "");
  return (
    <section className="o-card">
      <div className="o-card-head">
        <h2>연락처 및 탑승객 정보</h2>
        <button className="o-sample" onClick={onFill}>샘플 데이터 채우기</button>
      </div>
      <p className="o-muted">재현 데모라 직접 입력할 수 없습니다. 입력한 정보가 여권과 일치해야 합니다.</p>
      <div className="o-form">
        <label>이메일<input readOnly value={v("email")} /></label>
        <label>휴대전화 번호<input readOnly value={v("phone")} /></label>
      </div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <h3 className="o-pax-title">탑승객 {i + 1}</h3>
          <div className="o-form">
            <label>성<input readOnly value={v("last")} /></label>
            <label>이름<input readOnly value={v("first")} /></label>
            <label>생년월일<input readOnly value={v("birth")} /></label>
            <label>여권 번호<input readOnly value={v("passport")} /></label>
          </div>
        </div>
      ))}
      <Flag title="정보 먼저, 가격은 나중">민감한 여권 정보를 모두 받은 뒤에야 가격을 '재확인'합니다. 입력에 들인 수고 때문에 인상된 가격도 받아들이기 쉬워집니다.</Flag>
    </section>
  );
}

function ExtraRow({ id, note }: { id: string; note?: string }) {
  const { order } = useStore();
  const e = order?.extras.find((x) => x.id === id);
  if (!e) return null;
  return (
    <label className="o-extra">
      <input type="checkbox" checked={e.on} onChange={(ev) => setExtra(id, ev.target.checked)} />
      <span>{e.label}{note && <small>{note}</small>}</span>
      <b>{won(e.price)}/인</b>
    </label>
  );
}

function StageSkeleton({ stage }: { stage: Stage }) {
  return (
    <Shell stage={stage}>
      <main className="o-main o-grid" role="status" aria-label="불러오는 중">
        <div><CardSkeleton lines={3} /><CardSkeleton lines={4} /></div>
        <aside className="o-side"><Sk w="60%" h={18} /><Sk style={{ marginTop: 16 }} /><Sk w="70%" style={{ marginTop: 10 }} /><Sk w="50%" h={22} style={{ marginTop: 22 }} /></aside>
      </main>
    </Shell>
  );
}

// 1인당 가격만 크게 보여 주는 하단 고정 바.
function VoyBar({ label, onNext }: { label: string; onNext: () => void }) {
  const { order } = useStore();
  if (!order) return null;
  return (
    <div className="v-bar">
      <div className="v-bar-in">
        <span className="v-bar-label">{label}</span>
        <span className="v-bar-price"><b data-testid="total">{won(Math.round(order.fare / Math.max(1, seats(order.search))))}</b><small>성인 1인당 가격</small></span>
        <button className="o-pay small" onClick={onNext}>계속</button>
      </div>
    </div>
  );
}

export function TripSummary() {
  const { order } = useStore();
  const loading = useLoad(900);
  if (!order) return <Empty />;
  if (loading) return <StageSkeleton stage="summary" />;
  return (
    <Shell stage="summary" bottom={<VoyBar label="총 금액" onNext={() => go("/ota/passenger")} />}>
      <main className="o-main">
        <h1 className="v-title">{AIRPORTS[order.search.from]} → {AIRPORTS[order.search.to]}</h1>
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

export function Passenger() {
  const { order } = useStore();
  const f = flightOf(order);
  const site = useSite();
  const [filled, setFilled] = useState(false);
  const [error, setError] = useState("");
  const [viewers] = useState(() => 12 + Math.floor(Math.random() * 30));
  const gate = useGate(() => go("/ota/checkout"));
  const loading = useLoad(900);
  if (!order || !f) return <Empty />;
  if (loading) return <StageSkeleton stage="passenger" />;
  const next = () => {
    if (!filled) return setError("'샘플 데이터 채우기'를 먼저 눌러 주세요.");
    if (site === "pinefly") go("/ota/fare");
    else gate.start();
  };
  const lock = order.extras.find((e) => e.id === "lock");
  return (
    <Shell stage="passenger" bottom={site === "voyagate" ? <VoyBar label="총 금액" onNext={next} /> : undefined}>
      <main className={"o-main" + (site === "voyagate" ? "" : " o-grid")}>
        <div>
          {site !== "voyagate" && (
            <section className="o-card">
              <h2>{AIRPORTS[order.search.from]} {order.retId ? "⇄" : "→"} {AIRPORTS[order.search.to]}</h2>
              <FlightLines order={order} />
              {site === "faretrap" && (
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
          {site !== "pinefly" && (
            <section className="o-card">
              <h2>추가 서비스</h2>
              {order.extras.filter((e) => e.id !== "fast").map((e) => <ExtraRow key={e.id} id={e.id} />)}
              <Flag title="끼워팔기">유료 옵션이 미리 체크되어 있습니다. 직접 해제하지 않으면 결제 금액에 포함됩니다.</Flag>
            </section>
          )}
          {site !== "voyagate" && <button className="o-pay" onClick={next}>{site === "pinefly" ? "계속" : "결제하기"}</button>}
        </div>
        {site !== "voyagate" && <Summary />}
      </main>
      {gate.modals}
    </Shell>
  );
}

export function PineStep({ stage }: { stage: "fare" | "bags" | "seat" }) {
  const { order } = useStore();
  const gate = useGate(() => go("/ota/checkout"));
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
            if (stage === "fare") go("/ota/bags");
            else if (stage === "bags") go("/ota/seat");
            else gate.start();
          }}>계속</button>
        </div>
        <Summary />
      </main>
      {gate.modals}
    </Shell>
  );
}

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
  const { order } = useStore();
  const site = useSite();
  const seconds = SITES[site].timer;
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
              setTimeout(() => { paid.current = true; pay(); go("/ota/complete"); }, 1800);
            }}
          >
            {paying ? "결제 처리 중…" : `${won(total)} 지금 결제`}
          </button>
          <button className="o-leave" onClick={leaveToList}>결제하지 않고 나가기</button>
        </div>
        <Summary fees>
          <Flag title="숨은 요금">{`앞 단계에 없던 ${SITES[site].serviceLabel}가 마지막 결제 화면에서야 나타납니다. 처음 비교한 가격과 달라집니다.`}</Flag>
        </Summary>
      </main>
    </Shell>
  );
}

export function Complete() {
  const { order } = useStore();
  if (!order?.pnr) return <Empty />;
  return (
    <Shell stage="done">
      <main className="o-main">
        <section className="o-card o-center">
          <span className="ms ok">check_circle</span>
          <h2>결제가 완료되었습니다</h2>
          <p>예약번호 <b>{order.pnr}</b></p>
          <p className="o-muted">결제 금액 {won(order.paidTotal ?? 0)} · 전자티켓은 72시간 이내에 메일로 보내드립니다.</p>
          <Flag title="가짜 상품">이 시점에 실제 좌석은 확보되어 있지 않습니다. 결제부터 받고, 나중에 취소하거나 발권을 미룹니다.</Flag>
          <a className="o-link" href="#/mail">메일함 확인</a>
        </section>
      </main>
    </Shell>
  );
}

export function Gone() {
  const [left, setLeft] = useState(4);
  const loading = useLoad(1200);
  useEffect(() => {
    if (loading) return;
    if (left === 0) {
      goSellerList("선택하신 항공권은 이미 판매가 종료되었습니다.", getState().focusOrder);
      return;
    }
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left, loading]);
  if (loading) return <StageSkeleton stage="checkout" />;
  return (
    <Shell stage="checkout">
      <main className="o-main">
        <section className="o-card o-center">
          <span className="ms warn big">event_busy</span>
          <h2>죄송합니다. 이미 판매가 종료된 상품입니다</h2>
          <p className="o-muted">{left}초 뒤 다른 항공권 목록으로 이동합니다.</p>
          <Flag title="이탈 유도 메일">'원래 가격 그대로'라던 메일의 링크가 곧바로 판매 종료 화면으로 이어집니다. 사용자를 다시 불러들이는 미끼입니다.</Flag>
        </section>
      </main>
    </Shell>
  );
}

const BOT = "문의 내용이 접수되었습니다. 환불은 카드사 사정에 따라 영업일 기준 최대 30일이 소요될 수 있습니다. 추가 문의는 고객센터 메일로 보내 주세요.";

export function Support() {
  const site = useSite();
  const [log, setLog] = useState<{ me: boolean; text: string }[]>([{ me: false, text: `안녕하세요, ${SITES[site].name} AI 상담봇입니다. 무엇을 도와드릴까요?` }]);
  const loading = useLoad(800);
  const ask = (text: string) => {
    setLog((l) => [...l, { me: true, text }]);
    setTimeout(() => setLog((l) => [...l, { me: false, text: BOT }]), 900);
  };
  if (loading) return <StageSkeleton stage="done" />;
  return (
    <Shell stage="done">
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
    </Shell>
  );
}

type TicketStatus = "issuing" | "delayed" | "cancelled";

const STATUS_COPY: Record<TicketStatus, { label: string; desc: string; steps: [string, boolean][] }> = {
  issuing: {
    label: "발권 진행 중",
    desc: "결제가 확인되어 발권을 진행하고 있습니다. 전자티켓은 결제 후 72시간 이내에 발급됩니다.",
    steps: [["예약 접수", true], ["결제 확인", true], ["항공권 발권", false], ["전자티켓 발급", false]],
  },
  delayed: {
    label: "발권 지연",
    desc: "항공사 시스템 사정으로 발권이 지연되고 있습니다. 조금만 더 기다려 주세요.",
    steps: [["예약 접수", true], ["결제 확인", true], ["항공권 발권", false], ["전자티켓 발급", false]],
  },
  cancelled: {
    label: "예약 취소됨",
    desc: "좌석이 확보되지 않아 예약이 취소되었습니다. 환불은 영업일 기준 최대 30일이 소요됩니다.",
    steps: [["예약 접수", true], ["결제 확인", true], ["예약 취소", true]],
  },
};

export function Lookup() {
  const { order: current, focusOrder, mails } = useStore();
  const order = focusOrder ?? current;
  const f = flightOf(order);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  // 메일 속 주문은 발송 시점 값이므로, 현재 상태는 이후 도착한 메일로 판단한다.
  const related = mails.filter((m) => m.order.pnr && m.order.pnr === order?.pnr);
  const status: TicketStatus = related.some((m) => m.kind === "cancel") ? "cancelled" : related.some((m) => m.kind === "delay") ? "delayed" : "issuing";
  const copy = STATUS_COPY[status];
  return (
    <div className="l-page">
      <header className="l-head"><span className="ms">flight_takeoff</span>{f?.airline ?? "항공사"} 예약 조회</header>
      <main className="l-main">
        <label>예약번호<input readOnly value={order?.pnr ?? ""} /></label>
        <label>탑승객 성<input readOnly value={SAMPLE.last} /></label>
        <button disabled={state === "loading"} onClick={() => { setState("loading"); setTimeout(() => setState("done"), 1100); }}>{state === "loading" ? "조회 중…" : "조회"}</button>
        {state === "done" && !order?.pnr && <p className="l-none" role="alert">일치하는 예약을 찾을 수 없습니다.</p>}
        {state === "done" && order?.pnr && f && (
          <section className={`l-result ${status}`} aria-label="조회 결과" data-status={status}>
            <span className="l-badge">{copy.label}</span>
            <p>{copy.desc}</p>
            <ol className="l-steps">
              {copy.steps.map(([label, done]) => <li key={label} className={done ? "done" : ""}>{label}</li>)}
            </ol>
            <dl>
              <dt>항공편</dt><dd>{f.airline} {f.code} · {f.dep} → {f.arr}</dd>
              <dt>출발일</dt><dd>{dateLabel(order.search.date)}</dd>
              <dt>전자티켓 번호</dt><dd>{status === "cancelled" ? "발급되지 않음" : "발급 전"}</dd>
            </dl>
          </section>
        )}
        {state === "done" && order?.pnr && status === "issuing" && <Flag title="가짜 확정 메일">메일에는 '확정'이라고 쓰여 있지만 실제 상태는 발권 중이고 전자티켓 번호도 없습니다. '진행 중' 표시가 사용자를 안심시키는 사이 72시간의 취소 여지가 남습니다.</Flag>}
        {state === "done" && order?.pnr && status === "delayed" && <Flag title="가짜 확정 메일">약속한 72시간이 지나도 상태만 바뀔 뿐 전자티켓은 나오지 않습니다.</Flag>}
        {state === "done" && order?.pnr && status === "cancelled" && <Flag title="가짜 상품">조금 전까지 '발권 진행 중'이던 예약이 일방적으로 취소되었습니다. 전자티켓은 한 번도 발급되지 않았습니다.</Flag>}
      </main>
    </div>
  );
}
