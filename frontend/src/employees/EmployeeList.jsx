import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem,
  Paper, Pagination, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery, Grow,
  Avatar, Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import {
  useGetEmployeesQuery,
  useDeleteEmployeeMutation,
  useUnarchiveEmployeeMutation,
} from '../api/employeeApi';
import EmployeeFormDialog from './EmployeeFormDialog';
import { useGetTeamsQuery } from '../api/teamApi';
import { useGetShiftsQuery } from '../api/shiftApi';
import { useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../api/authSlice";


const pageSizeDefault = 10;

const EmployeeList = () => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderingField, setOrderingField] = useState('created_at'); // 🔁 was date_joined
  const [orderingDirection, setOrderingDirection] = useState('desc');
  const [positionFilter, setPositionFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // Archive/Unarchive state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [exportFormat, setExportFormat] = useState('');

  const debounceRef = useRef(null);
  const { data: teamsData } = useGetTeamsQuery({ page: 1, page_size: 100 });
  const { data: shiftsData } = useGetShiftsQuery({ page: 1, page_size: 100 });

  const currentUser = useSelector(selectCurrentUser);
  const userPermissions = currentUser?.permissions || [];
  // ▶️ Query employees (active or archived)
  const { data, error, isLoading, refetch } = useGetEmployeesQuery({
    page,
    page_size: pageSizeDefault,
    search: debouncedSearch,
    ordering: orderingDirection === 'desc' ? `-${orderingField}` : orderingField,
    position: positionFilter || undefined,
    team: teamFilter || undefined,
    primary_shift: shiftFilter || undefined,
    manager: managerFilter || undefined,
    is_archived: showArchived, // 🔁 new
  });

  const navigate = useNavigate();

  // Mutations
  const [archiveEmployee, { isLoading: archiving }] = useDeleteEmployeeMutation();
  const [unarchiveEmployee, { isLoading: unarchiving }] = useUnarchiveEmployeeMutation();

  const employees = data?.results || [];
  const total = data?.count || 0;

  // Debounce search typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleSelectAll = (e) => {
    e.stopPropagation();
    setSelectedEmployees(e.target.checked ? employees.map(e => e.id) : []);
  };

  const handleRowClick = (empId) => {
    if (userPermissions.includes("employee.view_employee")) {
      navigate(`/attendance/${empId}`);
    } else {
      toast.error("You do not have permission to view employee attendance.");
    }
  };


  const handleSelectOne = (e, id) => {
    e.stopPropagation();
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split('_');
    setOrderingField(field);
    setOrderingDirection(direction);
    setPage(1);
  };

  // Archive/Unarchive helpers
  const runArchiveAction = async (ids, unarchive = false) => {
    try {
      const fn = unarchive ? unarchiveEmployee : archiveEmployee;
      await Promise.all(ids.map(id => fn(id).unwrap()));
      toast.success(unarchive ? 'Unarchived successfully' : 'Archived successfully');
      setSelectedEmployees(prev => prev.filter(id => !ids.includes(id)));
      refetch();
    } catch (e) {
      toast.error(`Failed to ${unarchive ? 'unarchive' : 'archive'} employee(s)`);
    }
  };

  const confirmSingle = (id) => {
    setTargetId(id);
    setConfirmDialogOpen(true);
  };

  const handleConfirmSingle = async () => {
    await runArchiveAction([targetId], showArchived); // if viewing archived -> unarchive
    setConfirmDialogOpen(false);
    setTargetId(null);
  };

  const handleConfirmBulk = async () => {
    await runArchiveAction(selectedEmployees, showArchived);
    setConfirmBulkOpen(false);
  };

  const handleExport = (format) => {
  const map = {
    excel: 'export/employees/excel/',
    pdf: 'export/employees/pdf/',
  };

  if (format && map[format]) {
    window.open(`http://localhost:8000/api/${map[format]}`, '_blank');
  }
};



  const emptyRows = pageSizeDefault - employees.length;

  return (
    <Box p={isMobile ? 1 : 3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" color="primary" fontWeight="bold">
          {showArchived ? 'Archived Employees' : 'Employee Management'}
        </Typography>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select value={`${orderingField}_${orderingDirection}`} label="Sort" onChange={handleSortChange}>
              <MenuItem value="created_at_desc">Latest Added</MenuItem>
              <MenuItem value="name_asc">Name (A-Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>

          <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 180 }} />
          <Button
            variant="outlined"
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setPositionFilter('');
              setTeamFilter('');
              setShiftFilter('');
              setPage(1);
            }}
          >
            Clear
          </Button>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Manager</InputLabel>
            <Select
              value={managerFilter}
              label="Manager"
              onChange={(e) => setManagerFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {(teamsData?.results || []).map((team) => (
                <MenuItem key={team.manager} value={team.manager}>
                  {team.manager_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Team</InputLabel>
            <Select value={teamFilter} label="Team" onChange={(e) => setTeamFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {(teamsData?.results || []).map((team) => (
                <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Export</InputLabel>
            <Select
              value={exportFormat}
              label="Export"
              onChange={(e) => {
                handleExport(e.target.value);
                setExportFormat(''); // Reset select after export
              }}
            >
              <MenuItem value="" disabled>
                Export
              </MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
            </Select>
          </FormControl>


          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setDialogOpen(true); setEditingEmployee(null); }}>
            Add Employee
          </Button>

          {selectedEmployees.length > 0 && (
            <Button
              variant="outlined"
              color={showArchived ? 'primary' : 'error'}
              onClick={() => setConfirmBulkOpen(true)}
            >
              {showArchived ? 'Unarchive Selected' : 'Archive Selected'}
            </Button>
          )}

          <Box display="flex" alignItems="center">
            <Typography variant="body2" sx={{ mr: 1 }}>Show Archived</Typography>
            <Switch
              checked={showArchived}
              onChange={(e) => {
                setShowArchived(e.target.checked);
                setPage(1);
                setSelectedEmployees([]);
              }}
            />
          </Box>
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
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                {[
                  'Avatar', 'Name', 'Login ID', 'Company Email', 'Contact No:', 'Team Manager', 'Team Lead', 'Primary Shift',
                  ...(showArchived ? ['Archived At'] : []),
                  'Actions'
                ].map((label, idx) => (
                  <TableCell key={idx}><strong>{label}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <Grow in key={emp.id} timeout={300}>
                    <TableRow
                      hover
                      onClick={() => handleRowClick(emp.id)}   // ✅ redirect to attendance calendar
                      sx={{
                        cursor: "pointer",
                        ...(emp.is_archived ? { backgroundColor: "#f7f7f7" } : {}),
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={(e) => handleSelectOne(e, emp.id)}
                          onClick={(e) => e.stopPropagation()}
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
                      <TableCell>{emp.contact_number}</TableCell>
                      <TableCell>{emp.team_manager_name || '-'}</TableCell>
                      <TableCell>{emp.team_name || '-'}</TableCell>
                      <TableCell>{emp.primary_shift_name || '-'}</TableCell>

                      {showArchived && (
                        <TableCell>{emp.archived_at ? new Date(emp.archived_at).toLocaleDateString() : '-'}</TableCell>
                      )}

                      <TableCell>
                        <Tooltip title="View">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingEmployee(emp);
                              setViewDialogOpen(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEmployee(emp);
                              setDialogOpen(true);
                            }}
                          >
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={showArchived ? 'Unarchive' : 'Archive'}>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmSingle(emp.id);
                            }}
                          >
                            {showArchived ? <RestoreIcon color="primary" /> : <DeleteIcon color="error" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={showArchived ? 10 : 9} align="center">No employees found.</TableCell>
                </TableRow>
              )}
              {emptyRows > 0 && employees.length > 0 && (
                Array.from({ length: emptyRows }).map((_, idx) => (
                  <TableRow key={`empty-${idx}`} style={{ height: 53 }}>
                    <TableCell colSpan={showArchived ? 10 : 9} />
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

      {/* Confirm Single */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          {showArchived ? 'Unarchive this employee?' : 'Archive this employee?'}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            color={showArchived ? 'primary' : 'error'}
            onClick={handleConfirmSingle}
            disabled={archiving || unarchiving}
          >
            {showArchived ? 'Unarchive' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Bulk */}
      <Dialog open={confirmBulkOpen} onClose={() => setConfirmBulkOpen(false)}>
        <DialogTitle>
          {showArchived ? 'Unarchive selected employees?' : 'Archive selected employees?'}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmBulkOpen(false)}>Cancel</Button>
          <Button
            color={showArchived ? 'primary' : 'error'}
            onClick={handleConfirmBulk}
            disabled={archiving || unarchiving}
          >
            {showArchived ? 'Unarchive Selected' : 'Archive Selected'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle height={60} bgcolor="primary.main" mb={3}>Employee Details</DialogTitle>
        <DialogContent dividers>
          {viewingEmployee && (
            <Box display="flex" flexDirection="column" gap={1}>
              {[
                ['Name', viewingEmployee.name],
                ['Login ID', viewingEmployee.login_id],
                ['Company Email', viewingEmployee.company_email],
                ['Contact Number', viewingEmployee.contact_number],
                ['Roles', viewingEmployee.roles],
                ['Team Manager', viewingEmployee.team_manager_name],
                ['Team Lead', viewingEmployee.team_name],
                ['Primary Shift', viewingEmployee.primary_shift_name],
                //['Alternative Shift', viewingEmployee.alternate_shift_name],
                ['Created At', new Date(viewingEmployee.created_at).toLocaleString()],
                ['Last Updated', new Date(viewingEmployee.updated_at).toLocaleString()],
                ['Archived At', viewingEmployee.archived_at ? new Date(viewingEmployee.archived_at).toLocaleString() : '-'],
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
