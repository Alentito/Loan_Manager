import React, { useMemo, useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField } from "@mui/material";

export default function PayrollFormDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    employee_id: "",
    month: "",
    basic_salary: "",
    hra: "0",
    gross_salary: "",
    incentive_amount: "0",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        employee_id: initial.employee?.id || initial.employee_id || "",
        month: initial.month?.slice(0, 10) || "",
        basic_salary: String(initial.basic_salary ?? ""),
        hra: String(initial.hra ?? "0"),
        gross_salary: String(initial.gross_salary ?? ""),
        incentive_amount: String(initial.incentive_amount ?? "0"),
      });
    }
  }, [initial]);

  const handleChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSave = () => {
    // Backend will compute PF/ESI/EPS/Net
    const payload = {
      employee_id: form.employee_id || null,
      month: form.month || null,
      basic_salary: parseFloat(form.basic_salary || 0),
      hra: parseFloat(form.hra || 0),
      gross_salary: parseFloat(form.gross_salary || 0),
      incentive_amount: parseFloat(form.incentive_amount || 0),
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? "Edit Payroll" : "New Payroll"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              label="Employee ID"
              fullWidth
              value={form.employee_id}
              onChange={handleChange("employee_id")}
              helperText="Enter Employee ID (link to your Employee autocomplete if desired)"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Month"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.month}
              onChange={handleChange("month")}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Basic Salary" fullWidth value={form.basic_salary} onChange={handleChange("basic_salary")} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="HRA" fullWidth value={form.hra} onChange={handleChange("hra")} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Gross Salary" fullWidth value={form.gross_salary} onChange={handleChange("gross_salary")} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Incentive Amount" fullWidth value={form.incentive_amount} onChange={handleChange("incentive_amount")} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}