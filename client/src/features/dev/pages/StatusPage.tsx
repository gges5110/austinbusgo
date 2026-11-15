import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  backendCheck,
  CheckResult,
  edgeCacheCheck,
  eventsCheck,
  fetchStatus,
  Level,
  proxyCheck,
  realtimeCheck,
  scheduleCheck,
  webAnalyticsCheck,
} from "features/dev/status/checks";
import * as React from "react";
import { useTitle } from "shared/hooks/UseTitle";

const REFRESH_MS = 30_000;
const KEY = "status-page";

const COLORS: Record<Level, string> = {
  ok: "success.main",
  warn: "warning.main",
  down: "error.main",
  off: "text.disabled",
};

const LABELS: Record<Level, string> = {
  ok: "OK",
  warn: "Degraded",
  down: "Down",
  off: "Off",
};

interface CheckCardProps {
  /** What it is and what breaks for riders when it's down */
  description: string;
  error?: unknown;
  loading: boolean;
  result?: CheckResult;
  title: string;
}

const CheckCard: React.FC<CheckCardProps> = ({
  description,
  error,
  loading,
  result,
  title,
}) => {
  const level: Level | undefined = error ? "down" : result?.level;
  const summary = error
    ? `Request failed: ${error instanceof Error ? error.message : String(error)}`
    : (result?.summary ?? (loading ? "Checking…" : ""));
  return (
    <Card variant={"outlined"}>
      <CardContent>
        <Stack direction={"row"} spacing={1} sx={{ alignItems: "center" }}>
          <Box
            aria-hidden={true}
            sx={{
              bgcolor: level ? COLORS[level] : "text.disabled",
              borderRadius: "50%",
              flexShrink: 0,
              height: 12,
              width: 12,
            }}
          />
          <Typography component={"h2"} sx={{ flex: 1 }} variant={"subtitle1"}>
            {title}
          </Typography>
          {level && (
            <Typography
              sx={{ color: COLORS[level], fontWeight: 600 }}
              variant={"body2"}
            >
              {LABELS[level]}
            </Typography>
          )}
        </Stack>
        <Typography sx={{ mt: 1 }} variant={"body2"}>
          {summary}
        </Typography>
        {!error && result && result.details.length > 0 && (
          <Box
            component={"dl"}
            sx={{
              columnGap: 2,
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              mb: 0,
              mt: 1,
              rowGap: 0.25,
              "& dd": { m: 0, overflowWrap: "anywhere" },
            }}
          >
            {result.details.map(([label, value]) => (
              <React.Fragment key={label}>
                <Typography
                  color={"text.secondary"}
                  component={"dt"}
                  variant={"caption"}
                >
                  {label}
                </Typography>
                <Typography component={"dd"} variant={"caption"}>
                  {value}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
        )}
        <Typography
          color={"text.secondary"}
          sx={{ display: "block", mt: 1 }}
          variant={"caption"}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

const useCheck = (name: string, check: () => Promise<CheckResult>) =>
  useQuery({
    queryKey: [KEY, name],
    queryFn: check,
    refetchInterval: REFRESH_MS,
    retry: false,
  });

/**
 * Everything the site depends on, checked live from this browser: the
 * backend and the CapMetro feeds it reads, the Cloudflare workers, the
 * schedule's expiry, and whether this browser blocks analytics.
 */
export const StatusPage: React.FC = () => {
  useTitle("Status - Austin Bus Go");
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: [KEY, "backend"],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_MS,
    retry: false,
  });
  const edgeCache = useCheck("edge-cache", edgeCacheCheck);
  const proxy = useCheck("proxy", proxyCheck);
  const events = useCheck("events", () => eventsCheck());
  const analytics = useCheck("analytics", () => webAnalyticsCheck());

  const backendData = status.data;
  const feeds = backendData?.status.realtime ?? [];
  const feed = (name: string) => feeds.find((item) => item.name === name);
  const at = backendData?.status.now ?? Date.now() / 1000;

  const cards: CheckCardProps[] = [
    {
      title: "CapMetro arrival predictions",
      description:
        "GTFS-RT trip updates from data.texas.gov, read by the backend. Down: Nearby and stop pages fall back to scheduled times.",
      error: status.error,
      loading: status.isLoading,
      result: feed("tripUpdates") && realtimeCheck(feed("tripUpdates")!, at),
    },
    {
      title: "CapMetro bus locations",
      description:
        "GTFS-RT vehicle positions from data.texas.gov, read by the backend. Down: no buses on the map.",
      error: status.error,
      loading: status.isLoading,
      result:
        feed("vehiclePositions") &&
        realtimeCheck(feed("vehiclePositions")!, at),
    },
    {
      title: "Backend (Cloud Run)",
      description:
        "The API server, called directly here. Down: nothing loads. Slow right after idle is a cold start.",
      error: status.error,
      loading: status.isLoading,
      result: backendData && backendCheck(backendData.status, backendData.ms),
    },
    {
      title: "Edge cache worker",
      description:
        "Cloudflare worker in front of the backend that every API call goes through. Down: nothing loads.",
      error: edgeCache.error,
      loading: edgeCache.isLoading,
      result: edgeCache.data,
    },
    {
      title: "Bus schedule (GTFS)",
      description:
        "CapMetro's static schedule, baked into the backend image; checked nightly for a new one. Expired: no scheduled times.",
      error: status.error,
      loading: status.isLoading,
      result: backendData && scheduleCheck(backendData.status),
    },
    {
      title: "GTFS-RT proxy worker",
      description:
        "Cloudflare worker relaying the CapMetro feed to browsers. Only the /dev pages use it.",
      error: proxy.error,
      loading: proxy.isLoading,
      result: proxy.data,
    },
    {
      title: "Rider events worker",
      description:
        "Records anonymous rider events (Workers Analytics Engine). Down or blocked: those visits go uncounted.",
      error: events.error,
      loading: events.isLoading,
      result: events.data,
    },
    {
      title: "Cloudflare Web Analytics",
      description:
        "Page view counts. Blocked: this browser's visits go uncounted.",
      error: analytics.error,
      loading: analytics.isLoading,
      result: analytics.data,
    },
  ];

  const levels = cards
    .map((card) => (card.error ? "down" : card.result?.level))
    .filter((level): level is Level => !!level);
  const overall = levels.includes("down")
    ? "Something is down"
    : levels.includes("warn")
      ? "Something is degraded"
      : levels.length > 0
        ? "Everything looks fine"
        : "Checking…";

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", py: 2 }}>
      <Stack direction={"row"} spacing={1} sx={{ alignItems: "center", mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography component={"h1"} variant={"h5"}>
            {overall}
          </Typography>
          <Typography color={"text.secondary"} variant={"body2"}>
            Checked from this browser
            {status.dataUpdatedAt
              ? ` at ${new Date(status.dataUpdatedAt).toLocaleTimeString()}`
              : ""}
            ; refreshes every 30 seconds
          </Typography>
        </Box>
        <Tooltip title={"Check again"}>
          <IconButton
            aria-label={"Check again"}
            onClick={() => queryClient.invalidateQueries({ queryKey: [KEY] })}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack spacing={1.5}>
        {cards.map((card) => (
          <CheckCard key={card.title} {...card} />
        ))}
      </Stack>
    </Box>
  );
};
