// src/components/brokers/BrokerList.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogTitle, DialogContent,
  FormControl, IconButton, InputLabel, MenuItem, Paper, Pagination, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Tooltip, Typography, useMediaQuery, Grow, CircularProgress, Avatar, Chip, Switch
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
  useGetBrokersQuery,
  useArchiveBrokerMutation,
  useUnarchiveBrokerMutation
} from '../api/brokerApi';
import BrokerFormDialog from './BrokerFormDialog';

const pageSize = 10;

const BrokerList = () => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const debounceRef = useRef(null);

  // --- State ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderingField, setOrderingField] = useState('created_at');
  const [orderingDirection, setOrderingDirection] = useState('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);
  const [selectedBrokers, setSelectedBrokers] = useState([]);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [bulkArchiveDialogOpen, setBulkArchiveDialogOpen] = useState(false);
  const [toArchiveId, setToArchiveId] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingBroker, setViewingBroker] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // --- API Hooks ---
  const { data, error, isLoading, refetch } = useGetBrokersQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    ordering: orderingDirection === 'desc' ? `-${orderingField}` : orderingField,
    archived: showArchived,
  });

  const [archiveBroker, { isLoading: archiving }] = useArchiveBrokerMutation();
  const [unarchiveBroker, { isLoading: unarchiving }] = useUnarchiveBrokerMutation();

  const brokers = data?.results || [];
  const total = data?.count || 0;
  const emptyRows = pageSize - brokers.length;

  // --- Debounce search ---
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // --- Handlers ---
  const handleSelectAll = (e) => {
    setSelectedBrokers(e.target.checked ? brokers.map(b => b.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedBrokers(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split('_');
    setOrderingField(field);
    setOrderingDirection(direction);
    setPage(1);
  };

  const handleArchiveConfirm = (id) => {
    setToArchiveId(id);
    setArchiveDialogOpen(true);
  };

  const handleArchiveAction = async (ids, unarchive = false) => {
    try {
      const fn = unarchive ? unarchiveBroker : archiveBroker;
      await Promise.all(ids.map(id => fn(id).unwrap()));
      toast.success(unarchive ? 'Unarchived successfully' : 'Archived successfully');
      setSelectedBrokers(prev => prev.filter(id => !ids.includes(id)));
      refetch(); // always refresh
    } catch {
      toast.error(`Failed to ${unarchive ? 'unarchive' : 'archive'} broker(s)`);
    }
  };

  const handleArchive = async () => {
    await handleArchiveAction([toArchiveId], showArchived);
    setArchiveDialogOpen(false);
    setToArchiveId(null);
  };

  const handleBulkArchive = async () => {
    await handleArchiveAction(selectedBrokers, showArchived);
    setBulkArchiveDialogOpen(false);
  };

  const handleExport = async (format) => {
  const urls = {
    excel: 'https://backend-l3f9.onrender.com/api/export/brokers/excel/',
    pdf: 'https://backend-l3f9.onrender.com/api/export/brokers/pdf/', // ✅ corrected
  };

  const url = urls[format];
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // optional – you can remove since backend allows public export
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });

    if (!response.ok) throw new Error('Failed to export file');

    const blob = await response.blob();
    const fileUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `brokers.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(fileUrl);
  } catch (err) {
    toast.error(err.message || 'Export failed');
  }
};



  // --- Render ---
  return (
    <Box p={isMobile ? 1 : 3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" color="primary" fontWeight="bold">
          {showArchived ? 'Archived Brokers' : 'Broker Management'}
        </Typography>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={`${orderingField}_${orderingDirection}`}
              label="Sort"
              onChange={handleSortChange}
            >
              <MenuItem value="created_at_desc">Latest Added</MenuItem>
              <MenuItem value="name_asc">Name (A-Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant="outlined" onClick={() => setSearch('')}>Clear</Button>

          <FormControl size="small" sx={{ minWidth: 120 }}>
  <InputLabel>Export</InputLabel>
  <Select defaultValue="" label="Export" onChange={(e) => handleExport(e.target.value)}>
    <MenuItem value="" disabled>Export</MenuItem>
    <MenuItem value="excel">Excel</MenuItem>
    <MenuItem value="pdf">PDF</MenuItem>
  </Select>
</FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setDialogOpen(true); setEditingBroker(null); }}
          >
            Add Broker
          </Button>

          {selectedBrokers.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setBulkArchiveDialogOpen(true)}
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
                setSelectedBrokers([]);
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>Error loading brokers. Please try again.</Box>
      ) : (
        <TableContainer component={Paper} sx={{ minWidth: 1000 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedBrokers.length === brokers.length && brokers.length > 0}
                    indeterminate={selectedBrokers.length > 0 && selectedBrokers.length < brokers.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                {[
                  'Avatar', 'Name', 'Email', 'NMLS', 'Primary Phone',
                  'Created At', 'Updated At',
                  ...(showArchived ? ['Archived At'] : []),
                  'Actions'
                ].map((label, idx) => (
                  <TableCell key={idx}><strong>{label}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {brokers.length > 0 ? (
                brokers.map((broker) => (
                  <Grow in key={broker.id} timeout={300}>
                    <TableRow hover sx={broker.is_archived ? { backgroundColor: '#f0f0f0' } : {}}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedBrokers.includes(broker.id)}
                          onChange={() => handleSelectOne(broker.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: '#fff' }}>
                          {broker.name ? broker.name[0].toUpperCase() : '?'}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        {broker.name}
                        {broker.is_archived && <Chip label="Archived" size="small" sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell>{broker.email}</TableCell>
                      <TableCell>{broker.NMLS}</TableCell>
                      <TableCell>{broker.primary_phone}</TableCell>
                      <TableCell>{new Date(broker.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(broker.updated_at).toLocaleDateString()}</TableCell>
                      {showArchived && (
                        <TableCell>{broker.archived_at ? new Date(broker.archived_at).toLocaleDateString() : '-'}</TableCell>
                      )}
                      <TableCell>
                        <Tooltip title="View">
                          <IconButton onClick={() => { setViewingBroker(broker); setViewDialogOpen(true); }}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => { setEditingBroker(broker); setDialogOpen(true); }}>
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={showArchived ? "Unarchive" : "Archive"}>
                          <IconButton onClick={() => handleArchiveConfirm(broker.id)}>
                            {showArchived ? <RestoreIcon color="primary" /> : <DeleteIcon color="error" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))
              ) : (
                <TableRow><TableCell colSpan={showArchived ? 10 : 9} align="center">No brokers found.</TableCell></TableRow>
              )}
              {emptyRows > 0 && brokers.length > 0 && (
                Array.from(Array(emptyRows)).map((_, idx) => (
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

      {/* Dialogs */}
      <BrokerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingBroker={editingBroker}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
          setSelectedBrokers([]);
        }}
      />

      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)}>
        <DialogTitle>
          {showArchived ? 'Unarchive this broker?' : 'Archive this broker?'}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
          <Button
            color={showArchived ? "primary" : "error"}
            onClick={handleArchive}
            disabled={archiving || unarchiving}
          >
            {showArchived ? 'Unarchive' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkArchiveDialogOpen} onClose={() => setBulkArchiveDialogOpen(false)}>
        <DialogTitle>
          {showArchived ? 'Unarchive selected brokers?' : 'Archive selected brokers?'}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setBulkArchiveDialogOpen(false)}>Cancel</Button>
          <Button
            color={showArchived ? "primary" : "error"}
            onClick={handleBulkArchive}
            disabled={archiving || unarchiving}
          >
            {showArchived ? 'Unarchive Selected' : 'Archive Selected'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle height={60} bgcolor="primary.main" mb={3}>Broker Details</DialogTitle>
        <DialogContent dividers>
          {viewingBroker && (
            <Box display="flex" flexDirection="column" gap={1}>
              {[
                ['Name', viewingBroker.name],
                ['Email', viewingBroker.email],
                ['NMLS', viewingBroker.NMLS],
                ['Primary Phone', viewingBroker.primary_phone],
                ['Phone', viewingBroker.phone],
                ['Address', viewingBroker.address],
                ['Company Address', viewingBroker.company_address],
                ['Created At', new Date(viewingBroker.created_at).toLocaleString()],
                ['Updated At', new Date(viewingBroker.updated_at).toLocaleString()],
                ['Archived At', viewingBroker.archived_at ? new Date(viewingBroker.archived_at).toLocaleString() : '-'],
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

export default BrokerList;

