import React, { useState,useCallback, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
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
  useLazyGetLoansQuery,
} from "../api/loanApi";
import useLoanSocket from "../components/loan/useLoanSocket";
import { debounce } from "lodash";
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
  const theme = useTheme();
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
    broker_id: "",
    loan_officer_id: "",
    milestone: "",
    compensation: "",
    lock_status: "",
    closing_date: "",
    point_file: "",
    subject_property: "",
    loan_comment: "",
    team_leader_id: "",
    team_manager_id: "",
    processor_id: "",
    support_id: "",
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
    setNewLoan({
    ...loan,
    broker_id: loan.broker?.id || "",
    loan_officer_id: loan.loan_officer?.id || "",
    team_leader_id: loan.team_leader?.id ?? null,
    team_manager_id: loan.team_manager?.id ?? null,
    processor_id: loan.processor?.id ?? null,
    support_id: loan.support?.id ?? null,
    // Optionally, set other _id fields for team_leader, etc. if needed
  }); // Populate modal with loan data
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

  const [triggerRefetch] = useLazyGetLoansQuery(); // For manual refresh
  // Handle incoming WebSocket push
  const debouncedRefetch = useCallback(
  debounce(() => {
    triggerRefetch({
      page,
      pageSize: rowsPerPage,
      milestone: milestoneFilter,
      search,
      ordering,
    });
  }, 1000),
  [page, rowsPerPage, milestoneFilter, search, ordering]
);

// 👇 This listens to WebSocket loan update events
useLoanSocket(debouncedRefetch);



 

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
        broker_id: newLoan.broker_id || null,           // <-- correct
        loan_officer_id: newLoan.loan_officer_id || null, // <-- correct
        milestone: newLoan.milestone || "Unknown",
        compensation: newLoan.compensation || null,
        lock_status: newLoan.lock_status || null,
        closing_date: newLoan.closing_date || null,
        point_file: newLoan.point_file || null,
        subject_property: newLoan.subject_property || null,
        loan_comment: newLoan.loan_comment || null,
        lenders: lenders,
        team_leader_id: newLoan.team_leader_id || null,
        team_manager_id: newLoan.team_manager_id || null,
        processor_id: newLoan.processor_id || null,
        support_id: newLoan.support_id || null,
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
        broker_id: "",
        loan_officer_id: "",
        milestone: "",
        compensation: "",
        lock_status: "",
        closing_date: "",
        point_file: "",
        subject_property: "",
        loan_comment: "",
        team_leader_id: "",
        team_manager_id: "",
        processor_id: "",
        support_id: "",
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
    
    <Box sx={{mx:3, mt:1}}>
      {/* Title & Actions */}
      

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
                  <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
            sx={{
    width: 300,
    borderRadius: "12px",
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      color: theme.palette.text.primary,
      "& fieldset": {
        borderColor: theme.palette.divider,
      },
      "&:hover fieldset": {
        borderColor: theme.palette.primary.light,
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.primary.main,
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
    color: theme.palette.text.primary,
    fontWeight: "600",
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    textTransform: "none",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.light,
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
              color: theme.palette.text.primary,
    fontWeight: "600",
    borderRadius: "10px",
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    textTransform: "none",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.light,
    },
  }}
            onClick={exportToXML}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
    setNewLoan({
      first_name: "",
      last_name: "",
      broker_id: "",
      loan_officer_id: "",
      milestone: "",
      compensation: "",
      lock_status: "",
      closing_date: "",
      point_file: "",
      subject_property: "",
      loan_comment: "",
      team_leader_id: "",
      team_manager_id: "",
      processor_id: "",
      support_id: "",
    });
    setLenders([{ lender: "", comment: "" }]);
    setEditMode(false);
    setSelectedLoan(null);
    setOpenNew(true);
  }}
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
        
        milestones={milestones}
        
      />
    </Box>
  );
}
