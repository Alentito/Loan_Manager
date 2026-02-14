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
  Grid,
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
import { useGetBrokersQuery } from "../api/brokerApi";
import { useGetLoanOfficersQuery } from "../api/loanOfficerApi";
import { useGetMilestonesQuery } from "../api/milestoneApi";

// Sample dropdown options

export default function LoanManagement() {

  const { data: brokersData = {} } = useGetBrokersQuery({ page_size: 100 });
const brokers = brokersData.results || [];

const { data: loanOfficersData = {} } = useGetLoanOfficersQuery({ page_size: 100 });
const loanOfficers = loanOfficersData.results || [];

const { data: milestonesData = {} } = useGetMilestonesQuery({ page_size: 100 });
const milestones = milestonesData.results || [];

  const Permissions = useSelector(
    (state) => state.auth.user?.permissions || []
  );
const [roleAssignments, setRoleAssignments] = useState({});

  const [openFilter, setOpenFilter] = React.useState(false);
  const [draftFilters, setDraftFilters] = useState({});

  useEffect(() => {
  setDraftFilters({
    milestone: searchParams.get("milestone") || "",
    broker: searchParams.get("broker") || "",
    loan_officer: searchParams.get("loan_officer") || "",
    team_leader: searchParams.get("team_leader") || "",
    processor: searchParams.get("processor") || "",
    start_date: searchParams.get("start_date") || "",
    end_date: searchParams.get("end_date") || "",
    amount__gte: searchParams.get("amount__gte") || "",
    amount__lte: searchParams.get("amount__lte") || "",

    created_at__gte: searchParams.get("created_at__gte") || "",
    created_at__lte: searchParams.get("created_at__lte") || "",
  });
}, [openFilter, searchParams]);

  const applyFilters = (nextFilters) => {
  const next = new URLSearchParams(searchParams);

  Object.entries(nextFilters).forEach(([key, value]) => {
    if (value) next.set(key, value);
    else next.delete(key);
  });

  next.set("page", "1");
  setSearchParams(next);
  setPage(1);
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
    lock_amount: null,
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
      milestone_id: loan.milestone?.id || "",   // set FK on edit

   
      // Optionally, set other _id fields for team_leader, etc. if needed
    }); // Populate modal with loan data
    setLenders(Array.isArray(loan.lenders) ? loan.lenders : []); // prefill
if (loan.role_assignments) {
    const assignments = {};
    loan.role_assignments.forEach((ra) => {
      assignments[ra.role_id] = ra.employees || [];
    });
    setRoleAssignments(assignments);
  } else {
    setRoleAssignments({});
  }
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
  const params = new URLSearchParams(window.location.search);

  navigate(`loan-details/${loan.id}?${params.toString()}`);
};

  const [searchParams, setSearchParams] = useSearchParams();
  const urlMilestone = searchParams.get("milestone");
  // Read URL filters passed from Report Page
const urlProcessor = searchParams.get("processor");
const urlTeamLeader = searchParams.get("team_leader");
const urlBroker = searchParams.get("broker");
const urlLoanOfficer = searchParams.get("loan_officer");
const urlStartDate = searchParams.get("start_date");
const urlEndDate = searchParams.get("end_date");

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
    activeTab === "Active Loans" || activeTab === "all" || activeTab === "archived" ? undefined : activeTab;

  const includeArchived = activeTab === "archived";
  const effectiveSearch = openNew ? "" : search;
const loanQueryArgs = useMemo(() => {
  const get = (k) => searchParams.get(k) || undefined;

  return {
    page,
    pageSize: rowsPerPage,
    milestone: get("milestone"),
    broker: get("broker"),
    loan_officer: get("loan_officer"),
    team_leader: get("team_leader"),
    processor: get("processor"),
    start_date: get("start_date"),
    end_date: get("end_date"),
    amount__gte: get("amount__gte"),
amount__lte: get("amount__lte"),
created_at__gte: get("created_at__gte"),
created_at__lte: get("created_at__lte"),

    search: effectiveSearch,
    ordering,
    ...(activeTab === "archived"
      ? { include_archived: true, is_archived: true }
      : {}),
  };
}, [page, rowsPerPage, effectiveSearch, ordering, activeTab, searchParams]);

