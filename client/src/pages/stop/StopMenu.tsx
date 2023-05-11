import { useNavigate, useSearchParams } from "react-router-dom";
import * as React from "react";
import { StopInfoAndArrivalTimes } from "../../components/Stop/StopInfoAndArrivalTimes/StopInfoAndArrivalTimes";
import { useTitle } from "../../hooks/UseTitle";
import { client, useDataFromLoader } from "../../Router";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  StopDocument,
  StopQuery,
  StopQueryVariables,
} from "../../schemas/Stop.generated";
import { MenuPanel } from "../../components/MenuPanel";

interface StopMenuProps {
  hideBackButton?: boolean;
}

export const stopLoader = async ({ params }: LoaderFunctionArgs) => {
  const stopId = params["stopId"];
  return await client.query<StopQuery, StopQueryVariables>({
    query: StopDocument,
    variables: {
      stopId: stopId || "0",
    },
  });
};
export const StopMenu: React.FC<StopMenuProps> = ({ hideBackButton }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    data: { stop },
  } = useDataFromLoader(stopLoader);
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
