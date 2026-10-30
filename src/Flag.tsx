import { useStore } from "./store";

// '수법 해설 표시'를 켰을 때만 보이는 주석.
export function Flag({ title, children }: { title: string; children: string }) {
  const { annotate } = useStore();
  if (!annotate) return null;
  return (
    <div className="flag" role="note">
      <b>수법: {title}</b> {children}
    </div>
  );
}
