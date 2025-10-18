// src/components/loanOfficers/LoanOfficerList.js
import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogTitle, DialogContent,
  FormControl, IconButton, InputLabel, MenuItem, Paper, Pagination, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Tooltip, Typography, useMediaQuery, Grow, CircularProgress, Avatar, Chip, Switch
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Restore as RestoreIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import LoanOfficerFormDialog from './LoanOfficerFormDialog';
import { 
  useGetLoanOfficersQuery, 
  useDeleteLoanOfficerMutation, 
  useArchiveLoanOfficerMutation, 
  useUnarchiveLoanOfficerMutation 
} from '../api/loanOfficerApi';

const pageSize = 10;

const LoanOfficerList = () => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const debounceRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderingField, setOrderingField] = useState('created_at');
  const [orderingDirection, setOrderingDirection] = useState('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [selectedOfficers, setSelectedOfficers] = useState([]);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [bulkArchiveDialogOpen, setBulkArchiveDialogOpen] = useState(false);
  const [toArchiveId, setToArchiveId] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingOfficer, setViewingOfficer] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const { data, isLoading, refetch } = useGetLoanOfficersQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    ordering: orderingDirection === 'desc' ? `-${orderingField}` : orderingField,
    archived: showArchived,
  });

  const [deleteLoanOfficer] = useDeleteLoanOfficerMutation();
  const [archiveLoanOfficer] = useArchiveLoanOfficerMutation();
  const [unarchiveLoanOfficer] = useUnarchiveLoanOfficerMutation();

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Handlers
  const handleSelectAll = (e) => {
    setSelectedOfficers(e.target.checked ? data?.results.map(lo => lo.id) : []);
  };
  const handleSelectOne = (id) => {
    setSelectedOfficers(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const handleArchiveConfirm = (id) => { setToArchiveId(id); setArchiveDialogOpen(true); };
  const handleArchiveAction = async (ids, unarchive = false) => {
    try {
      const fn = unarchive ? unarchiveLoanOfficer : archiveLoanOfficer;
      await Promise.all(ids.map(id => fn(id).unwrap()));
      toast.success(unarchive ? 'Unarchived successfully' : 'Archived successfully');
      setSelectedOfficers(prev => prev.filter(id => !ids.includes(id)));
      refetch();
    } catch {
      toast.error(`Failed to ${unarchive ? 'unarchive' : 'archive'} officer(s)`);
    }
  };
  const handleArchive = async () => { await handleArchiveAction([toArchiveId], showArchived); setArchiveDialogOpen(false); setToArchiveId(null); };
  const handleBulkArchive = async () => { await handleArchiveAction(selectedOfficers, showArchived); setBulkArchiveDialogOpen(false); };
  const handleDelete = async (id) => {
    try {
      await deleteLoanOfficer(id).unwrap();
      toast.success('Deleted successfully');
      refetch();
      setSelectedOfficers(prev => prev.filter(sid => sid !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const handleExport = (format) => {
    const map = { excel: 'export/loan-officers/excel/', pdf: 'export/loan-officers/pdf/' };
    if (format && map[format]) window.open(`http://localhost:8000/api/${map[format]}`, '_blank');
  };


  const total = data?.count || 0;
  const loanOfficers = data?.results || [];
  const emptyRows = pageSize - loanOfficers.length;

  return (
    <Box p={isMobile ? 1 : 3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" color="primary" fontWeight="bold">
          {showArchived ? 'Archived Loan Officers' : 'Loan Officer Management'}
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

          <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button variant="outlined" onClick={() => setSearch('')}>Clear</Button>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Export</InputLabel>
            <Select defaultValue="" onChange={e => handleExport(e.target.value)} label="Export">
              <MenuItem value="" disabled>Export</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingOfficer(null); setDialogOpen(true); }}>Add Officer</Button>

          <Box display="flex" alignItems="center">
            <Typography variant="body2" sx={{ mr: 1 }}>Show Archived</Typography>
            <Switch checked={showArchived} onChange={(e) => { setShowArchived(e.target.checked); setPage(1); setSelectedOfficers([]); }} />
          </Box>

          {selectedOfficers.length > 0 && (
            <Button variant="outlined" color={showArchived ? "success" : "secondary"} onClick={handleBulkArchive}>
              {showArchived ? 'Unarchive Selected' : 'Archive Selected'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ minWidth: 1000 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedOfficers.length === loanOfficers.length && loanOfficers.length > 0}
                    indeterminate={selectedOfficers.length > 0 && selectedOfficers.length < loanOfficers.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                {["Avatar","Name","Email","Contact","NMLS","Company","Created At","Updated At", showArchived ? "Archived At" : null,"Actions"].filter(Boolean).map((label,i) => <TableCell key={i}><strong>{label}</strong></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {loanOfficers.length > 0 ? loanOfficers.map(officer => (
                <Grow key={officer.id} in timeout={300}>
                  <TableRow hover sx={officer.is_archived ? { backgroundColor: '#f0f0f0' } : {}}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedOfficers.includes(officer.id)} onChange={() => handleSelectOne(officer.id)} />
                    </TableCell>
                    <TableCell><Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: '#fff' }}>{officer.name ? officer.name[0].toUpperCase() : '?'}</Avatar></TableCell>
                    <TableCell>{officer.name}</TableCell>
                    <TableCell>{officer.email}</TableCell>
                    <TableCell>{officer.contact_number}</TableCell>
                    <TableCell>{officer.NMLS}</TableCell>
                    <TableCell>{officer.company_name}</TableCell>
                    <TableCell>{new Date(officer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(officer.updated_at).toLocaleDateString()}</TableCell>
                    {showArchived && <TableCell>{officer.archived_at ? new Date(officer.archived_at).toLocaleDateString() : '-'}</TableCell>}
                    <TableCell>
                      <Tooltip title="Edit"><IconButton onClick={() => { setEditingOfficer(officer); setDialogOpen(true); }}><EditIcon color="primary" /></IconButton></Tooltip>
                      <Tooltip title={showArchived ? "Unarchive" : "Archive"}>
                        <IconButton onClick={() => handleArchiveConfirm(officer.id)}>
                          {showArchived ? <RestoreIcon color="success" /> : <DeleteIcon color="error" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </Grow>
              )) : (
                <TableRow><TableCell colSpan={showArchived ? 10 : 9} align="center">No loan officers found.</TableCell></TableRow>
              )}
              {emptyRows > 0 && loanOfficers.length > 0 && Array.from(Array(emptyRows)).map((_, idx) => (
                <TableRow key={`empty-${idx}`} style={{ height: 53 }}><TableCell colSpan={showArchived ? 10 : 9} /></TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination count={Math.ceil(total/pageSize)} page={page} onChange={(_,newPage)=>setPage(newPage)} color="primary" shape="rounded" showFirstButton showLastButton disabled={isLoading}/>
      </Box>

      {/* Dialogs */}
      <LoanOfficerFormDialog open={dialogOpen} onClose={()=>setDialogOpen(false)} editingOfficer={editingOfficer} onSuccess={()=>{refetch(); setDialogOpen(false); setSelectedOfficers([]);}}/>

      <Dialog open={archiveDialogOpen} onClose={()=>setArchiveDialogOpen(false)}>
        <DialogTitle>{showArchived ? 'Unarchive this officer?' : 'Archive this officer?'}</DialogTitle>
        <DialogActions>
          <Button onClick={()=>setArchiveDialogOpen(false)}>Cancel</Button>
          <Button color={showArchived ? "primary":"error"} onClick={handleArchive}>{showArchived ? 'Unarchive':'Archive'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkArchiveDialogOpen} onClose={()=>setBulkArchiveDialogOpen(false)}>
        <DialogTitle>{showArchived ? 'Unarchive selected officers?' : 'Archive selected officers?'}</DialogTitle>
        <DialogActions>
          <Button onClick={()=>setBulkArchiveDialogOpen(false)}>Cancel</Button>
          <Button color={showArchived ? "primary":"error"} onClick={handleBulkArchive}>{showArchived ? 'Unarchive Selected':'Archive Selected'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={()=>setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Officer Details</DialogTitle>
        <DialogContent>
          {viewingOfficer && (
            <Box display="flex" flexDirection="column" gap={1}>
              {[
                ['Name', viewingOfficer.name],
                ['Email', viewingOfficer.email],
                ['Contact', viewingOfficer.contact_number],
                ['NMLS', viewingOfficer.NMLS],
                ['Company', viewingOfficer.company_name],
                ['Created At', new Date(viewingOfficer.created_at).toLocaleString()],
                ['Updated At', new Date(viewingOfficer.updated_at).toLocaleString()],
                ['Archived At', viewingOfficer.archived_at ? new Date(viewingOfficer.archived_at).toLocaleString() : '-']
              ].map(([label,value])=><Typography key={label}><strong>{label}:</strong> {value || '-'}</Typography>)}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={()=>setViewDialogOpen(false)} variant="contained" color="primary">Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoanOfficerList;
