// src/components/teams/TeamFormDialog.js
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Alert,
} from "@mui/material";
import {
  useAddTeamMutation,
  useUpdateTeamMutation,
  useGetManagersQuery,
  useGetLeadsQuery,
} from "../api/teamApi";
import { useGetShiftsQuery } from "../api/shiftApi";

const TeamFormDialog = ({ open, handleClose, team, onSave }) => {
  const isEdit = Boolean(team);

  const [formData, setFormData] = useState({
    name: "",
    manager: null,
    head: null,
    shift: "",
  });
  const [error, setError] = useState(null);

  const [addTeam] = useAddTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();
  const { data: managerEmployeesData } = useGetManagersQuery();
  const { data: headEmployeesData } = useGetLeadsQuery();
  const { data: shiftsData } = useGetShiftsQuery({ page_size: 1000 });

  const managerEmployees = Array.isArray(managerEmployeesData?.results)
    ? managerEmployeesData.results
    : managerEmployeesData || [];
  const headEmployees = Array.isArray(headEmployeesData?.results)
    ? headEmployeesData.results
    : headEmployeesData || [];
  const shifts = Array.isArray(shiftsData)
    ? shiftsData
    : shiftsData?.results || [];

  // 🔁 Populate form when editing
  useEffect(() => {
    if (open) {
      if (isEdit && team) {
        setFormData({
          name: team.name || "",
          manager: team.manager || null,
          head: team.head || null,
          shift: team.shift || "",
        });
      } else {
        setFormData({ name: "", manager: null, head: null, shift: "" });
      }
      setError(null);
    }
  }, [open, team, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { name, manager, head, shift } = formData;
    if (!name) return "Team name is required.";
    if (!shift) return "Please select a shift.";
    if (manager && head && manager === head)
      return "An employee cannot be both Manager and Head in the same team.";
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
      manager: formData.manager || null,
      head: formData.head || null,
      shift: formData.shift || null,
    };

    try {
      if (isEdit) {
        await updateTeam({ id: team.id, ...payload }).unwrap();
      } else {
        await addTeam(payload).unwrap();
      }
      setFormData({ name: "", manager: null, head: null, shift: "" });
      setError(null);
      onSave();
    } catch (err) {
      console.error("Error saving team:", err);
      setError("Failed to save team. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          backgroundColor: "#1976d2",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        {isEdit ? "Edit Team" : "Add Team"}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 🔹 Team Name */}
        <TextField
          label="Team Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />

        {/* 🔹 Team Manager (search + scroll + rounded) */}
        <Autocomplete
          options={managerEmployees}
          getOptionLabel={(option) =>
            option.login_id ? `${option.login_id} - ${option.name}` : ""
          }
          value={
            managerEmployees.find((emp) => emp.id === formData.manager) || null
          }
          onChange={(event, newValue) =>
            setFormData((prev) => ({
              ...prev,
              manager: newValue ? newValue.id : null,
            }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Team Manager"
              margin="normal"
              fullWidth
              placeholder="Search or select manager"
            />
          )}
          ListboxProps={{
            style: {
              maxHeight: 250,
              overflowY: "auto",
            },
          }}
          filterSelectedOptions
          sx={{
            "& .MuiAutocomplete-inputRoot": { borderRadius: 2 },
          }}
        />

        {/* 🔹 Team Head (search + scroll + rounded) */}
        <Autocomplete
          options={headEmployees}
          getOptionLabel={(option) =>
            option.login_id ? `${option.login_id} - ${option.name}` : ""
          }
          value={headEmployees.find((emp) => emp.id === formData.head) || null}
          onChange={(event, newValue) =>
            setFormData((prev) => ({
              ...prev,
              head: newValue ? newValue.id : null,
            }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Team Head"
              margin="normal"
              fullWidth
              placeholder="Search or select lead"
            />
          )}
          ListboxProps={{
            style: {
              maxHeight: 250,
              overflowY: "auto",
            },
          }}
          filterSelectedOptions
          sx={{
            "& .MuiAutocomplete-inputRoot": { borderRadius: 2 },
          }}
        />

        {/* 🔹 Shift (search + scroll + rounded) */}
        <Autocomplete
          options={shifts}
          getOptionLabel={(option) => option?.name || ""}
          value={shifts.find((s) => s.id === formData.shift) || null}
          onChange={(event, newValue) =>
            setFormData((prev) => ({
              ...prev,
              shift: newValue ? newValue.id : null,
            }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Shift"
              margin="normal"
              fullWidth
              placeholder="Search or select shift"
            />
          )}
          ListboxProps={{
            style: {
              maxHeight: 250,
              overflowY: "auto",
            },
          }}
          sx={{
            "& .MuiAutocomplete-inputRoot": { borderRadius: 2 },
          }}
          disableClearable
          filterSelectedOptions
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.name || !formData.shift}
        >
          {isEdit ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamFormDialog;
