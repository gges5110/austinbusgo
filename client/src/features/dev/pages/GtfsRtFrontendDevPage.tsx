/**
 * POC: Frontend-only GTFS Realtime
 *
 * Demonstrates fetching and decoding CapMetro GTFS-RT protobuf feeds
 * directly in the browser using gtfs-realtime-bindings — no backend required.
 */

import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import {
  useGtfsRtTripUpdates,
  useGtfsRtVehiclePositions,
} from "shared/hooks/useGtfsRtFrontend";
import {
  TripUpdate,
  VehiclePosition,
  VehicleStopStatus,
} from "shared/types/interface.d";

dayjs.extend(relativeTime);

// ─── helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status?: VehicleStopStatus | null): string {
  switch (status) {
    case VehicleStopStatus.IncomingAt:
      return "Incoming";
    case VehicleStopStatus.StoppedAt:
      return "Stopped";
    case VehicleStopStatus.InTransitTo:
      return "In Transit";
    default:
      return "Unknown";
  }
}

function statusColor(
  status?: VehicleStopStatus | null
): "warning" | "error" | "success" | "default" {
  switch (status) {
    case VehicleStopStatus.IncomingAt:
      return "warning";
    case VehicleStopStatus.StoppedAt:
      return "error";
    case VehicleStopStatus.InTransitTo:
      return "success";
    default:
      return "default";
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

const VehicleRow: React.FC<{ vp: VehiclePosition }> = ({ vp }) => (
  <TableRow>
    <TableCell>
      <Chip label={vp.trip?.routeId ?? "—"} size={"small"} />
    </TableCell>
    <TableCell>{vp.vehicle?.id ?? "—"}</TableCell>
    <TableCell>{vp.vehicle?.label ?? "—"}</TableCell>
    <TableCell>{vp.trip?.tripId ?? "—"}</TableCell>
    <TableCell>{vp.stopId ?? "—"}</TableCell>
    <TableCell>
      <Chip
        color={statusColor(vp.currentStatus)}
        label={statusLabel(vp.currentStatus)}
        size={"small"}
      />
    </TableCell>
    <TableCell>
      {vp.position
        ? `${vp.position.latitude.toFixed(4)}, ${vp.position.longitude.toFixed(4)}`
        : "—"}
    </TableCell>
    <TableCell>
      {vp.timestamp ? dayjs.unix(vp.timestamp).fromNow() : "—"}
    </TableCell>
  </TableRow>
);

const TripUpdateRow: React.FC<{ tu: TripUpdate }> = ({ tu }) => {
  const nextStop = tu.stopTimeUpdate[0];
  const arrivalSec = nextStop?.arrival?.time ?? nextStop?.departure?.time;
  const delay = nextStop?.arrival?.delay ?? nextStop?.departure?.delay;

  return (
    <TableRow>
      <TableCell>{tu.trip?.routeId ?? "—"}</TableCell>
      <TableCell>{tu.trip?.tripId ?? "—"}</TableCell>
      <TableCell>{tu.vehicle?.id ?? "—"}</TableCell>
      <TableCell>{nextStop?.stopId ?? "—"}</TableCell>
      <TableCell>
        {arrivalSec ? dayjs.unix(arrivalSec).format("h:mm:ss A") : "—"}
      </TableCell>
      <TableCell>
        {delay != null ? (
          <Chip
            color={delay === 0 ? "success" : delay > 0 ? "error" : "warning"}
            label={
              delay === 0
                ? "On time"
                : delay > 0
                  ? `+${delay}s late`
                  : `${Math.abs(delay)}s early`
            }
            size={"small"}
          />
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>{tu.stopTimeUpdate.length}</TableCell>
      <TableCell>
        {tu.timestamp ? dayjs.unix(tu.timestamp).fromNow() : "—"}
      </TableCell>
    </TableRow>
  );
};

// ─── main page ────────────────────────────────────────────────────────────────

export const GtfsRtFrontendDevPage: React.FC = () => {
  const [routeFilter, setRouteFilter] = React.useState("");

  const {
    data: vehicles,
    error: vehiclesError,
    isFetching: vehiclesFetching,
    refetch: refetchVehicles,
    dataUpdatedAt: vehiclesUpdatedAt,
  } = useGtfsRtVehiclePositions();

  const {
    data: tripUpdates,
    error: tripUpdatesError,
    isFetching: tripUpdatesFetching,
    refetch: refetchTripUpdates,
    dataUpdatedAt: tripUpdatesUpdatedAt,
  } = useGtfsRtTripUpdates();

  const filteredVehicles = React.useMemo(() => {
    const vps = vehicles ?? [];
    if (!routeFilter) return vps;
    return vps.filter((vp) => vp.trip?.routeId === routeFilter);
  }, [vehicles, routeFilter]);

  // Filter client-side so typing in the filter doesn't refetch the feed
  const filteredTripUpdates = React.useMemo(() => {
    const tus = tripUpdates ?? [];
    if (!routeFilter) return tus;
    return tus.filter((tu) => tu.trip?.routeId === routeFilter);
  }, [tripUpdates, routeFilter]);

  return (
    <Box sx={{ p: 3 }}>
      {/* ── header ── */}
      <Typography gutterBottom={true} variant={"h4"}>
        GTFS-RT Frontend POC
      </Typography>
      <Typography color={"text.secondary"} sx={{ mb: 2 }} variant={"body2"}>
        Vehicle positions and trip updates fetched and decoded entirely in the
        browser using <strong>gtfs-realtime-bindings</strong> — no backend
        server involved. Data auto-refreshes every 15 s.
      </Typography>

      <Alert severity={"info"} sx={{ mb: 3 }}>
        <AlertTitle>How it works</AlertTitle>
        The browser fetches the raw protobuf binary from{" "}
        <code>data.texas.gov</code> and decodes it using{" "}
        <code>gtfs-realtime-bindings</code> (a protobufjs wrapper). The decoded
        objects are then mapped to the same TypeScript types used by the
        existing GraphQL-backed components, so the data can be dropped in as a
        direct replacement.
      </Alert>

      {/* ── route filter ── */}
      <TextField
        label={"Filter by Route ID"}
        onChange={(e) => setRouteFilter(e.target.value.trim())}
        placeholder={"e.g. 1, 10, 801"}
        size={"small"}
        sx={{ mb: 3, width: 220 }}
        value={routeFilter}
      />

      {/* ── vehicle positions ── */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant={"h6"}>Vehicle Positions</Typography>
              <Typography color={"text.secondary"} variant={"caption"}>
                {vehiclesFetching
                  ? "Fetching…"
                  : `${filteredVehicles.length} vehicle${filteredVehicles.length !== 1 ? "s" : ""}${routeFilter ? ` on route ${routeFilter}` : ""} · updated ${vehiclesUpdatedAt ? dayjs(vehiclesUpdatedAt).fromNow() : "—"}`}
              </Typography>
            </Box>
            <Tooltip title={"Refresh vehicle positions"}>
              <IconButton onClick={() => refetchVehicles()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {vehiclesError ? (
            <Alert severity={"error"} sx={{ mt: 2 }}>
              <AlertTitle>Failed to load vehicle positions</AlertTitle>
              {String(vehiclesError)}
              <br />
              <Typography variant={"caption"}>
                If this is a CORS error, the feed host does not allow
                cross-origin requests. A transparent proxy (e.g. a Cloudflare
                Worker) would be needed in that case.
              </Typography>
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size={"small"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Route</TableCell>
                    <TableCell>Vehicle ID</TableCell>
                    <TableCell>Label</TableCell>
                    <TableCell>Trip ID</TableCell>
                    <TableCell>Stop ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Position (lat, lon)</TableCell>
                    <TableCell>Last Update</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell align={"center"} colSpan={8}>
                        <Typography color={"text.secondary"} sx={{ py: 2 }}>
                          {vehiclesFetching ? "Loading…" : "No vehicles found"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vp, i) => (
                      <VehicleRow
                        key={`${vp.trip?.tripId ?? i}-${vp.vehicle?.id ?? i}`}
                        vp={vp}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ mb: 4 }} />

      {/* ── trip updates ── */}
      <Card>
        <CardContent>
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant={"h6"}>Trip Updates</Typography>
              <Typography color={"text.secondary"} variant={"caption"}>
                {tripUpdatesFetching
                  ? "Fetching…"
                  : `${filteredTripUpdates.length} trip update${filteredTripUpdates.length !== 1 ? "s" : ""}${routeFilter ? ` for route ${routeFilter}` : ""} · updated ${tripUpdatesUpdatedAt ? dayjs(tripUpdatesUpdatedAt).fromNow() : "—"}`}
              </Typography>
            </Box>
            <Tooltip title={"Refresh trip updates"}>
              <IconButton onClick={() => refetchTripUpdates()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {tripUpdatesError ? (
            <Alert severity={"error"} sx={{ mt: 2 }}>
              <AlertTitle>Failed to load trip updates</AlertTitle>
              {String(tripUpdatesError)}
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size={"small"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Route</TableCell>
                    <TableCell>Trip ID</TableCell>
                    <TableCell>Vehicle ID</TableCell>
                    <TableCell>Next Stop</TableCell>
                    <TableCell>Arrival</TableCell>
                    <TableCell>Delay</TableCell>
                    <TableCell>Stop Updates</TableCell>
                    <TableCell>Feed Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTripUpdates.length === 0 ? (
                    <TableRow>
                      <TableCell align={"center"} colSpan={8}>
                        <Typography color={"text.secondary"} sx={{ py: 2 }}>
                          {tripUpdatesFetching
                            ? "Loading…"
                            : "No trip updates found"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTripUpdates.map((tu, i) => (
                      <TripUpdateRow
                        key={`${tu.trip?.tripId ?? i}-${tu.vehicle?.id ?? i}`}
                        tu={tu}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
