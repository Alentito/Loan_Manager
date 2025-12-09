import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useGetBrokersQuery } from "../../api/brokerApi";
import { useGetLoanOfficersQuery } from "../../api/loanOfficerApi";
import { useGetEmployeesQuery } from "../../api/employeeApi";
import { useGetMilestonesQuery } from "../../api/milestoneApi";
import { useGetLendersQuery } from "../../api/lenderApiSlice";
import { useGetGroupsQuery } from "../../api/authApi";

export default function LoanFormDialog({
  open,
  onClose,
  onSave,
  newLoan,
  setNewLoan,
  lenders,
  setLenders,
  roleAssignments,
  setRoleAssignments,
}) {
  // Safe fallbacks
  const assignments = roleAssignments || {};
  const updateAssignments =
    setRoleAssignments ||
    (() => {
      /* no-op */
    });

    const currentMilestoneId =
    newLoan.milestone_id ??
    (typeof newLoan.milestone === "object" ? newLoan.milestone?.id : "") ??
    "";
    
  // Fetch assignable roles
  const { data: allRolesData = {} } = useGetGroupsQuery({ page_size: 200 });
  const allRoles = allRolesData.results || [];
  const assignableRoles = allRoles.filter((r) => r.assignable_on_loan);

  // Employees
  const { data: employeesData = {} } = useGetEmployeesQuery({ page_size: 2000 });
  const employees = employeesData.results || [];

  // Normalize any stored primitive IDs into full employee objects after employees load
  useEffect(() => {
    updateAssignments((prev) => {
      if (!prev) return {};
      const next = {};
      Object.entries(prev).forEach(([roleId, arr]) => {
        if (!Array.isArray(arr)) {
          next[roleId] = [];
          return;
        }
        next[roleId] = arr
          .map((item) => {
            const id = typeof item === "object" ? item.id : item;
            return employees.find((e) => e.id === id) || null;
          })
          .filter(Boolean);
      });
      return next;
    });
  }, [employees, updateAssignments]);

  // Filter employees belonging to a role (supports emp.groups or emp.roles)
  const getEmployeesForRole = (roleId) =>
    employees.filter(
      (emp) =>
        (Array.isArray(emp.groups) && emp.groups.includes(roleId)) ||
        (Array.isArray(emp.roles) && emp.roles.includes(roleId))
    );

  // Selected employees for a role (match by ID)
  const getSelectedEmployeesForRole = (roleId) => {
    const assigned = assignments[roleId];
    if (!Array.isArray(assigned)) return [];
    return assigned
      .map((emp) => {
        const id = typeof emp === "object" ? emp.id : emp;
        return employees.find((e) => e.id === id) || null;
      })
      .filter(Boolean);
  };

  // Brokers
  const { data: brokersData = {}, isLoading: loadingBrokers } = useGetBrokersQuery({
    page: 1,
    page_size: 1000,
  });
  const brokers = brokersData.results || [];

  // Milestones
  const { data: milestonesData = {}, isLoading: loadingMilestones } =
    useGetMilestonesQuery({ page: 1, page_size: 1000 });
  const milestoneOptions = milestonesData.results || [];

  // Loan Officers (dependent on broker)
  const { data: loanOfficersData = {}, isLoading: loadingLoanOfficers } =
    useGetLoanOfficersQuery(
      newLoan.broker_id ? { brokerId: newLoan.broker_id } : {},
      { skip: !newLoan.broker_id }
    );
  const loanOfficers = loanOfficersData.results || [];

  const loanOfficersFiltered = useMemo(() => {
    if (!newLoan.broker_id) return [];
    const brokerId = String(newLoan.broker_id);
    return loanOfficers.filter((o) => {
      const ids = [
        o.broker_id,
        o.broker_company,
        o.broker?.id,
        o.company_id,
        o.company?.id,
      ]
        .filter((v) => v != null)
        .map(String);
      return ids.includes(brokerId);
    });
  }, [loanOfficers, newLoan.broker_id]);

  const loanOfficerNoOptionsText = useMemo(() => {
    if (!newLoan.broker_id) return "Select a broker first";
    if (loadingLoanOfficers) return "Loading loan officers...";
    return "No loan officers for selected broker";
  }, [newLoan.broker_id, loadingLoanOfficers]);

  // Lenders (search)
  const [lenderSearch, setLenderSearch] = useState("");
  const { data: lendersData = {}, isLoading: loadingLenders } = useGetLendersQuery({
    page: 1,
    page_size: 15,
    search: lenderSearch,
  });
  const lenderOptions = lendersData.results || [];

  // Save handler
const handleSaveClick = useCallback(() => {
  const lenderIds = (lenders || []).map((l) => l?.id).filter(Boolean);
  const roleAssignmentsArray = Object.entries(assignments).map(
    ([roleId, emps]) => ({
      role_id: Number(roleId),
      employee_ids: (emps || [])
        .map((e) => (typeof e === "object" ? e.id : e))
        .filter(Boolean),
    })
  );
  onSave({
    ...newLoan,
    milestone_id: currentMilestoneId || null,   // ensure FK goes up
    lender_ids: lenderIds,
    role_assignments: roleAssignmentsArray,
  });
}, [onSave, newLoan, lenders, assignments, currentMilestoneId]);


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{newLoan?.id ? "Edit Loan" : "New Loan"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="First Name"
              fullWidth
              margin="normal"
              value={newLoan.first_name || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, first_name: e.target.value })
              }
            />
            <TextField
              label="Last Name"
              fullWidth
              margin="normal"
              value={newLoan.last_name || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, last_name: e.target.value })
              }
            />

            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={brokers}
                loading={loadingBrokers}
                getOptionLabel={(o) => o?.name ?? ""}
                value={
                  brokers.find((b) => String(b.id) === String(newLoan.broker_id)) ||
                  null
                }
                onChange={(_e, val) =>
                  setNewLoan({
                    ...newLoan,
                    broker_id: val ? val.id : "",
                    loan_officer_id: "",
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Broker" variant="outlined" />
                )}
                isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={newLoan.broker_id ? loanOfficersFiltered : []}
                loading={loadingLoanOfficers && !!newLoan.broker_id}
                getOptionLabel={(o) => o?.name ?? ""}
                value={
                  loanOfficersFiltered.find(
                    (o) => String(o.id) === String(newLoan.loan_officer_id)
                  ) || null
                }
                onChange={(_e, val) =>
                  setNewLoan({
                    ...newLoan,
                    loan_officer_id: val ? val.id : "",
                  })
                }
                noOptionsText={loanOfficerNoOptionsText}
                renderInput={(params) => (
                  <TextField {...params} label="Loan Officer" variant="outlined" />
                )}
                isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
  <InputLabel>Milestone</InputLabel>
  <Select
    label="Milestone"
    // ...existing code...
    value={currentMilestoneId}
    onChange={(e) =>
      setNewLoan({ ...newLoan, milestone_id: e.target.value })
    }
  >
    {loadingMilestones ? (
      <MenuItem value="">
        <em>Loading milestones...</em>
      </MenuItem>
    ) : milestoneOptions.length ? (
      milestoneOptions.map((m) => (
        <MenuItem key={m.id} value={m.id}>
          {m.name}
        </MenuItem>
      ))
    ) : (
      <MenuItem value="">
        <em>No milestones</em>
      </MenuItem>
    )}
  </Select>
</FormControl>

            <TextField
              label="Compensation"
              fullWidth
              margin="normal"
              value={newLoan.compensation || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, compensation: e.target.value })
              }
            />
            <TextField
              label="Lock Status"
              fullWidth
              margin="normal"
              value={newLoan.lock_status || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, lock_status: e.target.value })
              }
            />
            <TextField
              label="Closing Date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={newLoan.closing_date || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, closing_date: e.target.value })
              }
            />
            <TextField
              label="Point File"
              fullWidth
              margin="normal"
              value={newLoan.point_file || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, point_file: e.target.value })
              }
            />
            <TextField
              label="Subject Property"
              fullWidth
              margin="normal"
              value={newLoan.subject_property || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, subject_property: e.target.value })
              }
            />
            <TextField
              label="Loan Comment"
              fullWidth
              multiline
              rows={3}
              margin="normal"
              value={newLoan.loan_comment || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, loan_comment: e.target.value })
              }
            />

            <FormControl fullWidth margin="normal">
              <Autocomplete
                multiple
                options={lenderOptions}
                loading={loadingLenders}
                filterSelectedOptions
                value={lenders || []}
                onChange={(_e, val) => setLenders(val || [])}
                onInputChange={(_e, value, reason) => {
                  if (reason === "input") setLenderSearch(value);
                }}
                getOptionLabel={(o) =>
                  o?.lender_name ||
                  o?.executive_email ||
                  o?.manager_email ||
                  ""
                }
                isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lenders"
                    placeholder="Search lenders…"
                  />
                )}
              />
            </FormControl>

            {assignableRoles.map((role) => (
              <FormControl fullWidth margin="normal" key={role.id}>
                <Autocomplete
                  multiple
                  options={getEmployeesForRole(role.id)}
                  value={getSelectedEmployeesForRole(role.id)}
                  onChange={(_e, val) =>
                    updateAssignments((prev) => ({
                      ...(prev || {}),
                      [role.id]: val,
                    }))
                  }
                  getOptionLabel={(o) => o?.name ?? ""}
                  isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
                  renderInput={(params) => (
                    <TextField {...params} label={role.name} variant="outlined" />
                  )}
                />
              </FormControl>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSaveClick}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}