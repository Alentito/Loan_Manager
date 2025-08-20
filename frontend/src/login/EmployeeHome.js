import React, { useState } from 'react';
import { Box, Button, Typography, Stack, Divider  } from '@mui/material';
import { getUserRole } from '../../utils/authUtils';
import TeamList from '../teams/TeamList';
import ShiftList from '../shifts/ShiftList'; // Adjust the path if needed


const EmployeeHome = () => {
  const role = getUserRole();
  const capitalizedRole = role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const [activeTab, setActiveTab] = useState('shift');

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        You are logged in as <strong>{capitalizedRole}</strong>.
      </Typography>

      {/* Conditionally render Team and Shift management for admin or team_manager */}
      {['admin', 'team_manager'].includes(role) && (
        <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Team & Shift Management
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <Button
          variant={activeTab === 'shift' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('shift')}
        >
          Shifts
        </Button>
        <Button
          variant={activeTab === 'team' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('team')}
        >
          Teams
        </Button>
      </Stack>

      <Divider />

      <Box mt={2}>
        {activeTab === 'shift' ? <ShiftList /> : <TeamList />}
      </Box>
    </Box>
      )}
    </Box>
  );
};

export default EmployeeHome;
