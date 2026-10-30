import { createHashRouter, Navigate } from "react-router-dom";
import { Booking } from "../pages/flights/Booking";
import { Home } from "../pages/flights/Home";
import { Results } from "../pages/flights/Results";
import { Lookup } from "../pages/lookup/Lookup";
import { MailApp } from "../pages/mail/MailApp";
import { Checkout } from "../pages/seller/Checkout";
import { Complete } from "../pages/seller/Complete";
import { Enter } from "../pages/seller/Enter";
import { Gone } from "../pages/seller/Gone";
import { SellerList } from "../pages/seller/SellerList";
import { SiteLayout } from "../pages/seller/SiteLayout";
import { StepRoute } from "../pages/seller/StepRoute";
import { Support } from "../pages/seller/Support";
import { AppLayout } from "./AppLayout";
import { bindNavigate } from "./navigation";

// 판매처를 추가해도 이 표는 바뀌지 않는다. siteId와 step은 판매처 설정으로 검증한다.
export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "results", element: <Results /> },
      { path: "booking/:outId/:retId?", element: <Booking /> },
      { path: "mail/:mailId?", element: <MailApp /> },
      { path: "lookup", element: <Lookup /> },
      {
        path: "sites/:siteId",
        element: <SiteLayout />,
        children: [
          { index: true, element: <Navigate to="list" replace /> },
          { path: "enter", element: <Enter /> },
          { path: "list", element: <SellerList /> },
          { path: "book/:step", element: <StepRoute /> },
          { path: "checkout", element: <Checkout /> },
          { path: "complete", element: <Complete /> },
          { path: "gone", element: <Gone /> },
          { path: "support", element: <Support /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

bindNavigate((to) => void router.navigate(to));
