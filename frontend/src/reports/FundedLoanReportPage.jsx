// File: frontend/src/reports/FundedLoanReportPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Pagination,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useGetFundedLoanReportQuery, useGetBrokerLinkedEmployeesQuery } from "@/api/fundedLoanReportApi";
import { useGetBrokersQuery } from "@/api/brokerApi";
import { useGetEmployeesQuery } from "@/api/employeeApi";

export default function FundedLoanReportPage() {
  const [filters, setFilters] = useState({
    broker: "",
    loan_officer: "",
    team_leader: "",
    processor: "",
    start_date: "",
    end_date: "",
    page: 1,
  });

  const [linkedOptions, setLinkedOptions] = useState({
    loan_officers: [],
    team_leaders: [],
    processors: [],
  });
  const { data: linkedData } = useGetBrokerLinkedEmployeesQuery(filters.broker, {
  skip: !filters.broker,
});


  // 🔹 Base data
  const { data: brokers, isLoading: isBrokersLoading } = useGetBrokersQuery({
    page: 1,
    page_size: 1000,
    archived: false,
  });
  const { data: employees } = useGetEmployeesQuery();
  const { data, isLoading } = useGetFundedLoanReportQuery(filters);


  // 🔹 Fetch linked employees when broker changes
  useEffect(() => {
    if (!filters.broker) {
      setLinkedOptions({ loan_officers: [], team_leaders: [], processors: [] });
      return;
    }

    const fetchLinked = async () => {
      try {
        const res = await fetch(
          `/api/report/funded-loans/linked-employees/?broker=${filters.broker}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const json = await res.json();
          setLinkedOptions(json);
        }
      } catch (err) {
        console.error("Error fetching linked employees:", err);
      }
    };
    fetchLinked();
  }, [filters.broker]);

  // 🔹 Handlers
  const handleChange = (field) => (event) =>
    setFilters({ ...filters, [field]: event.target.value, page: 1 });

  const handleDateChange = (field) => (event) =>
    setFilters({ ...filters, [field]: event.target.value });

  const handleApplyFilters = () =>
    setFilters((prev) => ({ ...prev, page: 1 }));

  const handleClearFilters = () =>
    setFilters({
      broker: "",
      loan_officer: "",
      team_leader: "",
      processor: "",
      start_date: "",
      end_date: "",
      page: 1,
    });

  // 🔹 Render
  return (
    <Box p={4}>
      <Typography variant="h5" mb={3} fontWeight={600}>
        📊 Funded Loan Report
      </Typography>

      {/* 🔸 Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          {/* Broker */}
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={brokers?.results || []}
              getOptionLabel={(option) => option.name || ""}
              value={
                brokers?.results?.find((b) => b.id === filters.broker) || null
              }
              onChange={(e, newValue) =>
                setFilters({
                  ...filters,
                  broker: newValue ? newValue.id : "",
                  loan_officer: "",
                  team_leader: "",
                  processor: "",
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Broker" fullWidth />
              )}
              disabled={isBrokersLoading}
               sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}
            />
          </Grid>

          {/* Loan Officer */}
<Autocomplete
  options={linkedData?.loan_officers || []}
  getOptionLabel={(option) => option.loan_officer__name || option.name || ""}
  value={
    linkedData?.loan_officers?.find((o) => o.loan_officer__id === filters.loan_officer) || null
  }
  onChange={(e, newValue) =>
    setFilters({
      ...filters,
      loan_officer: newValue ? newValue.loan_officer__id : "",
    })
  }
  renderInput={(params) => <TextField {...params} label="Loan Officer" fullWidth />}
   sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}
/>

{/* Team Leader */}
<Autocomplete
  options={linkedData?.team_leaders || []}
  getOptionLabel={(option) => option.team_leader__name || option.name || ""}
  value={
    linkedData?.team_leaders?.find((t) => t.team_leader__id === filters.team_leader) || null
  }
  onChange={(e, newValue) =>
    setFilters({
      ...filters,
      team_leader: newValue ? newValue.team_leader__id : "",
    })
  }
  renderInput={(params) => <TextField {...params} label="Team Leader" fullWidth />}
   sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}
/>

{/* Processor */}
<Autocomplete
  options={linkedData?.processors || []}
  getOptionLabel={(option) => option.processor__name || option.name || ""}
  value={
    linkedData?.processors?.find((p) => p.processor__id === filters.processor) || null
  }
  onChange={(e, newValue) =>
    setFilters({
      ...filters,
      processor: newValue ? newValue.processor__id : "",
    })
  }
  renderInput={(params) => <TextField {...params} label="Processor" fullWidth />}
   sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": { borderRadius: 2 },
                }}
/>


          {/* Date Filters */}
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

         
          <Grid item xs={12} md={2}>
  <Button
    fullWidth
    variant="outlined"
    color="secondary"
    sx={{ height: "100%" }}
    onClick={() =>
      setFilters({
        broker: "",
        loan_officer: "",
        team_leader: "",
        processor: "",
        start_date: "",
        end_date: "",
        page: 1,
      })
    }
  >
    Clear
  </Button>
</Grid>

        </Grid>
      </Paper>

      {/* 🔸 Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Broker</TableCell>
                <TableCell>Loan Officer</TableCell>
                <TableCell>Team Leader</TableCell>
                <TableCell>Processor</TableCell>
                <TableCell>Funded Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.results?.length ? (
                data.results.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.broker__name || "-"}</TableCell>
                    <TableCell>{row.loan_officer__name || "-"}</TableCell>
                    <TableCell>{row.team_leader__name || "-"}</TableCell>
                    <TableCell>{row.processor__name || "-"}</TableCell>
                    <TableCell>{row.funded_count}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No funded loans found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={Math.ceil((data?.count || 0) / 10)}
              page={filters.page}
              onChange={(e, newPage) =>
                setFilters({ ...filters, page: newPage })
              }
            />
          </Box>

          <Typography variant="body2" align="right" mt={2}>
            Total Funded Loans: {data?.total_funded_loans || 0}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
