import { useLocation } from "react-router-dom";

export const useViewStatePathname = () => {
  const location = useLocation();
  const re = /^(\/@[-0-9.]+,[-0-9.]+,[0-9.]+z)(.*)/;
  const viewStatePathname = location.pathname.match(re)?.[1] || "";

  const latlonzoomre = /^\/@([-0-9.]+),([-0-9.]+),([0-9.]+)z$/;
  const viewStateMatch = viewStatePathname.match(latlonzoomre);
  const latitude = viewStateMatch?.[1] ? Number(viewStateMatch[1]) : 0;
  const longitude = viewStateMatch?.[2] ? Number(viewStateMatch[2]) : 0;
  const zoom = viewStateMatch?.[3] ? Number(viewStateMatch[3]) : 0;

  return { viewStatePathname, latitude, longitude, zoom };
};
