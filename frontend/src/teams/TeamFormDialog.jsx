// src/components/teams/TeamFormDialog.js
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Autocomplete, Alert
} from '@mui/material';
import {
  useAddTeamMutation,
  useUpdateTeamMutation
} from '../api/teamApi';
import { useGetAllEmployeesQuery } from '../api/employeeApi';
import { useGetShiftsQuery } from '../api/shiftApi';
import { useGetTeamsQuery } from '../api/teamApi';

const TeamFormDialog = ({ open, handleClose, team, onSave }) => {
  const isEdit = Boolean(team);

  const [formData, setFormData] = useState({
    name: '',
    head: null,
    manager: null,
    shift: '',
  });

  const [error, setError] = useState(null);

  const [addTeam] = useAddTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();

  // ✅ Fetch all employees for dropdown (no pagination)
  const { data: employeesData, isLoading: employeesLoading } = useGetAllEmployeesQuery();
  const { data: shiftsData } = useGetShiftsQuery({ page_size: 1000 });
  const { data: teamsData } = useGetTeamsQuery({ page_size: 1000 });
  
  // Ensure always arrays
  const employees = Array.isArray(employeesData)
    ? employeesData
    : employeesData?.results || [];

  const shifts = Array.isArray(shiftsData)
    ? shiftsData
    : shiftsData?.results || [];

  const teams = Array.isArray(teamsData)
    ? teamsData
    : teamsData?.results || [];

  useEffect(() => {
    if (open) {
      if (isEdit && team) {
        setFormData({
          name: team.name || '',
          head: team.head || null,
          manager: team.manager || null,
          shift: team.shift || '',
        });
      } else {
        setFormData({ name: '', head: null, manager: null, shift: '' });
      }
      setError(null);
    }
  }, [open, team, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { head, manager } = formData;

    if (head && manager && head === manager) {
      return "An employee cannot be both Manager and Head in the same team.";
    }

    if (head) {
      const existing = teams.find(
        (t) => t.head === head && (!isEdit || t.id !== team.id)
      );
      if (existing) {
        return `This employee is already a Team Head under manager ${existing.manager_name}.`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: formData.name,
      head: formData.head || null,
      manager: formData.manager || null,
      shift: formData.shift || null,
    };

    try {
      if (isEdit) {
        await updateTeam({ id: team.id, ...payload }).unwrap();
      } else {
        await addTeam(payload).unwrap();
      }
      setFormData({ name: '', head: null, manager: null, shift: '' });
      setError(null);
      onSave();
    } catch (err) {
      console.error('Error saving team:', err);
      setError("Failed to save team. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, backgroundColor: "#1976d2", color: "#fff" }}>
        {isEdit ? 'Edit Team' : 'Add Team'}
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Team Name */}
        <TextField
          label="Team Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />

        {/* Team Manager */}
        <Autocomplete
          options={employees.filter((emp) => emp.id !== formData.head)}
          getOptionLabel={(option) =>
            option.login_id ? `${option.login_id} - ${option.name}` : ''
          }
          value={employees.find((emp) => emp.id === formData.manager) || null}
          onChange={(event, newValue) =>
            setFormData((prev) => ({
              ...prev,
              manager: newValue ? newValue.id : null,
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Team Manager (Login ID)" margin="normal" fullWidth />
          )}
          ListboxProps={{ style: { maxHeight: 300, overflowY: 'auto' } }}
          filterSelectedOptions
          disabled={employeesLoading}
        />

        {/* Team Head */}
        <Autocomplete
          options={employees.filter((emp) => emp.id !== formData.manager)}
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
          ListboxProps={{ style: { maxHeight: 300, overflowY: 'auto' } }}
          filterSelectedOptions
          disabled={employeesLoading}
        />

        {/* Shift */}
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
        </TextField>
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
