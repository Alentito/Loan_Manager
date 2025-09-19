// LoanDetails.jsx (drop-in replacement)
import React, { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import {
  useGetLoanQuery,
  useDeleteLoanMutation,
  useUpdateLoanMutation,
} from "../api/loanApi";

import Skeleton from "@mui/material/Skeleton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Divider,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Lazy children (keep your existing components)
const ContactTable = lazy(() =>
  import("../components/loandetail/ContactTable")
);
const DocOrderTable = lazy(() =>
  import("../components/loandetail/DocOrderTable")
);
const DocStatus = lazy(() => import("../components/loandetail/DocStatus"));
const SubmissionChecklist = lazy(() =>
  import("../components/loandetail/SubmissionChecklist")
);
const LoanTask = lazy(() => import("../components/loandetail/LoanTask"));
const Audit = lazy(() => import("../components/loandetail/Audit"));

// Your existing dialog
const LoanFormDialog = lazy(() => import("../components/loan/LoanFormDialog"));

// simple function to preload — keep if you used hover preloads
const preloadContactTable = () =>
  import("../components/loandetail/ContactTable");
const preloadDocOrderTable = () =>
  import("../components/loandetail/DocOrderTable");
const preloadDocStatus = () => import("../components/loandetail/DocStatus");
const preloadSubmissionChecklist = () =>
  import("../components/loandetail/SubmissionChecklist");
const preloadTask = () => import("../components/loandetail/LoanTask");
const preloadAudit = () => import("../components/loandetail/Audit");

const handleTabHover = (tabIndex) => {
  switch (tabIndex) {
    case 1:
      preloadSubmissionChecklist();
      break;
    case 2:
      preloadContactTable();
      break;
    case 3:
      preloadDocOrderTable();
      break;
    case 4:
      preloadTask();
      break;
    case 5:
      preloadAudit();
      break;
    default:
      break;
  }
};

// local theme to make fonts and spacing consistent with an enterprise look
const localTheme = createTheme({
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    fontSize: 14, // base font size
    h6: { fontSize: "1rem", fontWeight: 600 },
    body2: { fontSize: "0.95rem" },
    caption: { fontSize: "0.8rem" },
  },
  components: {
    MuiButton: {
      defaultProps: { size: "medium" },
    },
  },
});

