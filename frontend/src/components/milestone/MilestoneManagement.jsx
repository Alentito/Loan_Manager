import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Checkbox,
  Toolbar,
  Tooltip,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import {
  useGetMilestonesQuery,
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useBulkDeleteMilestonesMutation,
} from './../../api/milestoneApi';
import MilestoneFormDialog from './MilestoneFormDialog';

export default function MilestoneManagement() {
  const theme = useTheme();
  const permissions = useSelector(state => state.auth.user?.permissions || []);

  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [formDialog, setFormDialog] = useState({ open: false, milestone: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, milestone: null });
  const [menuAnchor, setMenuAnchor] = useState({ el: null, milestone: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Permissions
  const canCreate = permissions.includes('loan.add_milestone');
  const canEdit = permissions.includes('loan.change_milestone');
  const canDelete = permissions.includes('loan.delete_milestone');

  // API
  const { data, isLoading, isError, refetch } = useGetMilestonesQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search,
  });

  const [createMilestone, { isLoading: isCreating }] = useCreateMilestoneMutation();
  const [updateMilestone, { isLoading: isUpdating }] = useUpdateMilestoneMutation();
  const [deleteMilestone, { isLoading: isDeleting }] = useDeleteMilestoneMutation();
  const [bulkDeleteMilestones, { isLoading: isBulkDeleting }] = useBulkDeleteMilestonesMutation();

  const milestones = data?.results || [];
  const totalCount = data?.count || 0;

  // Handlers
  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(milestones.map(m => m.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleMenuOpen = (event, milestone) => {
    setMenuAnchor({ el: event.currentTarget, milestone });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ el: null, milestone: null });
  };

  const handleCreate = () => {
    setFormDialog({ open: true, milestone: null });
  };

  const handleEdit = (milestone) => {
    setFormDialog({ open: true, milestone });
    handleMenuClose();
  };

  const handleDelete = (milestone) => {
    setDeleteDialog({ open: true, milestone });
    handleMenuClose();
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setDeleteDialog({ open: true, milestone: null });
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (formDialog.milestone) {
        await updateMilestone({ id: formDialog.milestone.id, ...formData }).unwrap();
        setSnackbar({ open: true, message: 'Milestone updated successfully', severity: 'success' });
      } else {
        await createMilestone(formData).unwrap();
        setSnackbar({ open: true, message: 'Milestone created successfully', severity: 'success' });
      }
      setFormDialog({ open: false, milestone: null });
      refetch();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.data?.message || 'An error occurred', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.milestone) {
        await deleteMilestone(deleteDialog.milestone.id).unwrap();
        setSnackbar({ open: true, message: 'Milestone deleted successfully', severity: 'success' });
      } else {
        await bulkDeleteMilestones(selected).unwrap();
        setSnackbar({ open: true, message: `${selected.length} milestones deleted`, severity: 'success' });
        setSelected([]);
      }
      setDeleteDialog({ open: false, milestone: null });
      refetch();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.data?.message || 'An error occurred', 
        severity: 'error' 
      });
    }
  };

  const getStatusChip = (status) => {
    const config = {
      active: { label: 'Active', color: 'success' },
      inactive: { label: 'Inactive', color: 'warning' },
      archived: { label: 'Archived', color: 'default' },
    };
    const { label, color } = config[status] || config.active;
    return <Chip label={label} color={color} size="small" />;
  };

  const selectedCount = selected.length;
  const isAllSelected = selectedCount > 0 && selectedCount === milestones.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < milestones.length;

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load milestones. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      {/* Header */}
      

      {/* Toolbar */}
      <Box sx={{ mb: 2, borderRadius: 2 }}>
        <Toolbar
          sx={{
            pl: 2,
            pr: 1,
            ...(selectedCount > 0 && {
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            }),
          }}
        >
          {selectedCount > 0 ? (
            <Typography variant="subtitle1" component="div" sx={{ flex: '1 1 100%' }}>
              {selectedCount} selected
            </Typography>
          ) : (
            <Box sx={{ flex: '1 1 100%', display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                placeholder="Search milestones..."
                size="small"
                value={search}
                onChange={handleSearch}
                sx={{ minWidth: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {selectedCount > 0 ? (
            canDelete && (
              <Tooltip title="Delete selected">
                <IconButton
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )
          ) : (
            canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{
              backgroundColor: "rgba(0, 60, 247, 1)",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(0, 50, 200, 1)", // optional hover color
              },
            }}
              >
                Add Milestone
              </Button>
            )
          )}
        </Toolbar>
      </Box>

      {/* Table */}
      <Box sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 250px)",
        }}>
        <TableContainer sx={{
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
          }} >
          <Table sx={{
              "& .MuiTableCell-root": { borderBottom: "none" },
              borderCollapse: "separate",
              borderSpacing: 0,
            }}>
            <TableHead  sx={{
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
              }}>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                    disabled={milestones.length === 0}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Milestone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sort Order</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Preview</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : milestones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      {search ? 'No milestones found matching your search.' : 'No milestones created yet.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                milestones.map((milestone) => (
                  <TableRow
                    key={milestone.id}
                    hover
                    selected={selected.includes(milestone.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(milestone.id)}
                        onChange={() => handleSelectOne(milestone.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: milestone.background_color,
                            color: milestone.color,
                            width: 32,
                            height: 32,
                            fontSize: '14px',
                            fontWeight: 600,
                          }}
                        >
                          {milestone.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {milestone.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {milestone.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {milestone.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(milestone.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {milestone.sort_order}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={milestone.name}
                        size="small"
                        sx={{
                          backgroundColor: milestone.background_color,
                          color: milestone.color,
                          fontWeight: 500,
                          borderRadius: '8px',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, milestone)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor.el}
        open={Boolean(menuAnchor.el)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 120 } }}
      >
        {canEdit && (
          <MenuItem onClick={() => handleEdit(menuAnchor.milestone)}>
            <EditIcon sx={{ mr: 1, fontSize: 16 }} />
            Edit
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={() => handleDelete(menuAnchor.milestone)}>
            <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Form Dialog */}
      <MilestoneFormDialog
        open={formDialog.open}
        onClose={() => setFormDialog({ open: false, milestone: null })}
        milestone={formDialog.milestone}
        onSubmit={handleFormSubmit}
        loading={isCreating || isUpdating}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, milestone: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            {deleteDialog.milestone
              ? `"${deleteDialog.milestone.name}"`
              : `${selected.length} milestone${selected.length === 1 ? '' : 's'}`
            }? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, milestone: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting || isBulkDeleting}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}