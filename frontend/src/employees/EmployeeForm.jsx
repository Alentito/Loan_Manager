import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  CircularProgress,
  MenuItem,
  Checkbox,
  ListItemText,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { toast } from "react-hot-toast";
import { useGetGroupsQuery } from "../api/authApi"; // <-- Import your RTK Query hook

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
];

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
    roles: [], // <-- Use array for selected group IDs
    status: "active",
    login_password: "",
    bank_name: "",
    account_number: "",
    bank_details: "",
    address: "",
    experience_months: "",
    performance_score: "",
    date_of_join: "",
    leave_balance: "",
  });

  const [localErrors, setLocalErrors] = useState({});

  // Fetch groups/roles from API
  const { data: groupsData = [], isLoading: loadingGroups } =
    useGetGroupsQuery();
  const groups = Array.isArray(groupsData)
    ? groupsData
    : groupsData.results || [];

  useEffect(() => {
    if (existingData) {
      setFormData((prev) => ({
        ...prev,
        ...existingData,
        roles: existingData.roles || [],
      }));
    }
  }, [existingData]);

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
      "status",
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
      status: "active",
      login_password: "",
      bank_name: "",
      account_number: "",
      bank_details: "",
      address: "",
      experience_months: "",
      performance_score: "",
      date_of_join: "",
      leave_balance: "",
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

  // Render roles as multi-select
  const renderRolesField = () => (
  <FormControl fullWidth error={!!getError("roles")} sx={{ mb: 2, width: "100%" }}>
    <InputLabel id="roles-label">Role</InputLabel>
    <Select
      labelId="roles-label"
      label="Roles"
      fullWidth
      value={formData.roles[0] || ""}
      onChange={(e) => handleChange("roles", [e.target.value])}
      disabled={submitting || loadingGroups}
      sx={{ width: "100%" }}             // <- ensure full width
      MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
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

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Status"
            fullWidth
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            error={!!getError("status")}
            helperText={getError("status")}
            disabled={submitting}
          >
            {statusOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          {renderTextField("login_password", "Login Password")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("bank_name", "Bank Name")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("account_number", "Account Number")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("bank_details", "Bank Details")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("address", "Address")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField(
            "experience_months",
            "Experience (Months)",
            "number"
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("performance_score", "Performance Score", "number")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("date_of_join", "Date of Joining", "date")}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("leave_balance", "Leave Balance", "number", {
            disabled: true,
          })}
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
