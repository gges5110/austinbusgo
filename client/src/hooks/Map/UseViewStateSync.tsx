import { useNavigate, useNavigation } from "react-router-dom";
import { useViewStatePathname } from "../UseViewStatePathname";
import { useCallback, useEffect } from "react";
import { debounce } from "@mui/material";
import { ViewState } from "../../components/Map/Map";

const convertViewStateToPath = (viewState: ViewState) => {
  return `/@${parseFloat(viewState.latitude.toFixed(7))},${parseFloat(
    viewState.longitude.toFixed(7)
  )},${parseFloat(viewState.zoom.toFixed(2))}z`;
};

export const useViewStateSync = (viewState: ViewState) => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const {
    viewStatePathname,
    searchParams,
    restOfPathname,
  } = useViewStatePathname();

  useEffect(() => {
    if (viewStatePathname === "") {
      const path = convertViewStateToPath(viewState) + searchParams;

      // hack to prevent navigation from failing on component mount
      setTimeout(() => {
        navigate(path);
      });
    }
  }, []);

  const setViewStateInUrl = useCallback(
    debounce((viewState: ViewState) => {
      let path = convertViewStateToPath(viewState);
      if (restOfPathname !== "" && restOfPathname !== undefined) {
        path += restOfPathname + searchParams;
      }

      if (navigation.location === undefined) {
        navigate(path, { replace: true });
      }
    }, 50),
    [location.pathname, navigation.location, restOfPathname, searchParams]
  );

  return { setViewStateInUrl };
};
