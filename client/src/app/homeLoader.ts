import { LoaderFunctionArgs, redirect } from "react-router-dom";

// Keep in sync with theme.breakpoints.down("sm")
const PHONE_MAX_WIDTH = 600;

/**
 * Phones land on Nearby ("I'm at a stop"). A loader rather than a component
 * so it runs before the map mounts and starts writing its view state into
 * the URL. Only the bare "/" redirects; "/@lat,lon,zoom" (Explore) doesn't.
 */
export const homeLoader = () =>
  window.innerWidth < PHONE_MAX_WIDTH ? redirect("/nearby") : null;

/** Short link for stop signs and sharing: /s/1002 → that stop, pinned. */
export const shortLinkLoader = ({ params }: LoaderFunctionArgs) =>
  redirect(`/nearby/stop/${encodeURIComponent(params.stopId ?? "")}`);
