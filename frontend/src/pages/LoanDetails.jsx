import { useParams, useNavigate } from "react-router-dom";
import { useGetLoanQuery, useDeleteLoanMutation } from "../api/loanApi";

import Skeleton from "@mui/material/Skeleton";
import { ArrowLeft } from "lucide-react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Typography, CircularProgress,Tabs, Tab, Button, Paper } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Suspense, lazy, useState, fallback } from "react";
//import SubmissionChecklist from "../components/loandetail/SubmissionChecklist";
//import React, { Suspense, lazy, useState } from "react";
//task

// Preload components that are likely to be used soon after initial render
const preloadContactTable = () =>
  import("../components/loandetail/ContactTable");
const preloadDocOrderTable = () =>
  import("../components/loandetail/DocOrderTable");
const preloadDocStatus = () => import("../components/loandetail/DocStatus");
const preloadSubmissionChecklist = () =>
  import("../components/loandetail/SubmissionChecklist");
const preloadTask = () => import("../components/loandetail/LoanTask");

const preloadAudit = () => import("../components/loandetail/Audit");  

// Lazy load with preloading
const ContactTable = lazy(preloadContactTable);
const DocOrderTable = lazy(preloadDocOrderTable);
const DocStatus = lazy(preloadDocStatus);
const SubmissionChecklist = lazy(preloadSubmissionChecklist);
const LoanTask = lazy(preloadTask);
const Audit = lazy(preloadAudit);

// Preload when hovering over tabs
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
    case 5:
      preloadTask();
      break;
    case 6:
      preloadAudit();
      break;  
  }
};

export default function LoanDetails() {
  const { id } = useParams();

  const navigate = useNavigate();
  const { data: loan, isLoading, isError } = useGetLoanQuery(id);
  const [deleteLoan] = useDeleteLoanMutation();
  const [tab, setTab] = useState(0);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this loan?")) {
      try {
        await deleteLoan(id).unwrap(); // ensures promise resolves/rejects
        navigate("/loan-management");
      } catch (err) {
        alert("Failed to delete loan.");
      }
    }
  };

  if (isLoading) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading loans...
          </Typography>
        </Box>
      );
    }
  if (isError || !loan)
    return <Typography>Error loading loan details.</Typography>;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        justifyContent: "space-between",
        m: 0,
      }}
    >
      <Box sx={{ display: "flex", width: "100%" , justifyContent: "space-between", p: 2 }}>
        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            {/* Left side: Back Arrow + Title */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ArrowLeft
                onClick={() => navigate(-1)}
                sx={{ cursor: "pointer", mr: 1, fontSize: 30 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Loan Details - ID: {loan.id}
              </Typography>
            </Box>

            {/* Right side: Edit + Delete buttons */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/loans/edit/${loan.id}`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Box>
          </Box>

          <Tabs
            sx={{ mb: 2 }}
            value={tab}
            onChange={(_, v) => setTab(v)}
            aria-label="Loan detail tabs"
          >
            <Tab label="Overview" />
            <Tab
              label="Submission Checklist"
              onMouseEnter={() => handleTabHover(1)}
            />
            <Tab label="Contact" onMouseEnter={() => handleTabHover(2)} />
            <Tab label="Doc Order" onMouseEnter={() => handleTabHover(3)} />
            <Tab label="Income & Assets" />
            <Tab label="Tasks" onMouseEnter={() => handleTabHover(3)} />
            <Tab label="Audit" onMouseEnter={() => handleTabHover(6)} />
          </Tabs>

          <Suspense fallback={<Skeleton height={200} />}>
            <Box sx={{ display: "flex", flexDirection: "row", gap: 5, p: 2 }}>
              <Box sx={{ flex: 1 }}>
                {" "}
                {/* This box will expand to fill available vertical space */}
                {tab === 0 && (
                  <Box>
                    <Typography variant="h6">Overview</Typography>
                    <Typography>
                      Borrower: {loan.first_name} {loan.last_name}
                    </Typography>
                    <Typography>Amount: {loan.amount}</Typography>
                    <Typography>Milestone: {loan.milestone}</Typography>
                    <Typography>
                      Initiated:{" "}
                      {new Date(loan.created_at).toLocaleDateString()}
                    </Typography>
                    {/* Add more overview fields as needed */}
                  </Box>
                )}
                {tab === 1 && <SubmissionChecklist loan={loan} />}
                {tab === 2 && <ContactTable loanId={loan.id} />}
                {tab === 3 && <DocOrderTable loanId={loan.id} />}
                {tab === 4 && <Box>{/* Income & Assets */}</Box>}
                {tab === 5 && <LoanTask loanId={loan.id} />}
                {tab === 6 && <Audit loanId={loan.id} />}
              </Box>
            </Box>
          </Suspense>
        </Box>
      </Box>{" "}
      {/* Fixed height box */}
      <DocStatus loanId={loan.id} />
    </Box>
  );
}
