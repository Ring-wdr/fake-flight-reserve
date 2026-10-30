import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { DemoPanel } from "../components/DemoPanel";
import { Phone } from "../components/Phone";
import { Toast } from "../components/Toast";

export function AppLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <div className="demo-banner">
        재현 데모입니다. 실제 판매·결제가 없고 입력 정보는 어디에도 전송되지 않습니다. 실제 정보를 입력하지 마세요.
      </div>
      <Outlet />
      <DemoPanel />
      <Phone />
      <Toast />
    </>
  );
}
