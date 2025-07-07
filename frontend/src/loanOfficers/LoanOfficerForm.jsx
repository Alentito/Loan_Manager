// LoanOfficerForm.js (RTK Query Refactor)
import React, { useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Grid,
  Select,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import {
  useCreateLoanOfficerMutation,
  useUpdateLoanOfficerMutation,
} from '../api/loanOfficerApi';

const LoanOfficerForm = ({
  existingData,
  onSuccess,
  onStartSubmit,
  onError,
  submitting,
  brokers,
}) => {
  const [name, setName] = useState(existingData?.name || '');
  const [email, setEmail] = useState(existingData?.email || '');
  const [phone, setPhone] = useState(existingData?.contact_number || '');
  const [nmls, setNmls] = useState(existingData?.NMLS || '');
  const [brokerId, setBrokerId] = useState(existingData?.broker_company || '');
  const [errors, setErrors] = useState({});

  const [createLoanOfficer] = useCreateLoanOfficerMutation();
  const [updateLoanOfficer] = useUpdateLoanOfficerMutation();

  const validateEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const localErrors = {};
    if (!name.trim()) localErrors.name = 'Name is required';
    if (!email.trim()) {
      localErrors.email = 'Email is required';
    } else if (!validateEmailFormat(email)) {
      localErrors.email = 'Please enter a valid email address (e.g., example@gmail.com)';
    }
    if (!phone.trim()) localErrors.phone = 'Phone number is required';
    if (!nmls.trim()) localErrors.nmls = 'NMLS number is required';
    if (!brokerId) localErrors.broker_company = 'Please select a broker company';

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      toast.error('Please fill all required fields correctly.', {
        style: { border: '1px solid #f44336', padding: '12px', color: '#f44336' },
        iconTheme: { primary: '#f44336', secondary: '#FFF' },
      });
      if (onError) onError('Validation errors');
      return;
    }

    if (onStartSubmit) onStartSubmit();

    

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('contact_number', phone);
      formData.append('NMLS', nmls);
      formData.append('broker_company', brokerId);

      const mutation = existingData
        ? updateLoanOfficer({ id: existingData.id, data: formData })
        : createLoanOfficer(formData);
      console.log('Calling mutation with:', existingData ? 'UPDATE' : 'CREATE', formData);

      mutation
        .unwrap()
        .then(() => {
          toast.success(
            existingData
              ? `Loan Officer "${name}" updated successfully.`
              : `Loan Officer "${name}" added successfully.`,
            {
              style: { border: '1px solid #4caf50', padding: '12px', color: '#4caf50' },
              iconTheme: { primary: '#4caf50', secondary: '#FFF' },
            }
          );
          if (onSuccess) onSuccess();
        })
        
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={!!errors.email}
            helperText={errors.email}
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Phone"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            error={!!errors.phone}
            helperText={errors.phone}
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="NMLS"
            fullWidth
            value={nmls}
            onChange={(e) => setNmls(e.target.value)}
            required
            error={!!errors.nmls}
            helperText={errors.nmls}
            disabled={submitting}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl
            fullWidth
            required
            error={!!errors.broker_company}
            disabled={submitting}
            sx={{ minWidth: 300 }}
          >
            <InputLabel id="broker-company-label">Broker Company</InputLabel>
            <Select
              labelId="broker-company-label"
              value={brokerId}
              onChange={(e) => setBrokerId(e.target.value)}
              label="Broker Company"
            >
              <MenuItem value="">
                <em>Select Broker</em>
              </MenuItem>
              {brokers.map((broker) => (
                <MenuItem key={broker.id} value={broker.id}>
                  {broker.name}
                </MenuItem>
              ))}
            </Select>
            {errors.broker_company && (
              <Box mt={1} ml={2} color="error.main" fontSize="0.8rem">
                {errors.broker_company}
              </Box>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box textAlign="right">
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={18} />}
            >
              {existingData ? 'Update' : 'Submit'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoanOfficerForm;
