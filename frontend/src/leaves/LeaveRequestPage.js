import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from '@mui/material';
import { useGetLeaveRequestsQuery } from '../redux/leaveApi';
//import { getLoggedInEmployeeId } from '../../utils/authUtils';
import LeaveRequestForm from './LeaveRequestForm';

const LeaveRequestPage = () => {
  //const employeeId = getLoggedInEmployeeId();
  const { data, isLoading, isError, refetch } = useGetLeaveRequestsQuery();
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    if (data) setLeaveRequests(data);
  }, [data]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography color="error" mt={4} textAlign="center">
        Failed to load leave requests.
      </Typography>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        My Leave Requests
      </Typography>

      <Box mb={2}>
        <LeaveRequestForm employeeId={employeeId} />
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Leave Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.leave_type}</TableCell>
                  <TableCell>{req.start_date}</TableCell>
                  <TableCell>{req.end_date}</TableCell>
                  <TableCell
                    sx={{
                      color:
                        req.status === 'approved'
                          ? 'green'
                          : req.status === 'denied'
                          ? 'red'
                          : 'orange',
                      fontWeight: 600,
                    }}
                  >
                    {req.status.toUpperCase()}
                  </TableCell>
                  <TableCell>{req.reason}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No leave requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default LeaveRequestPage;
