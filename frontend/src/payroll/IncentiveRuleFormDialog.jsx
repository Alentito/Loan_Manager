import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  Autocomplete,
} from "@mui/material";
import { useGetGroupsQuery } from "../api/authApi";
import { useGetMilestonesQuery } from "../api/milestoneApi";

export default function IncentiveRuleFormDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    role: "",
    milestone: "",
    min_files: "",
    max_files: "",
    amount_per_file: "",
  });

  // Groups (Role/Group dropdown)
  const { data: groupsData, isFetching: groupsLoading } = useGetGroupsQuery();
  const groups = useMemo(() => {
    if (!groupsData) return [];
    return Array.isArray(groupsData) ? groupsData : groupsData.results || [];
  }, [groupsData]);
  const selectedRole = useMemo(
    () => groups.find((g) => String(g.id) === String(form.role)) || null,
    [groups, form.role]
  );

  // Milestones (searchable dropdown)
  const [milestoneSearch, setMilestoneSearch] = useState("");
  useEffect(() => {
    if (open) setMilestoneSearch(initial?.milestone ?? "");
  }, [open, initial]);
  const { data: msData, isFetching: msLoading } = useGetMilestonesQuery({
    page: 1,
    pageSize: 50,
    search: milestoneSearch,
  });
  const milestones = useMemo(() => {
    if (!msData) return [];
    return Array.isArray(msData) ? msData : msData.results || [];
  }, [msData]);
  const selectedMilestone = useMemo(
    () => milestones.find((m) => (m?.name || "") === String(form.milestone)) || null,
    [milestones, form.milestone]
  );

  useEffect(() => {
    if (initial) {
      const roleId = Array.isArray(initial.role_detail) && initial.role_detail.length > 0
        ? initial.role_detail[0]?.id ?? ""
        : "";
      const msName = initial?.milestone_detail?.name ?? initial?.milestone ?? "";
      setForm({
        role: roleId,
        milestone: msName,
        min_files: String(initial.min_files ?? ""),
        max_files: initial.max_files == null ? "" : String(initial.max_files),
        amount_per_file: String(initial.amount_per_file ?? ""),
      });
    } else {
      setForm({ role: "", milestone: "", min_files: "", max_files: "", amount_per_file: "" });
    }
  }, [initial]);

  const handleChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

const handleSave = () => {
  const payload = {
    // send role as an array for M2M
    roles: form.role === "" ? [] : [Number(form.role)],
    min_files: Number(form.min_files || 0),
    max_files: form.max_files === "" ? null : Number(form.max_files),
    amount_per_file: Number(form.amount_per_file || 0),
    milestone_id: selectedMilestone?.id ?? null,
  };
  onSave(payload);
};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? "Edit Incentive Rule" : "New Incentive Rule"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={groups}
              loading={groupsLoading}
              value={selectedRole}
              onChange={(_e, val) => setForm((s) => ({ ...s, role: val ? val.id : "" }))}
              getOptionLabel={(o) => o?.name || ""}
              isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
              size="small"
              fullWidth
              clearOnEscape
              noOptionsText="No roles found"
              loadingText="Loading roles..."
              ListboxProps={{ sx: { maxHeight: 300 } }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Role/Group"
                  placeholder="Search and select a role/group"
                  fullWidth
                  margin="dense"
                  inputProps={{ ...params.inputProps, autoComplete: "new-password" }}
                  helperText="Pick one role/group"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={milestones}
              loading={msLoading}
              value={selectedMilestone}
              inputValue={form.milestone}
              onInputChange={(_e, val) => {
                setForm((s) => ({ ...s, milestone: val }));
                setMilestoneSearch(val);
              }}
              onChange={(_e, val) => {
                if (val) setForm((s) => ({ ...s, milestone: val.name || "" }));
              }}
              getOptionLabel={(o) => o?.name || ""}
              isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
              freeSolo
              size="small"
              fullWidth
              clearOnEscape
              noOptionsText={msLoading ? "Loading..." : "No milestones found"}
              ListboxProps={{ sx: { maxHeight: 300 } }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Milestone"
                  placeholder="Search milestones or type a custom one"
                  fullWidth
                  margin="dense"
                  inputProps={{ ...params.inputProps, autoComplete: "new-password" }}
                  helperText="Choose from list or type to add"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Min Files"
              type="number"
              fullWidth
              margin="dense"
              value={form.min_files}
              onChange={handleChange("min_files")}
              inputProps={{ step: 1, min: 0 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Max Files (blank = ∞)"
              type="number"
              fullWidth
              margin="dense"
              value={form.max_files}
              onChange={handleChange("max_files")}
              inputProps={{ step: 1, min: 0 }}
              helperText="Leave blank for no upper limit"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Amount per File"
              type="number"
              fullWidth
              margin="dense"
              value={form.amount_per_file}
              onChange={handleChange("amount_per_file")}
              inputProps={{ step: "0.01", min: 0 }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}