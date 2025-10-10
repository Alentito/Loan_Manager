// src/admin/LeaveApprovalPage.jsx
import React, { useEffect, useState, useMemo } from "react";
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

// ------------------ Helpers ------------------
const formatToCSTDate = (input) => {
  if (!input) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const date = new Date(input);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
};

const mapToSimpleLeaveType = (type) => {
  if (type === "Paid Leave") return "Paid Leave";
  if (type === "Unpaid Leave") return "Unpaid Leave";
  return type || "—";
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Convert any date to CST midnight
const toCSTDate = (date) => {
  if (!date) return null;
  const cstString = date.toLocaleString("en-US", { timeZone: "America/Chicago" });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0);
  return cstDate;
};

// ------------------ Main Component ------------------
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
  const [viewMode, setViewMode] = useState("day"); // day/week/month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [approvalTypes, setApprovalTypes] = useState({});

  const { data, isLoading, refetch } = useGetAllLeaveRequestsQuery({
    page,
    page_size: rowsPerPage,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
  });

  const [approveLeave] = useApproveLeaveMutation();
  const [denyLeave] = useDenyLeaveMutation();

  useEffect(() => setPage(1), [currentDate, viewMode, statusFilter, debouncedSearch]);

  const total = data?.count || 0;
  const leaves = data?.results || [];
  const emptyRows = rowsPerPage - leaves.length;

  // ------------------ Filter leaves by CST date ------------------
  const filteredLeaves = useMemo(() => {
    const currentCST = toCSTDate(currentDate);
    return leaves.filter((req) => {
      const startCST = toCSTDate(new Date(req.start_date));
      const endCST = toCSTDate(new Date(req.end_date));

      if (!startCST || !endCST || !currentCST) return false;

      if (viewMode === "day") return currentCST >= startCST && currentCST <= endCST;

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
    });
  }, [leaves, viewMode, currentDate]);

  // ------------------ Handlers ------------------
  const handleDecision = async (id, decision, employee, approvalType = null) => {
    if (employee?.id === userId) {
      toast.error("⚠️ You cannot approve/deny your own leave request.");
      return;
    }

    try {
      if (decision === "approved") {
        if (!approvalType) {
          toast.error("Please select Paid or Unpaid before approving.");
          return;
        }
        await approveLeave({ id, approval_type: approvalType }).unwrap();
      } else {
        await denyLeave(id).unwrap();
      }

      toast.success(`Leave ${decision}`);
      refetch();
    } catch {
      toast.error("Failed to update leave request");
    }
  };

  const StatusBox = ({ status }) => {
    const bgColor =
      status === "approved"
        ? "#2e7d32"
        : status === "denied"
          ? "#d32f2f"
          : "#ed6c02";
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

  // ------------------ Render ------------------
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

        {/* Day/Week/Month + Date picker + Search + Status */}
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
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
          />

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
                "Approval Type",
                "Leave Balance",
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
            ) : filteredLeaves.length > 0 ? (
              filteredLeaves.map((req) => (
                <Grow key={req.id} in timeout={300}>
                  <TableRow hover sx={{ "& > *": { height: 60 } }}>
                    <TableCell sx={{ px: 2 }}>
                      {req.employee?.login_id || "—"}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {req.approval_type
                        ? req.approval_type.charAt(0).toUpperCase() + req.approval_type.slice(1)
                        : "—"}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {req.employee_balance ?? "—"}
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
                    <TableCell sx={{ px: 2 }}>
                      {req.reason || "—"}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {req.approved_by?.username ||
                        req.denied_by?.username ||
                        "—"}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {req.status === "pending" &&
                        req.employee?.id !== userId && (
                          <Box
                            display="flex"
                            gap={1}
                            alignItems="center"
                            position="relative"
                          >
                            {canApprove && (
                              <>
                                <Select
                                  size="small"
                                  value={approvalTypes[req.id] || ""}
                                  onChange={(e) =>
                                    setApprovalTypes((prev) => ({
                                      ...prev,
                                      [req.id]: e.target.value,
                                    }))
                                  }
                                  displayEmpty
                                  sx={{ minWidth: 140, zIndex: 1000 }}
                                >
                                  <MenuItem value="" disabled>
                                    Select Type
                                  </MenuItem>
                                  <MenuItem value="paid">
                                    Paid Leave
                                  </MenuItem>
                                  <MenuItem value="unpaid">
                                    Unpaid Leave
                                  </MenuItem>
                                </Select>
                                <Button
                                  size="small"
                                  color="success"
                                  variant="contained"
                                  disabled={!approvalTypes[req.id]}
                                  sx={{
                                    opacity: 0.9,
                                    borderRadius: "16px",
                                    textTransform: "none",
                                    minWidth: 90,
                                  }}
                                  onClick={() =>
                                    handleDecision(
                                      req.id,
                                      "approved",
                                      req.employee,
                                      approvalTypes[req.id]
                                    )
                                  }
                                >
                                  Approve
                                </Button>
                              </>
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
              filteredLeaves.length > 0 &&
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
    </Box>
  );
}