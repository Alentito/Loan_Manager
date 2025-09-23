// src/admin/LeaveApprovalPage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  CircularProgress,
  Snackbar,
  Grow,
} from "@mui/material";
import { Clear } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useGetAllLeaveRequestsQuery,
  useApproveLeaveMutation,
  useDenyLeaveMutation,
} from "../api/leaveApi";

const pageSizeDefault = 10;

/* ------------------ Helpers ------------------ */
// Format date into YYYY-MM-DD in CST
const formatToCSTDate = (input) => {
  if (!input) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  
  const date = new Date(input);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
};

// Keep only Paid / Unpaid types
const mapToSimpleLeaveType = (type) => {
  if (type === "Paid Leave") return "Paid Leave";
  if (type === "Unpaid Leave") return "Unpaid Leave";
  return type || "—";
};

/* ------------------ Debounce Hook ------------------ */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function LeaveApprovalPage() {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id;
  const permissions = user?.permissions || [];
  const canApprove = permissions.includes("employee.approve_leave");
  const canDeny = permissions.includes("employee.deny_leave");
  const isReviewer = canApprove || canDeny;

  if (!isReviewer) {
    return (
      <Typography color="error" mt={4} textAlign="center">
        Access denied. You do not have permission to approve/deny leave requests.
      </Typography>
    );
  }

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(pageSizeDefault);

  const { data, isLoading, refetch } = useGetAllLeaveRequestsQuery({
    page,
    page_size: rowsPerPage,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
  });

  const [approveLeave] = useApproveLeaveMutation();
  const [denyLeave] = useDenyLeaveMutation();

  const handleDecision = async (id, decision, employee) => {
    if (employee?.id === userId) {
      toast.error("⚠️ You cannot approve/deny your own leave request.");
      return;
    }
    try {
      if (decision === "approved") await approveLeave(id).unwrap();
      else await denyLeave(id).unwrap();
      toast.success(`Leave ${decision}`);
      refetch();
    } catch {
      toast.error("Failed to update leave request");
    }
  };

  const total = data?.count || 0;
  const leaves = data?.results || [];
  const emptyRows = rowsPerPage - leaves.length;

  // Styled Status Box
  const StatusBox = ({ status }) => {
    const bgColor =
      status === "approved" ? "#2e7d32" :
      status === "denied" ? "#d32f2f" :
      "#ed6c02";
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 28,
          px: 2,
          py: 0.5,
          width: 100,
          borderRadius: "16px",
          fontWeight: 600,
          fontSize: "0.85rem",
          color: "#fff",
          opacity: 0.9,
          backgroundColor: bgColor,
          textAlign: "center",
        }}
      >
        {status?.toUpperCase() || "—"}
      </Box>
    );
  };

  return (
    <Box p={3}>
      {/* Header + Filters */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight="bold" color="primary">
          Employee Leave Requests
        </Typography>

        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 180 }}
            InputProps={{
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearch("")}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="denied">Denied</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ minWidth: 1200 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {[
                "Employee ID",
                "Leave Type",
                "Start Date",
                "End Date",
                "Status",
                "Reason",
                "Reviewed By",
                "Actions",
              ].map((label, idx) => (
                <TableCell key={idx} sx={{ py: 1.5, px: 2 }}>
                  <strong>{label}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : leaves.length > 0 ? (
              leaves.map((req) => (
                <Grow key={req.id} in timeout={300}>
                  <TableRow hover sx={{ "& > *": { height: 60 } }}>
                    <TableCell sx={{ px: 2 }}>
                      {req.employee?.login_id || "—"}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {mapToSimpleLeaveType(req.leave_type)}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {formatToCSTDate(req.start_date)}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {formatToCSTDate(req.end_date)}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <StatusBox status={req.status} />
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>{req.reason || "—"}</TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {req.approved_by?.username ||
                        req.denied_by?.username ||
                        "—"}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {req.status === "pending" &&
                        req.employee?.id !== userId && (
                          <Box display="flex" gap={1}>
                            {canApprove && (
                              <Button
                                size="small"
                                color="success"
                                variant="contained"
                                sx={{
                                  opacity: 0.9,
                                  borderRadius: "16px",
                                  textTransform: "none",
                                  minWidth: 90,
                                }}
                                onClick={() =>
                                  handleDecision(req.id, "approved", req.employee)
                                }
                              >
                                Approve
                              </Button>
                            )}
                            {canDeny && (
                              <Button
                                size="small"
                                color="error"
                                variant="contained"
                                sx={{
                                  opacity: 0.9,
                                  borderRadius: "16px",
                                  textTransform: "none",
                                  minWidth: 90,
                                }}
                                onClick={() =>
                                  handleDecision(req.id, "denied", req.employee)
                                }
                              >
                                Deny
                              </Button>
                            )}
                          </Box>
                        )}
                    </TableCell>
                  </TableRow>
                </Grow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  No leave requests found.
                </TableCell>
              </TableRow>
            )}

            {emptyRows > 0 &&
              leaves.length > 0 &&
              Array.from(Array(emptyRows)).map((_, idx) => (
                <TableRow key={`empty-${idx}`} style={{ height: 60 }}>
                  <TableCell colSpan={8} />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination
          count={Math.ceil(total / rowsPerPage) || 1}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>

      <Snackbar open={false} autoHideDuration={3000} message="" />
    </Box>
  );
}
