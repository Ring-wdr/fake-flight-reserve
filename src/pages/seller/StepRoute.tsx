import { Navigate, useParams } from "react-router-dom";
import { paths } from "../../app/paths";
import type { FlowStep } from "../../sites";
import { useSite } from "./SiteLayout";
import { Options } from "./steps/Options";
import { Passenger } from "./steps/Passenger";
import { TripSummary } from "./steps/TripSummary";

const STEP_PAGES: Record<FlowStep, () => JSX.Element> = {
  summary: TripSummary,
  passenger: Passenger,
  fare: () => <Options step="fare" />,
  bags: () => <Options step="bags" />,
  seat: () => <Options step="seat" />,
};

// 판매처 flow에 없는 단계로 들어오면 첫 단계로 돌려보낸다.
export function StepRoute() {
  const { step } = useParams();
  const site = useSite();
  if (!site.flow.includes(step as FlowStep)) return <Navigate to={paths.step(site.id, site.flow[0])} replace />;
  const Page = STEP_PAGES[step as FlowStep];
  return <Page key={step} />;
}
