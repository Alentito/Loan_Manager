import React, { useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useGetLateLoginsQuery } from "../api/attendanceApi";

export default function LateLoginsPage() {
  const [filter, setFilter] = useState("month"); // day | week | month
  const { data, isLoading, error } = useGetLateLoginsQuery(filter);

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Late Logins ({filter.toUpperCase()})
      </Typography>

      {/* Filter dropdown */}
      <Box mb={2}>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          size="small"
        >
          <MenuItem value="day">Today</MenuItem>
          <MenuItem value="week">This Week</MenuItem>
          <MenuItem value="month">This Month</MenuItem>
        </Select>
      </Box>

      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            Failed to load data.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Login Time</TableCell>
                <TableCell>Minutes Late</TableCell>
                <TableCell>Shift</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.length ? (
  data.map((row, index) => (
    <TableRow key={`${row.employee_id}-${row.date}-${index}`}>
      <TableCell>{row.employee_id}</TableCell>
      <TableCell>{row.employee_name}</TableCell>
      <TableCell>{row.date}</TableCell>
      <TableCell>{row.status}</TableCell>
      <TableCell>{row.login_time}</TableCell>
      <TableCell>{row.late_duration}</TableCell>
      <TableCell>{row.shift_name}</TableCell>
    </TableRow>
  ))
) : (

                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No late logins found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
