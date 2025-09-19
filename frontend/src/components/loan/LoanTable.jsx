import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import useLoanSocket from "./useLoanSocket";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  TableRow,
  Avatar,
  Box,
  Button,
} from "@mui/material";
import Collapse from "@mui/material/Collapse";

import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Checkbox from "@mui/material/Checkbox";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MilestoneChip from "../../layout/MilestoneChip";
import { TableSortLabel } from "@mui/material"; // kept for compatibility if you use it
import {
  ArrowUpDown,
  Settings2,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import {
  setSelectedLoans,
  addSelectedLoan,
  removeSelectedLoan,
} from "./../../api/selectedLoansSlice";
import { useBulkDeleteLoansMutation } from "./../../api/loanApi";
import ColumnChooserDialog from "./ColumnChooserDialog";

/* -------------------------
   Config / constants
   ------------------------- */
const BASE_COLUMNS = [
  { id: "first_name", label: "Borrower Name", sortable: true },
  { id: "created_at", label: "Initiated Date", sortable: true },
  { id: "milestone", label: "Milestone", sortable: true },
  { id: "managed_by", label: "Managed By", sortable: false },
  { id: "amount", label: "Loan Amount", sortable: true },
  { id: "details", label: "Details", sortable: false },
  { id: "actions", label: "Actions", sortable: false },
  { id: "closing_date", label: "Close Date", sortable: true },
];

const LOCAL_STORAGE_KEY = "loanTableVisibleColumns_v1";
const LOCAL_STORAGE_CUSTOMIZED = "loanTableVisibleColumns_customized_v1";

// default visible columns (ordered)
const DEFAULT_VISIBLE = [
  "first_name",
  "created_at",
  "milestone",
  "details",
  "actions",
  "managed_by",
  "closing_date",
];

/* -------------------------
   small safe localStorage helpers (enterprise-safe)
   - always catch errors
   - use JSON
   ------------------------- */
const safeGetJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch (err) {
    // corrupted data or parsing error - remove to recover
    try {
      localStorage.removeItem(key);
    } catch (_) {}
    return null;
  }
};

const safeSetJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // quota / disabled storage - ignore but do not crash
    return false;
  }
};

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
};

/* -------------------------
   Component
   ------------------------- */
