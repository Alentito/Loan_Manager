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
} from "../api/attendanceApi";

// CST-safe YYYY-MM-DD
const getCSTTodayString = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());

const pageSize = 10;

export default function AttendanceReportsPage() {
  const [tab, setTab] = useState("late"); // late | absent
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(getCSTTodayString());
  const [page, setPage] = useState(1);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [tab, viewMode, currentDate]);

  const queryArgs = {
    filter: viewMode,
    date: currentDate,
    page,
    page_size: pageSize,
  };

  const lateQuery = useGetLateLoginsQuery(queryArgs, {
    skip: tab !== "late",
  });

  const absentQuery = useGetAbsentsQuery(queryArgs, {
    skip: tab !== "absent",
  });

  const data = tab === "late" ? lateQuery.data : absentQuery.data;
  const isLoading = tab === "late" ? lateQuery.isLoading : absentQuery.isLoading;
  const error = tab === "late" ? lateQuery.error : absentQuery.error;

  const rows = data?.results || [];
  const total = data?.count || 0;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Attendance Reports
      </Typography>

      {/* 🔹 Tabs (like Loan Pipeline) */}
      <Box display="flex" gap={2} mb={2}>
        <Button
          variant={tab === "late" ? "contained" : "outlined"}
          onClick={() => setTab("late")}
        >
          Late Logins
        </Button>
        <Button
          variant={tab === "absent" ? "contained" : "outlined"}
          onClick={() => setTab("absent")}
        >
          Absents
        </Button>
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

                  {tab === "late" && (
                    <>
                      <TableCell>Status</TableCell>
                      <TableCell>Login Time</TableCell>
                      <TableCell>Late Duration</TableCell>
                    </>
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

                      {tab === "late" && (
                        <>
                          <TableCell>{row.status}</TableCell>
                          <TableCell>{row.login_time}</TableCell>
                          <TableCell>{row.late_duration}</TableCell>
                        </>
                      )}

                      <TableCell>{row.shift_name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={tab === "late" ? 7 : 4}
                      align="center"
                    >
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
