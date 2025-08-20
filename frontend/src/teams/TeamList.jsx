import React, { useState } from 'react';
import {
  Box, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Snackbar, Pagination, Menu, MenuItem, Checkbox
} from '@mui/material';
import { Edit, Delete, ArrowDropDown } from '@mui/icons-material';
import { useGetTeamsQuery, useDeleteTeamMutation } from '../api/teamApi';
import TeamFormDialog from './TeamFormDialog';

const TeamList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const pageSize = 10;
  const { data, isLoading, refetch } = useGetTeamsQuery({ page, page_size: pageSize, search });
  const [deleteTeam] = useDeleteTeamMutation();

  const handleEdit = (team) => {
    setSelectedTeam(team);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteTeam(id);
    setSnackbar({ open: true, message: 'Team deleted successfully' });
    refetch();
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await deleteTeam(id);
    setSnackbar({ open: true, message: 'Selected teams deleted' });
    setSelectedIds([]);
    refetch();
  };

  const handleCheckbox = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalPages = data?.total_pages || Math.ceil((data?.count || 0) / pageSize);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Team Management</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedTeam(null);
            setDialogOpen(true);
          }}
        >
          Add Team
        </Button>
      </Box>

      <Box mb={2} display="flex" gap={2}>
        <TextField
          label="Search Team"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          fullWidth
        />
        {selectedIds.length > 0 && (
          <Button variant="contained" color="error" onClick={handleBulkDelete}>
            Delete Selected ({selectedIds.length})
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    selectedIds.length === data?.results?.length &&
                    data?.results?.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(data?.results.map((team) => team.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell><strong>Team Name</strong></TableCell>
              <TableCell><strong>Team Head</strong></TableCell>
              <TableCell><strong>Shift</strong></TableCell>
              <TableCell><strong>Created At</strong></TableCell>
              <TableCell><strong>Updated At</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.results?.map((team) => (
              <TableRow key={team.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(team.id)}
                    onChange={() => handleCheckbox(team.id)}
                  />
                </TableCell>
                <TableCell>{team.name}</TableCell>
                <TableCell>{team.head_name || 'N/A'}</TableCell>
                <TableCell>{team.shift_name || 'N/A'}</TableCell>
                <TableCell>{new Date(team.created_at).toLocaleString()}</TableCell>
                <TableCell>{new Date(team.updated_at).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(team)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(team.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data?.results?.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No teams found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      <TeamFormDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        team={selectedTeam}
        onSave={() => {
          setDialogOpen(false);
          refetch();
        }}
      />

      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ open: false, message: '' })}
        autoHideDuration={3000}
        message={snackbar.message}
      />
    </Box>
  );
};

export default TeamList;
