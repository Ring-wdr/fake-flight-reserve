import { Link } from "react-router-dom";
import { paths } from "../../app/paths";
import { Flag } from "../../components/Flag";
import { won } from "../../domain/flights";
import { checkoutTotal, flightOf, set, type Mail } from "../../state/store";

export function MailBody({ mail }: { mail: Mail }) {
  const order = mail.order;
  const f = flightOf(order);
  const focus = () => set({ focusOrder: mail.order });
  if (mail.kind === "lure")
    return (
      <div className="m-letter">
        <h2>{mail.from}</h2>
        <p>고객님, 결제를 완료하지 않으셨어요.</p>
        <p><b>지금 결제하시면 원래 가격 {won(order.fare)}으로 예약할 수 있습니다.</b> 좌석이 곧 마감됩니다.</p>
        {f && <p className="m-box">{f.airline} {f.code}<br />{f.dep} → {f.arr}</p>}
        <Link className="m-cta" onClick={focus} to={paths.gone(mail.site)}>원래 가격으로 결제하기</Link>
        <Flag title="이탈 유도 메일">결제 화면을 떠나면 자동으로 발송됩니다. 링크를 누르면 상품은 이미 사라져 있습니다.</Flag>
      </div>
    );
  if (mail.kind === "ticket")
    return (
      <div className="m-letter">
        <h2>{mail.from}</h2>
        <p>전자티켓이 <b>발급</b>되었습니다. 공항에서 이 번호나 여권을 제시해 주세요.</p>
        <p className="m-box">전자티켓 번호 {order.ticketNo}<br />예약번호 {order.pnr}<br />{f?.airline} {f?.code} · {f?.dep} → {f?.arr}<br />결제 금액 {won(order.paidTotal ?? 0)}</p>
        <Link className="m-cta" onClick={focus} to={paths.lookup}>항공사에서 예약 확인</Link>
        <Flag ok title="즉시 발권">결제 직후 전자티켓 번호를 받고, 항공사 조회에서도 같은 번호를 확인할 수 있습니다.</Flag>
      </div>
    );
  if (mail.kind === "receipt")
    return (
      <div className="m-letter">
        <h2>{mail.from}</h2>
        <p>예약이 <b>확정</b>되었습니다.</p>
        <p className="m-box">예약번호 {order?.pnr}<br />{f?.airline} {f?.code} · {f?.dep} → {f?.arr}<br />결제 금액 {order ? won(order.paidTotal ?? checkoutTotal(order)) : ""}</p>
        <p className="m-small">전자티켓은 결제 후 72시간 이내에 발권됩니다.</p>
        <Link className="m-cta" onClick={focus} to={paths.lookup}>항공사에서 예약 확인</Link>
        <Flag title="가짜 확정 메일">'확정'이라고 쓰여 있지만 아직 발권되지 않았습니다. 작은 글씨의 72시간은 그동안 취소할 여지를 남겨 둡니다.</Flag>
      </div>
    );
  if (mail.kind === "cancel")
    return (
      <div className="m-letter">
        <h2>{mail.from}</h2>
        <p>항공사 사정으로 좌석이 확보되지 않아 예약번호 <b>{order?.pnr}</b>이(가) 취소되었습니다.</p>
        <p>결제 금액 {order ? won(order.paidTotal ?? 0) : ""}은 카드사 사정에 따라 <b>영업일 기준 최대 30일</b> 이내에 환불됩니다.</p>
        <Link className="m-cta" onClick={focus} to={paths.support(mail.site)}>고객센터 문의</Link>
        <Flag title="가짜 상품">결제 2~3시간 뒤 일방적으로 취소됩니다. 그 사이 항공권 가격은 올랐을 가능성이 높고, 돈은 최대 30일 묶입니다.</Flag>
      </div>
    );
  return (
    <div className="m-letter">
      <h2>{mail.from}</h2>
      <p>예약번호 <b>{order?.pnr}</b>의 발권이 항공사 시스템 사정으로 지연되고 있습니다.</p>
      <p>약속한 72시간이 지났지만 전자티켓은 아직 발급되지 않았습니다. 조금만 더 기다려 주세요.</p>
      <Link className="m-cta" onClick={focus} to={paths.support(mail.site)}>고객센터 문의</Link>
      <Flag title="가짜 확정 메일">출발이 가까워질수록 다른 항공권 가격은 오르고, 사용자는 '곧 된다'는 말을 믿고 기다리게 됩니다.</Flag>
    </div>
  );
}
