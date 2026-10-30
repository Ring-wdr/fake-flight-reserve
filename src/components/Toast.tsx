import { useEffect } from "react";
import { go } from "../app/navigation";
import { set, useStore } from "../state/store";

export function Toast() {
  const { toast } = useStore();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => set({ toast: null }), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <button
      className="toast"
      onClick={() => {
        if (toast.href) go(toast.href);
        set({ toast: null });
      }}
    >
      <b>{toast.title}</b>
      <span>{toast.body}</span>
    </button>
  );
}
