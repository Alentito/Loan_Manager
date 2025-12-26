import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  IconButton, Avatar, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Tooltip, Pagination, Grow, Dialog, DialogActions, DialogTitle, DialogContent, Snackbar, Alert, Switch
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Restore as RestoreIcon } from "@mui/icons-material";
import {
  useGetLendersQuery,
  useDeleteLenderMutation,
  useArchiveLenderMutation,
  useUnarchiveLenderMutation
} from "../api/lenderApiSlice";
import LenderFormDialog from "./LenderFormDialog";

const pageSize = 10;

const LenderList = () => {
  const debounceRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderingField, setOrderingField] = useState("created_at");
  const [orderingDirection, setOrderingDirection] = useState("desc");
  const [showArchived, setShowArchived] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLender, setEditingLender] = useState(null);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLender, setViewingLender] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [toArchiveId, setToArchiveId] = useState(null);

  const [selectedLenders, setSelectedLenders] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const { data, error, isLoading, refetch } = useGetLendersQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    ordering: orderingDirection === "desc" ? `-${orderingField}` : orderingField,
    archived: showArchived ? "true" : "false",
  });

  const [deleteLender, { isLoading: deleting }] = useDeleteLenderMutation();
  const [archiveLender] = useArchiveLenderMutation();
  const [unarchiveLender] = useUnarchiveLenderMutation();

  const lenders = data?.results || [];
  const total = data?.count || 0;
  const emptyRows = pageSize - lenders.length;

  // Debounce search
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

  // Delete
  const handleDeleteClick = (id) => { setToDeleteId(id); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    try {
      await deleteLender(toDeleteId).unwrap();
      setSnackbarMessage("Lender deleted successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      refetch();
    } catch {
      setSnackbarMessage("Failed to delete lender");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setToDeleteId(null);
    }
  };

  // Archive/Unarchive
  const handleArchiveConfirm = (id) => { setToArchiveId(id); setArchiveDialogOpen(true); };
  const handleArchiveAction = async (id, unarchive = false) => {
    try {
      const fn = unarchive ? unarchiveLender : archiveLender;
      await fn(id).unwrap();
      setSnackbarMessage(unarchive ? "Unarchived successfully" : "Archived successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      refetch();
      setSelectedLenders((prev) => prev.filter(l => l !== id));
    } catch {
      setSnackbarMessage(`Failed to ${unarchive ? "unarchive" : "archive"} lender`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setArchiveDialogOpen(false);
      setToArchiveId(null);
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(selectedLenders.map(id => (showArchived ? unarchiveLender(id) : archiveLender(id)).unwrap()));
      setSnackbarMessage(showArchived ? "Unarchived selected successfully" : "Archived selected successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setSelectedLenders([]);
      refetch();
    } catch {
      setSnackbarMessage(`Failed to ${showArchived ? "unarchive" : "archive"} selected lenders`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Selection
  const handleSelectAll = (e) => setSelectedLenders(e.target.checked ? lenders.map(l => l.id) : []);
  const handleSelectOne = (id) => setSelectedLenders(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" color="primary" fontWeight="bold">{showArchived ? "Archived Lenders" : "Lender Management"}</Typography>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select value={`${orderingField}|${orderingDirection}`} label="Sort" onChange={handleSortChange}>
              <MenuItem value="created_at|desc">Latest Added</MenuItem>
              <MenuItem value="lender_name|asc">Name (A-Z)</MenuItem>
              <MenuItem value="lender_name|desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>

          <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant="outlined" onClick={() => setSearch("")}>Clear</Button>

          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setDialogOpen(true); setEditingLender(null); }}>
            Add Lender
          </Button>

          <Box display="flex" alignItems="center">
            <Typography variant="body2" sx={{ mr: 1 }}>Show Archived</Typography>
            <Switch checked={showArchived} onChange={(e) => { setShowArchived(e.target.checked); setSelectedLenders([]); setPage(1); }} />
          </Box>

          {selectedLenders.length > 0 && (
            <Button variant="outlined" color={showArchived ? "success" : "secondary"} onClick={handleBulkArchive}>
              {showArchived ? "Unarchive Selected" : "Archive Selected"}
            </Button>
          )}
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>Error loading lenders.</Box>
      ) : (
        <TableContainer component={Paper} sx={{ minWidth: 900 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input type="checkbox" checked={selectedLenders.length === lenders.length && lenders.length > 0} onChange={handleSelectAll} />
                </TableCell>
                {["Avatar","Lender Name","AE Name","Executive Email","Manager Name","Manager Email","Actions"].map((label, i) => <TableCell key={i}><strong>{label}</strong></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {lenders.length > 0 ? lenders.map((lender) => (
                <Grow in key={lender.id} timeout={300}>
                  <TableRow hover sx={lender.is_archived ? { backgroundColor: "#f0f0f0" } : {}}>
                    <TableCell padding="checkbox">
                      <input type="checkbox" checked={selectedLenders.includes(lender.id)} onChange={() => handleSelectOne(lender.id)} />
                    </TableCell>
                    <TableCell><Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: '#fff' }}>{lender.lender_name?.[0].toUpperCase()}</Avatar></TableCell>
                    <TableCell>{lender.lender_name}</TableCell>
                    <TableCell>{lender.account_executive_name || '-'}</TableCell>
                    <TableCell>{lender.executive_email}</TableCell>
                    <TableCell>{lender.account_manager_name || '-'}</TableCell>
                    <TableCell>{lender.manager_email}</TableCell>
                    <TableCell>
                      <Tooltip title="View"><IconButton onClick={() => { setViewingLender(lender); setViewDialogOpen(true); }}><VisibilityIcon /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton onClick={() => { setEditingLender(lender); setDialogOpen(true); }}><EditIcon color="primary" /></IconButton></Tooltip>
                      <Tooltip title={showArchived ? "Unarchive" : "Archive"}>
                        <IconButton onClick={() => handleArchiveConfirm(lender.id)}>
                          {showArchived ? <RestoreIcon color="success" /> : <DeleteIcon color="error" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </Grow>
              )) : (
                <TableRow><TableCell colSpan={8} align="center">No lenders found.</TableCell></TableRow>
              )}
              {emptyRows > 0 && lenders.length > 0 && Array.from(Array(emptyRows)).map((_, idx) => (
                <TableRow key={`empty-${idx}`} style={{ height: 53 }}><TableCell colSpan={8} /></TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination count={Math.ceil(total / pageSize)} page={page} onChange={(_, newPage) => setPage(newPage)} color="primary" showFirstButton showLastButton disabled={isLoading} />
      </Box>

      {/* Add/Edit Dialog */}
      <LenderFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editingLender={editingLender} onSuccess={() => refetch()} />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "#fff" }}>Lender Details</DialogTitle>
        <DialogContent dividers>
          {viewingLender && (
            <Box display="flex" flexDirection="column" gap={1}>
              {Object.entries(viewingLender).map(([key, value]) => (
                <Typography key={key}><strong>{key.replace(/_/g,' ')}:</strong> {value || '-'}</Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained" color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Lender</DialogTitle>
        <DialogContent>Are you sure you want to delete this lender?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={confirmDelete} disabled={deleting}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Archive/Unarchive Confirmation */}
      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)}>
        <DialogTitle>{showArchived ? "Unarchive this lender?" : "Archive this lender?"}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
          <Button color={showArchived ? "primary" : "error"} onClick={() => handleArchiveAction(toArchiveId, showArchived)}>
            {showArchived ? "Unarchive" : "Archive"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LenderList;
