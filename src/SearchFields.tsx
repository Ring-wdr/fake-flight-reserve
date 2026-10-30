import { useState } from "react";
import { AIRPORTS, CABINS, travellers, type Cabin, type Search } from "./data";

// 메타 검색과 판매사 자체 목록이 함께 쓰는 검색 입력.
function Counter({ label, sub, value, min, max, onChange }: { label: string; sub: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="g-count">
      <span>{label}<small>{sub}</small></span>
      <button aria-label={`${label} 줄이기`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <b aria-label={`${label} ${value}명`}>{value}</b>
      <button aria-label={`${label} 늘리기`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function PaxPicker({ search, onChange }: { search: Search; onChange: (s: Search) => void }) {
  const [open, setOpen] = useState(false);
  const room = 9 - travellers(search);
  return (
    <div className="g-pax">
      <button className="g-opt" aria-expanded={open} aria-label={`승객 ${travellers(search)}명, 승객 수 변경`} onClick={() => setOpen(!open)}>
        <span className="ms">person</span>{travellers(search)}<span className="ms sm">arrow_drop_down</span>
      </button>
      {open && <div className="g-pax-back" onClick={() => setOpen(false)} />}
      {open && (
        <div className="g-pax-pop" role="dialog" aria-label="승객 수 선택">
          <Counter label="성인" sub="12세 이상" value={search.adults} min={1} max={search.adults + room}
            onChange={(n) => onChange({ ...search, adults: n, infants: Math.min(search.infants, n) })} />
          <Counter label="어린이" sub="2~11세" value={search.children} min={0} max={search.children + room}
            onChange={(n) => onChange({ ...search, children: n })} />
          <Counter label="유아" sub="2세 미만, 성인 1명당 1명" value={search.infants} min={0} max={Math.min(search.adults, search.infants + room)}
            onChange={(n) => onChange({ ...search, infants: n })} />
          <button className="g-pax-done" onClick={() => setOpen(false)}>완료</button>
        </div>
      )}
    </div>
  );
}

export function SearchFields({ search, onChange }: { search: Search; onChange: (s: Search) => void }) {
  return (
    <div className="g-search">
      <div className="g-opts">
        <label className="g-opt">
          <span className="ms">{search.trip === "round" ? "sync_alt" : "east"}</span>
          <select aria-label="여정 유형" value={search.trip} onChange={(e) => onChange({ ...search, trip: e.target.value as Search["trip"] })}>
            <option value="round">왕복</option>
            <option value="oneway">편도</option>
          </select>
        </label>
        <PaxPicker search={search} onChange={onChange} />
        <label className="g-opt">
          <select aria-label="좌석 등급" value={search.cabin} onChange={(e) => onChange({ ...search, cabin: e.target.value as Cabin })}>
            {Object.entries(CABINS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      </div>
      <div className="g-fields">
        <label className="g-field">
          <span className="ms">radio_button_unchecked</span>
          <select aria-label="출발지" value={search.from} onChange={(e) => onChange({ ...search, from: e.target.value })}>
            {Object.entries(AIRPORTS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
          </select>
        </label>
        <button className="g-swap" aria-label="출발지와 목적지 바꾸기" onClick={() => onChange({ ...search, from: search.to, to: search.from })}>
          <span className="ms">swap_horiz</span>
        </button>
        <label className="g-field">
          <span className="ms">location_on</span>
          <select aria-label="목적지" value={search.to} onChange={(e) => onChange({ ...search, to: e.target.value })}>
            {Object.entries(AIRPORTS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
          </select>
        </label>
        <label className="g-field g-date">
          <span className="ms">calendar_month</span>
          <input aria-label="출발일" type="date" value={search.date}
            onChange={(e) => e.target.value && onChange({ ...search, date: e.target.value, returnDate: search.returnDate < e.target.value ? e.target.value : search.returnDate })} />
        </label>
        {search.trip === "round" && (
          <label className="g-field g-date">
            <span className="ms">calendar_month</span>
            <input aria-label="돌아오는 날" type="date" min={search.date} value={search.returnDate}
              onChange={(e) => e.target.value && onChange({ ...search, returnDate: e.target.value })} />
          </label>
        )}
      </div>
    </div>
  );
}
