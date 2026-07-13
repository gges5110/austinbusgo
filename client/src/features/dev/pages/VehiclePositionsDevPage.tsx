import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { useRoutes, useVehiclePositions } from "shared/api/generated/api";
import { VehiclePosition, VehicleStopStatus } from "shared/types/interface.d";

dayjs.extend(relativeTime);

const VehiclePositionRow: React.FC<{
  vehiclePosition: VehiclePosition;
  routeColor: string;
  routeId: string;
}> = ({ vehiclePosition, routeColor, routeId }) => {
  const getStatusLabel = (status?: VehicleStopStatus | null) => {
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
  };

  const getStatusColor = (status?: VehicleStopStatus | null) => {
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
  };

  return (
    <TableRow>
      <TableCell>
        <Chip
          label={routeId}
          size={"small"}
          sx={{ backgroundColor: `#${routeColor}`, color: "white" }}
        />
      </TableCell>
      <TableCell>{vehiclePosition.vehicle?.id || "N/A"}</TableCell>
      <TableCell>{vehiclePosition.vehicle?.label || "N/A"}</TableCell>
      <TableCell>{vehiclePosition.trip?.tripId || "N/A"}</TableCell>
      <TableCell>
        {vehiclePosition.stopId ? (
          <Link
            component={RouterLink}
            to={`/map/stop/${vehiclePosition.stopId}`}
            underline={"hover"}
          >
            {vehiclePosition.stopId}
          </Link>
        ) : (
          "N/A"
        )}
      </TableCell>
      <TableCell>{vehiclePosition.currentStopSequence || "N/A"}</TableCell>
      <TableCell>
        <Chip
          color={getStatusColor(vehiclePosition?.currentStatus)}
          label={getStatusLabel(vehiclePosition?.currentStatus)}
          size={"small"}
        />
      </TableCell>
      <TableCell>
        {vehiclePosition.position
          ? `${vehiclePosition.position.latitude.toFixed(
              4
            )}, ${vehiclePosition.position.longitude.toFixed(4)}`
          : "N/A"}
      </TableCell>
      <TableCell>
        {vehiclePosition.timestamp
          ? dayjs.unix(vehiclePosition.timestamp).fromNow()
          : "N/A"}
      </TableCell>
    </TableRow>
  );
};

type Order = "asc" | "desc";
type OrderBy =
  | "route"
  | "vehicleId"
  | "label"
  | "tripId"
  | "stopId"
  | "stopSeq"
  | "status"
  | "timestamp";

export const VehiclePositionsDevPage: React.FC = () => {
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<OrderBy>("route");

  const { data: routesData } = useRoutes({
    query: { refetchInterval: 30000 },
  });

  const { data: vehiclePositionsData, refetch } = useVehiclePositions(
    undefined,
    {
      query: { refetchInterval: 15000 },
    }
  );

  const routes = routesData || [];
  const routeMap = new Map(routes.map((r) => [r.routeId, r]));

  const allVehicles = (vehiclePositionsData || []).map((vp) => ({
    ...vp,
    route: routeMap.get(vp?.trip?.routeId || ""),
  }));

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const getComparator = (order: Order, orderBy: OrderBy) => {
    return (a: VehiclePosition, b: VehiclePosition) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (orderBy) {
        case "route":
          aValue = a.trip?.routeId || "";
          bValue = b.trip?.routeId || "";
          break;
        case "vehicleId":
          aValue = a.vehicle?.id || "";
          bValue = b.vehicle?.id || "";
          break;
        case "label":
          aValue = a.vehicle?.label || "";
          bValue = b.vehicle?.label || "";
          break;
        case "tripId":
          aValue = a.trip?.tripId || "";
          bValue = b.trip?.tripId || "";
          break;
        case "stopId":
          aValue = a.stopId || "";
          bValue = b.stopId || "";
          break;
        case "stopSeq":
          aValue = a.currentStopSequence || 0;
          bValue = b.currentStopSequence || 0;
          break;
        case "status":
          aValue = a.currentStatus || 0;
          bValue = b.currentStatus || 0;
          break;
        case "timestamp":
          aValue = a.timestamp || 0;
          bValue = b.timestamp || 0;
          break;
        default:
          aValue = "";
          bValue = "";
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return order === "asc" ? comparison : -comparison;
      }

      if (bValue < aValue) {
        return order === "asc" ? 1 : -1;
      }
      if (bValue > aValue) {
        return order === "asc" ? -1 : 1;
      }
      return 0;
    };
  };

  const sortedVehicles = React.useMemo(() => {
    return [...allVehicles].sort(getComparator(order, orderBy));
  }, [allVehicles, order, orderBy]);

  const lastUpdate = dayjs();

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography gutterBottom={true} variant={"h4"}>
                Real-time Vehicle Positions
              </Typography>
              <Typography color={"text.secondary"} variant={"body2"}>
                Showing {sortedVehicles.length} active vehicles across{" "}
                {routes.length} routes
              </Typography>
              <Typography color={"text.secondary"} variant={"caption"}>
                Last updated: {lastUpdate.format("h:mm:ss A")} • Auto-refresh:
                15s
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                refetch();
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table size={"small"}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "route"}
                  direction={orderBy === "route" ? order : "asc"}
                  onClick={() => handleRequestSort("route")}
                >
                  Route
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "vehicleId"}
                  direction={orderBy === "vehicleId" ? order : "asc"}
                  onClick={() => handleRequestSort("vehicleId")}
                >
                  Vehicle ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "label"}
                  direction={orderBy === "label" ? order : "asc"}
                  onClick={() => handleRequestSort("label")}
                >
                  Label
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "tripId"}
                  direction={orderBy === "tripId" ? order : "asc"}
                  onClick={() => handleRequestSort("tripId")}
                >
                  Trip ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "stopId"}
                  direction={orderBy === "stopId" ? order : "asc"}
                  onClick={() => handleRequestSort("stopId")}
                >
                  Stop ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "stopSeq"}
                  direction={orderBy === "stopSeq" ? order : "asc"}
                  onClick={() => handleRequestSort("stopSeq")}
                >
                  Stop Seq
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "status"}
                  direction={orderBy === "status" ? order : "asc"}
                  onClick={() => handleRequestSort("status")}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Position (Lat, Lon)</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "timestamp"}
                  direction={orderBy === "timestamp" ? order : "asc"}
                  onClick={() => handleRequestSort("timestamp")}
                >
                  Last Update
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedVehicles.length === 0 ? (
              <TableRow>
                <TableCell align={"center"} colSpan={9}>
                  <Typography color={"text.secondary"} sx={{ py: 3 }}>
                    No active vehicles found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedVehicles.map((vp, index) => (
                <VehiclePositionRow
                  key={`${vp.trip?.routeId}-${vp.vehicle?.id || index}`}
                  routeColor={vp.route?.routeColor || "666666"}
                  routeId={vp.trip?.routeId || "N/A"}
                  vehiclePosition={vp}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
