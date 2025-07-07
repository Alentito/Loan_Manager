import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem,
  Paper, Pagination, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery, Grow, Avatar
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useGetEmployeesQuery, useDeleteEmployeeMutation } from '../api/employeeApi';
import EmployeeFormDialog from './EmployeeFormDialog';

const pageSizeDefault = 10;

const EmployeeList = () => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderingField, setOrderingField] = useState('date_joined');
  const [orderingDirection, setOrderingDirection] = useState('desc');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const [toDeleteId, setToDeleteId] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [exportFormat, setExportFormat] = useState('');
  const debounceRef = useRef(null);

  const { data, error, isLoading, refetch } = useGetEmployeesQuery({
    page,
    page_size: pageSizeDefault,
    search: debouncedSearch,
    ordering: orderingDirection === 'desc' ? `-${orderingField}` : orderingField,
    position: positionFilter || undefined,
    status: statusFilter || undefined,
  });

  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation();
  const employees = data?.results || [];
  const total = data?.count || 0;

  // Debounce search input for user typing, but search only triggered by Search button
  useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setDebouncedSearch(search);
    setPage(1);
  }, 300);
  return () => clearTimeout(debounceRef.current);
}, [search]);

  const handleSelectAll = (e) => {
    setSelectedEmployees(e.target.checked ? employees.map(e => e.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Trigger search when Search button clicked
  const handleSearchButtonClick = () => {
    setDebouncedSearch(search.trim());
    setPage(1);
  };

  const handleExport = (format) => {
    const urls = {
      csv: 'http://localhost:8000/api/employees/export-csv/',  // Backend must handle exporting all fields except password
      xml: 'http://localhost:8000/api/employees/export-xml/',
    };
    if (urls[format]) window.open(urls[format], '_blank'); // reset selection after export
  };

  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split('_');
    setOrderingField(field);
    setOrderingDirection(direction);
    setPage(1);
  };

  const handleDeleteConfirm = (id) => {
    setIsBulkDelete(false);
    setToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
  try {
    if (isBulkDelete) {
      await Promise.all(selectedEmployees.map(id => deleteEmployee(id).unwrap()));
      toast.success('Selected employees deleted');
      setSelectedEmployees([]);
    } else {
      await deleteEmployee(toDeleteId).unwrap();
      toast.success('Employee deleted');
      setSelectedEmployees(prev => prev.filter(id => id !== toDeleteId));
    }
    refetch();
  } catch {
    toast.error('Failed to delete employee(s)');
  } finally {
    setDeleteDialogOpen(false);
    setToDeleteId(null);
    setIsBulkDelete(false);
  }
};


  const emptyRows = pageSizeDefault - employees.length;

  return (
    <Box p={isMobile ? 1 : 3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" color="primary" fontWeight="bold">Employee Management</Typography>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select value={`${orderingField}_${orderingDirection}`} label="Sort" onChange={handleSortChange}>
              <MenuItem value="date_joined_desc">Latest Added</MenuItem>
              <MenuItem value="name_asc">Name (A-Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>

        <TextField
  size="small"
  label="Search"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  sx={{ minWidth: 180 }}
/>
<Button
  variant="outlined"
  onClick={() => {
    setSearch('');
    setDebouncedSearch('');
    setPositionFilter('');
    setStatusFilter('');
    setPage(1);
  }}
>
  Clear
</Button>



          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Position</InputLabel>
            <Select value={positionFilter} label="Position" onChange={(e) => setPositionFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="junior_processor">Junior Processor</MenuItem>
              <MenuItem value="processor">Processor</MenuItem>
              <MenuItem value="team_lead">Team Lead</MenuItem>
              <MenuItem value="team_manager">Team Manager</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Export</InputLabel>
            <Select
              value={exportFormat}
              label="Export"
              onChange={(e) => {
                handleExport(e.target.value);
                setExportFormat('');
              }}
            >
              <MenuItem value="" disabled>Export</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setDialogOpen(true); setEditingEmployee(null); }} sx={{
              backgroundColor: "rgba(0, 60, 247, 1)",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(0, 50, 200, 1)", // optional hover color
              },
            }}>
            Add Employee
          </Button>
          {selectedEmployees.length > 0 && (
            <Button
  variant="outlined"
  color="error"
  onClick={() => {
    setIsBulkDelete(true);
    setDeleteDialogOpen(true);
  }}
>
  Delete Selected
</Button>

          )}
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>Error loading employees. Please try again.</Box>
      ) : (
        <TableContainer component={Paper} sx={{ minWidth: 1000 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedEmployees.length === employees.length && employees.length > 0}
                    indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < employees.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                {["Avatar", "Name", "Login ID", "Company Email", "Position", "Status", "Leave Balance", "Actions"].map((label, idx) => (
                  <TableCell key={idx}><strong>{label}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <Grow in key={emp.id} timeout={300}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={() => handleSelectOne(emp.id)}
                        />
                      </TableCell>

                      <TableCell>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: '#fff' }}>
                          {emp.name ? emp.name[0].toUpperCase() : '?'}
                        </Avatar>
                      </TableCell>

                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.login_id}</TableCell>
                      <TableCell>{emp.company_email}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell>
  <Box
    sx={{
      width: 100,
      height: 28,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 500,
      fontSize: '0.85rem',
      textTransform: 'capitalize',
      bgcolor: 
        emp.status === 'active'
          ? 'rgba(76, 175, 80, 0.2)'       // Green 50% soft
          : emp.status === 'inactive'
          ? 'rgba(244, 67, 54, 0.2)'       // Red 50% soft
          : 'rgba(255, 193, 7, 0.2)',      // Yellow 50% soft
      color: 
        emp.status === 'active'
          ? 'success.main'
          : emp.status === 'inactive'
          ? 'error.main'
          : 'warning.main',
    }}
  >
    {emp.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
  </Box>
</TableCell>

                      <TableCell>{emp.leave_balance !== undefined && emp.leave_balance !== null ? emp.leave_balance : '-'}</TableCell>

                      <TableCell>
                        <Tooltip title="View">
                          <IconButton onClick={() => { setViewingEmployee(emp); setViewDialogOpen(true); }}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => { setEditingEmployee(emp); setDialogOpen(true); }}>
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteConfirm(emp.id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))
              ) : (
                <TableRow><TableCell colSpan={9} align="center">No employees found.</TableCell></TableRow>
              )}

              {emptyRows > 0 && employees.length > 0 && (
                Array.from(Array(emptyRows)).map((_, idx) => (
                  <TableRow key={`empty-${idx}`} style={{ height: 53 }}>
                    <TableCell colSpan={9} />
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination
          count={Math.ceil(total / pageSizeDefault)}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          disabled={isLoading}
        />
      </Box>

      {/* Add/Edit Form */}
      <EmployeeFormDialog
        open={dialogOpen}
        onClose={(updated) => {
          setDialogOpen(false);
          setEditingEmployee(null);
          if (updated) refetch();
        }}
        initialData={editingEmployee}
      />

      {/* Delete Confirm */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Are you sure you want to delete this employee?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle height={60} bgcolor="primary.main" mb={3} >Employee Details</DialogTitle>
        <DialogContent dividers>
          {viewingEmployee && (
            <Box display="flex" flexDirection="column" gap={1}>
              {[
                ['Name', viewingEmployee.name],
                ['Login ID', viewingEmployee.login_id],
                ['Company Email', viewingEmployee.company_email],
                ['Contact Number', viewingEmployee.contact_number],
                ['Position', viewingEmployee.position],
                ['Status', viewingEmployee.status],
                ['Bank Name', viewingEmployee.bank_name],
                ['Account Number', viewingEmployee.account_number],
                ['Address', viewingEmployee.address],
                ['Experience (Months)', viewingEmployee.experience_months],
                ['Performance Score', viewingEmployee.performance_score],
                // Exclude password in view details for security
                ['Date Joined', new Date(viewingEmployee.date_joined).toLocaleString()],
                ['Last Updated', new Date(viewingEmployee.updated_at).toLocaleString()],
                ['Leave Balance', viewingEmployee.leave_balance !== undefined && viewingEmployee.leave_balance !== null ? viewingEmployee.leave_balance : '-'],
              ].map(([label, value]) => (
                <Typography key={label}><strong>{label}:</strong> {value || '-'}</Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained" color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
