import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import LenderFields from "./LenderFields";

export default function LoanFormDialog({
  open,
  onClose,
  onSave,
  newLoan,
  setNewLoan,
  lenders,
  setLenders,
  brokers,
  loanOfficers,
  milestones,
  teamLeads,
  teamManagers,
  processors,
  supports,
}) {
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
              <InputLabel>Broker</InputLabel>
              <Select
                label="Broker"
                value={newLoan.broker}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, broker: e.target.value })
                }
              >
                {brokers.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Loan Officer</InputLabel>
              <Select
                label="Loan Officer"
                value={newLoan.loan_officer}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, loan_officer: e.target.value })
                }
              >
                {loanOfficers.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </Select>
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
              <InputLabel>Team Leader</InputLabel>
              <Select
                label="Team Leader"
                value={newLoan.team_leader}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, team_leader: e.target.value })
                }
              >
                {teamLeads.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Team Manager</InputLabel>
              <Select
                label="Team Manager"
                value={newLoan.team_manager}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, team_manager: e.target.value })
                }
              >
                {teamManagers.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Processor</InputLabel>
              <Select
                label="Processor"
                value={newLoan.processor}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, processor: e.target.value })
                }
              >
                {processors.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Support</InputLabel>
              <Select
                label="Support"
                value={newLoan.support}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, support: e.target.value })
                }
              >
                {supports.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
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
