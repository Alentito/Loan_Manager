import React, { useMemo, useState, useCallback } from "react";
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
import LenderFields from "./LenderFields";
import { useGetBrokersQuery } from "../../api/brokerApi";
import { useGetLoanOfficersQuery } from "../../api/loanOfficerApi";
import { useGetEmployeesQuery,useGetAllEmployeesQuery } from "../../api/employeeApi";
import { useGetMilestonesQuery } from "../../api/milestoneApi";
import { useGetLendersQuery } from "../../api/lenderApiSlice";

export default function LoanFormDialog({
  open,
  onClose,
  onSave,
  newLoan,
  setNewLoan,
  lenders,
  setLenders,
}) {
  // Brokers
  const { data: brokersData = {}, isLoading: loadingBrokers } =
    useGetBrokersQuery({ page: 1, page_size: 1000 });
  const brokers = brokersData.results || [];

  // Milestones
  const { data: milestonesData = {}, isLoading: loadingMilestones } =
    useGetMilestonesQuery({ page: 1, page_size: 1000 });
  const milestoneOptions = milestonesData.results || [];

  // Loan Officers (after broker)
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
        o.brokerCompany,
        o.company_id,
        o.company?.id,
      ]
        .filter((v) => v !== null && v !== undefined)
        .map(String);
      return ids.includes(brokerId);
    });
  }, [loanOfficers, newLoan.broker_id]);

  const loanOfficerNoOptionsText = useMemo(() => {
    if (!newLoan.broker_id) return "Select a broker first";
    if (loadingLoanOfficers) return "Loading loan officers...";
    return "No loan officers for selected broker";
  }, [newLoan.broker_id, loadingLoanOfficers]);

  // Employees
  const { data: teamLeadsData = {} } = useGetAllEmployeesQuery({
    position: "team_lead",
    page_size: 100,
  });
  const { data: teamManagersData = {} } = useGetAllEmployeesQuery({
    position: "team_manager",
    page_size: 100,
  });
  const { data: processorsData = {} } = useGetAllEmployeesQuery({
    position: "processor",
    page_size: 100,
  });
  const { data: supportsData = {} } = useGetAllEmployeesQuery({
    position: "junior_processor",
    page_size: 100,
  });

  const teamLeads = teamLeadsData.results || [];
  const teamManagers = teamManagersData.results || [];
  const processors = processorsData.results || [];
  const supports = supportsData.results || [];

  // Lenders (server-side search + multi-select)
  const [lenderSearch, setLenderSearch] = useState("");
  const { data: lendersData = {}, isLoading: loadingLenders } = useGetLendersQuery(
    { page: 1, page_size: 10, search: lenderSearch }
  );
  const lenderOptions = lendersData.results || [];

  // Ensure onSave sends lender_ids (IDs only)
  const handleSaveClick = useCallback(() => {
    const lenderIds = (lenders || [])
     .map((l) => l?.id)
     .filter((id) => id !== undefined && id !== null);
   onSave({
     ...newLoan,
      lender_ids: lenderIds,
   });
  }, [onSave, newLoan, lenders]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>New Loan</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            {/* Basic */}
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
                getOptionLabel={(option) => option?.name ?? ""}
                value={
                  brokers.find(
                    (b) => String(b.id) === String(newLoan.broker_id)
                  ) || null
                }
                onChange={(_e, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    broker_id: newValue ? newValue.id : "",
                    loan_officer_id: "",
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Broker" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) =>
                  String(option?.id) === String(value?.id)
                }
                loading={loadingBrokers}
                clearOnEscape
              />
            </FormControl>

            {/* Loan Officer */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={newLoan.broker_id ? loanOfficersFiltered : []}
                getOptionLabel={(option) => option?.name ?? ""}
                value={
                  loanOfficersFiltered.find(
                    (o) => String(o.id) === String(newLoan.loan_officer_id)
                  ) || null
                }
                onChange={(_e, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    loan_officer_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Loan Officer"
                    variant="outlined"
                    helperText={
                      !newLoan.broker_id
                        ? "Select a broker to load loan officers"
                        : ""
                    }
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  String(option?.id) === String(value?.id)
                }
                clearOnEscape
                loading={loadingLoanOfficers && !!newLoan.broker_id}
                noOptionsText={loanOfficerNoOptionsText}
                disabled={loadingLoanOfficers && !!newLoan.broker_id}
              />
            </FormControl>

            {/* Milestone */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Milestone</InputLabel>
              <Select
                label="Milestone"
                value={newLoan.milestone || ""}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, milestone: e.target.value })
                }
              >
                {loadingMilestones ? (
                  <MenuItem value="">
                    <em>Loading milestones...</em>
                  </MenuItem>
                ) : milestoneOptions.length > 0 ? (
                  milestoneOptions.map((m) => (
                    <MenuItem key={m.id} value={m.name}>
                      {m.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    <em>No milestones available</em>
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

            {/* Lenders (multi, server search) */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                multiple
                options={lenderOptions}
                loading={loadingLenders}
                filterSelectedOptions
                value={lenders || []}
                onChange={(_e, newValue) => setLenders(newValue || [])}
                onInputChange={(_e, value, reason) => {
                  if (reason === "input") setLenderSearch(value);
                }}
                getOptionLabel={(option) =>
                  option?.lender_name ||
                  option?.executive_email ||
                  option?.manager_email ||
                  ""
                }
                isOptionEqualToValue={(option, value) =>
                  String(option?.id) === String(value?.id)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lenders"
                    placeholder="Search by name, email, phone…"
                    helperText="Type to search and select one or more lenders"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{option.lender_name}</strong>
                      <span style={{ fontSize: 12, opacity: 0.75 }}>
                        {option.executive_email || option.manager_email || "-"}
                      </span>
                    </div>
                  </li>
                )}
              />
            </FormControl>

            {/* Optional legacy fields */}
            
            {/* Team Lead */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={teamLeads}
                getOptionLabel={(option) => option?.name ?? ""}
                value={
                  teamLeads.find(
                    (t) => String(t.id) === String(newLoan.team_leader_id)
                  ) || null
                }
                onChange={(_e, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    team_leader_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Team Leader" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) =>
                  String(option?.id) === String(value?.id)
                }
                clearOnEscape
              />
            </FormControl>

            {/* Team Manager */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={teamManagers}
                getOptionLabel={(option) => option?.name ?? ""}
                value={
                  teamManagers.find(
                    (t) => String(t.id) === String(newLoan.team_manager_id)
                  ) || null
                }
                onChange={(_e, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    team_manager_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Team Manager" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) =>
                  String(option?.id) === String(value?.id)
                }
                clearOnEscape
              />
            </FormControl>

            {/* Processor */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={processors}
                getOptionLabel={(option) => option?.name ?? ""}
                value={
                  processors.find(
                    (p) => String(p.id) === String(newLoan.processor_id)
                  ) || null
                }
                onChange={(_e, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    processor_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Processor" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) =>
                  String(option?.id) === String(value?.id)
                }
                clearOnEscape
              />
            </FormControl>

            {/* Support */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={supports}
                getOptionLabel={(option) => option?.name ?? ""}
                value={
                  supports.find(
                    (s) => String(s.id) === String(newLoan.support_id)
                  ) || null
                }
                onChange={(_e, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    support_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Support" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) =>
                  String(option?.id) === String(value?.id)
                }
                clearOnEscape
              />
            </FormControl>
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
