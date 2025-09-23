import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  IconButton, Avatar, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Tooltip, Pagination, Grow, Dialog, DialogActions, DialogTitle, DialogContent, Snackbar, Alert
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import { useGetLendersQuery, useDeleteLenderMutation } from "../api/lenderApiSlice";
import LenderFormDialog from "./LenderFormDialog";

const pageSize = 10;

const LenderList = () => {
  const debounceRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderingField, setOrderingField] = useState("created_at");
  const [orderingDirection, setOrderingDirection] = useState("desc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLender, setEditingLender] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLender, setViewingLender] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const { data, error, isLoading, refetch } = useGetLendersQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    ordering: orderingDirection === "desc" ? `-${orderingField}` : orderingField,
  });

  const [deleteLender, { isLoading: deleting }] = useDeleteLenderMutation();
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

  const handleDeleteClick = (id) => {
    setToDeleteId(id);
    setDeleteDialogOpen(true);
  };

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

  const handleExport = (format) => {
    const urls = {
      csv: "http://localhost:8000/api/lenders/export-csv/",
      xml: "http://localhost:8000/api/lenders/export-xml/",
    };
    if (urls[format]) window.open(urls[format], "_blank");
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" color="primary" fontWeight="bold">Lender Management</Typography>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={`${orderingField}|${orderingDirection}`}
              label="Sort"
              onChange={handleSortChange}
            >
              <MenuItem value="created_at|desc">Latest Added</MenuItem>
              <MenuItem value="lender_name|asc">Name (A-Z)</MenuItem>
              <MenuItem value="lender_name|desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>

          <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant="outlined" onClick={() => setSearch("")}>Clear</Button>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Export</InputLabel>
            <Select defaultValue="" label="Export" onChange={(e) => handleExport(e.target.value)}>
              <MenuItem value="" disabled>Export</MenuItem>
              <MenuItem value="csv">Excel</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setDialogOpen(true); setEditingLender(null); }}>
            Add Lender
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>Error loading lenders. Please try again.</Box>
      ) : (
        <TableContainer component={Paper} sx={{ minWidth: 900 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {["Avatar", "Lender Name", "AE Name", "Executive Email", "Manager Name", "Manager Email", "Actions"].map((label, idx) => (
                  <TableCell key={idx}><strong>{label}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {lenders.length > 0 ? lenders.map((lender) => (
                <Grow in key={lender.id} timeout={300}>
                  <TableRow hover>
                    <TableCell>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: '#fff' }}>
                        {lender.lender_name ? lender.lender_name[0].toUpperCase() : '?'}
                      </Avatar>
                    </TableCell>
                    <TableCell>{lender.lender_name}</TableCell>
                    <TableCell>{lender.account_executive_name || '-'}</TableCell>
                    <TableCell>{lender.executive_email}</TableCell>
                    <TableCell>{lender.account_manager_name || '-'}</TableCell>
                    <TableCell>{lender.manager_email}</TableCell>
                    <TableCell>
                      <Tooltip title="View">
                        <IconButton onClick={() => { setViewingLender(lender); setViewDialogOpen(true); }}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => { setEditingLender(lender); setDialogOpen(true); }}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteClick(lender.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </Grow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">No lenders found.</TableCell>
                </TableRow>
              )}
              {emptyRows > 0 && lenders.length > 0 && Array.from(Array(emptyRows)).map((_, idx) => (
                <TableRow key={`empty-${idx}`} style={{ height: 53 }}>
                  <TableCell colSpan={7} />
                </TableRow>
              ))}
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
      <LenderFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingLender={editingLender}
        onSuccess={() => refetch()}
      />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "#fff" }}>Lender Details</DialogTitle>
        <DialogContent dividers>
          {viewingLender && (
            <Box display="flex" flexDirection="column" gap={1}>
              {[
                ['Lender Name', viewingLender.lender_name],
                ['Account Executive Name', viewingLender.account_executive_name],
                ['Executive Email', viewingLender.executive_email],
                ['Executive Phone', viewingLender.executive_phone],
                ['Executive Address', viewingLender.executive_address],
                ['Account Manager Name', viewingLender.account_manager_name],
                ['Manager Email', viewingLender.manager_email],
                ['Manager Contact', viewingLender.manager_contact],
                ['Manager Address', viewingLender.manager_address],
                ['Mortgage Clause', viewingLender.mortgage_clause],
                ['Created At', viewingLender.created_at ? new Date(viewingLender.created_at).toLocaleString() : '-'],
              ].map(([label, value]) => (
                <Typography key={label} sx={{ wordBreak: 'break-word' }}>
                  <strong>{label}:</strong> {value || '-'}
                </Typography>
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

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LenderList;
