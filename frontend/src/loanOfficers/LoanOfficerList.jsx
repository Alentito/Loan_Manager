// src/components/loanOfficers/LoanOfficerList.js
import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  Grow,
  Snackbar,
  CircularProgress,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-hot-toast';
import LoanOfficerFormDialog from './LoanOfficerFormDialog';
import {
  useGetLoanOfficersQuery,
  useDeleteLoanOfficerMutation,
} from '../api/loanOfficerApi';

const pageSizeDefault = 10;

const LoanOfficerList = () => {
  const isMobile = useMediaQuery('(max-width:600px)');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderingField, setOrderingField] = useState('created_at');
  const [orderingDirection, setOrderingDirection] = useState('desc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);

  const [selectedOfficers, setSelectedOfficers] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const debounceRef = useRef(null);

  const { data, isLoading, refetch } = useGetLoanOfficersQuery({
    page,
    page_size: pageSizeDefault,
    search: debouncedSearch,
    ordering: orderingDirection === 'desc' ? `-${orderingField}` : orderingField,
  });

  const [deleteLoanOfficer] = useDeleteLoanOfficerMutation();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleAddClick = () => {
    setEditingOfficer(null);
    setDialogOpen(true);
  };

  const handleEditClick = (officer) => {
    setEditingOfficer(officer);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = (id) => {
    setToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteLoanOfficer(toDeleteId).unwrap();
      toast.success('Loan Officer deleted successfully');
      refetch();
    } catch {
      toast.error('Failed to delete loan officer');
    }
    setDeleteDialogOpen(false);
    setToDeleteId(null);
    setSelectedOfficers((prev) => prev.filter((id) => id !== toDeleteId));
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedOfficers.map((id) => deleteLoanOfficer(id).unwrap()));
      setSnackbarMsg('Selected loan officers deleted successfully');
      setSelectedOfficers([]);
      refetch();
    } catch {
      setSnackbarMsg('Failed to delete some loan officers');
    }
    setBulkDeleteDialogOpen(false);
  };

  const handleSelectAll = (e) => {
    setSelectedOfficers(e.target.checked ? data?.results.map((lo) => lo.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedOfficers((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleExport = (format) => {
    const map = {
      csv: 'loan-officers/export-csv/',
      xml: 'loan-officers/export-xml/',
    };
    if (format && map[format]) window.open(`http://localhost:8000/api/${map[format]}`, '_blank');
  };

  const total = data?.count || 0;
  const loanOfficers = data?.results || [];
  const emptyRows = pageSizeDefault - loanOfficers.length;

  return (
    <Box p={isMobile ? 1 : 3}>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={1} flexWrap="wrap">
        <Typography variant="h5" color="primary" fontWeight="bold">
          Loan Officer Management
        </Typography>

        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={`${orderingField}_${orderingDirection}`}
              label="Sort"
              onChange={(e) => {
                const [field, direction] = e.target.value.split('_');
                setOrderingField(field);
                setOrderingDirection(direction);
                setPage(1);
              }}
            >
              <MenuItem value="created_at_desc">Latest Added</MenuItem>
              <MenuItem value="name_asc">Name (A-Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outlined" onClick={() => setSearch('')}>Clear</Button>
          

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Export</InputLabel>
            <Select defaultValue="" onChange={(e) => handleExport(e.target.value)} label="Export">
              <MenuItem value="" disabled>Export</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} sx={{
              backgroundColor: "rgba(0, 60, 247, 1)",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(0, 50, 200, 1)", // optional hover color
              },
            }}>Add Loan Officer</Button>
          {selectedOfficers.length > 0 && (
            <Button variant="outlined" color="error" onClick={() => setBulkDeleteDialogOpen(true)}>
              Delete Selected
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ minWidth: 1200 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedOfficers.length === loanOfficers.length && loanOfficers.length > 0}
                  indeterminate={selectedOfficers.length > 0 && selectedOfficers.length < loanOfficers.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {["Avatar","Name", "Email", "Contact", "NMLS", "Broker Company", "Created At", "Updated At", "Actions"].map((label, i) => (
                <TableCell key={i}><strong>{label}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : loanOfficers.length > 0 ? (
              loanOfficers.map((officer) => (
                <Grow key={officer.id} in timeout={300}>
                  <TableRow hover sx={{ '& > *': { height: 40 } }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedOfficers.includes(officer.id)}
                        onChange={() => handleSelectOne(officer.id)}
                      />
                    </TableCell>
                    
                    <TableCell>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: '#fff' }}>
                                              {officer.name ? officer.name[0].toUpperCase() : '?'}
                                            </Avatar>
                                            
                                          </TableCell>
                    <TableCell>{officer.name}</TableCell>
                    <TableCell>{officer.email}</TableCell>
                    <TableCell>{officer.contact_number}</TableCell>
                    <TableCell>{officer.NMLS}</TableCell>
                    <TableCell>{officer.broker_company_name}</TableCell>
                    <TableCell>{new Date(officer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(officer.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditClick(officer)}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteConfirm(officer.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </Grow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No loan officers found.
                </TableCell>
              </TableRow>
            )}

            {emptyRows > 0 && loanOfficers.length > 0 &&
              Array.from(Array(emptyRows)).map((_, idx) => (
                <TableRow key={`empty-${idx}`} style={{ height: 53 }}>
                  <TableCell colSpan={9} />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination
          count={Math.ceil(total / pageSizeDefault)}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>

      <LoanOfficerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingOfficer={editingOfficer}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
          setSelectedOfficers([]);
        }}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Are you sure you want to delete this loan officer?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)}>
        <DialogTitle>Are you sure you want to delete selected loan officers?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleBulkDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg('')}
        message={snackbarMsg}
      />
    </Box>
  );
};

export default LoanOfficerList;
