import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import toast from 'react-hot-toast';
import {
  useAddDesignationMutation,
  useUpdateDesignationMutation,
  useGetGroupsQuery,
} from '../redux/designationApi';

export default function DesignationFormDialog({ open, onClose, designation }) {
  const isEdit = !!designation;

  const [name, setName] = useState('');
  const [group, setGroup] = useState('');

  const { data: groups } = useGetGroupsQuery();
  const [addDesignation, { isLoading: adding }] = useAddDesignationMutation();
  const [updateDesignation, { isLoading: updating }] = useUpdateDesignationMutation();

  useEffect(() => {
    if (designation) {
      setName(designation.name || '');
      setGroup(designation.group || '');
    } else {
      setName('');
      setGroup('');
    }
  }, [designation]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = { name, group: group || null };

    try {
      if (isEdit) {
        await updateDesignation({ id: designation.id, ...payload }).unwrap();
        toast.success('Designation updated');
      } else {
        await addDesignation(payload).unwrap();
        toast.success('Designation added');
      }
      onClose();
    } catch (err) {
      // Try to extract backend validation errors
      if (err?.data) {
        const messages = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${val}`)
          .join('\n');
        toast.error(messages || 'Failed to save designation');
      } else {
        toast.error('Failed to save designation');
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Designation' : 'Add Designation'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Designation Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          select
          label="Group"
          value={group || ''}
          onChange={(e) => setGroup(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="">No Group</MenuItem>
          {groups?.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.name}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={adding || updating}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={adding || updating}
          startIcon={(adding || updating) && <CircularProgress size={16} />}
        >
          {isEdit ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
