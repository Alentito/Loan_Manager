import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Pagination,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';

import {
  useGetDesignationsQuery,
  useDeleteDesignationMutation,
  useGetGroupsQuery,
} from '../redux/designationApi';
import DesignationFormDialog from './DesignationFormDialog';

export default function DesignationListPage() {
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [groupFilter, setGroupFilter] = useState('');

  // Fetch groups for dropdown
  const { data: groups } = useGetGroupsQuery();

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceSearch = debounce((val) => setDebouncedSearch(val), 500);

  const { data, isLoading } = useGetDesignationsQuery({
    page,
    search: debouncedSearch,
    ordering,
    group: groupFilter || undefined,
  });

  const [deleteDesignation] = useDeleteDesignationMutation();

  // Handle search input
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    debounceSearch(e.target.value);
  };

  const handleEdit = (desig) => {
    setSelectedDesignation(desig);
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedDesignation(null);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        await deleteDesignation(id).unwrap();
        toast.success('Designation deleted');
      } catch (err) {
        toast.error('Failed to delete designation');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDesignation(null);
  };

  const handleOrdering = (field) => {
    setOrdering((prev) => (prev === field ? `-${field}` : field));
  };

  useEffect(() => {
    setPage(1); // Reset to first page if search/filter changes
  }, [debouncedSearch, groupFilter]);

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" flexWrap="wrap" justifyContent="space-between" mb={2} gap={1}>
          <TextField
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            label="Filter by Group"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Groups</MenuItem>
            {groups?.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleAdd}>
            Add Designation
          </Button>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Button onClick={() => handleOrdering('name')}>
                  Name{' '}
                  {ordering.includes('name') ? (ordering.startsWith('-') ? '↓' : '↑') : ''}
                </Button>
              </TableCell>
              <TableCell>
                <Button onClick={() => handleOrdering('group')}>
                  Group{' '}
                  {ordering.includes('group') ? (ordering.startsWith('-') ? '↓' : '↑') : ''}
                </Button>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.results.map((desig) => (
              <TableRow key={desig.id}>
                <TableCell>{desig.name}</TableCell>
                <TableCell>{desig.group_name || '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(desig)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(desig.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!data?.results.length && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No designations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {data?.count > 0 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={Math.ceil(data.count / data.page_size)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {openDialog && (
        <DesignationFormDialog
          open={openDialog}
          onClose={handleCloseDialog}
          designation={selectedDesignation}
        />
      )}
    </Box>
  );
}
