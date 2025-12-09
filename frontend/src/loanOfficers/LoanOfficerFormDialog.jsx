// src/components/loanOfficers/LoanOfficerFormDialog.js
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LoanOfficerForm from './LoanOfficerForm';
import { useGetBrokersQuery } from '../api/brokerApi';

const LoanOfficerFormDialog = ({ open, onClose, editingOfficer, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0); // forces LoanOfficerForm to reset
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // Load brokers using RTK Query
  const { data, isLoading, isError } = useGetBrokersQuery({ page_size: 1000 }, { skip: !open });

  useEffect(() => {
    if (open) {
      setFormKey((prev) => prev + 1);
      setSnackbarMsg('');
    }
  }, [open]);

  const handleSuccess = (msg) => {
    setSubmitting(false);
    if (msg) setSnackbarMsg(msg);
    onSuccess?.(); // reload list
    onClose();
  };

  const handleStartSubmit = () => {
    setSubmitting(true);
  };

  const handleError = (msg) => {
    setSubmitting(false);
    if (msg) setSnackbarMsg(msg);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ m: 0, p: 2, backgroundColor: '#1976d2', color: '#fff' }}>
          {editingOfficer ? 'Edit Loan Officer' : 'Add Loan Officer'}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Box color="error.main">Failed to load brokers.</Box>
          ) : (
            <LoanOfficerForm
              key={formKey}
              existingData={editingOfficer}
              onSuccess={handleSuccess}
              onStartSubmit={handleStartSubmit}
              onError={handleError}
              submitting={submitting}
              brokers={data?.results || []}
            />
          )}
        </DialogContent>

        <DialogActions>
          <Box flexGrow={1} />
          <Button onClick={onClose} color="secondary" disabled={submitting}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg('')}
        message={snackbarMsg}
      />
    </>
  );
};

export default LoanOfficerFormDialog;
