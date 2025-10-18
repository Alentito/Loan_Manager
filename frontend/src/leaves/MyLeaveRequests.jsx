// src/components/leaves/MyLeaveRequests.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Skeleton,
  Pagination,
  Grow,
  TextField,
  Button,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useGetEmployeeLeaveRequestsQuery } from "../api/leaveApi";

const ROWS_PER_PAGE = 10;

// ------------------ Helpers ------------------

// Format date for table display
const formatToCSTDate = (input) => {
  if (!input) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const date = new Date(input);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
};

// Status badge
const StatusBox = ({ status }) => {
  const colors = { approved: "#2e7d32", denied: "#d32f2f", pending: "#ed6c02" };
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 0.5,
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "0.8rem",
        color: "#fff",
        backgroundColor: colors[status] || "#757575",
      }}
    >
      {status?.toUpperCase() || "—"}
    </Box>
  );
};

// Convert any date to CST midnight
const toCSTDate = (date) => {
  if (!date) return null;
  const cstString = date.toLocaleString("en-US", { timeZone: "America/Chicago" });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0); // reset to midnight CST
  return cstDate;
};

// ------------------ Main Component ------------------
export default function MyLeaveRequests() {
  const { user } = useSelector((state) => state.auth);
  const employeeId = user?.employee?.id;

  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("day"); // day/week/month
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data, isLoading, isError } = useGetEmployeeLeaveRequestsQuery(
    { employeeId, page, page_size: ROWS_PER_PAGE },
    { skip: !employeeId }
  );

  // Reset page when current date or view mode changes
  useEffect(() => setPage(1), [currentDate, viewMode]);

  const leaveRequests = data?.results || [];
  const total = data?.count || 0;

  // ------------------ Filter leave requests ------------------
  const filteredLeaves = useMemo(() => {
    const currentCST = toCSTDate(currentDate);

    return leaveRequests
      .filter((req) => {
        const startCST = toCSTDate(new Date(req.start_date));
        const endCST = toCSTDate(new Date(req.end_date));

        if (!startCST || !endCST || !currentCST) return false;

        if (viewMode === "day") {
          return currentCST >= startCST && currentCST <= endCST;
        }

        if (viewMode === "week") {
          const startOfWeek = new Date(currentCST);
          startOfWeek.setDate(currentCST.getDate() - currentCST.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return startCST <= endOfWeek && endCST >= startOfWeek;
        }

        if (viewMode === "month") {
          const sameMonth =
            (startCST.getFullYear() === currentCST.getFullYear() &&
              startCST.getMonth() === currentCST.getMonth()) ||
            (endCST.getFullYear() === currentCST.getFullYear() &&
              endCST.getMonth() === currentCST.getMonth());
          return sameMonth;
        }

        return true;
      })
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }, [leaveRequests, viewMode, currentDate]);

  // ------------------ Guards ------------------
  if (!employeeId)
    return (
      <Typography color="text.secondary" mt={4} textAlign="center">
        ⚠️ No employee profile linked to this account.
      </Typography>
    );

  if (isError)
    return (
      <Typography color="error" mt={4} textAlign="center">
        ❌ Failed to load leave requests.
      </Typography>
    );

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} color="primary" mb={2}>
        My Leave Requests
      </Typography>

      {/* Day/Week/Month + Date picker */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <Button
          variant={viewMode === "day" ? "contained" : "outlined"}
          onClick={() => setViewMode("day")}
        >
          Day
        </Button>
        <Button
          variant={viewMode === "week" ? "contained" : "outlined"}
          onClick={() => setViewMode("week")}
        >
          Week
        </Button>
        <Button
          variant={viewMode === "month" ? "contained" : "outlined"}
          onClick={() => setViewMode("month")}
        >
          Month
        </Button>

        <TextField
          type="date"
          value={currentDate.toISOString().split("T")[0]}
          onChange={(e) => setCurrentDate(new Date(e.target.value))}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {[
                "Approval Type",
                "Leave Balance",
                "Start Date",
                "End Date", 
                "Created At",
                "Status",
                "Reason",
              ].map((label) => (
                <TableCell key={label} sx={{ fontWeight: 600 }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading
              ? Array.from({ length: ROWS_PER_PAGE }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={6}>
                      <Skeleton height={40} />
                    </TableCell>
                  </TableRow>
                ))
              : filteredLeaves.length > 0
              ? filteredLeaves.map((req) => (
                  <Grow key={req.id} in timeout={300}>
                    <TableRow hover>
                      <TableCell>
                        {req.approval_type
                          ? req.approval_type.charAt(0).toUpperCase() +
                            req.approval_type.slice(1)
                          : "—"}
                      </TableCell>
                      <TableCell>{req.employee_balance ?? "—"}</TableCell>
                      <TableCell>{formatToCSTDate(req.start_date)}</TableCell>
                      <TableCell>{formatToCSTDate(req.end_date)}</TableCell>
                      <TableCell>{formatToCSTDate(req.created_at)}</TableCell>
                      <TableCell>
                        <StatusBox status={req.status} />
                      </TableCell>
                      <TableCell>{req.reason || "—"}</TableCell>
                    </TableRow>
                  </Grow>
                ))
              : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </Paper>

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination
          count={Math.ceil(total / ROWS_PER_PAGE) || 1}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
}
