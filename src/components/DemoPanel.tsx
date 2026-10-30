import { useState } from "react";
import { go } from "../app/navigation";
import { paths } from "../app/paths";
import { advance, fmtTime, reset, SCENARIOS, set, useStore, type Scenario } from "../state/store";

export function DemoPanel() {
  const s = useStore();
  // 좁은 화면에서는 패널이 버튼을 가리지 않도록 접어서 시작한다.
  const [open, setOpen] = useState(() => innerWidth > 1100);
  if (!open)
    return (
      <button className="panel-fab" onClick={() => setOpen(true)} aria-label="재현 패널 열기">
        <span className="ms">tune</span>
      </button>
    );
  const pending = s.scheduled.length;
  return (
    <aside className="panel" aria-label="재현 패널">
      <div className="panel-head">
        <b>재현 패널</b>
        <span className="panel-clock">{fmtTime(s.now)}</span>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="재현 패널 접기">
          <span className="ms">close</span>
        </button>
      </div>
      <label className="panel-label" htmlFor="scenario">시나리오</label>
      <select
        id="scenario"
        value={s.scenario}
        onChange={(e) => {
          set({ scenario: e.target.value as Scenario });
          reset();
        }}
      >
        {SCENARIOS.map((x) => (
          <option key={x.id} value={x.id}>{x.label}</option>
        ))}
      </select>
      <p className="panel-hint">{SCENARIOS.find((x) => x.id === s.scenario)?.hint}</p>
      <label className="panel-check">
        <input type="checkbox" checked={s.annotate} onChange={(e) => set({ annotate: e.target.checked })} />
        수법 해설 표시
      </label>
      <div className="panel-label">시간 건너뛰기{pending > 0 && <em> · 대기 중인 알림 {pending}건</em>}</div>
      <div className="panel-row">
        <button onClick={() => advance(15 * 60_000)}>+15분</button>
        <button onClick={() => advance(3 * 3_600_000)}>+3시간</button>
        <button onClick={() => advance(3 * 86_400_000 + 3_600_000)}>+3일</button>
      </div>
      <div className="panel-row">
        <button onClick={() => go(paths.home)}>항공편</button>
        <button onClick={() => go(paths.mail())}>
          메일{s.mails.some((m) => !m.read) && <i className="dot" />}
        </button>
        <button onClick={() => set({ phoneOpen: !s.phoneOpen })}>휴대폰</button>
      </div>
      <button className="panel-reset" onClick={reset}>처음부터</button>
    </aside>
  );
}
