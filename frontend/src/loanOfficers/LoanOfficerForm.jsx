// src/components/LoanOfficerForm.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { toast } from "react-hot-toast";
import {
  useCreateLoanOfficerMutation,
  useUpdateLoanOfficerMutation,
  useValidateLoanOfficerMutation,
} from "../api/loanOfficerApi";

const LoanOfficerForm = ({
  existingData = {},
  onSuccess,
  onStartSubmit,
  onError,
  submitting,
  brokers = [],
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_number: "",
    NMLS: "",
    broker_company: null,
  });
  const [errors, setErrors] = useState({});

  const [createLoanOfficer] = useCreateLoanOfficerMutation();
  const [updateLoanOfficer] = useUpdateLoanOfficerMutation();
  const [validateLoanOfficer] = useValidateLoanOfficerMutation();

  // Prefill data
  useEffect(() => {
    if (existingData) {
      setFormData({
        name: existingData.name || "",
        email: existingData.email || "",
        contact_number: existingData.contact_number || "",
        NMLS: existingData.NMLS || "",
        broker_company:
          brokers.find((b) => b.id === existingData.broker_company) || null,
      });
    }
  }, [existingData, brokers]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const localErrors = {};
    if (!formData.name.trim()) localErrors.name = "Name is required";
    if (!formData.email.trim()) localErrors.email = "Email is required";
    if (!formData.contact_number.trim())
      localErrors.contact_number = "Phone number is required";
    if (!formData.NMLS.trim()) localErrors.NMLS = "NMLS is required";
    if (!formData.broker_company)
      localErrors.broker_company = "Please select a broker company";
    return localErrors;
  };

  const validateDuplicates = async () => {
    try {
      const result = await validateLoanOfficer({
        email: formData.email,
        phone: formData.contact_number,
        nmls: formData.NMLS,
        exclude_id: existingData?.id || null,
      }).unwrap();

      if (result.errors && Object.keys(result.errors).length > 0) {
        setErrors(result.errors);
        const msg = Object.values(result.errors).flat().join(" ");
        toast.error(msg);
        return false;
      }

      return true;
    } catch (err) {
      const backendErrors = err?.data?.errors || {};
      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
        const msg = Object.values(backendErrors).flat().join(" ");
        toast.error(msg);
      } else {
        toast.error("Unable to validate data. Please try again.");
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const localErrors = validateForm();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      toast.error("Please fill all required fields correctly.");
      onError?.("Validation errors");
      return;
    }

    const isUnique = await validateDuplicates();
    if (!isUnique) return;

    onStartSubmit?.();

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("email", formData.email);
    payload.append("contact_number", formData.contact_number);
    payload.append("NMLS", formData.NMLS);
    payload.append("broker_company", formData.broker_company.id);

    try {
      const mutation = existingData?.id
        ? updateLoanOfficer({ id: existingData.id, data: payload })
        : createLoanOfficer(payload);

      await mutation.unwrap();

      toast.success(
        existingData?.id
          ? `Loan Officer "${formData.name}" updated successfully.`
          : `Loan Officer "${formData.name}" added successfully.`
      );

      onSuccess?.();
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save loan officer. Please try again.");
    }
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Name"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            disabled={submitting}
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Email"
            fullWidth
            required
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            disabled={submitting}
          />
        </Grid>

        {/* Phone */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Phone"
            fullWidth
            required
            value={formData.contact_number}
            onChange={(e) => handleChange("contact_number", e.target.value)}
            error={!!errors.contact_number || !!errors.phone}
            helperText={errors.contact_number || errors.phone}
            disabled={submitting}
          />
        </Grid>

        {/* NMLS */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="NMLS"
            fullWidth
            required
            value={formData.NMLS}
            onChange={(e) => handleChange("NMLS", e.target.value)}
            error={!!errors.NMLS || !!errors.nmls}
            helperText={errors.NMLS || errors.nmls}
            disabled={submitting}
          />
        </Grid>

        {/* Broker dropdown */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={brokers}
            getOptionLabel={(option) => option.name || ""}
            value={formData.broker_company}
            onChange={(e, newValue) => handleChange("broker_company", newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Broker Company"
                placeholder="Search broker..."
                fullWidth
                error={!!errors.broker_company}
                helperText={errors.broker_company}
                disabled={submitting}
                sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}
              />
            )}
            ListboxProps={{ style: { maxHeight: 250, overflowY: "auto" } }}
            filterSelectedOptions
          />
        </Grid>

        {/* Submit */}
        <Grid item xs={12}>
          <Box textAlign="right">
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={18} />}
            >
              {existingData?.id ? "Update" : "Submit"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoanOfficerForm;
