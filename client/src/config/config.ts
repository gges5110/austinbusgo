export const apiBase =
  import.meta.env.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : "";

// The Cloud Run backend, called directly (not through the edge cache) by
// the status page to see its own latency. Local dev: the local backend.
const CLOUD_RUN_ORIGIN =
  "https://austinbusgo-backend-761140212463.us-central1.run.app";

export const backendOrigin = apiBase.includes("localhost")
  ? apiBase
  : CLOUD_RUN_ORIGIN;
