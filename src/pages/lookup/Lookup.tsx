import { useState } from "react";
import { Flag } from "../../components/Flag";
import { dateLabel } from "../../domain/flights";
import { flightOf, useStore } from "../../state/store";
import { SAMPLE } from "../seller/parts";

type TicketStatus = "issuing" | "delayed" | "cancelled" | "ticketed";

const STATUS_COPY: Record<TicketStatus, { label: string; desc: string; steps: [string, boolean][] }> = {
  ticketed: {
    label: "발권 완료",
    desc: "항공권이 발권되었습니다. 전자티켓 번호로 탑승 수속을 할 수 있습니다.",
    steps: [["예약 접수", true], ["결제 확인", true], ["항공권 발권", true], ["전자티켓 발급", true]],
  },
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
  const status: TicketStatus = order?.ticketNo ? "ticketed" : related.some((m) => m.kind === "cancel") ? "cancelled" : related.some((m) => m.kind === "delay") ? "delayed" : "issuing";
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
              <dt>전자티켓 번호</dt><dd>{order.ticketNo ?? (status === "cancelled" ? "발급되지 않음" : "발급 전")}</dd>
            </dl>
          </section>
        )}
        {state === "done" && order?.pnr && status === "ticketed" && <Flag ok title="즉시 발권">메일과 항공사 조회의 전자티켓 번호가 같고, 상태도 시간이 지나도 바뀌지 않습니다.</Flag>}
        {state === "done" && order?.pnr && status === "issuing" && <Flag title="가짜 확정 메일">메일에는 '확정'이라고 쓰여 있지만 실제 상태는 발권 중이고 전자티켓 번호도 없습니다. '진행 중' 표시가 사용자를 안심시키는 사이 72시간의 취소 여지가 남습니다.</Flag>}
        {state === "done" && order?.pnr && status === "delayed" && <Flag title="가짜 확정 메일">약속한 72시간이 지나도 상태만 바뀔 뿐 전자티켓은 나오지 않습니다.</Flag>}
        {state === "done" && order?.pnr && status === "cancelled" && <Flag title="가짜 상품">조금 전까지 '발권 진행 중'이던 예약이 일방적으로 취소되었습니다. 전자티켓은 한 번도 발급되지 않았습니다.</Flag>}
      </main>
    </div>
  );
}
