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

  // Merges preserved params (e.g. buses=1) with any additional query params.
  // Pass a URLSearchParams or plain object of extra params to include.
  const withPreservedSearch = (extra?: Record<string, string>): string => {
    const sp = new URLSearchParams(location.search);
    const kept = new URLSearchParams();
    if (sp.get("buses") === "1") kept.set("buses", "1");
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        kept.set(k, v);
      }
    }
    const s = kept.toString();
    return s ? `?${s}` : "";
  };

  return {
    viewStatePathname,
    latitude,
    longitude,
    zoom,
    restOfPathname,
    searchParams: location.search,
    isBasePath,
    withPreservedSearch,
  };
};
