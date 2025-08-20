// src/components/teams/TeamFormDialog.js
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Autocomplete
} from '@mui/material';
import {
  useAddTeamMutation,
  useUpdateTeamMutation
} from '../redux/teamApi';
import { useGetEmployeesQuery } from '../redux/employeeApi';
import { useGetShiftsQuery } from '../redux/shiftApi';

const TeamFormDialog = ({ open, handleClose, team, onSave }) => {
  const isEdit = Boolean(team);

  const [formData, setFormData] = useState({
    name: '',
    head: null,
    shift: '',
  });

  const [addTeam] = useAddTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();

  const { data: employeesData } = useGetEmployeesQuery({ page: 1, page_size: 1000 });
  const { data: shiftsData } = useGetShiftsQuery({ page_size: 1000 });

  const employees = employeesData?.results || employeesData || [];
  const shifts = shiftsData?.results || shiftsData || [];

  useEffect(() => {
    if (isEdit) {
      setFormData({
        name: team.name || '',
        head: team.head || null,
        shift: team.shift || '',
      });
    } else {
      setFormData({ name: '', head: null, shift: '' });
    }
  }, [team, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      head: formData.head || null,
      shift: formData.shift || null,
    };

    try {
      if (isEdit) {
        await updateTeam({ id: team.id, ...payload });
      } else {
        await addTeam(payload);
      }
      onSave();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>{isEdit ? 'Edit Team' : 'Add Team'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Team Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />

        {/* Autocomplete dropdown for searchable team head by login_id */}
        <Autocomplete
          options={employees}
          getOptionLabel={(option) =>
            option.login_id ? `${option.login_id} - ${option.name}` : ''
          }
          value={employees.find((emp) => emp.id === formData.head) || null}
          onChange={(event, newValue) =>
            setFormData((prev) => ({
              ...prev,
              head: newValue ? newValue.id : null,
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Team Head (Login ID)" margin="normal" fullWidth />
          )}
        />

        <TextField
          select
          label="Shift"
          name="shift"
          value={formData.shift}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          {shifts.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>z
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamFormDialog;
