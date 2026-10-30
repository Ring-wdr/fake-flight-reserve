import type { Flight } from "../../domain/flights";

export function Tail({ f }: { f: Flight }) {
  return <span className="g-tail" style={{ color: f.color }} aria-hidden><span className="ms">flight</span></span>;
}