export default function LoanDetails() {
  const Permissions = useSelector(
    (state) => state.auth.user?.permissions || []
  );

  const [updateLoan] = useUpdateLoanMutation();

  const { id } = useParams();
  const navigate = useNavigate();

  const { data: loan, isLoading, isError, refetch } = useGetLoanQuery(id);
  const [deleteLoan] = useDeleteLoanMutation();

  // keep your tabs unchanged
  const [tab, setTab] = useState(0);

  // Edit modal state: robust flow
  const [selectedLoan, setSelectedLoan] = useState(null); // set when user clicks Edit
  const [newLoan, setNewLoan] = useState({}); // passed to modal
  const [openNew, setOpenNew] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // lenders + milestones defaults (prevent .map crash)
  const [lenders, setLenders] = useState([]);
  const milestones = [
    "New",
    "Pre-Funding",
    "Funding",
    "Underwriting",
    "Closed",
  ];

  // feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  // When selectedLoan changes, derive newLoan then open modal.
  // This ensures newLoan has final value when the dialog mounts.
  useEffect(() => {
    if (!selectedLoan) return;
    const payload = {
      ...selectedLoan,
      broker_id: selectedLoan?.broker?.id || selectedLoan?.broker || "",
      loan_officer_id:
        selectedLoan?.loan_officer?.id || selectedLoan?.loan_officer || "",
      team_leader_id:
        selectedLoan?.team_leader?.id || selectedLoan?.team_leader || "",
      team_manager_id:
        selectedLoan?.team_manager?.id || selectedLoan?.team_manager || "",
      processor_id:
        selectedLoan?.processor?.id || selectedLoan?.processor || "",
      support_id: selectedLoan?.support?.id || selectedLoan?.support || "",
    };
    setNewLoan(payload);
    setOpenNew(true);
  }, [selectedLoan]);

  // handle click — only sets selectedLoan and editMode; modal opens from effect above
  const handleEditLoan = (loanObj) => {
    setSelectedLoan(loanObj);
    setEditMode(true);
  };
  const handleSaveEditLoan = async () => {
    try {
      await updateLoan({ id: loan.id, data: newLoan }).unwrap();
      setOpenNew(false);
      setEditMode(false);
      setSelectedLoan(null);
      setNewLoan({});
      refetch();
      setSnackbar({
        open: true,
        severity: "success",
        message: "Loan updated.",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to update loan.",
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this loan?")) return;
    try {
      await deleteLoan(id).unwrap();
      navigate("/loan-management");
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to delete loan.",
      });
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "60vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !loan) {
    return <Typography color="error">Error loading loan details.</Typography>;
  }

  return (
    <ThemeProvider theme={localTheme}>
      <Box
        sx={{
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          m: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box sx={{ width: "100%" }}>
            {/* keep your top tabs & header as-is */}
            <Tabs
              sx={{ mb: 2 }}
              value={tab}
              onChange={(_, v) => setTab(v)}
              aria-label="Loan detail tabs"
            >
              <Tab label="Overview" />
              <Tab label="Contact" onMouseEnter={() => handleTabHover(1)} />
              <Tab label="Income & Assets" />
              <Tab label="Tasks" onMouseEnter={() => handleTabHover(2)} />
              <Tab label="Audit" onMouseEnter={() => handleTabHover(3)} />
            </Tabs>

            {/* ---------- modern Overview area (only this section changed) ---------- */}
            <Suspense fallback={<Skeleton height={200} />}>
              <Box sx={{ display: "flex", flexDirection: "row", gap: 5, p: 0 }}>
                <Box sx={{ flex: 1 }}>
                  {tab === 0 && (
                    <Box>
                      {/* LEFT COLUMN */}

                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 2 }}
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "primary.main",
                                  width: 56,
                                  height: 56,
                                  fontSize: 20,
                                }}
                              >
                                {loan.first_name?.[0]?.toUpperCase() || "U"}
                              </Avatar>
                              <Box>
                                <Typography variant="h6">
                                  {loan.first_name} {loan.last_name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Loan ID: {loan.id ?? "-"} • Created:{" "}
                                  {loan.created_at
                                    ? new Date(
                                        loan.created_at
                                      ).toLocaleDateString()
                                    : "-"}
                                </Typography>
                              </Box>
                            </Stack>
                            <Chip
                              label={loan.milestone ?? "Unknown"}
                              color="primary"
                              size="small"
                            />
                          </Stack>

                          <Divider sx={{ mb: 2 }} />

                          {/* summary row */}
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography>
                                <strong>Borrower:</strong> {loan.first_name}{" "}
                                {loan.last_name}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography>
                                <strong>Amount:</strong> {loan.amount ?? "-"}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography>
                                <strong>Closing Date:</strong>{" "}
                                {loan.closing_date ?? "-"}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography noWrap>
                                <strong>Lenders:</strong>{" "}
                                {Array.isArray(loan.lenders)
                                  ? loan.lenders.join(", ")
                                  : loan.lenders ?? "-"}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Divider sx={{ my: 2 }} />

                          {/* --- Quick Info (left) + Two mini-cards (right) --- */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              width: "100%",
                              flexDirection: { xs: "column", md: "row" },
                              alignItems: "stretch",
                            }}
                          >
                            {/* LEFT column (fills remaining space) */}
                            <Box
                              sx={{
                                flex: 1, // take remaining space
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column", // stack cards vertically
                                gap: 2,
                                alignItems: "stretch",
                              }}
                            >
                              {/* Mini-card 1 */}
                              <Card
                                variant="outlined"
                                sx={{
                                  width: "100%", // full width of left column
                                  boxSizing: "border-box",
                                  p: 2,
                                }}
                              >
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Compensation:</strong>{" "}
                                  {loan.compensation ?? "Nil"}
                                </Typography>
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Lock Status:</strong>{" "}
                                  {loan.lock_status ?? "Nil"}
                                </Typography>
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Point File:</strong>{" "}
                                  {loan.point_file ?? "Nil"}
                                </Typography>
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Property:</strong>{" "}
                                  {loan.subject_property ?? "Nil"}
                                </Typography>
                              </Card>

                              {/* Mini-card 2 */}
                              <Card
                                variant="outlined"
                                sx={{
                                  width: "100%", // full width of left column
                                  boxSizing: "border-box",
                                  p: 2,
                                }}
                              >
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Loan Comment:</strong>{" "}
                                  {loan.loan_comment ?? "-"}
                                </Typography>
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Team Leader:</strong>{" "}
                                  {loan.team_leader?.name ?? "-"}
                                </Typography>
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Processor:</strong>{" "}
                                  {loan.processor?.name ?? "-"}
                                </Typography>
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Support:</strong>{" "}
                                  {loan.support?.name ?? "-"}
                                </Typography>
                              </Card>
                            </Box>

                            {/* RIGHT column (fixed ~30%) */}
                            <Box
                              sx={{
                                flex: "0 0 30%",
                                maxWidth: { xs: "100%", md: "30%" },
                                boxSizing: "border-box",
                              }}
                            >
                              <Card
                                variant="outlined"
                                sx={{ height: "100%", minHeight: 200 }}
                              >
                                <CardContent>
                                  <Typography variant="subtitle1" gutterBottom>
                                    Quick Info
                                  </Typography>
                                  <List dense>
                                    <ListItem>
                                      <ListItemText
                                        primary="External ID"
                                        secondary={loan.external_id ?? "-"}
                                      />
                                    </ListItem>
                                    <ListItem>
                                      <ListItemText
                                        primary="Purpose"
                                        secondary={loan.purpose ?? "-"}
                                      />
                                    </ListItem>
                                    <ListItem>
                                      <ListItemText
                                        primary="Note Amount"
                                        secondary={loan.note_amount ?? "-"}
                                      />
                                    </ListItem>
                                    <ListItem>
                                      <ListItemText
                                        primary="Note Rate"
                                        secondary={loan.note_rate ?? "-"}
                                      />
                                    </ListItem>
                                  </List>
                                </CardContent>
                              </Card>
                            </Box>
                          </Box>

                          {/* actions */}
                          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            {Permissions.includes("loan.change_loan") && (
                              <Button
                                variant="contained"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditLoan(loan)}
                              >
                                Edit Loan
                              </Button>
                            )}
                            {Permissions.includes("loan.delete_loan") && (
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleDelete}
                              >
                                Delete
                              </Button>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* RIGHT COLUMN */}

                      {/* You can also move DocStatus here */}
                    </Box>
                  )}

                  {/* other tabs unchanged */}
                  {tab === 1 && <ContactTable loanId={loan.id} />}
                  {tab === 2 && <Box>{/* Income & Assets */}</Box>}
                  {tab === 3 && <LoanTask loanId={loan.id} />}
                  {tab === 4 && <Audit loanId={loan.id} />}
                </Box>
              </Box>
            </Suspense>
            {/* ---------- end Overview ---------- */}
          </Box>
        </Box>

        {/* Right panel unchanged */}
        <DocStatus loanId={loan.id} />

        {/* LoanFormDialog modal (safe defaults) */}
        <Suspense fallback={null}>
          <LoanFormDialog
            open={openNew}
            onClose={() => {
              setOpenNew(false);
              setEditMode(false);
              setSelectedLoan(null);
              setNewLoan({});
            }}
            onSave={handleSaveEditLoan}
            newLoan={newLoan}
            setNewLoan={setNewLoan}
            lenders={lenders}
            setLenders={setLenders}
            milestones={milestones}
          />
        </Suspense>

        {/* feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
