import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  Box,
} from "@mui/material";
import { useGetBrokersQuery } from "../../api/brokerApi";
import { useGetLoanOfficersQuery } from "../../api/loanOfficerApi";
import { useGetAllEmployeesQuery } from "../../api/employeeApi";
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
  const draftKey = useMemo(
    () => (newLoan?.id ? `loanFormDraft:edit:${newLoan.id}` : "loanFormDraft:new"),
    [newLoan?.id]
  );

  const baselineRef = useRef(null);
  const loadedKeyRef = useRef(null);

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
  const { data: employeesData = {} } = useGetAllEmployeesQuery({ page_size: 2000 });
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

  const draftPayload = useMemo(
    () => ({
      newLoan,
      lenders: lenders || [],
      roleAssignments: roleAssignments || {},
    }),
    [newLoan, lenders, roleAssignments]
  );

  const isDirty = useMemo(() => {
    if (!open) return false;
    if (!baselineRef.current) return false;
    try {
      return JSON.stringify(draftPayload) !== baselineRef.current;
    } catch {
      return true;
    }
  }, [open, draftPayload]);

  const handleDialogClose = useCallback(
    (event, reason) => {
      if (isDirty && (reason === "backdropClick" || reason === "escapeKeyDown")) {
        return;
      }
      onClose?.(event, reason);
    },
    [isDirty, onClose]
  );

  const handleCancelClick = useCallback(
    (event) => {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      loadedKeyRef.current = null;
      baselineRef.current = null;
      onClose?.(event);
    },
    [draftKey, onClose]
  );

  const handleClearClick = useCallback(() => {
    const clearedLoan = {
      ...(newLoan?.id ? { id: newLoan.id } : {}),
      first_name: "",
      last_name: "",
      broker_id: "",
      loan_officer_id: "",
      milestone_id: "",
      compensation: "",
      compensation_borrower_paid: false,
      compensation_borrower_paid_amount: null,
      compensation_lender_paid: false,
      compensation_lender_paid_amount: null,
      funded_check_to_company: false,
      funded_check_to_company_note: "",
      funded_invoice: false,
      funded_invoice_company: "",
      funded_invoice_entegra_amount: null,
      funded_invoice_quantegra_amount: null,
      lock_status: "",
      closing_date: "",
      point_file: "",
      subject_property: "",
      loan_comment: "",
    };

    if (typeof setNewLoan === "function") setNewLoan(clearedLoan);
    if (typeof setLenders === "function") setLenders([]);
    if (typeof setRoleAssignments === "function") setRoleAssignments({});

    try {
      // don't persist an empty/cleared draft; clearing should not break future edits
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  }, [draftKey, newLoan?.id, setLenders, setNewLoan, setRoleAssignments]);

  // Restore draft on open
  useEffect(() => {
    if (!open) return;
    if (loadedKeyRef.current === draftKey) return;
    loadedKeyRef.current = draftKey;

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) {
        baselineRef.current = JSON.stringify(draftPayload);
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.newLoan && typeof setNewLoan === "function") {
        setNewLoan((prev) => ({ ...(prev || {}), ...(parsed.newLoan || {}) }));
      }
      if (parsed?.lenders && typeof setLenders === "function") {
        setLenders(Array.isArray(parsed.lenders) ? parsed.lenders : []);
      }
      if (typeof setRoleAssignments === "function") {
        setRoleAssignments(parsed?.roleAssignments || {});
      }

      // baseline is the restored state
      baselineRef.current = JSON.stringify({
        newLoan: parsed?.newLoan ?? newLoan,
        lenders: parsed?.lenders ?? (lenders || []),
        roleAssignments: parsed?.roleAssignments ?? (roleAssignments || {}),
      });
    } catch {
      baselineRef.current = JSON.stringify(draftPayload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draftKey]);

  // Autosave draft while open (debounced)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(draftPayload));
      } catch {
        // ignore quota/serialization issues
      }
    }, 250);
    return () => clearTimeout(t);
  }, [open, draftKey, draftPayload]);

  const selectedMilestone = useMemo(() => {
    const id = currentMilestoneId;
    if (!id) return typeof newLoan?.milestone === "object" ? newLoan.milestone : null;
    return (
      milestoneOptions.find((m) => String(m.id) === String(id)) ||
      (typeof newLoan?.milestone === "object" ? newLoan.milestone : null)
    );
  }, [currentMilestoneId, milestoneOptions, newLoan?.milestone]);

  const isFundedMilestone =
    (selectedMilestone?.name || "").trim().toLowerCase() === "funded";

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
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="md">
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

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Compensation
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!newLoan.compensation_borrower_paid}
                      onChange={(e) =>
                        setNewLoan({
                          ...newLoan,
                          compensation_borrower_paid: e.target.checked,
                          compensation_borrower_paid_amount: e.target.checked
                            ? newLoan.compensation_borrower_paid_amount
                            : null,
                        })
                      }
                    />
                  }
                  label="Borrower Paid"
                />
                {newLoan.compensation_borrower_paid ? (
                  <TextField
                    label="Borrower Paid Amount"
                    type="number"
                    fullWidth
                    margin="dense"
                    value={newLoan.compensation_borrower_paid_amount ?? ""}
                    onChange={(e) =>
                      setNewLoan({
                        ...newLoan,
                        compensation_borrower_paid_amount: e.target.value,
                      })
                    }
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                ) : null}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!newLoan.compensation_lender_paid}
                      onChange={(e) =>
                        setNewLoan({
                          ...newLoan,
                          compensation_lender_paid: e.target.checked,
                          compensation_lender_paid_amount: e.target.checked
                            ? newLoan.compensation_lender_paid_amount
                            : null,
                        })
                      }
                    />
                  }
                  label="Lender Paid"
                />
                {newLoan.compensation_lender_paid ? (
                  <TextField
                    label="Lender Paid Amount"
                    type="number"
                    fullWidth
                    margin="dense"
                    value={newLoan.compensation_lender_paid_amount ?? ""}
                    onChange={(e) =>
                      setNewLoan({
                        ...newLoan,
                        compensation_lender_paid_amount: e.target.value,
                      })
                    }
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                ) : null}
              </FormGroup>
            </Box>

            {isFundedMilestone ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Funded Options
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!newLoan.funded_check_to_company}
                        onChange={(e) =>
                          setNewLoan({
                            ...newLoan,
                            funded_check_to_company: e.target.checked,
                            funded_check_to_company_note: e.target.checked
                              ? newLoan.funded_check_to_company_note
                              : "",
                          })
                        }
                      />
                    }
                    label="Check to Company"
                  />
                  {newLoan.funded_check_to_company ? (
                    <>
                      <TextField
                        label="Check to Company Note"
                        fullWidth
                        margin="dense"
                        multiline
                        rows={3}
                        value={newLoan.funded_check_to_company_note || ""}
                        onChange={(e) =>
                          setNewLoan({
                            ...newLoan,
                            funded_check_to_company_note: e.target.value,
                          })
                        }
                        inputProps={{ maxLength: 200 }}
                        helperText={`${(newLoan.funded_check_to_company_note || "")
                          .length}/200`}
                      />
                    </>
                  ) : null}

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!newLoan.funded_invoice}
                        onChange={(e) =>
                          setNewLoan({
                            ...newLoan,
                            funded_invoice: e.target.checked,
                            funded_invoice_company: e.target.checked
                              ? newLoan.funded_invoice_company
                              : "",
                            funded_invoice_entegra_amount: e.target.checked
                              ? newLoan.funded_invoice_entegra_amount
                              : null,
                            funded_invoice_quantegra_amount: e.target.checked
                              ? newLoan.funded_invoice_quantegra_amount
                              : null,
                          })
                        }
                      />
                    }
                    label="Invoice"
                  />
                  {newLoan.funded_invoice ? (
                    <>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Company</InputLabel>
                        <Select
                          label="Company"
                          value={newLoan.funded_invoice_company || ""}
                          onChange={(e) =>
                            setNewLoan({
                              ...newLoan,
                              funded_invoice_company: e.target.value,
                              funded_invoice_entegra_amount:
                                e.target.value === "entegra"
                                  ? newLoan.funded_invoice_entegra_amount
                                  : null,
                              funded_invoice_quantegra_amount:
                                e.target.value === "quantegra"
                                  ? newLoan.funded_invoice_quantegra_amount
                                  : null,
                            })
                          }
                        >
                          <MenuItem value="entegra">Entegra</MenuItem>
                          <MenuItem value="quantegra">Quadaid</MenuItem>
                        </Select>
                      </FormControl>

                      {String(newLoan.funded_invoice_company || "") === "entegra" ? (
                        <TextField
                          label="Entegra Amount"
                          type="number"
                          fullWidth
                          margin="dense"
                          value={newLoan.funded_invoice_entegra_amount ?? ""}
                          onChange={(e) =>
                            setNewLoan({
                              ...newLoan,
                              funded_invoice_entegra_amount: e.target.value,
                            })
                          }
                          inputProps={{ min: 0, step: "0.01" }}
                        />
                      ) : null}

                      {String(newLoan.funded_invoice_company || "") === "quantegra" ? (
                        <TextField
                          label="Quadaid Amount"
                          type="number"
                          fullWidth
                          margin="dense"
                          value={newLoan.funded_invoice_quantegra_amount ?? ""}
                          onChange={(e) =>
                            setNewLoan({
                              ...newLoan,
                              funded_invoice_quantegra_amount: e.target.value,
                            })
                          }
                          inputProps={{ min: 0, step: "0.01" }}
                        />
                      ) : null}
                    </>
                  ) : null}
                </FormGroup>
              </Box>
            ) : null}
            <FormControl fullWidth margin="normal">
              <InputLabel>Lock Status</InputLabel>
              <Select
                label="Lock Status"
                value={newLoan.lock_status || ""}
                onChange={(e) =>
                  setNewLoan({
                    ...newLoan,
                    lock_status: e.target.value,
                    lock_amount:
                      String(e.target.value || "").toLowerCase() === "locked"
                        ? newLoan.lock_amount
                        : null,
                  })
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="Locked">Locked</MenuItem>
                <MenuItem value="Float">Float</MenuItem>
              </Select>
            </FormControl>

            {String(newLoan.lock_status || "").toLowerCase() === "locked" ? (
              <TextField
                label="Lock Amount"
                type="number"
                fullWidth
                margin="dense"
                value={newLoan.lock_amount ?? ""}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, lock_amount: e.target.value })
                }
                inputProps={{ min: 0, step: "0.01" }}
              />
            ) : null}
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
        <Button onClick={handleCancelClick} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleClearClick} color="secondary">
          Clear
        </Button>
        <Button variant="contained" onClick={handleSaveClick}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
