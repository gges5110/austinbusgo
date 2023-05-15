import { Stop } from "../../interfaces/interface.d";
import { useEffect, useState } from "react";
import {
  NearByStopsQueryVariables,
  useNearByStopsQuery,
} from "../../schemas/NearByStops.generated";
import { Coordinate, ViewState } from "../../components/Map/Map";
import { useAtom } from "jotai";
import { nearByStopsAtom } from "../../Atoms";

export const useNearByStops = (viewState: ViewState, stops: Stop[]) => {
  const [nearByStopsVariables, setNearByStopsVariables] = useState<
    NearByStopsQueryVariables | undefined
  >();
  const [nearByStops, setNearByStops] = useAtom(nearByStopsAtom);
  const { isFetching } = useNearByStopsQuery(
    nearByStopsVariables as NearByStopsQueryVariables,
    {
      enabled: nearByStopsVariables !== undefined,
      onSuccess: (data) => {
        const stopIds = stops.map((stop) => stop.stopId);
        const filteredNearByStops = data.nearByStops.filter(
          (stop) => !stopIds.includes(stop.stopId)
        );
        setNearByStops(filteredNearByStops);
        setNearByStopsVariables(undefined);
        setNearByStopsCoordinate([viewState.latitude, viewState.longitude]);
        setShowNearByStopsButton(false);
      },
    }
  );

  const [nearByStopsCoordinate, setNearByStopsCoordinate] = useState<
    Coordinate | undefined
  >(undefined);

  useEffect(() => {
    if (nearByStopsCoordinate === undefined) {
      setNearByStopsCoordinate([viewState.latitude, viewState.longitude]);
    }
  }, [viewState, nearByStopsCoordinate]);

  const [showNearByStopsButton, setShowNearByStopsButton] = useState(true);

  useEffect(() => {
    if (!showNearByStopsButton && nearByStopsCoordinate) {
      if (
        Math.abs(nearByStopsCoordinate[0] - viewState.latitude) > 0.03 ||
        Math.abs(nearByStopsCoordinate[1] - viewState.longitude) > 0.03
      ) {
        setShowNearByStopsButton(true);
      }
    }
  }, [showNearByStopsButton, nearByStopsCoordinate, viewState]);

  const fetchNearByStops = () => {
    setNearByStopsVariables({
      lat: parseFloat(viewState.latitude.toFixed(7)),
      lon: parseFloat(viewState.longitude.toFixed(7)),
    });
  };

  return {
    nearByStops,
    showNearByStopsButton,
    fetchNearByStops,
    isLoading: isFetching,
  };
};
