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


function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Return current CST Date
const getCSTNow = () => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
};

// Convert any date to CST midnight (safe normalization)
const toCSTDate = (date) => {
  if (!date) return null;
  const cstString = date.toLocaleString("en-US", { timeZone: "America/Chicago" });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0);
  return cstDate;
};

const getTodayRaw = () => new Date().toISOString().split("T")[0];

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
  const [viewMode, setViewMode] = useState("month"); // day/week/month
  const [currentDate, setCurrentDate] = useState(getTodayRaw);
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
    return leaves.filter((req) => {
      const start = req.start_date.split("T")[0];
      const end = req.end_date.split("T")[0];
      const cur = currentDate;

      if (!start || !end || !cur) return false;

      if (viewMode === "day") return cur >= start && cur <= end;

      if (viewMode === "week") {
        const dateObj = new Date(cur);
        const startOfWeek = new Date(dateObj.setDate(dateObj.getDate() - dateObj.getDay()));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const s = new Date(start);
        const e = new Date(end);

        return s <= endOfWeek && e >= startOfWeek;
      }

      if (viewMode === "month") {
        return (
          start.slice(0, 7) === cur.slice(0, 7) ||
          end.slice(0, 7) === cur.slice(0, 7)
        );
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
          Employee Leave Approval
        </Typography>

        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          {["day", "week", "month"].map((m) => (
            <Button key={m} variant={viewMode === m ? "contained" : "outlined"} onClick={() => setViewMode(m)}>
              {m[0].toUpperCase() + m.slice(1)}
            </Button>
          ))}

          {/* 🎯 Updated Date Picker */}
          <TextField
            type="date"
            size="small"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value || getTodayRaw())}
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

          <Select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 120 }}>
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
                "Created At",
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
                      {formatToCSTDate(req.created_at)}
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
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
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
