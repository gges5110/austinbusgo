import { apiBase } from "config/config";

/**
 * Custom fetch used by every orval-generated hook. Prefixes the API base
 * (the edge cache worker in production, localhost in dev) and fails on
 * non-2xx responses so react-query surfaces errors.
 */
export const apiFetch = async <T>(
  url: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${apiBase}${url}`, init);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${url}`);
  }
  return response.json();
};
