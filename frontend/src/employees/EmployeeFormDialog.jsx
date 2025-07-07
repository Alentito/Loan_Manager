import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-hot-toast';
import EmployeeForm from './EmployeeForm';
import {
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
} from '../api/employeeApi';

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="down" ref={ref} {...props} />
));

const EmployeeFormDialog = ({ open, onClose, initialData }) => {
  const [addEmployee] = useAddEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();

  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const handleStartSubmit = () => {
    setSubmitting(true);
    setServerErrors({});
  };

  const handleSubmit = async (formData) => {
    try {
      const action = initialData ? updateEmployee : addEmployee;
      const payload = initialData
        ? { id: initialData.id, ...formData }
        : formData;

      await action(payload).unwrap();
      toast.success(`Employee ${initialData ? 'updated' : 'created'} successfully`);
      onClose(true);
    } catch (error) {
      setServerErrors(error?.data || {});
      toast.error('Failed to save employee. Please check the form.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      fullWidth
      maxWidth="md"
      TransitionComponent={Transition}
    >
      <DialogTitle sx={{ m: 0, p: 2, backgroundColor: '#1976d2', color: '#fff'}}>
        {initialData ? 'Edit Employee' : 'Add Employee'}
        <IconButton
          onClick={() => onClose(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <EmployeeForm
          existingData={initialData}
          onSuccess={handleSubmit}
          onStartSubmit={handleStartSubmit}
          onError={() => setSubmitting(false)}
          submitting={submitting}
          serverErrors={serverErrors}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={submitting}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeFormDialog;
