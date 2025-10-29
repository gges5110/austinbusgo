import { debounce } from "@mui/material";
import { ViewState } from "features/map/components/Map";
import { useCallback, useEffect } from "react";
import { useNavigate, useNavigation } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

const convertViewStateToPath = (viewState: ViewState) => {
  return `/@${parseFloat(viewState.latitude.toFixed(7))},${parseFloat(
    viewState.longitude.toFixed(7)
  )},${parseFloat(viewState.zoom.toFixed(2))}z`;
};

const buildPathWithViewState = (
  restOfPathname: string,
  viewStatePath: string,
  searchParams: string
) => {
  let path = restOfPathname === "/" ? "" : restOfPathname;
  path += viewStatePath;
  if (searchParams) {
    path += searchParams;
  }
  return path;
};

export const useUpdateViewState = () => {
  const { latitude, longitude, zoom, searchParams, restOfPathname } =
    useViewStatePathname();
  const getViewStateURL = (viewState: Partial<ViewState>) => {
    const viewStatePath = convertViewStateToPath({
      latitude: viewState.latitude || latitude,
      longitude: viewState.longitude || longitude,
      zoom: viewState.zoom || zoom,
    });

    return buildPathWithViewState(restOfPathname, viewStatePath, searchParams);
  };

  return { getViewStateURL };
};

export const useViewStateSync = (viewState: ViewState) => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { viewStatePathname, searchParams, restOfPathname } =
    useViewStatePathname();

  useEffect(() => {
    if (viewStatePathname === "") {
      const path = buildPathWithViewState(
        restOfPathname,
        convertViewStateToPath(viewState),
        searchParams
      );

      // hack to prevent navigation from failing on component mount
      setTimeout(() => {
        navigate(path);
      });
    }
  }, []);

  const setViewStateInUrl = useCallback(
    debounce((viewState: ViewState) => {
      const path = buildPathWithViewState(
        restOfPathname,
        convertViewStateToPath(viewState),
        searchParams
      );

      if (navigation.location === undefined) {
        navigate(path, { replace: true });
      }
    }, 50),
    [location.pathname, navigation.location, restOfPathname, searchParams]
  );

  return { setViewStateInUrl };
};
