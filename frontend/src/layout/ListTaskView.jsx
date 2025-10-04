// TaskListTable.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Paper,
  Grid,
  TextField,
  IconButton,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Typography,
  useTheme,
  Checkbox,
  Collapse,
  Tooltip,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import { Trash2, Settings2 } from "lucide-react";

/**
 * TaskListTable — styled to match your LoanTable visual language.
 *
 * Props:
 *  - cards = [] (task array)
 *  - serverSide (bool)
 *  - page, rowsPerPage, totalCount, onPageChange, onRowsPerPageChange (pagination handlers)
 *  - onRowClick(task) optional
 *  - onSelectionChange(selectedIdsArray) optional (fired on selection changes)
 *  - onDelete(taskId) optional (used by bulk fallback)
 *  - onBulkDelete(selectedIdsArray) optional (preferred for bulk delete)
 *  - height = "72vh"
 */
export default function TaskListTable({
  cards = [],
  serverSide = false,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  totalCount = 0,
  onPageChange: onServerPageChange,
  onRowsPerPageChange: onServerRowsPerPageChange,
  onRowClick,
  onSelectionChange,
  onDelete, // optional single delete handler
  onBulkDelete, // optional bulk delete handler
  height = "72vh",
}) {
  const theme = useTheme();

  // UI state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(() => new Set());

  const effectivePage = serverSide ? controlledPage ?? 0 : page;
  const effectiveRowsPerPage = serverSide
    ? controlledRowsPerPage ?? rowsPerPage
    : rowsPerPage;

  const STATUS_LABELS = {
    "To Do": "To Do",
    TODO: "To Do",
    "In Progress": "In Progress",
    IN_PROGRESS: "In Progress",
    Done: "Done",
    DONE: "Done",
  };
  const displayStatus = (s) => STATUS_LABELS[s] || s || "-";

  const statusColor = useCallback((s) => {
    if (!s) return "default";
    const t = ("" + s).toLowerCase();
    if (t.includes("progress") || t.includes("in progress") || t.includes("doing"))
      return "primary";
    if (t.includes("pending") || t.includes("todo")) return "warning";
    if (t.includes("complete") || t.includes("done") || t.includes("closed"))
      return "success";
    if (t.includes("blocked")) return "error";
    return "default";
  }, []);

  // filtering
  const filtered = useMemo(() => {
    if (!cards) return [];
    const q = (search || "").trim().toLowerCase();
    return cards.filter((c) => {
      if (status !== "All" && (c.status || "All") !== status) return false;
      if (!q) return true;
      if ((c.title || "").toLowerCase().includes(q)) return true;
      if ((c.description || "").toLowerCase().includes(q)) return true;
      if (c.assignee && (c.assignee.name || "").toLowerCase().includes(q)) return true;
      if (c.assigner && (c.assigner.username || c.assigner.name || "").toLowerCase().includes(q)) return true;
      return false;
    });
  }, [cards, search, status]);

  const pagedRows = useMemo(() => {
    if (serverSide) return filtered; // server should send current page rows
    const start = effectivePage * effectiveRowsPerPage;
    return filtered.slice(start, start + effectiveRowsPerPage);
  }, [filtered, serverSide, effectivePage, effectiveRowsPerPage]);

  const effectiveTotal = serverSide ? totalCount : filtered.length;

  // pagination handlers
  const handleChangePage = useCallback(
    (e, newPage) => {
      if (serverSide) onServerPageChange && onServerPageChange(e, newPage);
      else setPage(newPage);
    },
    [serverSide, onServerPageChange]
  );
  const handleChangeRowsPerPage = useCallback(
    (e) => {
      const val = parseInt(e.target.value, 10);
      if (serverSide) onServerRowsPerPageChange && onServerRowsPerPageChange(e);
      else {
        setRowsPerPage(val);
        setPage(0);
      }
    },
    [serverSide, onServerRowsPerPageChange]
  );
  const clearFilters = () => {
    setSearch("");
    setStatus("All");
  };

  const statusOptions = useMemo(() => {
    const s = new Set(cards.map((c) => c.status).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [cards]);

  // selection state + callbacks
  useEffect(() => {
    if (onSelectionChange) onSelectionChange(Array.from(selected));
  }, [selected, onSelectionChange]);

  const toggleSelectOne = (id) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const allVisibleSelected = useMemo(() => {
    if (!pagedRows || pagedRows.length === 0) return false;
    return pagedRows.every((r) => selected.has(r.id));
  }, [pagedRows, selected]);

  const someVisibleSelected = useMemo(() => {
    if (!pagedRows || pagedRows.length === 0) return false;
    return pagedRows.some((r) => selected.has(r.id)) && !allVisibleSelected;
  }, [pagedRows, selected, allVisibleSelected]);

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (allVisibleSelected) pagedRows.forEach((r) => copy.delete(r.id));
      else pagedRows.forEach((r) => copy.add(r.id));
      return copy;
    });
  };

  // --- custom checkbox visuals (borrowed from your LoanTable) ---
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

  // bulk delete behavior: prefer onBulkDelete, fallback to calling onDelete per id
  const handleBulkDelete = async () => {
    const sel = Array.from(selected);
    if (!sel.length) return;
    if (!window.confirm(`Delete ${sel.length} selected tasks?`)) return;
    if (onBulkDelete) {
      await onBulkDelete(sel);
    } else if (onDelete) {
      for (const id of sel) {
        await onDelete(id);
      }
    }
    setSelected(new Set());
  };

  return (
    <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 250px)",
            }}
          >
      {/* Header / Filters */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={12}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={8} sm={9} md={10}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search tasks (title, description, assignee, assigner)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>

            <Grid item xs={4} sm={3} md={2}>
              <TextField
                select
                label="Status"
                size="small"
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterListIcon />}
                onClick={() => clearFilters()}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Styled Table (header + rows styled like LoanTable) */}
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
        <Table sx={{ "& .MuiTableCell-root": { borderBottom: "none" }, borderCollapse: "separate", borderSpacing: 0 }}>
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
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.grey[900] : "#F9F9F9",
                position: "sticky",
                top: 0,
                zIndex: 3,
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <TableRow sx={{ borderRadius: "12px" }}>
              <TableCell padding="checkbox" sx={{ borderTopLeftRadius: "12px" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Tooltip title="Select">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      icon={checkboxIcon}
                      checkedIcon={checkboxCheckedIcon}
                      inputProps={{ "aria-label": "select visible tasks" }}
                    />
                  </Tooltip>

                  <Tooltip title="Delete selected">
                    <Collapse in={selected.size > 0} orientation="horizontal" timeout={300}>
                      <span>
                        <IconButton color="error" aria-label="Delete selected" onClick={handleBulkDelete} sx={{ ml: 1 }}>
                          <Trash2 size={16} color="#9CA3AF" />
                        </IconButton>
                      </span>
                    </Collapse>
                  </Tooltip>

                  {/* Optional settings icon to match loan header look */}
                  
                </Box>
              </TableCell>

              <TableCell sx={{ width: 220, fontWeight: 700 }}>TITLE</TableCell>
              <TableCell sx={{ width: 320, fontWeight: 700 }}>DESCRIPTION</TableCell>
              <TableCell sx={{ width: 140, fontWeight: 700 }}>STATUS</TableCell>
              <TableCell sx={{ width: 160, fontWeight: 700 }}>ASSIGNEE</TableCell>
              <TableCell sx={{ width: 160, fontWeight: 700 }}>ASSIGNER</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pagedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">No tasks found.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((c) => {
                const isSelected = selected.has(c.id);
                return (
                  <TableRow
                    key={c.id}
                    hover
                    onClick={() => onRowClick && onRowClick(c)}
                    sx={{
                      cursor: onRowClick ? "pointer" : "default",
                      "&.Mui-selected, &.Mui-selected:hover": {
                        backgroundColor: theme.palette.action.selected,
                      },
                    }}
                    selected={isSelected}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectOne(c.id)}
                        icon={checkboxIcon}
                        checkedIcon={checkboxCheckedIcon}
                        inputProps={{ "aria-label": `select task ${c.id}` }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{c.title}</Typography>
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {c.description}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip label={displayStatus(c.column)} size="small" color={statusColor(c.column)} />
                    </TableCell>

                    {/* Assignee */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {c.assignee?.avatar ? (
                          <Avatar src={c.assignee.avatar} alt={c.assignee.name} sx={{ width: 28, height: 28 }} />
                        ) : (
                          <Avatar sx={{ width: 28, height: 28 }}>{(c.assignee?.name || "-").slice(0, 1)}</Avatar>
                        )}
                        <Typography noWrap>{c.assignee?.name ?? "Unassigned"}</Typography>
                      </Box>
                    </TableCell>

                    {/* Assigner */}
                    <TableCell>
                      <Typography noWrap>{c.assigner?.name ?? c.assigner?.username ?? "-"}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination right-aligned (like LoanTable) */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <TablePagination
          component="div"
          count={effectiveTotal}
          page={effectivePage}
          onPageChange={handleChangePage}
          rowsPerPage={effectiveRowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
}
