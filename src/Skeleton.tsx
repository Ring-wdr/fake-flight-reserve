import { useEffect, useState, type CSSProperties } from "react";

// 실제 서비스처럼 매번 조금씩 다른 시간 동안 로딩한다. key가 바뀌면 다시 불러온다.
export function useLoad(ms: number, key?: unknown) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms * (0.8 + Math.random() * 0.5));
    return () => clearTimeout(t);
  }, [key]);
  return loading;
}

export const Sk = ({ w = "100%", h = 14, r = 4, style }: { w?: number | string; h?: number; r?: number; style?: CSSProperties }) => (
  <span className="sk" aria-hidden style={{ width: w, height: h, borderRadius: r, ...style }} />
);

export const TopBar = () => <div className="top-bar" role="progressbar" aria-label="불러오는 중" />;

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <section className="o-card" aria-hidden>
      <Sk w="40%" h={22} />
      {Array.from({ length: lines }, (_, i) => (
        <Sk key={i} w={`${92 - i * 14}%`} style={{ marginTop: 14 }} />
      ))}
    </section>
  );
}
