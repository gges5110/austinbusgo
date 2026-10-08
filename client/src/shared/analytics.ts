const BEACON_URL = "https://static.cloudflareinsights.com/beacon.min.js";

/**
 * Cloudflare Web Analytics: page views, referrers and Core Web Vitals,
 * without cookies (so no consent banner).
 *
 * Only runs in production builds that have a token (the
 * CF_ANALYTICS_TOKEN repository variable, passed to the build as
 * VITE_CF_ANALYTICS_TOKEN); local dev and PR previews send nothing. The
 * token is a public site identifier, not a secret. `spa: true` counts
 * client-side route changes as page views.
 */
export const initAnalytics = (
  token: string | undefined = import.meta.env.VITE_CF_ANALYTICS_TOKEN,
  isProduction: boolean = import.meta.env.PROD
) => {
  if (!token || !isProduction) return false;
  const script = document.createElement("script");
  script.defer = true;
  script.src = BEACON_URL;
  script.dataset.cfBeacon = JSON.stringify({ token, spa: true });
  document.head.appendChild(script);
  return true;
};
