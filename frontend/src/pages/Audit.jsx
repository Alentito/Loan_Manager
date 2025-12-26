// src/pages/AuditPage.jsx  (or wherever you rendered the old AuditTable)
import React from 'react';
import Box from '@mui/material/Box';
import LogTable from '../components/audit/LogTable';   // << NEW component

export default function AuditPage() {
  return (
    <Box p={2}>
      <LogTable />        {/* renders the TanStack/MUI grid */}
    </Box>
  );
}
