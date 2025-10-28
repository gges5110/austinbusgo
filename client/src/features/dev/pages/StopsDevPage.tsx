import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Card,
  CardContent,
  InputAdornment,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useStopQuery } from "shared/api/schemas/Stop.generated";
import { useStopsByNameQuery } from "shared/api/schemas/StopsByName.generated";
import { Stop } from "shared/types/interface.d";

const StopRow: React.FC<{ stop: Stop; onSelect: (stop: Stop) => void }> = ({
  stop,
  onSelect,
}) => {
  return (
    <TableRow
      hover={true}
      onClick={() => onSelect(stop)}
      sx={{ cursor: "pointer" }}
    >
      <TableCell>{stop.stopId}</TableCell>
      <TableCell>{stop.stopCode || "N/A"}</TableCell>
      <TableCell>
        <Link
          component={RouterLink}
          onClick={(e) => e.stopPropagation()}
          to={`/stop/${stop.stopId}`}
        >
          {stop.stopName}
        </Link>
      </TableCell>
      <TableCell>
        {stop.stopLoc?.coordinates
          ? `${stop.stopLoc.coordinates[1].toFixed(
              6
            )}, ${stop.stopLoc.coordinates[0].toFixed(6)}`
          : "N/A"}
      </TableCell>
    </TableRow>
  );
};

export const StopsDevPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(
    null
  );

  // Initialize from URL
  React.useEffect(() => {
    const stopIdFromUrl = searchParams.get("stopId");
    const searchFromUrl = searchParams.get("search");

    if (stopIdFromUrl && !selectedStopId) {
      setSelectedStopId(stopIdFromUrl);
    }
    if (searchFromUrl && !searchTerm) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams, selectedStopId, searchTerm]);

  const { data: searchResultsData } = useStopsByNameQuery(
    { stopName: searchTerm },
    {
      enabled: searchTerm.length >= 2,
    }
  );

  const { data: selectedStopData } = useStopQuery(
    { stopId: selectedStopId || "" },
    {
      enabled: !!selectedStopId,
    }
  );

  const searchResults = searchResultsData?.stopsByName || [];
  const selectedStop = selectedStopData?.stop;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
    setSelectedStopId(null);
  };

  const handleSelectStop = (stop: Stop) => {
    setSelectedStopId(stop.stopId);
    setSearchParams({
      stopId: stop.stopId,
      search: searchTerm,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography gutterBottom={true} variant={"h4"}>
            Stops Lookup
          </Typography>
          <Typography
            color={"text.secondary"}
            gutterBottom={true}
            variant={"body2"}
          >
            Search for stops by name or ID to view details
          </Typography>

          <Box sx={{ mt: 3 }}>
            <TextField
              InputProps={{
                startAdornment: (
                  <InputAdornment position={"start"}>
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              fullWidth={true}
              label={"Search Stops"}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={"Enter stop name (e.g., Airport, Lamar)"}
              value={searchTerm}
              variant={"outlined"}
            />
          </Box>
        </CardContent>
      </Card>

      {searchTerm.length >= 2 && searchResults.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography gutterBottom={true} variant={"h6"}>
              {`Search Results (${searchResults.length} stops found)`}
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size={"small"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Stop ID</TableCell>
                    <TableCell>Stop Code</TableCell>
                    <TableCell>Stop Name</TableCell>
                    <TableCell>Location (Lat, Lon)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((stop) => (
                    <StopRow
                      key={stop.stopId}
                      onSelect={handleSelectStop}
                      stop={stop}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {searchTerm.length >= 2 && searchResults.length === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography align={"center"} color={"text.secondary"}>
            No stops found matching your search
          </Typography>
        </Paper>
      )}

      {selectedStop && (
        <Card>
          <CardContent>
            <Typography gutterBottom={true} variant={"h6"}>
              Stop Details
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography color={"text.secondary"} variant={"caption"}>
                  STOP NAME
                </Typography>
                <Typography variant={"body1"}>
                  {selectedStop.stopName}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography color={"text.secondary"} variant={"caption"}>
                  STOP ID
                </Typography>
                <Typography variant={"body1"}>{selectedStop.stopId}</Typography>
              </Box>
              {selectedStop.stopCode && (
                <Box sx={{ mb: 2 }}>
                  <Typography color={"text.secondary"} variant={"caption"}>
                    STOP CODE
                  </Typography>
                  <Typography variant={"body1"}>
                    {selectedStop.stopCode}
                  </Typography>
                </Box>
              )}
              {selectedStop.stopLoc?.coordinates && (
                <Box sx={{ mb: 2 }}>
                  <Typography color={"text.secondary"} variant={"caption"}>
                    LOCATION
                  </Typography>
                  <Typography variant={"body1"}>
                    {`Lat: ${selectedStop.stopLoc.coordinates[1].toFixed(
                      6
                    )}, Lon: ${selectedStop.stopLoc.coordinates[0].toFixed(6)}`}
                  </Typography>
                </Box>
              )}
              <Box sx={{ mt: 3 }}>
                <Link
                  component={RouterLink}
                  to={`/stop/${selectedStop.stopId}`}
                  underline={"hover"}
                >
                  View stop in main app →
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
