// src/components/brokers/BrokerFormDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BrokerForm from './BrokerForm';
import { toast } from 'react-hot-toast';
import {
  useAddBrokerMutation,
  useUpdateBrokerMutation,
} from '../api/brokerApi';

const BrokerFormDialog = ({ open, onClose, editingBroker, onSuccess }) => {
  const [addBroker, { isLoading: isAdding }] = useAddBrokerMutation();
  const [updateBroker, { isLoading: isUpdating }] = useUpdateBrokerMutation();

  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({}); // New: server validation errors

  // Reset submitting and errors when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setServerErrors({});
    }
  }, [open]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setServerErrors({}); // Clear old errors on new submit

    try {
      if (editingBroker) {
        await updateBroker({ id: editingBroker.id, formData }).unwrap();
        toast.success(`Broker "${formData.get('name')}" updated successfully.`, {
          style: { border: '1px solid #4caf50', padding: '12px', color: '#4caf50' },
          iconTheme: { primary: '#4caf50', secondary: '#FFF' },
        });
      } else {
        await addBroker(formData).unwrap();
        toast.success(`Broker "${formData.get('name')}" added successfully.`, {
          style: { border: '1px solid #4caf50', padding: '12px', color: '#4caf50' },
          iconTheme: { primary: '#4caf50', secondary: '#FFF' },
        });
      }

      setSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      // Check if error.data contains field validation errors
      if (error?.data && typeof error.data === 'object') {
        setServerErrors(error.data);
      } else {
        toast.error(error?.data?.detail || 'Failed to submit broker form. Please check your data.', {
          style: { border: '1px solid #f44336', padding: '12px', color: '#f44336' },
          iconTheme: { primary: '#f44336', secondary: '#FFF' },
        });
      }
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ m: 0, p: 2, backgroundColor: '#1976d2', color: '#fff' }}>
        {editingBroker ? 'Edit Broker' : 'Add Broker'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <BrokerForm
          existingData={editingBroker}
          onSuccess={handleSubmit}
          submitting={submitting || isAdding || isUpdating}
          onStartSubmit={() => setSubmitting(true)}
          onError={() => setSubmitting(false)}
          serverErrors={serverErrors}  // Pass down server errors here
        />
      </DialogContent>

      <DialogActions>
        <Box flexGrow={1} />
        <Button onClick={onClose} color="secondary" disabled={submitting}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BrokerFormDialog;
