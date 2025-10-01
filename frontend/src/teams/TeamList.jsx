// src/teams/TeamList.jsx
import React, { useState, useEffect, useRef } from "react";
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
import { useGetTeamsQuery, useDeleteTeamMutation } from "../api/teamApi";
import TeamFormDialog from "./TeamFormDialog";

const pageSize = 10;

const TeamList = () => {
  const debounceRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at"); // default sorting

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data, isLoading, error, refetch } = useGetTeamsQuery({
    page:1,
    page_size: 10,
    search: debouncedSearch,
    ordering,
  });

  const [deleteTeam, { isLoading: deleting }] = useDeleteTeamMutation();
  const teams = data?.results || [];
  const total = data?.count || 0;

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleSortChange = (e) => {
    setOrdering(e.target.value);
    setPage(1); // reset to first page on sort
  };

  const handleEdit = (team) => {
    setSelectedTeam(team);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTeam(id).unwrap();
      setSnackbar({ open: true, message: "Team deleted successfully", severity: "success" });
      refetch();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete team", severity: "error" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) await deleteTeam(id).unwrap();
      setSnackbar({ open: true, message: "Selected teams deleted", severity: "success" });
      setSelectedIds([]);
      refetch();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete selected teams", severity: "error" });
    }
  };

  const handleCheckbox = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : "—";

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Team Management
        </Typography>

        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          {/* Sorting */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={ordering} label="Sort By" onChange={handleSortChange}>
              <MenuItem value="-created_at">Latest Added</MenuItem>
              <MenuItem value="name">Team Name (A-Z)</MenuItem>
              <MenuItem value="-name">Team Name (Z-A)</MenuItem>
              <MenuItem value="manager__name">Manager (A-Z)</MenuItem>
              <MenuItem value="-manager__name">Manager (Z-A)</MenuItem>
              <MenuItem value="head__name">Head (A-Z)</MenuItem>
              <MenuItem value="-head__name">Head (Z-A)</MenuItem>
              <MenuItem value="-updated_at">Recently Updated</MenuItem>
            </Select>
          </FormControl>

          {/* Search */}
          <TextField size="small" label="Search Team" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant="outlined" onClick={() => setSearch("")}>
            Clear
          </Button>

          {/* Bulk Delete */}
          {selectedIds.length > 0 && (
            <Button variant="contained" color="error" onClick={handleBulkDelete} disabled={deleting}>
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          {/* Add Team */}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedTeam(null); setDialogOpen(true); }}>
            Add Team
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>Error loading teams. Please try again.</Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.length === teams.length && teams.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < teams.length}
                    onChange={(e) => { e.target.checked ? setSelectedIds(teams.map((t) => t.id)) : setSelectedIds([]); }}
                  />
                </TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Team Manager</strong></TableCell>
                <TableCell><strong>Team Head</strong></TableCell>
                <TableCell><strong>Shift</strong></TableCell>
                <TableCell><strong>Created At</strong></TableCell>
                <TableCell><strong>Updated At</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <Grow in key={team.id} timeout={300}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(team.id)}
                          onChange={() => handleCheckbox(team.id)}
                        />
                      </TableCell>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.manager_name || "—"}</TableCell>
                      <TableCell>{team.head_name || "—"}</TableCell>
                      <TableCell>{team.shift_name || "—"}</TableCell>
                      <TableCell>{formatDate(team.created_at)}</TableCell>
                      <TableCell>{formatDate(team.updated_at)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(team)}>
                            <Edit color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(team.id)} color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No teams found.</TableCell>
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
      <TeamFormDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        team={selectedTeam}
        onSave={() => { setDialogOpen(false); refetch(); }}
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

export default TeamList;
