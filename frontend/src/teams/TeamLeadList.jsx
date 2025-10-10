// src/teams/TeamLeadList.jsx
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
import {
  useGetTeamLeadsQuery,
  useDeleteTeamLeadMutation,
} from "../api/teamLeadApi";
import TeamLeadFormDialog from "./TeamLeadFormDialog";

const pageSize = 10;

const TeamLeadList = () => {
  const debounceRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderingField, setOrderingField] = useState("created_at");
  const [orderingDirection, setOrderingDirection] = useState("desc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeamLead, setSelectedTeamLead] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { data, isLoading, error, refetch } = useGetTeamLeadsQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    ordering: orderingDirection === "desc" ? `-${orderingField}` : orderingField,
  });

  const [deleteTeamLead, { isLoading: deleting }] = useDeleteTeamLeadMutation();

  const teamLeads = data?.results || [];
  const total = data?.count || 0;

  // ✅ Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split("|");
    setOrderingField(field);
    setOrderingDirection(direction);
    setPage(1);
  };

  const handleEdit = (teamLead) => {
    setSelectedTeamLead(teamLead);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTeamLead(id).unwrap();
      setSnackbar({
        open: true,
        message: "Team Lead deleted successfully",
        severity: "success",
      });
      refetch();
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to delete team lead",
        severity: "error",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) await deleteTeamLead(id).unwrap();
      setSnackbar({
        open: true,
        message: "Selected team leads deleted",
        severity: "success",
      });
      setSelectedIds([]);
      refetch();
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to delete selected team leads",
        severity: "error",
      });
    }
  };

  const handleCheckbox = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight="bold" color="primary">
          Team Lead Management
        </Typography>

        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={`${orderingField}|${orderingDirection}`}
              label="Sort"
              onChange={handleSortChange}
            >
              <MenuItem value="created_at|desc">Latest Added</MenuItem>
              <MenuItem value="lead|asc">Lead (A-Z)</MenuItem>
              <MenuItem value="lead|desc">Lead (Z-A)</MenuItem>
              <MenuItem value="updated_at|desc">Recently Updated</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Search Team Lead"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outlined" onClick={() => setSearch("")}>
            Clear
          </Button>

          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              color="error"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedTeamLead(null);
              setDialogOpen(true);
            }}
          >
            Add Team Lead
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>
          Error loading team leads. Please try again.
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      selectedIds.length === teamLeads.length &&
                      teamLeads.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(teamLeads.map((tl) => tl.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <strong>Team Lead</strong>
                </TableCell>
                <TableCell>
                  <strong>Members</strong>
                </TableCell>
                <TableCell>
                  <strong>Created At</strong>
                </TableCell>
                <TableCell>
                  <strong>Updated At</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamLeads.length > 0 ? (
                teamLeads.map((tl) => (
                  <Grow in key={tl.id} timeout={300}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(tl.id)}
                          onChange={() => handleCheckbox(tl.id)}
                        />
                      </TableCell>
                      <TableCell>{tl.lead_login_id || `#${tl.lead}`}</TableCell>
                      <TableCell>
                        {tl.member_login_ids?.length > 0
                          ? tl.member_login_ids.join(", ")
                          : "No Members"}
                      </TableCell>
                      <TableCell>
                        {tl.created_at
                          ? new Date(tl.created_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {tl.updated_at
                          ? new Date(tl.updated_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(tl)}>
                            <Edit color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDelete(tl.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No team leads found.
                  </TableCell>
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
      <TeamLeadFormDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        teamLead={selectedTeamLead}
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
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamLeadList;
