import { useNavigate, useSearchParams } from "react-router-dom";
import * as React from "react";
import { StopInfoAndArrivalTimes } from "../../components/Stop/StopInfoAndArrivalTimes/StopInfoAndArrivalTimes";
import { useTitle } from "../../hooks/UseTitle";
import { useDataFromLoader } from "../../Router";
import { MenuPanel } from "../../components/MenuPanel";
import { stopLoader } from "./StopLoader";

interface StopMenuProps {
  hideBackButton?: boolean;
}

export const StopMenu: React.FC<StopMenuProps> = ({ hideBackButton }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stopData = useDataFromLoader(stopLoader);
  const stop = stopData.stop;
  useTitle(`${stop.stopName} - Austin Bus Go`);

  const onBack = () => {
    navigate(-1);
  };

  return (
    <MenuPanel>
      <StopInfoAndArrivalTimes
        stop={stop}
        routeId={searchParams.get("routeId") || ""}
        onBack={onBack}
        hideBackButton={hideBackButton}
      />
    </MenuPanel>
  );
};
