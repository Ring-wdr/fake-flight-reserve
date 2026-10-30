import { useEffect, useState } from "react";
import { Flag } from "../../components/Flag";
import { useLoad } from "../../components/Skeleton";
import { getState, goSellerList } from "../../state/store";
import { Shell, StageSkeleton } from "./Shell";
import { useSite } from "./SiteLayout";

export function Gone() {
  const site = useSite();
  const [left, setLeft] = useState(4);
  const loading = useLoad(1200);
  useEffect(() => {
    if (loading) return;
    if (left === 0) {
      goSellerList(site.id, "선택하신 항공권은 이미 판매가 종료되었습니다.", getState().focusOrder);
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
