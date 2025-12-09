import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Popover,
  Box,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { ChromePicker } from "react-color";

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "active",
  sort_order: 0,
  color: "#2563EB",
  background_color: "#EEF2FF",
  notify_on_reach: false,
 include_in_reports: false,
include_in_payroll: false,
};

const helperSx = { "& .MuiFormHelperText-root": { minHeight: 20 } };
const hexRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export default function MilestoneFormDialog({
  open,
  onClose,
  milestone,
  onSubmit,
  loading,
}) {
  const isEditing = Boolean(milestone);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [anchorColor, setAnchorColor] = useState(null);
  const [anchorBg, setAnchorBg] = useState(null);

  useEffect(() => {
    if (!open) {
      setFormData(EMPTY_FORM);
      setErrors({});
      setAnchorColor(null);
      setAnchorBg(null);
      return;
    }
    if (milestone) {
      setFormData({
        name: milestone.name ?? "",
        description: milestone.description ?? "",
        status: milestone.status ?? "active",
        sort_order: milestone.sort_order ?? milestone.sortOrder ?? 0,
        color: milestone.color ?? "#2563EB",
        background_color:
          milestone.background_color ?? milestone.backgroundColor ?? "#EEF2FF",
        notify_on_reach: Boolean(milestone.notify_on_reach),
        include_in_reports: Boolean(milestone.include_in_reports),
        include_in_payroll: Boolean(milestone.include_in_payroll),
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors({});
  }, [open, milestone]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "sort_order" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const validate = useCallback(() => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = "Name is required";
    if (!hexRegex.test(formData.color)) nextErrors.color = "Invalid hex code";
    if (!hexRegex.test(formData.background_color))
      nextErrors.background_color = "Invalid hex code";
    if (
      formData.sort_order !== "" &&
      (Number.isNaN(Number(formData.sort_order)) ||
        Number(formData.sort_order) < 0)
    ) {
      nextErrors.sort_order = "Sort order must be a number ≥ 0";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formData]);

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit?.({
      ...formData,
      sort_order: Number(formData.sort_order) || 0,
    });
  };

  const closeDialog = () => {
    if (!loading) onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {isEditing ? "Edit Milestone" : "Create New Milestone"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEditing ? "Update milestone information" : "Add a new milestone"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} // 1 column on mobile, 2 columns after 600px
          gap={2}
        >
          {" "}
          {/* Basic info column */}
          <Grid item xs={12} md={6} >
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: 2, bgcolor: "#FAFAFA", height: "100%" }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Basic Information
              </Typography>
              <Grid container spacing={2} direction="column">
                <Grid item>
                  <TextField
                    label="Name *"
                    size="small"
                    fullWidth
                    value={formData.name}
                    onChange={handleChange("name")}
                    error={Boolean(errors.name)}
                    helperText={errors.name || " "}
                    sx={helperSx}
                  />
                </Grid>
                <Grid item>
                  <FormControl size="small" fullWidth sx={helperSx}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={handleChange("status")}
                    >
                      {STATUSES.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <TextField
                    label="Description"
                    size="small"
                    fullWidth
                    multiline
                    minRows={3}
                    value={formData.description}
                    onChange={handleChange("description")}
                    helperText="Optional description"
                    sx={helperSx}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    label="Sort Order"
                    type="number"
                    size="small"
                    fullWidth
                    value={formData.sort_order}
                    onChange={handleChange("sort_order")}
                    error={Boolean(errors.sort_order)}
                    helperText={errors.sort_order || "Controls display order"}
                    sx={helperSx}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          {/* Appearance column */}
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: 2, bgcolor: "#FAFAFA", height: "100%" }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Appearance
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Text color */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Text Color
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: formData.color,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      onClick={(e) => {
                        setAnchorColor(e.currentTarget);
                        setAnchorBg(null);
                      }}
                    />
                    <TextField
                      label="Hex Code"
                      size="small"
                      fullWidth
                      value={formData.color}
                      onChange={handleChange("color")}
                      error={Boolean(errors.color)}
                      helperText={errors.color || " "}
                      sx={helperSx}
                    />
                  </Box>
                </Box>

                {/* Background color */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Background Color
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: formData.background_color,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      onClick={(e) => {
                        setAnchorBg(e.currentTarget);
                        setAnchorColor(null);
                      }}
                    />
                    <TextField
                      label="Hex Code"
                      size="small"
                      fullWidth
                      value={formData.background_color}
                      onChange={handleChange("background_color")}
                      error={Boolean(errors.background_color)}
                      helperText={errors.background_color || " "}
                      sx={helperSx}
                    />
                  </Box>
                </Box>

                {/* Preview */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Preview
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      textAlign: "center",
                      px: 2,
                      py: 1,
                      borderRadius: 1.5,
                      bgcolor: formData.background_color,
                      color: formData.color,
                      fontWeight: 500,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {formData.name || "Milestone Name"}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.notify_on_reach}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notify_on_reach: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Send email when a loan reaches this milestone"
                  />
                </Grid>
                <Grid item>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.include_in_reports}
                        onChange={(e) =>
                          setFormData((prev) => ({
                                                        ...prev,
                            include_in_reports: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Include milestone in reports"
                  />
                </Grid>
                <Grid item>
                  <FormControlLabel
                    control={
                     <Checkbox
                        checked={formData.include_in_payroll}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            include_in_payroll: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Include milestone in payroll calculations"
                  />
               </Grid>
        </Box>

        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Fix the highlighted fields before saving.
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={closeDialog} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Saving..." : isEditing ? "Update" : "Create"}
        </Button>
      </DialogActions>

      {/* Color pickers */}
      <Popover
        open={Boolean(anchorColor)}
        anchorEl={anchorColor}
        onClose={() => setAnchorColor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <ChromePicker
          color={formData.color}
          onChange={(color) =>
            setFormData((prev) => ({ ...prev, color: color.hex }))
          }
        />
      </Popover>

      <Popover
        open={Boolean(anchorBg)}
        anchorEl={anchorBg}
        onClose={() => setAnchorBg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <ChromePicker
          color={formData.background_color}
          onChange={(color) =>
            setFormData((prev) => ({ ...prev, background_color: color.hex }))
          }
        />
      </Popover>
    </Dialog>
  );
}
