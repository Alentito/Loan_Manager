import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  useAddLenderMutation,
  useUpdateLenderMutation,
  useValidateLenderFieldMutation,
} from "../api/lenderApiSlice";

const SlideTransition = (props) => <Slide {...props} direction="left" />;

const LenderFormDialog = ({ open, onClose, editingLender, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });
  const [submitting, setSubmitting] = useState(false);

  const [addLender] = useAddLenderMutation();
  const [updateLender] = useUpdateLenderMutation();
  const [validateField] = useValidateLenderFieldMutation();

  // Populate form when editingLender changes
  useEffect(() => {
    if (open) {
      setErrors({});
      setServerErrors({});
      setSubmitting(false);
      setFormData(
        editingLender || {
          lender_name: "",
          account_executive_name: "",
          executive_email: "",
          executive_phone: "",
          executive_address: "",
          account_manager_name: "",
          manager_email: "",
          manager_contact: "",
          manager_address: "",
          mortgage_clause: "",
        }
      );
    }
  }, [open, editingLender]);

  const showToast = (message, severity = "info") => {
    setToast({ open: true, message, severity });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleValidation = async (field, value) => {
    if (!value) return;

    if (field.includes("email")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setErrors((prev) => ({ ...prev, [field]: "Invalid email format" }));
        return;
      }
    }

    try {
      const res = await validateField({ field, value }).unwrap();
      if (res.exists) {
        setErrors((prev) => ({ ...prev, [field]: `${field.replaceAll("_", " ")} already exists` }));
      }
    } catch {
      showToast("Validation failed. Please try again.", "error");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.lender_name?.trim()) newErrors.lender_name = "Lender name is required";
    if (!formData.executive_email?.trim()) newErrors.executive_email = "Executive email is required";
    if (!formData.executive_phone?.trim()) newErrors.executive_phone = "Executive phone is required";
    if (!formData.manager_email?.trim()) newErrors.manager_email = "Manager email is required";
    if (!formData.manager_contact?.trim()) newErrors.manager_contact = "Manager contact is required";
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("Please fix validation errors before submitting.", "error");
      return;
    }

    setSubmitting(true);
    setServerErrors({});

    try {
      if (editingLender?.id) {
        await updateLender({ id: editingLender.id, ...formData }).unwrap();
        showToast("Lender updated successfully", "success");
      } else {
        await addLender(formData).unwrap();
        showToast("Lender added successfully", "success");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      if (error?.data && typeof error.data === "object") {
        setServerErrors(error.data);
      } else {
        showToast("Failed to save lender. Please try again.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getError = (field) => errors[field] || serverErrors[field]?.[0] || "";

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ m: 0, p: 2, backgroundColor: "#1976d2", color: "#fff" }}>
          {editingLender ? "Edit Lender" : "Add New Lender"}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8, color: "#fff" }}
            disabled={submitting}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            {[
              { name: "lender_name", label: "Lender Name", required: true },
              { name: "account_executive_name", label: "Account Executive Name" },
              { name: "executive_email", label: "Executive Email", required: true, validate: true },
              { name: "executive_phone", label: "Executive Phone", required: true, validate: true },
              { name: "executive_address", label: "Executive Address", multiline: true },
              { name: "account_manager_name", label: "Account Manager Name" },
              { name: "manager_email", label: "Manager Email", required: true, validate: true },
              { name: "manager_contact", label: "Manager Contact #", required: true, validate: true },
              { name: "manager_address", label: "Manager Address", multiline: true },
              { name: "mortgage_clause", label: "Mortgage Clause", multiline: true },
            ].map((f, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <TextField
                  name={f.name}
                  label={f.label}
                  value={formData[f.name] || ""}
                  onChange={handleChange}
                  onBlur={(e) => f.validate && handleValidation(f.name, e.target.value)}
                  fullWidth
                  required={f.required}
                  error={Boolean(getError(f.name))}
                  helperText={getError(f.name)}
                  multiline={f.multiline}
                  disabled={submitting}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Box flexGrow={1} />
          <Button
            onClick={() => {
              setFormData({});
              setErrors({});
              setServerErrors({});
              showToast("Form cleared", "info");
            }}
            color="warning"
            variant="outlined"
            disabled={submitting}
          >
            Clear Form
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : null}
          >
            {editingLender ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, boxShadow: 3, fontSize: "0.9rem" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LenderFormDialog;
