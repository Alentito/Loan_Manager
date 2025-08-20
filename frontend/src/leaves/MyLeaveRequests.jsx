// src/components/leaves/MyLeaveRequests.js

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
import { useGetEmployeeLeaveRequestsQuery } from '../redux/leaveApi';
import { getEmployeeId } from '../../utils/authUtils';

const MyLeaveRequests = () => {
    const employeeId = getEmployeeId();
    const { data, isLoading, isError } = useGetEmployeeLeaveRequestsQuery(employeeId);
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
                Failed to load your leave requests.
            </Typography>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                My Submitted Leave Requests
            </Typography>

            <Paper sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Leave Type</strong></TableCell>
                            <TableCell><strong>Start Date</strong></TableCell>
                            <TableCell><strong>End Date</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Reason</strong></TableCell>
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

export default MyLeaveRequests;
