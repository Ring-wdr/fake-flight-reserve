import { Link } from "react-router-dom";
import { paths } from "../../app/paths";
import { BRAND } from "../../sites/brand";

export function Header() {
  return (
    <header className="g-head">
      <button className="icon-btn" aria-label="메뉴"><span className="ms">menu</span></button>
      <Link className="g-logo" to={paths.home}>{BRAND.search}</Link>
      <nav className="g-nav">
        <a><span className="ms">travel_explore</span>살펴보기</a>
        <Link className="on" to={paths.home}><span className="ms">flight</span>항공편</Link>
        <a><span className="ms">bed</span>호텔</a>
      </nav>
      <span className="g-grow" />
      <button className="icon-btn" aria-label="앱"><span className="ms">apps</span></button>
      <button className="g-login">로그인</button>
    </header>
  );
}
