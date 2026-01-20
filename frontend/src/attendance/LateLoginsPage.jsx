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

import {
  useGetLateLoginsQuery,
  useGetAbsentsQuery,
  useGetLoginLogoutQuery, // ⬅️ ADD THIS
} from "../api/attendanceApi";

/* ------------------ Helpers ------------------ */
const getCSTTodayString = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());

const pageSize = 10;

/* ------------------ Component ------------------ */
export default function AttendanceReportsPage() {
  const [tab, setTab] = useState("late"); // late | absent | login
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(getCSTTodayString());
  const [page, setPage] = useState(1);

  /* Reset page on filter change */
  useEffect(() => {
    setPage(1);
  }, [tab, viewMode, currentDate]);

  const queryArgs = {
    filter: viewMode,
    date: currentDate,
    page,
    page_size: pageSize,
  };

  /* ------------------ Queries ------------------ */
  const lateQuery = useGetLateLoginsQuery(queryArgs, {
  skip: tab !== "late",
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

const absentQuery = useGetAbsentsQuery(queryArgs, {
  skip: tab !== "absent",
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

const loginQuery = useGetLoginLogoutQuery(queryArgs, {
  skip: tab !== "login",
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  pollingInterval: tab === "login" ? 30_000 : 0, // ✅ ONLY poll when tab active
});

  /* ------------------ Tab Config ------------------ */
  const tabsConfig = {
    late: {
      label: "Late Logins",
      query: lateQuery,
      columns: ["status", "login_time", "late_duration"],
    },
    absent: {
      label: "Absents",
      query: absentQuery,
      columns: [],
    },
    login: {
      label: "Login / Logout",
      query: loginQuery,
      columns: ["login_time", "logout_time", "worked_hours", "status"],
    },
  };

  const { query, columns } = tabsConfig[tab];
  const { data, isLoading, error } = query;

  const rows = data?.results || [];
  const total = data?.count || 0;

  /* ------------------ Render ------------------ */
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Attendance Reports
      </Typography>


      {/* 🔹 Tabs */}
      <Box display="flex" gap={2} mb={2}>
        {Object.entries(tabsConfig).map(([key, cfg]) => (
          <Button
            key={key}
            variant={tab === key ? "contained" : "outlined"}
            onClick={() => setTab(key)}
          >
            {cfg.label}
          </Button>
        ))}
      </Box>

      {/* 🔹 Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        {["day", "week", "month"].map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "contained" : "outlined"}
            onClick={() => setViewMode(mode)}
          >
            {mode[0].toUpperCase() + mode.slice(1)}
          </Button>
        ))}
<Button
  variant="outlined"
  onClick={() => {
    if (tab === "late") lateQuery.refetch();
    if (tab === "absent") absentQuery.refetch();
    if (tab === "login") loginQuery.refetch();
  }}
>
  ♻️
</Button>
        <TextField
          type="date"
          size="small"
          value={currentDate}
          onChange={(e) =>
            setCurrentDate(e.target.value || getCSTTodayString())
          }
        />
      </Box>

      {/* 🔹 Table */}
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

                  {columns.includes("status") && <TableCell>Status</TableCell>}
                  {columns.includes("login_time") && (
                    <TableCell>Login</TableCell>
                  )}
                  {columns.includes("logout_time") && (
                    <TableCell>Logout</TableCell>
                  )}
                  {columns.includes("late_duration") && (
                    <TableCell>Late Duration</TableCell>
                  )}
                  {columns.includes("worked_hours") && (
                    <TableCell>Worked Hours</TableCell>
                  )}

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

                      {columns.includes("status") && (
                        <TableCell>{row.status}</TableCell>
                      )}
                      {columns.includes("login_time") && (
                        <TableCell>{row.login_time}</TableCell>
                      )}
                      {columns.includes("logout_time") && (
                        <TableCell>{row.logout_time}</TableCell>
                      )}
                      {columns.includes("late_duration") && (
                        <TableCell>{row.late_duration}</TableCell>
                      )}
                      {columns.includes("worked_hours") && (
                        <TableCell>{row.worked_hours}</TableCell>
                      )}

                      <TableCell>{row.shift_name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* 🔹 Pagination */}
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Pagination
                count={Math.ceil(total / pageSize) || 1}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