export default function LoanTable({
  loans = [],
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions,
  totalLoans,
  pageCount,
  onEdit,
  onDelete,
  onDetails,
  sortField,
  sortDirection,
  setSortField,
  setSortDirection,
}) {

  useLoanSocket();
  const Permissions = useSelector(
    (state) => state.auth.user?.permissions || []
  );

  const theme = useTheme();
  const dispatch = useDispatch();
  const selectedRows = useSelector((state) => state.selectedLoans || []);

  const [bulkDeleteLoans] = useBulkDeleteLoansMutation();

  // derive keys from loan data (for dynamic columns)
  const loanKeys = React.useMemo(() => {
    if (!loans || loans.length === 0) return [];
    return Object.keys(loans[0]).filter((k) => k !== "__typename");
  }, [loans]);

  // dynamicAllColumns merges base + any new keys found on loan objects
  const dynamicAllColumns = React.useMemo(() => {
    const map = new Map(BASE_COLUMNS.map((c) => [c.id, c]));
    const cols = [...BASE_COLUMNS];
    loanKeys.forEach((k) => {
      if (!map.has(k) && k !== "id") {
        const label = k
          .replace(/([A-Z])/g, " $1")
          .replace(/[_-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
          .join(" ");
        cols.push({ id: k, label, sortable: false });
        map.set(k, true);
      }
    });
    return cols;
  }, [loanKeys]);

  // visibleIds: state that drives which columns are shown (order preserved)
  // start with the DEFAULT_VISIBLE as a safe initial render; real initialization happens in effect below
  const [visibleIds, setVisibleIds] = useState(() => DEFAULT_VISIBLE.slice());

  const [chooserOpen, setChooserOpen] = useState(false);

  /* -------------------------
     Initialization & syncing logic (enterprise-safe)
     Goals:
     - If user has previously applied preferences (LOCAL_STORAGE_KEY exists), use them.
       * If stored prefs reference columns that are removed from `dynamicAllColumns`, drop them.
       * Do NOT auto-append new columns if user has customized (prevents overwriting user choices).
     - If no stored prefs (first-time user), initialize to DEFAULT_VISIBLE (filtered to existing columns)
       and append other columns (so user sees all columns but in default order).
     - Persist the resulting visibleIds to localStorage.
     ------------------------- */
  useEffect(() => {
    const allIds = dynamicAllColumns.map((c) => c.id);

    // read stored value (if any)
    const stored = safeGetJSON(LOCAL_STORAGE_KEY);

    if (Array.isArray(stored) && stored.length > 0) {
      // user had preferences — keep their order but drop any ids that no longer exist
      const filtered = stored.filter((id) => allIds.includes(id));

      // If everything was filtered out (rare), fall back to sensible default
      const final = filtered.length
        ? filtered
        : allIds
            .filter((id) => DEFAULT_VISIBLE.includes(id))
            .concat(allIds.filter((id) => !DEFAULT_VISIBLE.includes(id)));

      setVisibleIds(final);
      // persist back if we removed some stale ids
      if (JSON.stringify(final) !== JSON.stringify(stored)) {
        safeSetJSON(LOCAL_STORAGE_KEY, final);
      }
      return;
    }

    // no stored prefs -> first-time user
    // build: defaults (in order, only those present) + append all other columns (in dynamic order)
    const base = DEFAULT_VISIBLE.filter((id) => allIds.includes(id));
    const appended = allIds.filter((id) => !base.includes(id));
    const next = [...base, ...appended];

    setVisibleIds(next);
    safeSetJSON(LOCAL_STORAGE_KEY, next);

    // NOTE: do NOT set the customized flag here — this is a default initialization for first-time users.
  }, [dynamicAllColumns]);

  /* -------------------------
     Helper to apply and persist visible columns
     - Marks the user's preferences as customized (prevents future auto-append overwrites)
     ------------------------- */
  const applyVisibleIds = (newVisible) => {
    // ensure we only store ids that exist in the current columns (defensive)
    const allIds = dynamicAllColumns.map((c) => c.id);
    const sanitized = newVisible.filter((id) => allIds.includes(id));
    setVisibleIds(sanitized);
    safeSetJSON(LOCAL_STORAGE_KEY, sanitized);
    // set a simple flag so we know the user manually chose a configuration
    safeSetJSON(LOCAL_STORAGE_CUSTOMIZED, true);
  };

  /* -------------------------
     Optional: reset to default (keeps it explicit — user action)
     - This function resets to DEFAULT_VISIBLE (filtered/ordered) and marks as customized.
     ------------------------- */
  const resetToDefaults = () => {
    const allIds = dynamicAllColumns.map((c) => c.id);
    // Only show the default columns, in order, if they exist in dynamicAllColumns
    const next = DEFAULT_VISIBLE.filter((id) => allIds.includes(id));
    setVisibleIds(next);
    safeSetJSON(LOCAL_STORAGE_KEY, next);
    safeSetJSON(LOCAL_STORAGE_CUSTOMIZED, true);
  };

  /* -------------------------
     keep selected rows persistence (you already had this logic)
     ------------------------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("loanTableSelected_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((id) => {
            const n = Number(id);
            return Number.isNaN(n) ? id : n;
          });
          dispatch(setSelectedLoans(normalized));
        }
      }
    } catch (e) {}
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const arr = (selectedRows || []).map(String);
      localStorage.setItem("loanTableSelected_v1", JSON.stringify(arr));
    } catch (e) {}
  }, [selectedRows]);

  /* -------------------------
     checkbox visuals (kept as-is)
     ------------------------- */
  const checkboxIcon = (
    <span
      style={{
        width: 22,
        height: 22,
        display: "inline-block",
        borderRadius: 8,
        border: `2px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    />
  );
  const checkboxCheckedIcon = (
    <span
      style={{
        width: 22,
        height: 22,
        display: "inline-block",
        borderRadius: 8,
        backgroundColor: theme.palette.primary.main,
        position: "relative",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.palette.primary.contrastText}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );

  /* -------------------------
     value formatting & render helpers (kept as you had)
     ------------------------- */
  const formatValue = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "number") return Number(val).toLocaleString();
    if (typeof val === "string") {
      const isoDate = /^\d{4}-\d{2}-\d{2}T|\d{4}-\d{2}-\d{2}$/.test(val);
      if (isoDate) {
        const d = new Date(val);
        if (!isNaN(d)) {
          return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }
      }
      return val;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return "-";
      if (typeof val[0] === "object") return JSON.stringify(val);
      return val.join(", ");
    }
    if (typeof val === "object") {
      if (val.first_name || val.name || val.title) {
        const name = `${val.first_name || ""} ${val.last_name || ""}`.trim();
        if (name) return name;
        return val.name || val.title || JSON.stringify(val);
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  // build visibleColumns from dynamicAllColumns filtered by visibleIds
  const visibleColumns = dynamicAllColumns.filter((c) =>
    visibleIds.includes(c.id)
  );

  // keep details/actions on right
  const leftColumns = visibleColumns.filter(
    (c) => c.id !== "details" && c.id !== "actions"
  );
  const rightColumns = visibleColumns.filter(
    (c) => c.id === "details" || c.id === "actions"
  );
  rightColumns.sort((a, b) =>
    a.id === "actions" ? 1 : a.id === "details" ? -1 : 0
  );
  const orderedColumns = [...leftColumns, ...rightColumns];

  // selected set
  const selectedSet = React.useMemo(
    () => new Set((selectedRows || []).map(String)),
    [selectedRows]
  );

  const allSelected =
    loans.length > 0 && loans.every((loan) => selectedSet.has(String(loan.id)));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      dispatch(setSelectedLoans(loans.map((loan) => loan.id)));
    } else {
      dispatch(setSelectedLoans([]));
    }
  };
  const handleSelectRow = (id) => (e) => {
    if (e.target.checked) {
      dispatch(addSelectedLoan(id));
    } else {
      dispatch(removeSelectedLoan(id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRows || selectedRows.length === 0) return;
    if (!window.confirm("Are you sure you want to delete the selected loans?"))
      return;
    await bulkDeleteLoans(selectedRows);
    dispatch(setSelectedLoans([]));
  };

  const handleSort = (colId) => {
    if (!setSortField || !setSortDirection) return;
    if (sortField === colId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(colId);
      setSortDirection("asc");
    }
  };

  // renderCell kept mostly intact
  const renderCell = (loan, col) => {
    const id = col.id;
    if (id === "first_name") {
      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar sx={{ mr: 1, bgcolor: "secondary.main" }}>
            {loan.first_name
              ? loan.first_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : loan.first_name?.[0] || loan.last_name?.[0] || "?"}
          </Avatar>
          <Box sx={{ fontWeight: 600 }}>
            {loan.first_name} {loan.last_name ? ` ${loan.last_name}` : ""}
          </Box>
        </Box>
      );
    }

    if (id === "created_at") {
      return (
        <Box sx={{ color: "rgba(152, 152, 152, 1)", fontWeight: 500 }}>
          {loan.created_at
            ? new Date(loan.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "-"}
        </Box>
      );
    }

    if (id === "closing_date") {
      return (
        <Box sx={{ color: "rgba(152, 152, 152, 1)", fontWeight: 500 }}>
          {loan.closing_date
            ? new Date(loan.closing_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "-"}
        </Box>
      );
    }

    if (id === "milestone") {
      return <MilestoneChip status={loan.milestone} />;
    }

    if (id === "managed_by") {
      if (typeof loan.managed_by === "object") {
        return (
          loan.managed_by.name ||
          `${loan.managed_by.first_name || ""} ${
            loan.managed_by.last_name || ""
          }` ||
          "-"
        );
      }
      return loan.managed_by || "-";
    }

    if (id === "amount") {
      const amt = Number(loan.amount || 0);
      return (
        <Box sx={{ color: "rgba(152, 152, 152, 1)", fontWeight: 500 }}>
          {isNaN(amt)
            ? "-"
            : amt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </Box>
      );
    }

    if (id === "details") {
      return (
        <Button
          endIcon={<OpenInNewIcon fontSize="small" />}
          onClick={(e) => {
            e.stopPropagation();
            onDetails(loan);
          }}
          sx={{
            borderRadius: "999px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "14px",
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            paddingX: 2,
            paddingY: 0.5,
            minHeight: "32px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
              borderColor: theme.palette.primary.light,
            },
          }}
        >
          Details
        </Button>
      );
    }

    if (id === "actions") {
      return (
        <>
          {Permissions.includes("loan.change_loan") && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(loan);
              }}
              sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: 500,
                boxShadow: "none",
                minWidth: { xs: "auto", md: "auto" },
                width: { xs: "auto", md: "auto" },
                px: { xs: 1, md: 2 },
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.primary.light,
                  boxShadow: "none",
                },
                mr: { xs: 0, md: 0 },
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", md: "inline" } }}
              >
                Edit
              </Box>
            </Button>
          )}
          {Permissions.includes("loan.delete_loan") && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete(loan.id);
              }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </>
      );
    }

    const value = loan[id];
    return formatValue(value);
  };

  // sticky right offsets (kept as you had)
  const rightOffsets = { actions: 0, details: 88 };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 250px)",
        }}
      >
        <TableContainer
          sx={{
            width: "100%",
            minHeight: { xs: 300, sm: 400 },
            maxHeight: "100%",
            flexGrow: 1,
            "&::-webkit-scrollbar": {
              width: 8,
              backgroundColor: theme.palette.background.paper,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.grey[800]
                  : theme.palette.grey[300],
              borderRadius: 8,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.grey[700]
                  : theme.palette.grey[400],
            },
            scrollbarColor: `${
              theme.palette.mode === "dark"
                ? theme.palette.grey[800]
                : theme.palette.grey[300]
            } ${theme.palette.background.paper}`,
            scrollbarWidth: "thin",
          }}
        >
          <Table
            sx={{
              "& .MuiTableCell-root": { borderBottom: "none" },
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <TableHead
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "12px",
                zIndex: 99,
                position: "sticky",
                top: 0,
                "& th": {
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[900]
                      : "#F9F9F9",
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                },
              }}
            >
              <TableRow sx={{ borderRadius: "12px" }}>
                <TableCell
                  padding="checkbox"
                  sx={{ borderTopLeftRadius: "12px" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Tooltip title="Select">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={selectedRows.length > 0 && !allSelected}
                        onChange={handleSelectAll}
                        icon={checkboxIcon}
                        checkedIcon={checkboxCheckedIcon}
                      />
                    </Tooltip>
                    <Tooltip title="Delete">
                      <Collapse
                        in={selectedRows.length > 0}
                        orientation="horizontal"
                        timeout={300}
                      >
                        <span>
                          <IconButton
                            color="error"
                            aria-label="Delete selected"
                            onClick={handleBulkDelete}
                            sx={{ ml: 1 }}
                          >
                            <Trash2 size={16} color="#9CA3AF" />
                          </IconButton>
                        </span>
                      </Collapse>
                    </Tooltip>
                  </Box>
                </TableCell>

                {orderedColumns.map((col) => {
                  const isRight = col.id === "details" || col.id === "actions";
                  const rightStyle =
                    isRight && rightOffsets[col.id] !== undefined
                      ? {
                          position: "sticky",
                          right: rightOffsets[col.id],
                          zIndex: 4,
                          backgroundColor:
                            theme.palette.mode === "dark"
                              ? theme.palette.grey[900]
                              : "#F9F9F9",
                        }
                      : {};
                  return (
                    <TableCell
                      key={col.id}
                      sx={{
                        cursor: col.sortable ? "pointer" : "default",
                        userSelect: "none",
                        ...rightStyle,
                        borderTopRightRadius:
                          col.id === "actions" ? "12px" : undefined,
                      }}
                      onClick={() => col.sortable && handleSort(col.id)}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        {col.label}
                        {col.sortable &&
                          (sortField !== col.id ? (
                            <ArrowUpDown size={16} color="#9CA3AF" />
                          ) : sortDirection === "asc" ? (
                            <ArrowUp size={16} color="#2563EB" />
                          ) : (
                            <ArrowDown size={16} color="#2563EB" />
                          ))}
                      </Box>
                      {col.id === "actions" && (
                        <IconButton
                          onClick={() => setChooserOpen(true)}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: "50%",
                            right: 8,
                            transform: "translateY(-50%)",
                            color: "#6B7280",
                          }}
                        >
                          <Settings2 size={18} />
                        </IconButton>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {loans.map((loan) => (
                <TableRow
                  key={loan.id}
                  selected={selectedSet.has(String(loan.id))}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => onDetails(loan)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedSet.has(String(loan.id))}
                      onChange={handleSelectRow(loan.id)}
                      onClick={(e) => e.stopPropagation()}
                      icon={checkboxIcon}
                      checkedIcon={checkboxCheckedIcon}
                    />
                  </TableCell>

                  {orderedColumns.map((col) => {
                    const isRight =
                      col.id === "details" || col.id === "actions";
                    const rightStyle =
                      isRight && rightOffsets[col.id] !== undefined
                        ? {
                            position: "sticky",
                            right: rightOffsets[col.id],
                            backgroundColor:
                              theme.palette.mode === "dark"
                                ? theme.palette.grey[900]
                                : "#F9F9F9",
                            zIndex: 3,
                          }
                        : {};
                    return (
                      <TableCell key={col.id} sx={rightStyle}>
                        {renderCell(loan, col)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <TablePagination
            component="div"
            count={totalLoans}
            page={page - 1}
            rowsPerPage={rowsPerPage}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={rowsPerPageOptions ?? [5, 10, 25]}
          />
        </Box>
      </Box>

      <ColumnChooserDialog
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        visibleIds={visibleIds}
        allColumns={dynamicAllColumns}
        defaultVisible={DEFAULT_VISIBLE}
        minCount={4}
        maxCount={7}
        onApply={(newVisible) => {
          // applyVisibleIds will mark as customized
          applyVisibleIds(newVisible);
          setChooserOpen(false);
        }}
        onReset={() => {
          resetToDefaults();
          setChooserOpen(false);
        }}
      />
    </>
  );
}
