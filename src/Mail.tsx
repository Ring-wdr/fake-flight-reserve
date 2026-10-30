import { useEffect } from "react";
import { BRAND } from "./brand";
import { won } from "./data";
import { Flag } from "./Flag";
import { TopBar, useLoad } from "./Skeleton";
import { checkoutTotal, flightOf, fmtTime, getState, go, set, useStore, type Mail } from "./store";

const FILLER = [
  { from: "여행 뉴스레터", subject: "이번 주 인기 여행지 5곳", preview: "겨울 여행 준비, 지금 시작하세요." },
  { from: "은행 알림", subject: "10월 카드 이용 내역 안내", preview: "이번 달 이용 내역을 확인하세요." },
];

function Body({ mail }: { mail: Mail }) {
  const order = mail.order;
  const f = flightOf(order);
  const focus = () => set({ site: mail.site, focusOrder: mail.order });
  if (mail.kind === "lure")
    return (
      <div className="m-letter">
        <h2>{mail.from}</h2>
        <p>고객님, 결제를 완료하지 않으셨어요.</p>
        <p><b>지금 결제하시면 원래 가격 {won(order.fare)}으로 예약할 수 있습니다.</b> 좌석이 곧 마감됩니다.</p>
        {f && <p className="m-box">{f.airline} {f.code}<br />{f.dep} → {f.arr}</p>}
        <a className="m-cta" onClick={focus} href="#/ota/gone">원래 가격으로 결제하기</a>
        <Flag title="이탈 유도 메일">결제 화면을 떠나면 자동으로 발송됩니다. 링크를 누르면 상품은 이미 사라져 있습니다.</Flag>
      </div>
    );
  if (mail.kind === "ticket")
    return (
      <div className="m-letter">
        <h2>{mail.from}</h2>
        <p>전자티켓이 <b>발급</b>되었습니다. 공항에서 이 번호나 여권을 제시해 주세요.</p>
        <p className="m-box">전자티켓 번호 {order.ticketNo}<br />예약번호 {order.pnr}<br />{f?.airline} {f?.code} · {f?.dep} → {f?.arr}<br />결제 금액 {won(order.paidTotal ?? 0)}</p>
        <a className="m-cta" onClick={focus} href="#/ota/lookup">항공사에서 예약 확인</a>
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
        <a className="m-cta" onClick={focus} href="#/ota/lookup">항공사에서 예약 확인</a>
        <Flag title="가짜 확정 메일">'확정'이라고 쓰여 있지만 아직 발권되지 않았습니다. 작은 글씨의 72시간은 그동안 취소할 여지를 남겨 둡니다.</Flag>
      </div>
    );
  if (mail.kind === "cancel")
    return (
      <div className="m-letter">
        <h2>{mail.from}</h2>
        <p>항공사 사정으로 좌석이 확보되지 않아 예약번호 <b>{order?.pnr}</b>이(가) 취소되었습니다.</p>
        <p>결제 금액 {order ? won(order.paidTotal ?? 0) : ""}은 카드사 사정에 따라 <b>영업일 기준 최대 30일</b> 이내에 환불됩니다.</p>
        <a className="m-cta" onClick={focus} href="#/ota/support">고객센터 문의</a>
        <Flag title="가짜 상품">결제 2~3시간 뒤 일방적으로 취소됩니다. 그 사이 항공권 가격은 올랐을 가능성이 높고, 돈은 최대 30일 묶입니다.</Flag>
      </div>
    );
  return (
    <div className="m-letter">
      <h2>{mail.from}</h2>
      <p>예약번호 <b>{order?.pnr}</b>의 발권이 항공사 시스템 사정으로 지연되고 있습니다.</p>
      <p>약속한 72시간이 지났지만 전자티켓은 아직 발급되지 않았습니다. 조금만 더 기다려 주세요.</p>
      <a className="m-cta" onClick={focus} href="#/ota/support">고객센터 문의</a>
      <Flag title="가짜 확정 메일">출발이 가까워질수록 다른 항공권 가격은 오르고, 사용자는 '곧 된다'는 말을 믿고 기다리게 됩니다.</Flag>
    </div>
  );
}

