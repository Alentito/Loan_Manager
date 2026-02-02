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
import { useValidateEmployeeFieldMutation } from "../api/employeeApi";


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
  roles: [],
  login_password: "",
  team: "",
  shift: "",
  alternate_shift: "",

  bank_name: "",
  bank_account_no: "",
  work_location: "",

  base_salary: "",
  hra: "",
  conveyance_allowance: "",
  medical_reimbursement: "",
  uniform_allowance: "",
  food_allowance: "",
  special_allowance: "",
  arrear_salary: "",

  // ✅ Statutory
  uan_number: "",
  tds_amount: "",
  labour_welfare_fund: "",

  // ✅ Variable earnings
  bonus_amount: "",
  leave_encashment_amount: "",
  overtime_hours: "",
  overtime_amount: "",
  night_shift_allowance: "",
  comp_off_balance: "",

  // ✅ Deductions
  loan_repayment_amount: "",
  other_deductions: "",
});


  const [localErrors, setLocalErrors] = useState({});
  const [validateField] = useValidateEmployeeFieldMutation();
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
      bank_name: existingData.bank_name || "",
      bank_account_no: existingData.bank_account_no || "",
      work_location: existingData.work_location || "",
      base_salary: existingData.base_salary || "",
      hra: existingData.hra || "",
      conveyance_allowance: existingData.conveyance_allowance || "",
      medical_reimbursement: existingData.medical_reimbursement || "",
      uniform_allowance: existingData.uniform_allowance || "",
      food_allowance: existingData.food_allowance || "",
      special_allowance: existingData.special_allowance || "",
      arrear_salary: existingData.arrear_salary || "",
      uan_number: existingData.uan_number || "",
tds_amount: existingData.tds_amount || "",
labour_welfare_fund: existingData.labour_welfare_fund || "",

bonus_amount: existingData.bonus_amount || "",
leave_encashment_amount: existingData.leave_encashment_amount || "",
overtime_hours: existingData.overtime_hours || "",
overtime_amount: existingData.overtime_amount || "",
night_shift_allowance: existingData.night_shift_allowance || "",
comp_off_balance: existingData.comp_off_balance || "",

loan_repayment_amount: existingData.loan_repayment_amount || "",
other_deductions: existingData.other_deductions || "",

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

  const handleFieldValidation = async (field, value) => {
  if (!value) return;

  // Email pattern check
  if (field === "company_email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(value)) {
      setLocalErrors((prev) => ({
        ...prev,
        [field]: "Invalid email format",
      }));
      return;
    }
  }

  try {
    const res = await validateField({ field, value }).unwrap();
    if (res.exists) {
      setLocalErrors((prev) => ({
        ...prev,
        [field]: `${field.replace("_", " ")} already exists`,
      }));
      toast.error(`${field.replace("_", " ")} already exists`);
    }
  } catch {
    toast.error("Validation failed. Please try again.");
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

  // ✅ Only login_id is required
  if (!formData.login_id?.toString().trim()) {
    errors.login_id = "Login ID is required";
  }

  // ✅ Optional: validate email only if it's entered
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
      bank_name: "",
      bank_account_no: "",
      work_location: "",
      base_salary: "",
      hra: "",
      conveyance_allowance: "",
      medical_reimbursement: "",
      uniform_allowance: "",
      food_allowance: "",
      special_allowance: "",
      arrear_salary: "",

      // ✅ Statutory
      uan_number: "",
      tds_amount: "",
      labour_welfare_fund: "",

      // ✅ Variable earnings
      bonus_amount: "",
      leave_encashment_amount: "",
      overtime_hours: "",
      overtime_amount: "",
      night_shift_allowance: "",
      comp_off_balance: "",

      // ✅ Deductions
      loan_repayment_amount: "",
      other_deductions: "",
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
  <TextField
    fullWidth
    label="Login ID"
    value={formData.login_id || ""}
    onChange={(e) => handleChange("login_id", e.target.value)}
    onBlur={(e) => handleFieldValidation("login_id", e.target.value)} // 👈 validation on blur
    error={!!getError("login_id")}
    helperText={getError("login_id")}
    disabled={submitting}
  />
</Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("name", "Name")}
        </Grid>
        <Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    label="Company Email"
    value={formData.company_email || ""}
    onChange={(e) => handleChange("company_email", e.target.value)}
    onBlur={(e) => handleFieldValidation("company_email", e.target.value)} // 👈 validation on blur
    error={!!getError("company_email")}
    helperText={getError("company_email")}
    disabled={submitting}
  />
