import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { paths } from "../../app/paths";
import { CardSkeleton, Sk } from "../../components/Skeleton";
import type { FlowStep } from "../../sites";
import { leaveToList } from "../../state/store";
import { useSite } from "./SiteLayout";

export type Stage = FlowStep | "list" | "checkout" | "done";

const STEP_LABELS: Record<FlowStep, string> = {
  summary: "여정 요약",
  passenger: "탑승객 세부정보",
  fare: "티켓 요금",
  bags: "수하물",
  seat: "좌석",
};

function Progress({ stage }: { stage: Stage }) {
  const site = useSite();
  const paying = stage === "checkout" || stage === "done";
  if (site.header === "steps")
    return null;
  if (site.header === "wizard") {
    if (stage === "list") return null;
    const total = site.flow.length + 1;
    const current = paying ? total : Math.max(1, site.flow.indexOf(stage as FlowStep) + 1);
    return <p className="v-step">단계 {current}/{total}</p>;
  }
  const steps: [string, string][] = [["list", "검색"], ...site.flow.map((s): [string, string] => [s, STEP_LABELS[s]]), ["checkout", "요약 & 결제"]];
  const cur = steps.findIndex(([k]) => k === (stage === "done" ? "checkout" : stage));
  return (
    <ol className="p-steps">
      {steps.map(([k, label], i) => (
        <li key={k} className={i < cur ? "done" : i === cur ? "on" : ""}><i>{i < cur ? "✓" : i + 1}</i><span>{label}</span></li>
      ))}
    </ol>
  );
}

export function Logo() {
  const site = useSite();
  return <>{site.logoIcon && <span className="ms">{site.logoIcon}</span>}{site.logoText}</>;
}

export function Shell({ stage, children, bottom }: { stage: Stage; children: ReactNode; bottom?: ReactNode }) {
  const site = useSite();
  const paying = stage === "checkout" || stage === "done";
  const toList = (e: MouseEvent) => {
    e.preventDefault();
    leaveToList(site.id);
  };
  return (
    <div className={`o-page site-${site.id}`}>
      <header className="o-head">
        <a className="o-logo" href={`#${paths.list(site.id)}`} onClick={toList}><Logo /></a>
        {site.header === "steps" && (
          <ol className="o-steps">
            <li className={paying ? "" : "on"}><i>1</i>항공편 정보</li>
            <li className={paying ? "on" : ""}><i>2</i>결제</li>
          </ol>
        )}
        <span className="g-grow" />
        <Link className="o-help" to={paths.support(site.id)}>{site.helpLabel}</Link>
        {site.header === "wizard" && <span className="o-help">내 예약</span>}
      </header>
      <Progress stage={stage} />
      {children}
      {site.footer && <p className="v-foot">{site.footer}</p>}
      {bottom}
    </div>
  );
}

export function Empty() {
  return (
    <Shell stage="passenger">
      <main className="o-main"><div className="o-card"><p>진행 중인 예약이 없습니다.</p><Link className="o-link" to={paths.home}>항공편 검색으로</Link></div></main>
    </Shell>
  );
}

export function StageSkeleton({ stage }: { stage: Stage }) {
  return (
    <Shell stage={stage}>
      <main className="o-main o-grid" role="status" aria-label="불러오는 중">
        <div><CardSkeleton lines={3} /><CardSkeleton lines={4} /></div>
        <aside className="o-side"><Sk w="60%" h={18} /><Sk style={{ marginTop: 16 }} /><Sk w="70%" style={{ marginTop: 10 }} /><Sk w="50%" h={22} style={{ marginTop: 22 }} /></aside>
      </main>
    </Shell>
  );
}
