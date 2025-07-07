import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

//axios old methods
import axiosInstance from "../api/axios"; // Use your configured axios instance
import { createLoan, deleteLoan,updateLoan, getLoans } from "../api/loanApi";

import LoanTable from "../components/LoanTable";
import LoanFormDialog from "../components/LoanFormDialog";
import ImportDialog from "../components/ImportDialog";
import { Typography, Box, Button, Tabs, Tab } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";

// Sample dropdown options
const brokers = ["Broker A", "Broker B"];
const loanOfficers = ["Officer X", "Officer Y"];
const lendersList = ["Lender 1", "Lender 2"];
const milestones = ["Application", "Underwriting", "Funding"];
const teamLeads = ["Lead A", "Lead B"];
const teamManagers = ["Manager A", "Manager B"];
const processors = ["Processor A", "Processor B"];
const supports = ["Support A", "Support B"];

export default function LoanManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const [loans, setLoans] = useState([]);
  const [openImport, setOpenImport] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [lenders, setLenders] = useState([{ lender: "", comment: "" }]);

  const [newLoan, setNewLoan] = useState({
    first_name: "",
    last_name: "",
    broker: "",
    loan_officer: "",
    milestone: "",
    compensation: "",
    lock_status: "",
    closing_date: "",
    point_file: "",
    subject_property: "",
    loan_comment: "",
    team_leader: "",
    team_manager: "",
    processor: "",
    support: "",
  });
  // ...existing code...
  const [editMode, setEditMode] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const handleEditLoan = (loan) => {
    setSelectedLoan(loan);
    setNewLoan({ ...loan }); // Populate modal with loan data
    setEditMode(true);
    setOpenNew(true);
  };

  const handleDeleteLoan = async (id) => {
    try {
      await deleteLoan(id);
      setLoans(loans.filter((loan) => loan.id !== id));
    } catch (error) {
      console.error("Error deleting loan:", error);
    }
  };

  const handleDetailsLoan = (loan) => {
    // For navigation, use react-router
    // navigate(`/loans/${loan.id}`);
    // Or set a state to show a details component/modal
    // setSelectedLoan(loan); setShowDetails(true);
  };

  useEffect(() => {
    axiosInstance
      .get("/loan/")
      .then((response) => setLoans(response.data))
      .catch((error) => console.error("Error fetching loan data:", error));
  }, []);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1); // Reset pagination to page 1 when tab changes
  };

  const exportToXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?><Loans>';
    loans.forEach((loan) => {
      xml += `<Loan>`;
      xml += `<BorrowerName>${loan.first_name}</BorrowerName>`;
      xml += `<LastName>${loan.last_name}</LastName>`;
      xml += `<InitiatedDate>${loan.created_at}</InitiatedDate>`;
      xml += `<Status>${loan.milestone}</Status>`;
      xml += `<ManagedBy>${loan.managed_by || ""}</ManagedBy>`;
      xml += `<LoanAmount>${loan.amount}</LoanAmount>`;
      xml += `<Total>${loan.total || ""}</Total>`;
      xml += `</Loan>`;
    });
    xml += `</Loans>`;
    const blob = new Blob([xml], { type: "application/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "loans.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveNewLoan = async () => {
  try {
    const newLoanData = {
      first_name: newLoan.first_name,
      last_name: newLoan.last_name || "Unknown",
      broker: newLoan.broker || null,
      loan_officer: newLoan.loan_officer || null,
      milestone: newLoan.milestone || "Unknown",
      compensation: newLoan.compensation || null,
      lock_status: newLoan.lock_status || null,
      closing_date: newLoan.closing_date || null,
      point_file: newLoan.point_file || null,
      subject_property: newLoan.subject_property || null,
      loan_comment: newLoan.loan_comment || null,
      lenders: lenders,
      team_leader: newLoan.team_leader || null,
      team_manager: newLoan.team_manager || null,
      processor: newLoan.processor || null,
      support: newLoan.support || null,
    };

    let savedLoan;
    if (editMode && selectedLoan) {
      // Edit mode: update existing loan
      const response = await updateLoan(selectedLoan.id, newLoanData);
      savedLoan = response.data;
      setLoans((prev) =>
        prev.map((loan) => (loan.id === selectedLoan.id ? savedLoan : loan))
      );
    } else {
      // Create mode: create new loan
      const response = await createLoan(newLoanData);
      savedLoan = response.data;
      setLoans((prev) => [...prev, savedLoan]);
    }

    // Reset form and modal state
    setNewLoan({
      first_name: "",
      last_name: "",
      broker: "",
      loan_officer: "",
      milestone: "",
      compensation: "",
      lock_status: "",
      closing_date: "",
      point_file: "",
      subject_property: "",
      loan_comment: "",
      team_leader: "",
      team_manager: "",
      processor: "",
      support: "",
    });
    setLenders([{ lender: "", comment: "" }]);
    setOpenNew(false);
    setEditMode(false);
    setSelectedLoan(null);
  } catch (error) {
    console.error("Error saving loan:", error);
    // Optionally notify user here
  }
};
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  // Step 1: filter loans based on the tab
  const filteredLoans = loans.filter((loan) => {
    switch (activeTab) {
      case 0:
        return loan; //.status// === "Application" || loan.status === "pending"; // adjust based on your data
      case 1:
        return loan.milestone === "Application"; // adjust status names as per your API data
      case 2:
        return loan.status === "Funded Loans";
      case 3:
        return loan.status === "Busted Loans";
      default:
        return true;
    }
  });

  // Step 2: calculate pages based on filtered loans
  const pageCount = Math.ceil(filteredLoans.length / rowsPerPage);

  // Step 3: slice filtered loans for current page
  const paginatedLoans = filteredLoans.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Box>
      {/* Title & Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h5">Loan Management</Typography>
          <Typography color="text.secondary">Manage your Loans</Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            sx={{ mr: 1 }}
            onClick={() => setOpenImport(true)}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{ mr: 1 }}
            onClick={exportToXML}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNew(true)}
          >
            New Loan
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Loan Pipeline" />
        <Tab label="Applied Loans" />
        <Tab label="Funded Loans" />
        <Tab label="Busted Loans" />
      </Tabs>



      {/* Table */}
      <LoanTable
        loans={filteredLoans}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        pageCount={pageCount}
        onEdit={handleEditLoan}
        onDelete={handleDeleteLoan}
        onDetails={handleDetailsLoan}
      />

      {/* Import Dialog */}
      <ImportDialog open={openImport} onClose={() => setOpenImport(false)} />

      {/* New Loan Dialog */}
      <LoanFormDialog
        open={openNew}
        onClose={() => setOpenNew(false)}
        onSave={handleSaveNewLoan}
        newLoan={newLoan}
        setNewLoan={setNewLoan}
        lenders={lenders}
        setLenders={setLenders}
        brokers={brokers}
        loanOfficers={loanOfficers}
        milestones={milestones}
        teamLeads={teamLeads}
        teamManagers={teamManagers}
        processors={processors}
        supports={supports}
      />
    </Box>
  );
}