</Grid>
        <Grid item xs={12} sm={6}>
          {renderTextField("contact_number", "Contact Number")}
        </Grid>

        <Grid item xs={12} sm={6}>
          {renderRolesField()}
        </Grid>

{/* Team Dropdown (searchable + scrollable + wider) */}
<Grid item xs={12} sm={6}>
  <FormControl
    fullWidth
    error={!!getError("team")}
    sx={{ "& .MuiAutocomplete-root": { minWidth: "100%" } }}
  >
    <Autocomplete
      options={teams}
      getOptionLabel={(option) => option?.name || ""}
      value={teams.find((t) => t.id === formData.team) || null}
      onChange={(e, newValue) =>
        handleChange("team", newValue ? newValue.id : "")
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Team"
          placeholder="Search or select team"
          error={!!getError("team")}
          helperText={getError("team")}
          sx={{
            minWidth: 180, // 💡 wider box
            "& .MuiInputBase-root": {
              borderRadius: 2,
            },
          }}
        />
      )}
      ListboxProps={{
        style: { maxHeight: 250, overflowY: "auto" },
      }}
      disabled={submitting || teamLoading}
    />
  </FormControl>
</Grid>


        {/* Shift Dropdown (searchable + scrollable + wider) */}
<Grid item xs={12} sm={6}>
  <FormControl
    fullWidth
    error={!!getError("shift")}
    sx={{ "& .MuiAutocomplete-root": { minWidth: "100%" } }}
  >
    <Autocomplete
      options={shifts}
      getOptionLabel={(option) => option?.name || ""}
      value={shifts.find((s) => s.id === formData.shift) || null}
      onChange={(e, newValue) =>
        handleChange("shift", newValue ? newValue.id : "")
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Shift"
          placeholder="Search or select shift"
          error={!!getError("shift")}
          helperText={getError("shift")}
          sx={{
            minWidth: 180, // 💡 wider box
            "& .MuiInputBase-root": {
              borderRadius: 2,
            },
          }}
        />
      )}
      ListboxProps={{
        style: { maxHeight: 250, overflowY: "auto" },
      }}
      disabled={submitting || shiftLoading}
    />
  </FormControl>
</Grid>

{/* 🏦 Bank Name */}
<Grid item xs={12} sm={6}>
  {renderTextField("bank_name", "Bank Name")}
</Grid>

{/* 💳 Bank Account Number */}
<Grid item xs={12} sm={6}>
  {renderTextField("bank_account_no", "Bank Account Number")}
</Grid>

{/* 📍 Work Location */}
<Grid item xs={12} sm={6}>
  {renderTextField("work_location", "Work Location")}
</Grid>

<Grid item xs={12} sm={6}>
  {renderTextField("base_salary", "Basic Salary", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("hra", "HRA (House Rent Allowance)", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("conveyance_allowance", "Conveyance Allowance", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("medical_reimbursement", "Medical Reimbursement", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("uniform_allowance", "Uniform Allowance", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("food_allowance", "Food Allowance", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("special_allowance", "Special Allowance", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("arrear_salary", "Arrear Salary", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("uan_number", "PF UAN Number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("tds_amount", "TDS Amount", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("labour_welfare_fund", "Labour Welfare Fund", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("bonus_amount", "Bonus Amount", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("leave_encashment_amount", "Leave Encashment", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("overtime_hours", "Overtime Hours", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("overtime_amount", "Overtime Amount", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("night_shift_allowance", "Night Shift Allowance", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("comp_off_balance", "Comp Off Balance", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("loan_repayment_amount", "Loan Repayment", "number")}
</Grid>
<Grid item xs={12} sm={6}>
  {renderTextField("other_deductions", "Other Deductions", "number")}
</Grid>

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

