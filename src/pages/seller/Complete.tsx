import { Link } from "react-router-dom";
import { paths } from "../../app/paths";
import { Flag } from "../../components/Flag";
import { won } from "../../domain/flights";
import { Empty, Shell } from "./Shell";
import { useSiteOrder } from "./SiteLayout";

export function Complete() {
  const order = useSiteOrder();
  if (!order?.pnr) return <Empty />;
  return (
    <Shell stage="done">
      <main className="o-main">
        <section className="o-card o-center">
          <span className="ms ok">check_circle</span>
          <h2>결제가 완료되었습니다</h2>
          <p>예약번호 <b>{order.pnr}</b></p>
          {order.ticketNo ? (
            <>
              <p>전자티켓 번호 <b data-testid="ticket-no">{order.ticketNo}</b></p>
              <p className="o-muted">결제 금액 {won(order.paidTotal ?? 0)} · 전자티켓이 발급되어 메일로 발송되었습니다.</p>
              <Flag ok title="즉시 발권">결제 직후 전자티켓이 발급됩니다. 나중에 취소되거나 발권이 미뤄지지 않습니다.</Flag>
            </>
          ) : (
            <>
              <p className="o-muted">결제 금액 {won(order.paidTotal ?? 0)} · 전자티켓은 72시간 이내에 메일로 보내드립니다.</p>
              <Flag title="가짜 상품">이 시점에 실제 좌석은 확보되어 있지 않습니다. 결제부터 받고, 나중에 취소하거나 발권을 미룹니다.</Flag>
            </>
          )}
          <Link className="o-link" to={paths.mail()}>메일함 확인</Link>
        </section>
      </main>
    </Shell>
  );
}
