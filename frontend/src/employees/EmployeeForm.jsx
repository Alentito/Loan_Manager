// src/components/EmployeeForm.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { Autocomplete } from "@mui/material"; // for alternate shift
import { toast } from "react-hot-toast";
import { useGetGroupsQuery } from "../api/authApi";
import { useGetTeamsQuery, useGetTeamByIdQuery } from "../api/teamApi";
import { useGetShiftsQuery } from "../api/shiftApi";

const EmployeeForm = ({
  existingData = {},
  onSuccess,
  submitting,
  onStartSubmit,
  onError,
  serverErrors = {},
}) => {
  const [formData, setFormData] = useState({
    login_id: "",
    name: "",
    company_email: "",
    contact_number: "",
    roles: "", // Role IDs
    login_password: "",
    team: "",
    shift: "",
    alternate_shift: "", // NEW field
  });

  const [localErrors, setLocalErrors] = useState({});

  // Teams & Shifts
  const { data: teamData, isLoading: teamLoading } = useGetTeamsQuery({ page: 1, page_size: 100 });
  const teams = teamData?.results || [];

  const { data: shiftData, isLoading: shiftLoading } = useGetShiftsQuery({ page: 1, page_size: 100 });
  const shifts = shiftData?.results || [];

  // Get single team (to auto-select shift)
  const { data: selectedTeamData } = useGetTeamByIdQuery(formData.team, {
    skip: !formData.team,
  });

  // Groups (roles)
  const { data: groupsData = [], isLoading: loadingGroups } = useGetGroupsQuery();
  const groups = Array.isArray(groupsData) ? groupsData : groupsData.results || [];

  // Pre-fill form when editing
  useEffect(() => {
    if (!existingData || !Object.keys(existingData).length) return;
    setFormData((prev) => ({
      ...prev,
      ...existingData,
      roles: existingData.roles || [],
      team: existingData.team || "",
      shift: existingData.shift || "",
      alternate_shift: existingData.alternate_shift || "",
    }));
  }, [existingData]);

  // Auto-select shift when team changes
  useEffect(() => {
    if (selectedTeamData?.shift) {
      setFormData((prev) => ({ ...prev, shift: selectedTeamData.shift }));
    }
  }, [selectedTeamData]);

  const clearFieldError = (field) => {
    if (localErrors[field]) {
      const updated = { ...localErrors };
      delete updated[field];
      setLocalErrors(updated);
    }
  };

  const getError = (field) =>
    localErrors[field] || serverErrors?.[field]?.[0] || "";

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      "login_id",
      "name",
      "company_email",
      "contact_number",
      "roles",
      "team",
      "shift",
    ];

    requiredFields.forEach((field) => {
      if (
        field === "roles"
          ? formData.roles.length === 0
          : !formData[field]?.toString().trim()
      ) {
        errors[field] = "This field is required";
      }
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (formData.company_email && !emailRegex.test(formData.company_email)) {
      errors.company_email = "Invalid email format";
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      toast.error("Please fix validation errors");
      onError?.("Validation failed");
      return;
    }

    onStartSubmit?.();
    onSuccess?.(formData);
  };

  const handleClear = () => {
    setFormData({
      login_id: "",
      name: "",
      company_email: "",
      contact_number: "",
      roles: [],
      login_password: "",
      team: "",
      shift: "",
      alternate_shift: "",
    });
    setLocalErrors({});
  };

  const renderTextField = (field, label, type = "text", props = {}) => (
    <TextField
      fullWidth
      label={label}
      value={formData[field] || ""}
      onChange={(e) => handleChange(field, e.target.value)}
      error={!!getError(field)}
      helperText={getError(field)}
      type={type}
      InputLabelProps={type === "date" ? { shrink: true } : {}}
      disabled={submitting || props.disabled}
      {...props}
    />
  );

  const renderRolesField = () => (
    <FormControl fullWidth error={!!getError("roles")} sx={{ mb: 2 }}>
      <InputLabel id="roles-label">Role</InputLabel>
      <Select
        labelId="roles-label"
        label="Roles"
        fullWidth
        value={formData.roles || ""}
        onChange={(e) => handleChange("roles", [e.target.value])}
        disabled={submitting || loadingGroups}
        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
        sx={{ minWidth: 250 }}
      >
        {loadingGroups ? (
          <MenuItem disabled>Loading...</MenuItem>
        ) : (
          groups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {group.name}
            </MenuItem>
          ))
        )}
      </Select>

      {getError("roles") && (
        <Box color="error.main" fontSize={12} mt={0.5}>
          {getError("roles")}
        </Box>
      )}
    </FormControl>
  );

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          {renderTextField("login_id", "Login ID")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("name", "Name")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("company_email", "Company Email")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("contact_number", "Contact Number")}
        </Grid>

        <Grid item xs={12} sm={6}>
          {renderRolesField()}
        </Grid>

        {/* Team Dropdown */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!getError("team")}>
            <InputLabel id="team-label">Team</InputLabel>
            <Select
              labelId="team-label"
              label="Team"
              value={formData.team || ""}
              onChange={(e) => handleChange("team", e.target.value)}
              disabled={submitting || teamLoading}
              sx={{ minWidth: 250 }}
              fullWidth
            >
              {teamLoading ? (
                <MenuItem disabled>Loading...</MenuItem>
              ) : (
                teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))
              )}
            </Select>
            {getError("team") && (
              <Box color="error.main" fontSize={12} mt={0.5}>
                {getError("team")}
              </Box>
            )}
          </FormControl>
        </Grid>

        {/* Shift Dropdown (auto-populated from team) */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!getError("shift")}>
            <InputLabel id="shift-label">Shift</InputLabel>
            <Select
              labelId="shift-label"
              label="Shift"
              value={formData.shift || ""}
              onChange={(e) => handleChange("shift", e.target.value)}
              disabled={submitting || shiftLoading}
              sx={{ minWidth: 250 }}
            >
              {shiftLoading ? (
                <MenuItem disabled>Loading...</MenuItem>
              ) : (
                shifts.map((shift) => (
                  <MenuItem key={shift.id} value={shift.id}>
                    {shift.name}
                  </MenuItem>
                ))
              )}
            </Select>
            {getError("shift") && (
              <Box color="error.main" fontSize={12} mt={0.5}>
                {getError("shift")}
              </Box>
            )}
          </FormControl>
        </Grid>

        {/* Alternate Shift (free text + dropdown) */}
        {/* Alternate Shift (Autocomplete but stores ID) 
<Grid item xs={12} sm={6}>
  <Autocomplete
    options={shifts}
    getOptionLabel={(option) => option.name || ""}
    value={shifts.find((s) => s.id === formData.alternate_shift) || null}
    onChange={(e, newValue) => {
      handleChange("alternate_shift", newValue ? newValue.id : "");
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Alternate Shift"
        fullWidth
        error={!!getError("alternate_shift")}
        helperText={getError("alternate_shift")}
        sx={{ minWidth: 250 }}
      />
    )}
    disabled={submitting}
  />
</Grid>

*/}
        <Grid item xs={12} sm={6}>
          {renderTextField("login_password", "Login Password")}
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleClear}
              disabled={submitting}
            >
              Clear
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} /> : null}
            >
              {existingData ? "Update" : "Submit"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeForm;

