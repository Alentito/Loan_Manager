import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  TextField,
  Pagination,
} from "@mui/material";
import { useGetLateLoginsQuery } from "../api/attendanceApi";

const getCSTTodayString = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());

const pageSize = 10;

export default function LateLoginsPage() {
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(getCSTTodayString());
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useGetLateLoginsQuery(
  {
    filter: viewMode,
    date: currentDate,
    page,
    page_size: pageSize,
  },
  {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,       // 👈 key line
    refetchOnReconnect: true,   // 👈 key line
  }
);


  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [viewMode, currentDate]);

  const rows = data?.results || [];
  const total = data?.count || 0;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Late Logins
      </Typography>

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        {["day", "week", "month"].map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "contained" : "outlined"}
            onClick={() => setViewMode(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}

        <TextField
          type="date"
          size="small"
          value={currentDate}
          onChange={(e) =>
            setCurrentDate(e.target.value || getCSTTodayString())
          }
        />
      </Box>

      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            Failed to load data
          </Typography>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Login Time</TableCell>
                  <TableCell>Late Duration</TableCell>
                  <TableCell>Shift</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length ? (
                  rows.map((row, index) => (
                    <TableRow key={`${row.employee_id}-${row.date}-${index}`}>
                      <TableCell>{row.employee_id}</TableCell>
                      <TableCell>{row.employee_name}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.login_time}</TableCell>
                      <TableCell>{row.late_duration}</TableCell>
                      <TableCell>{row.shift_name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No late logins found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* ✅ Pagination (same as BrokerList) */}
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Pagination
                count={Math.ceil(total / pageSize)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
                disabled={isLoading}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
