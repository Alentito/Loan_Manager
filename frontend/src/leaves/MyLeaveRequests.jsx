// src/components/leaves/MyLeaveRequests.jsx
import React, { useState } from "react";
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
} from "@mui/material";
import { useSelector } from "react-redux";
import { useGetEmployeeLeaveRequestsQuery } from "../api/leaveApi";

const ROWS_PER_PAGE = 10;

/* ------------------ Helpers ------------------ */
// Format a date string to YYYY-MM-DD in CST
const formatToCSTDate = (input) => {
  if (!input) return "—";
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const date = new Date(input);
  if (isNaN(date)) return "—";

  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
};

// Simplify leave type (match form)
const mapToSimpleLeaveType = (type) => {
  if (type === "Paid Leave") return "Paid Leave";
  if (type === "Unpaid Leave") return "Unpaid Leave";
  return type || "—";
};

// Colored status box
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

/* ------------------ Main Component ------------------ */
export default function MyLeaveRequests() {
  const { user } = useSelector((state) => state.auth);
  const employeeId = user?.employee?.id;

  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetEmployeeLeaveRequestsQuery(
    { employeeId, page, page_size: ROWS_PER_PAGE },
    { skip: !employeeId }
  );

  const total = data?.count || 0;
  const leaveRequests = data?.results || [];

  // Debug API response
  console.log("MyLeaveRequests API response:", data);

  // Guard: no employee linked
  if (!employeeId) {
    return (
      <Typography color="text.secondary" mt={4} textAlign="center">
        ⚠️ No employee profile linked to this account.
      </Typography>
    );
  }

  // Guard: API error
  if (isError) {
    return (
      <Typography color="error" mt={4} textAlign="center">
        ❌ Failed to load leave requests.
      </Typography>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} color="primary" mb={2}>
        My Leave Requests
      </Typography>

      <Paper sx={{ mt: 2, borderRadius: 2, overflow: "hidden" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["Leave Type", "Start Date", "End Date", "Status", "Reason"].map((label) => (
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
                    <TableCell colSpan={5}>
                      <Skeleton height={40} />
                    </TableCell>
                  </TableRow>
                ))
              : leaveRequests.length > 0
              ? leaveRequests.map((req) => (
                  <Grow key={req.id} in timeout={300}>
                    <TableRow hover>
                      <TableCell>{mapToSimpleLeaveType(req.leave_type)}</TableCell>
                      <TableCell>{formatToCSTDate(req.start_date)}</TableCell>
                      <TableCell>{formatToCSTDate(req.end_date)}</TableCell>
                      <TableCell>
                        <StatusBox status={req.status} />
                      </TableCell>
                      <TableCell>{req.reason || "—"}</TableCell>
                    </TableRow>
                  </Grow>
                ))
              : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
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
