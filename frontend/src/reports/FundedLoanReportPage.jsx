import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import {
  useGetFundedLoanReportQuery,
  useGetBrokerLinkedEmployeesQuery,
  useGetTeamLeadProcessorsQuery,

} from "@/api/fundedLoanReportApi";
import { useGetBrokersQuery } from "@/api/brokerApi";
import { useGetAllEmployeesQuery } from "@/api/employeeApi";
import { useNavigate } from "react-router-dom";



export default function FundedLoanReportPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    broker: null,
    loan_officer: null,
    team_leader: null,
    processor: null,
    start_date: "",
    end_date: "",
    page: 1,
  });

  // 🔹 Fetch all brokers
  const { data: brokers, isLoading: isBrokersLoading } = useGetBrokersQuery({
    page: 1,
    page_size: 1000,
    archived: false,
  });
  
  // 🔹 Fetch all employees (for independent selection)
  const { data: allEmployees, isFetching: isAllEmployeesLoading } =
    useGetAllEmployeesQuery();
    console.log("👥 allEmployees:", allEmployees);


  // 🔹 Fetch broker-linked employees
  const { data: linkedData, isFetching: isLinkedLoading } =
    useGetBrokerLinkedEmployeesQuery(filters.broker?.id, {
      skip: !filters.broker?.id,
    });

  // 🔹 Fetch processors linked to team leader
  const { data: leadProcessors, isFetching: isProcessorsLoading } =
    useGetTeamLeadProcessorsQuery(filters.team_leader?.id, {
      skip: !filters.team_leader?.id,
    });

  // 🔹 Fetch report data
  const { data, isLoading: isReportLoading } = useGetFundedLoanReportQuery({
    broker: filters.broker?.id,
    loan_officer: filters.loan_officer?.id,
    team_leader: filters.team_leader?.id,
    processor: filters.processor?.id,
    start_date: filters.start_date,
    end_date: filters.end_date,
    page: filters.page,
  });
  console.log("📊 funded report raw data:", data);
  // ======================================================
  // 🔸 Derived dropdown options
  // ======================================================
  const loanOfficers = linkedData?.loan_officers || [];

  const teamLeaders = useMemo(() => {
  const employees = allEmployees?.results || [];
  
  if (filters.broker && linkedData?.team_leaders?.length)
    return linkedData.team_leaders;

  return employees.filter(
    (e) => e.role_names?.includes("Lead") || e.role_names?.includes("Team Lead")
  );
}, [filters.broker, linkedData, allEmployees]);


const processors = useMemo(() => {
  const employees = allEmployees?.results || [];

  const allProcessorList = employees.filter((e) =>
    e.role_names?.some((r) => r.toLowerCase().includes("processor"))
  );

  if (filters.team_leader && leadProcessors?.processors?.length) {
    const ids = leadProcessors.processors.map((p) => p.id);
    return allProcessorList.filter((p) => ids.includes(p.id));
  }

  if (filters.broker && linkedData?.processors?.length) {
    const ids = linkedData.processors.map((p) => p.id);
    return allProcessorList.filter((p) => ids.includes(p.id));
  }

  return allProcessorList;
}, [filters.team_leader, filters.broker, leadProcessors, linkedData, allEmployees]);


const handleMilestoneClick = (milestoneId) => {
  if (milestoneId) {
    navigate(`/loan-management?milestone=${milestoneId}`);
  }
};


  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1,
      ...(field === "broker" && {
        loan_officer: null,
        team_leader: null,
        processor: null,
      }),
      ...(field === "team_leader" && { processor: null }),
    }));
  };

  const handleDateChange = (field) => (e) =>
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));

  const handleClearFilters = () =>
    setFilters({
      broker: null,
      loan_officer: null,
      team_leader: null,
      processor: null,
      start_date: "",
      end_date: "",
      page: 1,
    });

  const renderAutocomplete = (label, options, field, loading = false) => (
    <Autocomplete
      options={options}
      getOptionLabel={(opt) => opt?.name || ""}
      value={filters[field]}
      onChange={(_, newValue) => handleFilterChange(field, newValue)}
      loading={loading}
      renderInput={(params) => (
        <TextField {...params} label={label} fullWidth />
      )}
    />
  );

  // ======================================================
  // 🔸 UI
  // ======================================================
  return (
    <Box p={4}>
      <Typography variant="h5" mb={3} fontWeight={600}>
        📊 Loan Report
      </Typography>

      {/* 🔸 Filter Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3} sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}>
            {renderAutocomplete(
              "Broker",
              brokers?.results || [],
              "broker",
              isBrokersLoading
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}>
            {renderAutocomplete(
              "Loan Officer",
              loanOfficers,
              "loan_officer",
              isLinkedLoading
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}>
            {renderAutocomplete(
              "Team Leader",
              teamLeaders,
              "team_leader",
              isLinkedLoading || isAllEmployeesLoading
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}>
            {renderAutocomplete(
              "Processor",
              processors,
              "processor",
              isProcessorsLoading || isAllEmployeesLoading
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              type="date"
              label="Start Date"
              value={filters.start_date}
              onChange={handleDateChange("start_date")}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              type="date"
              label="End Date"
              value={filters.end_date}
              onChange={handleDateChange("end_date")}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{ height: "100%" }}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 🔸 Loan Report Table */}
      {isReportLoading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" mb={2}>
            📠 Milestone Summary
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Milestone</TableCell>
                <TableCell align="right">Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.milestones?.length ? (
                <>
                {data.milestones.map((row, i) => (
                  
<TableRow
  key={i}
  hover
  sx={{ cursor: "pointer" }}
  onClick={() => handleMilestoneClick(row.milestone_id)}
>

    <TableCell>{row.milestone || "Unknown"}</TableCell>
    <TableCell align="right">{row.count || 0}</TableCell>
  </TableRow>
))}


                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Total Loans</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {data.total_loans || 0}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No data found for selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}





