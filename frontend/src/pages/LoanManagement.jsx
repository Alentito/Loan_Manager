import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Download,Upload } from 'lucide-react';
import {
  useGetLoansQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
  useUploadXmlMutation,
} from "../api/loanApi";
import Checkbox from "@mui/material/Checkbox";

import LoanTable from "../components/loan/LoanTable";
import LoanFormDialog from "../components/loan/LoanFormDialog";
import ImportDialog from "../components/loan/ImportDialog";
import {
  Typography,
  InputAdornment,
  CircularProgress,
  Box,
  TextField,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { FaMoneyCheckAlt } from "react-icons/fa";

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
    //const [uploadXml, { isLoading: isUploading, isSuccess, error }] = useUploadXmlMutation();//xml upload
//const fileInputRef = React.useRef();

  const navigate = useNavigate(); //loan details route
  const [search, setSearch] = useState(""); //search state
  const [selectedRows, setSelectedRows] = useState([]); // array of loan IDs
  const [activeTab, setActiveTab] = useState("all"); // state for active tab
  const [openImport, setOpenImport] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [lenders, setLenders] = useState([{ lender: "", comment: "" }]);

  //sorting for tloan table
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("asc");

  const ordering = sortDirection === "asc" ? sortField : `-${sortField}`;
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleEditLoan = (loan) => {
    setSelectedLoan(loan);
    setNewLoan({ ...loan }); // Populate modal with loan data
    setEditMode(true);
    setOpenNew(true);
  };

  const handleDeleteLoan = async (id) => {
    try {
      await deleteLoan(id);
    } catch (error) {
      console.error("Error deleting loan:", error);
    }
  };

  const handleDetailsLoan = (loan) => {
    navigate(`loan-details/${loan.id}`);
    // For navigation, use react-router
    // navigate(`/loans/${loan.id}`);
    // Or set a state to show a details component/modal
    // setSelectedLoan(loan); setShowDetails(true);
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromURL = parseInt(searchParams.get("page") ?? "1", 10);  const sizeFromURL        = parseInt(searchParams.get("rowsPerPage") ?? "10", 10); // NEW

  const [page, setPage] = useState(pageFromURL);
  const [rowsPerPage, setRowsPerPage] = useState(sizeFromURL); // NEW


  //const rowsPerPage = 5;
  const milestoneMap = {
  1: "Application",
  2: "Funded",
  3: "Busted",
};
const milestoneFilter = activeTab === "all" ? undefined : activeTab;
//const milestoneFilter = milestoneMap[activeTab];

  const { data, isLoading, isError } = useGetLoansQuery({
    page,
    pageSize: rowsPerPage,
    milestone: milestoneFilter,
    search,
    ordering,
  });
  const loans = data?.results || [];
  const totalLoans = data?.count || 0;
  const pageCount = Math.ceil(totalLoans / rowsPerPage);

  const [createLoan] = useCreateLoanMutation();
  const [updateLoan] = useUpdateLoanMutation();
  const [deleteLoan] = useDeleteLoanMutation();
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

      if (editMode && selectedLoan) {
        await updateLoan({ id: selectedLoan.id, data: newLoanData });
      } else {
        await createLoan(newLoanData);
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

  const handleChangePage = (_e, newPageZeroBased) => {
  // TablePagination gives 0-based; convert to 1-based for state/API
  const apiPage = newPageZeroBased + 1;
  setPage(apiPage);
  setSearchParams({ page: apiPage, rowsPerPage });
};
const handleChangeRowsPerPage = (e) => {                 // NEW
  const newSize = parseInt(e.target.value, 10);
  setRowsPerPage(newSize);
  setPage(1);                                            // always reset
  setSearchParams({ page: 1, rowsPerPage: newSize });
};

  // Step 1: filter loans based on the tab
  // const filteredLoans = loans.filter((loan) => {
  //   switch (activeTab) {
  //     case 0:
  //       return loan; //.status// === "Application" || loan.status === "pending"; // adjust based on your data
  //     case 1:
  //       return loan.milestone === "Application"; // adjust status names as per your API data
  //     case 2:
  //       return loan.status === "Funded Loans";
  //     case 3:
  //       return loan.status === "Busted Loans";
  //     default:
  //       return true;
  //   }
  // });

  // Step 2: calculate pages based on filtered loans
  //const pageCount = Math.ceil(filteredLoans.length / rowsPerPage);

  // Step 3: slice filtered loans for current page
  // const paginatedLoans = filteredLoans.slice(
  //   (page - 1) * rowsPerPage,
  //   page * rowsPerPage
  // );
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
  if (isError) return <div>Error loading loans.</div>;

  return (
    
    <Box sx={{m:3}}>
      {/* Title & Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <FaMoneyCheckAlt size={22} color="#2563EB" />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
              }}
            >
              Loan Management
            </Typography>
            <Typography color="text.secondary">Manage your Loans</Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          mb: 2,
          // Change tab text color
          "& .MuiTab-root": {
            color: "#6B7280", // default text color (gray-500)
            fontWeight: 500,
            textTransform: "none",
            fontSize: "16px",
            px: 2,
          },
          "& .Mui-selected": {
            color: "#2563EB", // active tab text color (blue)
          },
        }}
        TabIndicatorProps={{
          style: {
            backgroundColor: "#2563EB", // active tab underline color
            height: "3px", // underline thickness
            borderRadius: "3px",
          },
        }}
      >
        <Tab label="Loan Pipeline" value="all" />
        <Tab label="Active Loans" value="Application" />
        <Tab label="Funded Loans" value="funded"  />
        <Tab label="Busted Loans" value="busted" />
      </Tabs>

      {/* Search + Filter Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <TextField
            size="small"
            placeholder="Search borrower..."
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "rgb(0,0,0,0.5)" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 300,
              borderRadius: "12px",
              backgroundColor: "#FFFFFF",
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                "& fieldset": {
                  borderColor: "rgba(0, 0, 0, 0.1)", // 👈 Your custom border color
                },
                "&:hover fieldset": {
                  borderColor: "rgba(0, 0, 0, 0.25)", // 👈 On hover
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#003CF7", // 👈 On focus
                },
              },
            }}
          />
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Download  size="16"/>}
            sx={{
              mr: 1,
              borderRadius: "10px",
              color: "rgba(0,0,0,0.8)",
              fontWeight: "600",
              //boxShadow: "4px 4px 6px rgba(0, 0, 0, 0.05)", // 👈 custom shadow
              border: "1px solid rgba(0, 0, 0, 0.1)", // 👈 custom border
              backgroundColor: "#fff", // optional, makes border visible
              textTransform: "none", // optional, keeps "Import" capitalized as-is
              "&:hover": {
                boxShadow: "6px 6px 8px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#f9f9f9",
                borderColor: "rgba(0, 0, 0, 0.2)",
              },
            }}
            
            onClick={() => setOpenImport(true)}
            
            
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload  size="16"/>}
            sx={{
              mr: 1,
              color: "rgba(0,0,0,0.8)",
              fontWeight: "600",
              borderRadius: "10px",
              //boxShadow: "4px 4px 6px rgba(0, 0, 0, 0.05)", // 👈 custom shadow
              border: "1px solid rgba(0, 0, 0, 0.1)", // 👈 custom border
              backgroundColor: "#fff", // optional, makes border visible
              textTransform: "none", // optional, keeps "Import" capitalized as-is
              "&:hover": {
                boxShadow: "6px 6px 8px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#f9f9f9",
                borderColor: "rgba(0, 0, 0, 0.2)",
              },
            }}
            onClick={exportToXML}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNew(true)}
            sx={{
              backgroundColor: "rgba(0, 60, 247, 1)",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(0, 50, 200, 1)", // optional hover color
              },
            }}
          >
            New Loan
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <LoanTable
        loans={loans}
        page={page}
        rowsPerPage={rowsPerPage}
        totalLoans={totalLoans}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}   // NEW
        rowsPerPageOptions={[5, 10, 25]}  
        pageCount={pageCount}
        onEdit={handleEditLoan}
        onDelete={handleDeleteLoan}
        onDetails={handleDetailsLoan}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        sortField={sortField}
        sortDirection={sortDirection}
        setSortField={setSortField}
        setSortDirection={setSortDirection}
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
