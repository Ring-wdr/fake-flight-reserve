import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { go } from "../../app/navigation";
import { paths } from "../../app/paths";
import { TopBar, useLoad } from "../../components/Skeleton";
import { BRAND } from "../../sites/brand";
import { fmtTime, getState, set, useStore } from "../../state/store";
import { MailBody } from "./MailBody";

const FILLER = [
  { from: "여행 뉴스레터", subject: "이번 주 인기 여행지 5곳", preview: "겨울 여행 준비, 지금 시작하세요." },
  { from: "은행 알림", subject: "10월 카드 이용 내역 안내", preview: "이번 달 이용 내역을 확인하세요." },
];

function Rail() {
  const { mails } = useStore();
  const unread = mails.filter((m) => !m.read).length;
  return (
    <nav className="m-rail">
      <button className="m-compose"><span className="ms">edit</span>편지 쓰기</button>
      <Link className="on" to={paths.mail()}><span className="ms">inbox</span>받은편지함{unread > 0 && <b>{unread}</b>}</Link>
      <a><span className="ms">star</span>별표편지함</a>
      <a><span className="ms">schedule</span>다시 알림</a>
      <a><span className="ms">send</span>보낸편지함</a>
      <a><span className="ms">draft</span>임시보관함</a>
    </nav>
  );
}

export function MailApp() {
  const { mailId: id } = useParams();
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
        <Link className="m-logo" to={paths.mail()}><span className="ms">mail</span>{BRAND.mail}</Link>
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
                <button className="icon-btn" onClick={() => go(paths.mail())} aria-label="목록으로"><span className="ms">arrow_back</span></button>
                <button className="icon-btn" aria-label="보관"><span className="ms">archive</span></button>
                <button className="icon-btn" aria-label="삭제"><span className="ms">delete</span></button>
              </div>
              <h1>{mail.subject}</h1>
              <div className="m-sender">
                <span className="m-avatar alt">{mail.from[0]}</span>
                <div><b>{mail.from}</b> <small>&lt;{mail.addr}&gt;</small><br /><small>나에게</small></div>
                <time>{fmtTime(mail.at)}</time>
              </div>
              <MailBody mail={mail} />
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
                    <Link to={paths.mail(m.id)}>
                      <span className="ms m-star">star</span>
                      <span className="m-from">{m.from}</span>
                      <span className="m-subj"><b>{m.subject}</b> <small>- {m.preview}</small></span>
                      <time>{fmtTime(m.at)}</time>
                    </Link>
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
