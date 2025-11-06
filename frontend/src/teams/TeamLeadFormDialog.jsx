// src/teams/TeamLeadFormDialog.js
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
  useAddTeamLeadMutation,
  useUpdateTeamLeadMutation,
  useGetTeamLeadsQuery, // ✅ fetch all team leads
} from "../api/teamLeadApi";

const TeamLeadFormDialog = ({ open, handleClose, teamLead, onSave }) => {
  const isEdit = Boolean(teamLead);

  const [formData, setFormData] = useState({
    lead: null,
    members: [],
  });

  // ✅ Employees API call
  const { data: employeesData, isLoading } = useGetEmployeesQuery({
    page: 1,
    page_size: 1000,
  });
  const employees = employeesData?.results || [];

  // ✅ Fetch all team leads to block already used employees
  const { data: teamLeadsData } = useGetTeamLeadsQuery({
    page: 1,
    page_size: 1000,
  });
  const existingTeams = teamLeadsData?.results || [];

  // ✅ Collect all blocked employee IDs (except current edit mode values)
  const blockedEmployeeIds = useMemo(() => {
    const blocked = new Set();
    existingTeams.forEach((team) => {
      if (!isEdit || team.id !== teamLead?.id) {
        blocked.add(team.lead); // team lead
        team.members.forEach((m) => blocked.add(m)); // members
      }
    });
    return blocked;
  }, [existingTeams, isEdit, teamLead]);

  const [addTeamLead] = useAddTeamLeadMutation();
  const [updateTeamLead] = useUpdateTeamLeadMutation();

  // Reset form state on open
  useEffect(() => {
    if (open) {
      if (isEdit && teamLead) {
        setFormData({
          lead: teamLead.lead || null,
          members: teamLead.members || [],
        });
      } else {
        setFormData({ lead: null, members: [] });
      }
    }
  }, [open, isEdit, teamLead]);

  const handleSubmit = async () => {
    const payload = {
      lead: formData.lead,
      members: formData.members,
    };

    try {
      if (isEdit) {
        await updateTeamLead({ id: teamLead.id, ...payload }).unwrap();
      } else {
        await addTeamLead(payload).unwrap();
      }
      onSave();
    } catch (error) {
      console.error("Error saving team lead:", error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>{isEdit ? "Edit Team Lead" : "Add Team Lead"}</DialogTitle>
      <DialogContent dividers>
        {/* Autocomplete for Team Lead (single select) */}
        <Autocomplete
          options={employees}
          loading={isLoading}
          getOptionLabel={(option) =>
            option.login_id ? `${option.login_id} - ${option.name}` : ""
          }
          value={employees.find((emp) => emp.id === formData.lead) || null}
          onChange={(event, newValue) =>
            setFormData((prev) => ({
              ...prev,
              lead: newValue ? newValue.id : null,
            }))
          }
          getOptionDisabled={(option) => blockedEmployeeIds.has(option.id)} // 🚀 disable blocked
          renderInput={(params) => (
            <TextField
              {...params}
              label="Team Lead (Login ID)"
              margin="normal"
              fullWidth
              required
            />
          )}
        />

        {/* Autocomplete for Team Members (multi-select) */}
        <Autocomplete
          multiple
          options={employees}
          loading={isLoading}
          getOptionLabel={(option) =>
            option.login_id ? `${option.login_id} - ${option.name}` : ""
          }
          value={employees.filter((emp) =>
            formData.members.includes(emp.id)
          )}
          onChange={(event, newValue) =>
            setFormData((prev) => ({
              ...prev,
              members: newValue.map((emp) => emp.id),
            }))
          }
          getOptionDisabled={(option) => blockedEmployeeIds.has(option.id)} // 🚀 disable blocked
          renderInput={(params) => (
            <TextField
              {...params}
              label="Team Members (Login IDs)"
              margin="normal"
              fullWidth
              required
            />
          )}
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

export default TeamLeadFormDialog;
