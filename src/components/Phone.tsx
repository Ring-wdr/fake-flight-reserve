import { BRAND } from "../sites/brand";
import { fmtTime, set, useStore } from "../state/store";

export function Phone() {
  const s = useStore();
  if (!s.phoneOpen) return null;
  return (
    <aside className="phone" aria-label="휴대폰 문자">
      <div className="phone-bar">
        <span>{fmtTime(s.now)}</span>
        <button className="icon-btn" onClick={() => set({ phoneOpen: false })} aria-label="휴대폰 닫기">
          <span className="ms">close</span>
        </button>
      </div>
      <h3>{BRAND.payApp} 알림</h3>
      {s.sms.length === 0 && <p className="phone-empty">받은 문자가 없습니다.</p>}
      {s.sms.map((m) => (
        <div className="bubble" key={m.id}>
          {m.body}
          <time>{fmtTime(m.at)}</time>
        </div>
      ))}
    </aside>
  );
}
