/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
  /** Cloudflare Web Analytics site token; analytics are off when unset */
  readonly VITE_CF_ANALYTICS_TOKEN?: string;
  /** rider-events worker endpoint (…/e); rider events are off when unset */
  readonly VITE_EVENTS_URL?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
