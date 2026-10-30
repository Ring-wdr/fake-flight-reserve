import { go } from "../../app/navigation";
import { paths } from "../../app/paths";
import { SearchFields } from "../../components/SearchFields";
import { set, useStore } from "../../state/store";
import { Header } from "./Header";

export function Home() {
  const { search } = useStore();
  return (
    <div className="g-page">
      <Header />
      <section className="g-hero">
        <div className="g-sky" aria-hidden><span className="ms">flight_takeoff</span></div>
        <h1>항공편</h1>
      </section>
      <main className="g-main">
        <SearchFields search={search} onChange={(s) => set({ search: s })} />
        <div className="g-center">
          <button className="g-explore" onClick={() => go(paths.results)}>
            <span className="ms">search</span>검색
          </button>
        </div>
      </main>
    </div>
  );
}
