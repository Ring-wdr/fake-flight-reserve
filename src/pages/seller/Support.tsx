import { useState } from "react";
import { Flag } from "../../components/Flag";
import { useLoad } from "../../components/Skeleton";
import { Shell, StageSkeleton } from "./Shell";
import { useSite } from "./SiteLayout";

const HONEST_REPLIES: Record<string, string> = {
  "상담원 연결해 주세요": "상담원에게 연결합니다. 현재 예상 대기 시간은 2분입니다.",
  "환불은 언제 되나요?": "항공사 환불 규정에 따라 처리되며, 취소를 접수하면 처리 일정을 메일로 안내해 드립니다.",
  "왜 취소됐나요?": "고객님의 예약에는 취소 내역이 없습니다. 전자티켓은 정상적으로 유효합니다.",
};

const BOT = "문의 내용이 접수되었습니다. 환불은 카드사 사정에 따라 영업일 기준 최대 30일이 소요될 수 있습니다. 추가 문의는 고객센터 메일로 보내 주세요.";

export function Support() {
  const site = useSite();
  const [log, setLog] = useState<{ me: boolean; text: string }[]>([{ me: false, text: `안녕하세요, ${site.name} AI 상담봇입니다. 무엇을 도와드릴까요?` }]);
  const loading = useLoad(800);
  const ask = (text: string) => {
    setLog((l) => [...l, { me: true, text }]);
    setTimeout(() => setLog((l) => [...l, { me: false, text: site.honest ? HONEST_REPLIES[text] : BOT }]), 900);
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
          {site.honest && <Flag ok title="상담 연결">질문에 맞는 답을 주고 상담원 연결 경로가 있습니다.</Flag>}
          {!site.honest && <Flag title="환불·상담 지연">어떤 질문에도 같은 답을 반복합니다. 상담원 연결 경로가 없고, 환불 기한은 '최대'라는 말로 늘어납니다.</Flag>}
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
