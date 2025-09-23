import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Pagination,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Grow,
} from "@mui/material";
import { Edit, Delete, Add as AddIcon } from "@mui/icons-material";
import {
  useGetTeamManagersQuery,
  useDeleteTeamManagerMutation,
} from "../api/teamManagerApi";
import TeamManagerFormDialog from "./TeamManagerFormDialog";

const pageSize = 10;

const TeamManagerList = () => {
  const debounceRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderingField, setOrderingField] = useState("created_at");
  const [orderingDirection, setOrderingDirection] = useState("desc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Fetch Team Managers
  const { data, isLoading, error, refetch } = useGetTeamManagersQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    ordering: orderingDirection === "desc" ? `-${orderingField}` : orderingField,
  });

  const [deleteTeamManager, { isLoading: deleting }] = useDeleteTeamManagerMutation();

  const managers = data?.results || [];
  const total = data?.count || 0;

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Handle sorting change
  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split("|");
    setOrderingField(field);
    setOrderingDirection(direction);
    setPage(1);
  };

  // Edit manager
  const handleEdit = (manager) => {
    setSelectedManager(manager);
    setDialogOpen(true);
  };

  // Delete single manager
  const handleDelete = async (id) => {
    try {
      await deleteTeamManager(id).unwrap();
      setSnackbar({ open: true, message: "Team Manager deleted successfully", severity: "success" });
      refetch();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete team manager", severity: "error" });
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => deleteTeamManager(id).unwrap()));
      setSnackbar({ open: true, message: "Selected team managers deleted", severity: "success" });
      setSelectedIds([]);
      refetch();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete selected team managers", severity: "error" });
    }
  };

  const handleCheckbox = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const allSelected = useMemo(() => selectedIds.length === managers.length && managers.length > 0, [selectedIds, managers]);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Team Manager Management
        </Typography>

        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select value={`${orderingField}|${orderingDirection}`} label="Sort" onChange={handleSortChange}>
              <MenuItem value="created_at|desc">Latest Added</MenuItem>
              <MenuItem value="manager|asc">Manager (A-Z)</MenuItem>
              <MenuItem value="manager|desc">Manager (Z-A)</MenuItem>
              <MenuItem value="updated_at|desc">Recently Updated</MenuItem>
            </Select>
          </FormControl>

          <TextField size="small" label="Search Manager" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant="outlined" onClick={() => setSearch("")}>Clear</Button>

          {selectedIds.length > 0 && (
            <Button variant="contained" color="error" onClick={handleBulkDelete} disabled={deleting}>
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedManager(null);
              setDialogOpen(true);
            }}
          >
            Add Team Manager
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>Error loading team managers. Please try again.</Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} onChange={(e) => setSelectedIds(e.target.checked ? managers.map((m) => m.id) : [])} />
                </TableCell>
                <TableCell><strong>Manager</strong></TableCell>
                <TableCell><strong>Team Leads</strong></TableCell>
                <TableCell><strong>Members</strong></TableCell>
                <TableCell><strong>Created At</strong></TableCell>
                <TableCell><strong>Updated At</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {managers.length ? (
                managers.map((m) => (
                  <Grow in key={m.id} timeout={300}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedIds.includes(m.id)} onChange={() => handleCheckbox(m.id)} />
                      </TableCell>
                      <TableCell>{m.manager_login_id || `#${m.manager}`}</TableCell>
                      <TableCell>{m.teamLead_login_ids?.join(", ") || "No Team Leads"}</TableCell>
                      <TableCell>{m.member_login_ids?.join(", ") || "No Members"}</TableCell>
                      <TableCell>{m.created_at ? new Date(m.created_at).toLocaleString() : "—"}</TableCell>
                      <TableCell>{m.updated_at ? new Date(m.updated_at).toLocaleString() : "—"}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(m)}><Edit color="primary" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(m.id)} color="error"><Delete /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">No team managers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
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

      {/* Add/Edit Dialog */}
      <TeamManagerFormDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        manager={selectedManager}
        onSave={() => {
          setDialogOpen(false);
          refetch();
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamManagerList;
