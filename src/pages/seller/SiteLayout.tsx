import { createContext, useContext } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { paths } from "../../app/paths";
import { SITES, type SiteConfig } from "../../sites";
import { useStore } from "../../state/store";

const SiteContext = createContext<SiteConfig | null>(null);

export const useSite = () => useContext(SiteContext)!;

// 지금 보는 판매처의 주문만 돌려준다. 다른 판매처 주문이 화면에 섞이지 않게 한다.
export function useSiteOrder() {
  const { order } = useStore();
  const site = useSite();
  return order?.site === site.id ? order : null;
}

export function SiteLayout() {
  const { siteId } = useParams();
  const site = siteId ? SITES[siteId] : undefined;
  if (!site) return <Navigate to={paths.home} replace />;
  return (
    <SiteContext.Provider value={site}>
      <Outlet />
    </SiteContext.Provider>
  );
}
