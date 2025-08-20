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
  Box,
} from "@mui/material";
import LenderFields from "./LenderFields";
import { useGetBrokersQuery } from "../../api/brokerApi";
import { useGetLoanOfficersQuery } from "../../api/loanOfficerApi";
import { useGetEmployeesQuery } from "../../api/employeeApi";

export default function LoanFormDialog({
  open,
  onClose,
  onSave,
  newLoan,
  setNewLoan,
  lenders,
  setLenders,

  milestones,
}) {
  const { data: brokersData = [], isLoading: loadingBrokers } =
    useGetBrokersQuery({
      page: 1,
      page_size: 1000,
    });
  const brokers = brokersData.results || [];

  const { data: loanOfficersData = [] } = useGetLoanOfficersQuery(
    newLoan.broker_id ? { broker_company: newLoan.broker_id } : {},
    { skip: !newLoan.broker_id }
  );
  const loanOfficers = loanOfficersData.results || [];

  const { data: teamLeadsData = [] } = useGetEmployeesQuery({
    position: "team_lead",
    page_size: 100,
  });
  const { data: teamManagersData = [] } = useGetEmployeesQuery({
    position: "team_manager",
    page_size: 100,
  });
  const { data: processorsData = [] } = useGetEmployeesQuery({
    position: "processor",
    page_size: 100,
  });
  const { data: supportsData = [] } = useGetEmployeesQuery({
    position: "junior_processor",
    page_size: 100,
  });

  const teamLeads = teamLeadsData.results || [];
  const teamManagers = teamManagersData.results || [];
  const processors = processorsData.results || [];
  const supports = supportsData.results || [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>New Loan</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            {/* ...TextFields and Selects for loan fields... */}
            {/* Example: */}
            <TextField
              label="First Name"
              fullWidth
              margin="normal"
              value={newLoan.first_name}
              onChange={(e) =>
                setNewLoan({ ...newLoan, first_name: e.target.value })
              }
            />
            <TextField
              label="Last Name"
              fullWidth
              margin="normal"
              value={newLoan.last_name}
              onChange={(e) =>
                setNewLoan({ ...newLoan, last_name: e.target.value })
              }
            />
            <FormControl size="medium" fullWidth margin="normal">
              <Autocomplete
                options={brokers}
                getOptionLabel={(option) => option.name}
                value={brokers.find((b) => b.id === newLoan.broker_id) || null}
                onChange={(event, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    broker_id: newValue ? newValue.id : "",
                    loan_officer_id: "", // reset loan officer when broker changes
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Broker" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={loadingBrokers}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={loanOfficers}
                getOptionLabel={(option) => option.name}
                value={
                  loanOfficers.find((o) => o.id === newLoan.loan_officer_id) ||
                  null
                }
                onChange={(event, newValue) => {
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
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Milestone</InputLabel>
              <Select
                label="Milestone"
                value={newLoan.milestone}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, milestone: e.target.value })
                }
              >
                {milestones.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Compensation"
              fullWidth
              margin="normal"
              value={newLoan.compensation}
              onChange={(e) =>
                setNewLoan({ ...newLoan, compensation: e.target.value })
              }
            />
            <TextField
              label="Lock Status"
              fullWidth
              margin="normal"
              value={newLoan.lock_status}
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
              value={newLoan.closing_date}
              onChange={(e) =>
                setNewLoan({ ...newLoan, closing_date: e.target.value })
              }
            />

            <TextField
              label="Point File"
              fullWidth
              margin="normal"
              value={newLoan.point_file}
              onChange={(e) =>
                setNewLoan({ ...newLoan, point_file: e.target.value })
              }
            />
            <TextField
              label="Subject Property"
              fullWidth
              margin="normal"
              value={newLoan.subject_property}
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
              value={newLoan.loan_comment}
              onChange={(e) =>
                setNewLoan({ ...newLoan, loan_comment: e.target.value })
              }
            />
            {/* ...other fields... */}
            <LenderFields lenders={lenders} setLenders={setLenders} />
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={teamLeads}
                getOptionLabel={(option) => option.name}
                value={
                  teamLeads.find((t) => t.id === newLoan.team_leader_id) || null
                }
                onChange={(event, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    team_leader_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Team Leader"
                    variant="outlined"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={teamManagers}
                getOptionLabel={(option) => option.name}
                value={
                  teamManagers.find((t) => t.id === newLoan.team_manager_id) ||
                  null
                }
                onChange={(event, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    team_manager_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Team Manager"
                    variant="outlined"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={processors}
                getOptionLabel={(option) => option.name}
                value={
                  processors.find((p) => p.id === newLoan.processor_id) || null
                }
                onChange={(event, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    processor_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Processor" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={supports}
                getOptionLabel={(option) => option.name}
                value={supports.find((s) => s.id === newLoan.support_id) || null}
                onChange={(event, newValue) => {
                  setNewLoan({
                    ...newLoan,
                    support_id: newValue ? newValue.id : "",
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Support" variant="outlined" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </FormControl>
            {/* ...team lead, manager, processor, support selects... */}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