useEffect(() => {
  if (urlMilestone) {
    setActiveTab((prev) => (prev !== "all" ? "all" : prev));
    setPage((prev) => (prev !== 1 ? 1 : prev));
  }
}, [urlMilestone]);

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

const roleAssignmentsArray = Object.entries(roleAssignments).map(
  ([roleId, emps]) => ({
    role_id: Number(roleId),
    employee_ids: emps.map((e) => e.id),
  })
);

  const handleSaveNewLoan = async () => {
    try {
      const newLoanData = {
        first_name: newLoan.first_name,
        last_name: newLoan.last_name || "Unknown",
        broker_id: newLoan.broker_id || null, // <-- correct
        loan_officer_id: newLoan.loan_officer_id || null, // <-- correct
        milestone_id: newLoan.milestone_id || null,
        compensation: newLoan.compensation || null,
        compensation_borrower_paid: !!newLoan.compensation_borrower_paid,
        compensation_borrower_paid_amount: newLoan.compensation_borrower_paid
          ? newLoan.compensation_borrower_paid_amount || null
          : null,
        compensation_lender_paid: !!newLoan.compensation_lender_paid,
        compensation_lender_paid_amount: newLoan.compensation_lender_paid
          ? newLoan.compensation_lender_paid_amount || null
          : null,
        funded_check_to_company: !!newLoan.funded_check_to_company,
        funded_check_to_company_note: newLoan.funded_check_to_company
          ? newLoan.funded_check_to_company_note || ""
          : "",
        funded_invoice: !!newLoan.funded_invoice,
        funded_invoice_company: newLoan.funded_invoice
          ? newLoan.funded_invoice_company || null
          : null,
        funded_invoice_entegra_amount:
          newLoan.funded_invoice && newLoan.funded_invoice_company === "entegra"
            ? newLoan.funded_invoice_entegra_amount || null
            : null,
        funded_invoice_quantegra_amount:
          newLoan.funded_invoice && newLoan.funded_invoice_company === "quantegra"
            ? newLoan.funded_invoice_quantegra_amount || null
            : null,
        lock_status: newLoan.lock_status || null,
        lock_amount:
          String(newLoan.lock_status || "").toLowerCase() === "locked"
            ? newLoan.lock_amount || null
            : null,
        closing_date: newLoan.closing_date || null,
        point_file: newLoan.point_file || null,
        subject_property: newLoan.subject_property || null,
        loan_comment: newLoan.loan_comment || null,
        lender_ids: (lenders || []).map((l) => l?.id).filter((id) => id != null), // M2M IDs
        role_assignments: roleAssignmentsArray,
      };

      if (editMode && selectedLoan) {
        await updateLoan({ id: selectedLoan.id, data: newLoanData });
        try {
          localStorage.removeItem(`loanFormDraft:edit:${selectedLoan.id}`);
        } catch {
          // ignore
        }
      } else {
        await createLoan(newLoanData);
        try {
          localStorage.removeItem("loanFormDraft:new");
        } catch {
          // ignore
        }
      }

      // Reset form and modal state
      setNewLoan({
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
        lock_amount: null,
        closing_date: "",
        point_file: "",
        subject_property: "",
        loan_comment: "",
       
      });
      setLenders([]); // reset to empty
      setOpenNew(false);
      setEditMode(false);
      setRoleAssignments({});
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
        {/* <Tab label="Active Loans" value="Active Loans" />
        <Tab label="Funded Loans" value="funded" />
        <Tab label="Busted Loans" value="busted" /> */}
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

  {/* LEFT SIDE: Search + Filter */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

    {/* Search Field */}
    <TextField
      size="small"
      placeholder="Search borrower..."
      value={search}
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
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px",
        },
      }}
    />

    {/* Filter Button */}
    <Tooltip title="Filter">
      <IconButton
        onClick={() => setOpenFilter(true)}
        sx={{
          borderRadius: "10px",
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Filter size={18} />
      </IconButton>
    </Tooltip>

  </Box>

</Box>


{/* Actions */}
<Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 2 }}>

        <Button
          variant="outlined"
          startIcon={<Download size="16" />}
          sx={{
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
                backgroundColor: "rgba(0, 50, 200, 1)",
              },
            }}
          >
            New Loan
          </Button>
        )}
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
        roleAssignments={roleAssignments}
        setRoleAssignments={setRoleAssignments}
      />
       <Dialog
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        maxWidth="xs"         // small width
        fullWidth
        keepMounted
      >
        <DialogTitle sx={{ py: 1.5, fontSize: 16, fontWeight: 600 }}>
          Filter Loans
        </DialogTitle>

        <DialogContent dividers sx={{ p: 1.5 }}>
          <Grid container spacing={1.25}>
            {/* Broker */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>Broker</InputLabel>
                <Select
                  label="Broker"
                  value={draftFilters.broker || ""}
                 onChange={(e) =>
  setDraftFilters(prev => ({
    ...prev,
    broker: e.target.value
  }))
}

                >
                  <MenuItem value="">All</MenuItem>
                  {brokers.map((b) => (
                   <MenuItem key={b.id} value={b.id}>
    {b.name}
  </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Loan Officer */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>Loan Officer</InputLabel>
                <Select
                  label="Loan Officer"
                  value={draftFilters.loan_officer || ""}
onChange={(e) =>
  setDraftFilters(prev => ({
    ...prev,
    loan_officer: e.target.value
  }))
}

                >
                  <MenuItem value="">All</MenuItem>
                  {loanOfficers.map((o) => (
  <MenuItem key={o.id} value={o.id}>
    {o.name}
  </MenuItem>
))}

                </Select>
              </FormControl>
            </Grid>

            {/* Milestone */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>Milestone</InputLabel>
                <Select
                  label="Milestone"
                  value={draftFilters.milestone || ""}
                 onChange={(e) =>
  setDraftFilters(prev => ({
    ...prev,
    milestone: e.target.value
  }))
}

                >
                  <MenuItem value="">All</MenuItem>
                  {milestones.map((m) => (
  <MenuItem key={m.id} value={m.id}>
    {m.name}
  </MenuItem>
))}

                </Select>
              </FormControl>
            </Grid>

            {/* Amount range */}
            <Grid item xs={6}>
              <TextField
                label="Min Amount"
                type="number"
                size="small"
                fullWidth
                margin="dense"
                value={draftFilters.amount__gte || ""}
onChange={(e) =>
  setDraftFilters(prev => ({
    ...prev,
    amount__gte: e.target.value
  }))
}

              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Max Amount"
                type="number"
                size="small"
                fullWidth
                margin="dense"
                value={draftFilters.amount__lte || ""}
onChange={(e) =>
  setDraftFilters(prev => ({
    ...prev,
    amount__lte: e.target.value
  }))
}

              />
            </Grid>

            {/* Created date range */}
            <Grid item xs={6}>
              <TextField
                label="Created From"
                type="date"
                size="small"
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
               value={draftFilters.created_at__gte || ""}
onChange={(e) =>
  setDraftFilters(prev => ({
    ...prev,
    created_at__gte: e.target.value
  }))
}

              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Created To"
                type="date"
                size="small"
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
                value={draftFilters.created_at__lte || ""}
onChange={(e) =>
  setDraftFilters(prev => ({
    ...prev,
    created_at__lte: e.target.value
  }))
}

              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 1.25 }}>
          <Button size="small" onClick={() => setOpenFilter(false)}>Cancel</Button>
          <Button
            size="small"
            onClick={() => {
 setDraftFilters({
  broker: "",
  loan_officer: "",
  milestone: "",
  team_leader: "",
  processor: "",
  amount__gte: "",
  amount__lte: "",
  created_at__gte: "",
  created_at__lte: "",
});

  setSearchParams({});
  setPage(1);
}}

          >
            Clear
          </Button>
          <Button
  size="small"
  variant="contained"
  onClick={() => applyFilters(draftFilters)}
>

            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