function Rail() {
  const { mails } = useStore();
  const unread = mails.filter((m) => !m.read).length;
  return (
    <nav className="m-rail">
      <button className="m-compose"><span className="ms">edit</span>편지 쓰기</button>
      <a className="on" href="#/mail"><span className="ms">inbox</span>받은편지함{unread > 0 && <b>{unread}</b>}</a>
      <a><span className="ms">star</span>별표편지함</a>
      <a><span className="ms">schedule</span>다시 알림</a>
      <a><span className="ms">send</span>보낸편지함</a>
      <a><span className="ms">draft</span>임시보관함</a>
    </nav>
  );
}

export function MailApp({ id }: { id?: string }) {
  const { mails, now } = useStore();
  const mail = mails.find((m) => m.id === id);
  // 앱에 처음 들어올 때의 로딩 화면과 메일을 열 때의 얇은 진행 표시.
  const booting = useLoad(1300);
  const opening = useLoad(350, id);
  useEffect(() => {
    if (mail && !mail.read) set({ mails: getState().mails.map((m) => (m.id === mail.id ? { ...m, read: true } : m)) });
  }, [mail?.id]);
  if (booting)
    return (
      <div className="m-boot" role="status" aria-label="메일 불러오는 중">
        <span className="ms">mail</span>
        <b>{BRAND.mail}</b>
        <i><u /></i>
      </div>
    );
  return (
    <div className="m-page">
      {opening && <TopBar />}
      <header className="m-head">
        <button className="icon-btn" aria-label="메뉴"><span className="ms">menu</span></button>
        <a className="m-logo" href="#/mail"><span className="ms">mail</span>{BRAND.mail}</a>
        <div className="m-search"><span className="ms">search</span>메일 검색</div>
        <span className="g-grow" />
        <button className="icon-btn" aria-label="도움말"><span className="ms">help</span></button>
        <button className="icon-btn" aria-label="설정"><span className="ms">settings</span></button>
        <span className="m-avatar">나</span>
      </header>
      <div className="m-body">
        <Rail />
        <main className="m-main">
          {mail ? (
            <article className="m-read">
              <div className="m-tools">
                <button className="icon-btn" onClick={() => go("/mail")} aria-label="목록으로"><span className="ms">arrow_back</span></button>
                <button className="icon-btn" aria-label="보관"><span className="ms">archive</span></button>
                <button className="icon-btn" aria-label="삭제"><span className="ms">delete</span></button>
              </div>
              <h1>{mail.subject}</h1>
              <div className="m-sender">
                <span className="m-avatar alt">{mail.from[0]}</span>
                <div><b>{mail.from}</b> <small>&lt;{mail.addr}&gt;</small><br /><small>나에게</small></div>
                <time>{fmtTime(mail.at)}</time>
              </div>
              <Body mail={mail} />
            </article>
          ) : (
            <>
              <div className="m-tabs">
                <span className="on"><span className="ms">inbox</span>기본</span>
                <span><span className="ms">sell</span>프로모션</span>
                <span><span className="ms">group</span>소셜</span>
              </div>
              <ul className="m-list">
                {mails.map((m) => (
                  <li key={m.id} className={m.read ? "" : "unread"}>
                    <a href={`#/mail/${m.id}`}>
                      <span className="ms m-star">star</span>
                      <span className="m-from">{m.from}</span>
                      <span className="m-subj"><b>{m.subject}</b> <small>- {m.preview}</small></span>
                      <time>{fmtTime(m.at)}</time>
                    </a>
                  </li>
                ))}
                {FILLER.map((m) => (
                  <li key={m.subject}>
                    <a>
                      <span className="ms m-star">star</span>
                      <span className="m-from">{m.from}</span>
                      <span className="m-subj"><b>{m.subject}</b> <small>- {m.preview}</small></span>
                      <time>{new Date(now - 86_400_000).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</time>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
