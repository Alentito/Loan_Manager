import React, { useState, useCallback, useEffect,useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Download, Upload, Filter } from "lucide-react";

import { useSelector } from "react-redux";

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
  Tooltip,
  CircularProgress,
  Box,
  TextField,
  Button,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  const Permissions = useSelector(
    (state) => state.auth.user?.permissions || []
  );


  const [openFilter, setOpenFilter] = React.useState(false);
  const [filters, setFilters] = React.useState({
    milestone: "",
    managedBy: "",
    minAmount: "",
    maxAmount: "",
    dateFrom: "",
    dateTo: "",
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    // Trigger backend filtering via RTK Query refetch
    refetchLoans(filters);
    setOpenFilter(false);
  };

  const theme = useTheme();
  //const [uploadXml, { isLoading: isUploading, isSuccess, error }] = useUploadXmlMutation();//xml upload
  //const fileInputRef = React.useRef();

  const navigate = useNavigate(); //loan details route
  const [search, setSearch] = useState(""); //search state
  const [selectedRows, setSelectedRows] = useState([]); // array of loan IDs
  const [activeTab, setActiveTab] = useState("all"); // state for active tab
  const [openImport, setOpenImport] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [lenders, setLenders] = useState([]); // store selected Lender objects (from API)

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
    setLenders(Array.isArray(loan.lenders) ? loan.lenders : []); // prefill

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
  const pageFromURL = parseInt(searchParams.get("page") ?? "1", 10);
  const sizeFromURL = parseInt(searchParams.get("rowsPerPage") ?? "10", 10); // NEW

  const [page, setPage] = useState(pageFromURL);
  const [rowsPerPage, setRowsPerPage] = useState(sizeFromURL); // NEW

  //const rowsPerPage = 5;
  const milestoneMap = {
    1: "Application",
    2: "Funded",
    3: "Busted",
  };
  const milestoneFilter =
    activeTab === "all" || activeTab === "archived" ? undefined : activeTab;

  const includeArchived = activeTab === "archived";
const loanQueryArgs = useMemo(() => {
    const base = {
      page,
      pageSize: rowsPerPage,
      milestone: milestoneFilter,
      search,
      ordering,
      ...filters,
    };
    return includeArchived
      ? { ...base, include_archived: true, is_archived: true }
      : base;
  }, [page, rowsPerPage, milestoneFilter, search, ordering, includeArchived, filters]);

  const { data, isLoading, isError } = useGetLoansQuery(loanQueryArgs);


 
  const loans = data?.results || [];
  const totalLoans = data?.count || 0;
  const pageCount = Math.ceil(totalLoans / rowsPerPage);

  const [triggerRefetch] = useLazyGetLoansQuery(); // For manual refresh
  // Handle incoming WebSocket push
  const debouncedRefetch = useCallback(
    debounce(() => {
      triggerRefetch(loanQueryArgs);
    }, 1000),
    [triggerRefetch, loanQueryArgs]
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
        broker_id: newLoan.broker_id || null, // <-- correct
        loan_officer_id: newLoan.loan_officer_id || null, // <-- correct
        milestone: newLoan.milestone || "Unknown",
        compensation: newLoan.compensation || null,
        lock_status: newLoan.lock_status || null,
        closing_date: newLoan.closing_date || null,
        point_file: newLoan.point_file || null,
        subject_property: newLoan.subject_property || null,
        loan_comment: newLoan.loan_comment || null,
        lender_ids: (lenders || []).map((l) => l?.id).filter((id) => id != null), // M2M IDs
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
      setLenders([]); // reset to empty
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
  const handleChangeRowsPerPage = (e) => {
    // NEW
    const newSize = parseInt(e.target.value, 10);
    setRowsPerPage(newSize);
    setPage(1); // always reset
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
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading loans...
        </Typography>
      </Box>
    );
  }
  if (isError) return <div>Error loading loans.</div>;

  return (
    <Box sx={{ mx: 3, mt: 1 }}>
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
        <Tab label="Funded Loans" value="funded" />
        <Tab label="Busted Loans" value="busted" />
        <Tab label="Archived Loans" value="archived" />

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
          <Tooltip title="Filter">
            <IconButton
              onClick={() => setOpenFilter(true)}
              sx={{
                borderRadius: "10px",
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Filter size={18} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Download size="16" />}
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
            startIcon={<Upload size="16" />}
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
          {Permissions.includes("loan.add_loan") && (

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
              setLenders([]);
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
          )}
        </Box>
      </Box>

      {/* Table */}
      <LoanTable
        loans={loans}
        page={page}
        rowsPerPage={rowsPerPage}
        totalLoans={totalLoans}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage} // NEW
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
      <Dialog
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Loans</DialogTitle>
        <DialogContent dividers>
          {/* Borrower Search */}
          <TextField
            label="first name"
            fullWidth
            sx={{ mb: 2 }}
            value={filters.first_name || ""}
            onChange={(e) => handleFilterChange("first_name", e.target.value)}
          />

          {/* Broker */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Broker</InputLabel>
            <Select
              value={filters.broker || ""}
              onChange={(e) => handleFilterChange("broker", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {brokers?.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Loan Officer */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Loan Officer</InputLabel>
            <Select
              value={filters.loanOfficer || ""}
              onChange={(e) =>
                handleFilterChange("loanOfficer", e.target.value)
              }
            >
              <MenuItem value="">All</MenuItem>
              {loanOfficers?.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Milestone */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Milestone</InputLabel>
            <Select
              value={filters.milestone || ""}
              onChange={(e) => handleFilterChange("milestone", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Application">Application</MenuItem>
              <MenuItem value="Underwriting">Underwriting</MenuItem>
              <MenuItem value="Funded">Funded</MenuItem>
              <MenuItem value="Busted">Busted</MenuItem>
            </Select>
          </FormControl>

          {/* Lock Status */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Lock Status</InputLabel>
            <Select
              value={filters.lockStatus || ""}
              onChange={(e) => handleFilterChange("lockStatus", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Locked">Locked</MenuItem>
              <MenuItem value="Unlocked">Unlocked</MenuItem>
            </Select>
          </FormControl>

          {/* Compensation */}
          <TextField
            label="Compensation"
            fullWidth
            sx={{ mb: 2 }}
            value={filters.compensation || ""}
            onChange={(e) => handleFilterChange("compensation", e.target.value)}
          />

          {/* Subject Property */}
          <TextField
            label="Subject Property"
            fullWidth
            sx={{ mb: 2 }}
            value={filters.subjectProperty || ""}
            onChange={(e) =>
              handleFilterChange("subjectProperty", e.target.value)
            }
          />

          {/* Loan Amount Range */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Min Amount"
              type="number"
              fullWidth
              value={filters.minAmount || ""}
              onChange={(e) => handleFilterChange("minAmount", e.target.value)}
            />
            <TextField
              label="Max Amount"
              type="number"
              fullWidth
              value={filters.maxAmount || ""}
              onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            />
          </Box>

          {/* Closing Date Range */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Closing Date From"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={filters.closingDateFrom || ""}
              onChange={(e) =>
                handleFilterChange("closingDateFrom", e.target.value)
              }
            />
            <TextField
              label="Closing Date To"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={filters.closingDateTo || ""}
              onChange={(e) =>
                handleFilterChange("closingDateTo", e.target.value)
              }
            />
          </Box>

          {/* Created At Date Range */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Created From"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={filters.createdFrom || ""}
              onChange={(e) =>
                handleFilterChange("createdFrom", e.target.value)
              }
            />
            <TextField
              label="Created To"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={filters.createdTo || ""}
              onChange={(e) => handleFilterChange("createdTo", e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenFilter(false)}>Cancel</Button>
          <Button onClick={applyFilters} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
