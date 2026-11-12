import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, test } from "vitest";

import { useDeferredStart } from "./LazyMap";

// Real timers: React Query delivers "fetching changed" through a
// timer-then-promise chain that fake timers don't flush inside act()
const setup = (queryClient: QueryClient, maxDelayMs: number) => {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useDeferredStart(maxDelayMs), { wrapper });
};

const pendingQuery = (queryClient: QueryClient) => {
  let finish: (value: string) => void = () => undefined;
  void queryClient.fetchQuery({
    queryKey: ["arrivals"],
    queryFn: () => new Promise<string>((resolve) => (finish = resolve)),
  });
  return () => finish("done");
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("useDeferredStart", () => {
  test("starts right after the first render when nothing is loading", async () => {
    const { result } = setup(new QueryClient(), 5000);
    expect(result.current).toBe(false);

    await waitFor(() => expect(result.current).toBe(true), { timeout: 500 });
  });

  test("waits for the page's queries to finish", async () => {
    const queryClient = new QueryClient();
    const finish = pendingQuery(queryClient);
    const { result } = setup(queryClient, 5000);

    await act(() => sleep(300));
    expect(result.current).toBe(false);

    await act(async () => finish());
    await waitFor(() => expect(result.current).toBe(true), { timeout: 500 });
  });

  test("starts at the cap even if a request never finishes", async () => {
    const queryClient = new QueryClient();
    pendingQuery(queryClient);
    const { result } = setup(queryClient, 300);

    await act(() => sleep(150));
    expect(result.current).toBe(false);

    await waitFor(() => expect(result.current).toBe(true), { timeout: 500 });
  });
});
