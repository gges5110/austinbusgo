export const useViewStatePathname = () => {
  // TODO: convert this to non hook
  const location = window.location;
  const re = /(.*?)(\/@[-0-9.]+,[-0-9.]+,[0-9.]+z)?$/;
  const restOfPathname = location.pathname.match(re)?.[1] || "";
  const viewStatePathname = location.pathname.match(re)?.[2] || "";

  const latlonzoomre = /^\/@([-0-9.]+),([-0-9.]+),([0-9.]+)z$/;
  const viewStateMatch = viewStatePathname.match(latlonzoomre);
  const latitude = viewStateMatch?.[1] ? Number(viewStateMatch[1]) : 0;
  const longitude = viewStateMatch?.[2] ? Number(viewStateMatch[2]) : 0;
  const zoom = viewStateMatch?.[3] ? Number(viewStateMatch[3]) : 0;
  const isBasePath = restOfPathname === "" || restOfPathname === "/";

  return {
    viewStatePathname,
    latitude,
    longitude,
    zoom,
    restOfPathname,
    searchParams: location.search,
    isBasePath,
  };
};
