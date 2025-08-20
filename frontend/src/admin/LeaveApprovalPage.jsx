import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Stack,
  TablePagination,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  useGetAllLeaveRequestsQuery,
  useUpdateLeaveStatusMutation,
} from '../redux/leaveApi';
import { getUserRole, isApprover } from '../../utils/authUtils';

const LeaveApprovalPage = () => {
  const [page, setPage] = useState(0); // zero-based for frontend
  const [statusFilter, setStatusFilter] = useState('');
  const rowsPerPage = 10;

  const { data, isLoading, isError, refetch } = useGetAllLeaveRequestsQuery({
    page: page + 1,
    page_size: rowsPerPage,
    status: statusFilter,
  });

  const [updateLeaveStatus, { isLoading: isUpdating }] = useUpdateLeaveStatusMutation();
  const userRole = getUserRole();

  const requests = data?.results || [];
  const totalCount = data?.count || 0;

  const canApproveRequest = (requesterRole) => {
    if (!requesterRole) return false;
    if (userRole === 'team_lead') {
      return ['processor', 'junior_processor'].includes(requesterRole);
    }
    return userRole === 'team_manager';
  };

  const handleAction = async (id, status) => {
    try {
      await updateLeaveStatus({ id, status }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to update leave status:', error);
    }
  };

  if (!isApprover()) {
    return (
      <Box p={3}>
        <Typography color="error">
          Access denied. Only approvers can access this page.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">Failed to load leave requests.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Leave Requests – Approval Panel
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Filter by Status"
          select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="denied">Denied</MenuItem>
        </TextField>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Employee ID</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Leave Type</strong></TableCell>
              <TableCell><strong>Start</strong></TableCell>
              <TableCell><strong>End</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Reason</strong></TableCell>
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {requests.length > 0 ? (
              requests.map(({ id, employee = {}, leave_type, start_date, end_date, status, reason }) => {
               
                const position = employee.position || '';
                const readablePosition = position ? position.replace(/_/g, ' ') : 'Unknown';
                const statusColor =
                  status === 'approved' ? 'green' :
                    status === 'denied' ? 'red' : 'orange';

                return (
                  <TableRow key={id}>
                    <TableCell>{employee?.name} ({employee?.login_id})</TableCell>
                    <TableCell>{readablePosition}</TableCell>
                    <TableCell>{leave_type}</TableCell>
                    <TableCell>{start_date}</TableCell>
                    <TableCell>{end_date}</TableCell>
                    <TableCell sx={{ color: statusColor, fontWeight: 600 }}>
                      {status.toUpperCase()}
                    </TableCell>
                    <TableCell>{reason}</TableCell>
                    <TableCell>
                      {status === 'pending' && canApproveRequest(position) ? (
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAction(id, 'approved')}
                            disabled={isUpdating}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => handleAction(id, 'denied')}
                            disabled={isUpdating}
                          >
                            Deny
                          </Button>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No leave requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </Paper>
    </Box>
  );
};

export default LeaveApprovalPage;
