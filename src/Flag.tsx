import { useStore } from "./store";

// '수법 해설 표시'를 켰을 때만 보이는 주석.
export function Flag({ title, children, ok }: { title: string; children: string; ok?: boolean }) {
  const { annotate } = useStore();
  if (!annotate) return null;
  return (
    <div className={"flag" + (ok ? " flag-good" : "")} role="note">
      <b>{ok ? "정상" : "수법"}: {title}</b> {children}
    </div>
  );
}
