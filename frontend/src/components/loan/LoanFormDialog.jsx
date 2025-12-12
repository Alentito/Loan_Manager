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
import { useGetAllLoanOfficersQuery } from "../../api/loanOfficerApi";
import { useGetAllEmployeesQuery } from "../../api/employeeApi";
import { useGetMilestonesQuery } from "../../api/milestoneApi";
import { useGetAllLendersQuery } from "../../api/lenderApiSlice";
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
  const assignments = roleAssignments || {};
  const updateAssignments = setRoleAssignments || (() => {});

  const currentMilestoneId =
    newLoan.milestone_id ??
    (typeof newLoan.milestone === "object" ? newLoan.milestone?.id : "") ??
    "";

  // Roles
  const { data: allRolesData = {} } = useGetGroupsQuery({ page_size: 200 });
  const allRoles = allRolesData.results || [];
  const assignableRoles = allRoles.filter((r) => r.assignable_on_loan);

  // Employees
  const { data: employeesData = {} } = useGetAllEmployeesQuery();
  const employees = employeesData.results || employeesData || [];

  useEffect(() => {
    updateAssignments((prev) => {
      if (!prev) return {};
      const next = {};
      Object.entries(prev).forEach(([roleId, arr]) => {
        next[roleId] = (arr || [])
          .map((item) => {
            const id = typeof item === "object" ? item.id : item;
            return employees.find((e) => e.id === id) || null;
          })
          .filter(Boolean);
      });
      return next;
    });
  }, [employees, updateAssignments]);

  const getEmployeesForRole = (roleId) =>
    employees.filter(
      (emp) =>
        (Array.isArray(emp.groups) && emp.groups.includes(roleId)) ||
        (Array.isArray(emp.roles) && emp.roles.includes(roleId))
    );

  const getSelectedEmployeesForRole = (roleId) => {
    const assigned = assignments[roleId];
    return (assigned || [])
      .map((emp) => {
        const id = typeof emp === "object" ? emp.id : emp;
        return employees.find((e) => e.id === id) || null;
      })
      .filter(Boolean);
  };

  // Brokers
  const { data: brokersData = {}, isLoading: loadingBrokers } =
    useGetBrokersQuery({ page: 1, page_size: 1000 });

  const brokers = brokersData.results || [];

  // Milestones
  const { data: milestonesData = {}, isLoading: loadingMilestones } =
    useGetMilestonesQuery({ page: 1, page_size: 1000 });

  const milestoneOptions = milestonesData.results || [];

  // Load ALL LOAN OFFICERS
  const { data: allLoanOfficers = [], isLoading: loadingLoanOfficers } =
    useGetAllLoanOfficersQuery();

  const loanOfficersFiltered = useMemo(() => {
    if (!newLoan.broker_id) return [];
    const brokerId = String(newLoan.broker_id);

    return allLoanOfficers.filter((o) => {
      const ids = [
        o.broker_id,
        o.broker_company,
        o.broker?.id,
        o.company_id,
        o.company?.id,
      ]
        .filter(Boolean)
        .map(String);

      return ids.includes(brokerId);
    });
  }, [allLoanOfficers, newLoan.broker_id]);

  const loanOfficerNoOptionsText = !newLoan.broker_id
    ? "Select a broker first"
    : loadingLoanOfficers
    ? "Loading loan officers..."
    : "No loan officers for selected broker";

  // Load ALL LENDERS
  const { data: allLenders = [], isLoading: loadingLenders } =
    useGetAllLendersQuery();

  const lenderOptions = allLenders || [];

  // Save
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
      milestone_id: currentMilestoneId || null,
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
            {/* First + Last Name */}
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

            {/* Broker */}
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
              />
            </FormControl>

            {/* Loan Officers */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={loanOfficersFiltered}
                loading={loadingLoanOfficers}
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
                  <TextField {...params} label="Loan Officer" />
                )}
              />
            </FormControl>

            {/* Lenders */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                multiple
                options={lenderOptions}
                loading={loadingLenders}
                filterSelectedOptions
                value={lenders || []}
                onChange={(_e, val) => setLenders(val || [])}
                getOptionLabel={(o) =>
                  o?.lender_name ||
                  o?.executive_email ||
                  o?.manager_email ||
                  ""
                }
                renderInput={(params) => (
                  <TextField {...params} label="Lenders" />
                )}
              />
            </FormControl>

            {/* Milestone */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Milestone</InputLabel>
              <Select
                label="Milestone"
                value={currentMilestoneId}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, milestone_id: e.target.value })
                }
              >
                {loadingMilestones ? (
                  <MenuItem value="">
                    <em>Loading...</em>
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

            {/* Other fields */}
            <TextField
              label="Compensation"
              fullWidth
              margin="normal"
              value={newLoan.compensation || ""}
              onChange={(e) =>
                setNewLoan({ ...newLoan, compensation: e.target.value })
              }
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Lock Status</InputLabel>
              <Select
                label="Lock Status"
                value={newLoan.lock_status ?? ""}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, lock_status: e.target.value || null })
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="lock">Lock</MenuItem>
                <MenuItem value="float">Float</MenuItem>
              </Select>
            </FormControl>

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

            {/* Assignable Roles */}
            {assignableRoles.map((role) => (
              <FormControl fullWidth margin="normal" key={role.id}>
                <Autocomplete
                  multiple
                  options={getEmployeesForRole(role.id)}
                  value={getSelectedEmployeesForRole(role.id)}
                  onChange={(_e, val) =>
                    updateAssignments((prev) => ({
                      ...prev,
                      [role.id]: val,
                    }))
                  }
                  getOptionLabel={(o) => o?.name ?? ""}
                  renderInput={(params) => (
                    <TextField {...params} label={role.name} />
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
