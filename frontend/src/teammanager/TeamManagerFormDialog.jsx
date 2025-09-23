import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
} from "@mui/material";
import { useGetEmployeesQuery } from "../redux/employeeApi";
import {
  useAddTeamManagerMutation,
  useUpdateTeamManagerMutation,
  useGetTeamManagersQuery,
} from "../api/teamManagerApi";
import { useGetTeamLeadsQuery } from "../api/teamLeadApi";

const TeamManagerFormDialog = ({ open, handleClose, manager, onSave }) => {
  const isEdit = Boolean(manager);

  const [formData, setFormData] = useState({
    manager: null, // employee ID
    teamLeads: [], // array of teamLead IDs
    members: [], // auto-filled member IDs
  });

  // Employees API
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployeesQuery({
    page: 1,
    page_size: 1000,
  });
  const employees = employeesData?.results || [];

  // Team Leads API
  const { data: teamLeadsData, isLoading: teamLeadsLoading } = useGetTeamLeadsQuery({
    page: 1,
    page_size: 1000,
  });
  const teamLeads = teamLeadsData?.results || [];

  // Existing Team Managers
  const { data: existingManagersData } = useGetTeamManagersQuery({
    page: 1,
    page_size: 1000,
  });
  const existingManagers = existingManagersData?.results || [];

  // Blocked employees (already a manager)
  const blockedManagerIds = useMemo(() => {
    const blocked = new Set();
    existingManagers.forEach((m) => {
      if (!isEdit || m.id !== manager?.id) blocked.add(m.manager);
    });
    return blocked;
  }, [existingManagers, isEdit, manager]);

  const [addTeamManager] = useAddTeamManagerMutation();
  const [updateTeamManager] = useUpdateTeamManagerMutation();

  // Initialize form when dialog opens and data is ready
  useEffect(() => {
    if (!open || !teamLeads.length || !employees.length) return;

    if (isEdit && manager) {
      setFormData({
        manager: manager.manager || null,
        teamLeads: manager.teamLeads || [],
        members: manager.members || [],
      });
    } else {
      setFormData({ manager: null, teamLeads: [], members: [] });
    }
  }, [open, isEdit, manager, teamLeads, employees]);

  // Auto-fill members when teamLeads change
  useEffect(() => {
    if (!teamLeads.length) return;

    const selectedLeads = teamLeads.filter((tl) => formData.teamLeads.includes(tl.id));
    const allMembers = new Set();
    selectedLeads.forEach((tl) => {
      tl.members?.forEach((m) => allMembers.add(m)); // safe optional chaining
      allMembers.add(tl.lead); // include the lead itself
    });
    setFormData((prev) => ({ ...prev, members: Array.from(allMembers) }));
  }, [formData.teamLeads, teamLeads]);

  const handleSubmit = async () => {
    const payload = {
      manager: formData.manager,
      teamLeads: formData.teamLeads,
      members: formData.members,
    };

    try {
      if (isEdit) {
        await updateTeamManager({ id: manager.id, ...payload }).unwrap();
      } else {
        await addTeamManager(payload).unwrap();
      }
      onSave();
    } catch (error) {
      console.error("Error saving team manager:", error);
    }
  };

  // Wait until all data is loaded before rendering
  if (employeesLoading || teamLeadsLoading) return null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>{isEdit ? "Edit Team Manager" : "Add Team Manager"}</DialogTitle>
      <DialogContent dividers>
        {/* Team Manager */}
        <Autocomplete
          options={employees}
          getOptionLabel={(option) => `${option.login_id} - ${option.name}`}
          value={employees.find((emp) => emp.id === formData.manager) || null}
          onChange={(e, newValue) =>
            setFormData((prev) => ({ ...prev, manager: newValue ? newValue.id : null }))
          }
          getOptionDisabled={(option) => blockedManagerIds.has(option.id)}
          renderInput={(params) => (
            <TextField {...params} label="Team Manager" margin="normal" fullWidth required />
          )}
        />

        {/* Team Leads multi-select */}
        <Autocomplete
          multiple
          options={teamLeads}
          getOptionLabel={(tl) =>
            tl.lead_login_id ? `${tl.lead_login_id} - ${tl.lead_login_id}` : ""
          }
          value={teamLeads.filter((tl) => formData.teamLeads.includes(tl.id))}
          onChange={(e, newValue) =>
            setFormData((prev) => ({ ...prev, teamLeads: newValue.map((tl) => tl.id) }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Team Leads" margin="normal" fullWidth required />
          )}
        />

        {/* Members (read-only) */}
        <TextField
          label="Members (auto-filled)"
          value={employees
            .filter((emp) => formData.members.includes(emp.id))
            .map((emp) => emp.login_id)
            .join(", ")}
          margin="normal"
          fullWidth
          multiline
          InputProps={{ readOnly: true }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {isEdit ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamManagerFormDialog;
