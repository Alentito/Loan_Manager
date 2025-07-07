// src/components/brokers/BrokerForm.js
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-hot-toast';

const BrokerForm = ({
  existingData,
  onSuccess,
  submitting,
  onStartSubmit,
  onError,
  serverErrors = {},
}) => {
  const [name, setName] = useState(existingData?.name || '');
  const [email, setEmail] = useState(existingData?.email || '');
  const [nmls, setNmls] = useState(existingData?.NMLS || '');
  const [primaryPhone, setPrimaryPhone] = useState(existingData?.primary_phone || '');
  const [phone, setPhone] = useState(existingData?.phone || '');
  const [address, setAddress] = useState(existingData?.address || '');
  const [companyAddress, setCompanyAddress] = useState(existingData?.company_address || '');
  const [designation, setDesignation] = useState(existingData?.designation || '');
  const [entregarEmail, setEntregarEmail] = useState(existingData?.entregar_email || '');
  const [entregarFax, setEntregarFax] = useState(existingData?.entregar_fax || '');
  const [entregarPhone, setEntregarPhone] = useState(existingData?.entregar_phone || '');
  const [docOrderOption, setDocOrderOption] = useState(existingData?.doc_order_option || '');
  const [submissionChecklist, setSubmissionChecklist] = useState(existingData?.submission_checklist || '');
  const [signature, setSignature] = useState(null);
  const [logo, setLogo] = useState(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [clearSignature, setClearSignature] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  const validateEmailFormat = (email) => {
  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gov|mil|biz|info|io|co|in|us|uk|ca|de|fr|au|nz|me|tv|live|app|site|shop|cloud|tech|online)$/i;
  return emailRegex.test(trimmed);
};

  const clearFieldError = (field) => {
    if (localErrors[field]) {
      setLocalErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!name.trim()) errors.name = 'Name is required';

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!validateEmailFormat(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!nmls.trim()) errors.nmls = 'NMLS is required';
    if (!primaryPhone.trim()) errors.primary_phone = 'Primary phone is required';
    if (!phone.trim()) errors.phone = 'Phone is required';
    if (!address.trim()) errors.address = 'Address is required';
    if (!companyAddress.trim()) errors.company_address = 'Company address is required';
    if (!designation.trim()) errors.designation = 'Designation is required';

    const trimmedEntregarEmail = entregarEmail.trim();
    if (!trimmedEntregarEmail) {
      errors.entregar_email = 'Entregar email is required';
    } else if (!validateEmailFormat(trimmedEntregarEmail)) {
      errors.entregar_email = 'Please enter a valid entregar email';
    }

    if (!entregarFax.trim()) errors.entregar_fax = 'Entregar fax is required';
    if (!entregarPhone.trim()) errors.entregar_phone = 'Entregar phone is required';

    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      toast.error('Please fill all required fields correctly.', {
        style: { border: '1px solid #f44336', padding: '12px', color: '#f44336' },
        iconTheme: { primary: '#f44336', secondary: '#FFF' },
      });
      onError?.('Validation errors');
      return;
    }

    onStartSubmit?.();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', trimmedEmail);
    formData.append('NMLS', nmls);
    formData.append('primary_phone', primaryPhone);
    formData.append('phone', phone);
    formData.append('address', address);
    formData.append('company_address', companyAddress);
    formData.append('designation', designation);
    formData.append('entregar_email', trimmedEntregarEmail);
    formData.append('entregar_fax', entregarFax);
    formData.append('entregar_phone', entregarPhone);
    formData.append('doc_order_option', docOrderOption);
    formData.append('submission_checklist', submissionChecklist);
    if (signature) formData.append('signature', signature);
    if (logo) formData.append('logo', logo);
    onSuccess?.(formData);
  };

  const getError = (field) =>
    localErrors[field] || (serverErrors[field] ? serverErrors[field][0] : '');

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {[
          { label: 'Name', val: name, set: setName, key: 'name' },
          { label: 'Email', val: email, set: setEmail, key: 'email' },
          { label: 'NMLS', val: nmls, set: setNmls, key: 'nmls' },
          { label: 'Primary Phone', val: primaryPhone, set: setPrimaryPhone, key: 'primary_phone' },
          { label: 'Phone', val: phone, set: setPhone, key: 'phone' },
          { label: 'Address', val: address, set: setAddress, key: 'address' },
          { label: 'Company Address', val: companyAddress, set: setCompanyAddress, key: 'company_address' },
          { label: 'Designation', val: designation, set: setDesignation, key: 'designation' },
          { label: 'Entregar Email', val: entregarEmail, set: setEntregarEmail, key: 'entregar_email' },
          { label: 'Entregar Fax', val: entregarFax, set: setEntregarFax, key: 'entregar_fax' },
          { label: 'Entregar Phone', val: entregarPhone, set: setEntregarPhone, key: 'entregar_phone' },
          { label: 'Doc Order Option', val: docOrderOption, set: setDocOrderOption, key: 'doc_order_option', optional: true },
        ].map((f, i) => (
          <Grid item xs={12} sm={6} key={i}>
            <TextField
              label={f.label}
              fullWidth
              required={!f.optional}
              value={f.val}
              onChange={(e) => {
                f.set(e.target.value);
                clearFieldError(f.key);
              }}
              error={!!getError(f.key)}
              helperText={getError(f.key)}
              disabled={submitting}
            />
          </Grid>
        ))}

        <Grid item xs={12}>
          <TextField
            label="Submission Checklist"
            fullWidth
            multiline
            rows={3}
            value={submissionChecklist}
            onChange={(e) => setSubmissionChecklist(e.target.value)}
            disabled={submitting}
          />
        </Grid>

        {[{
          label: 'Upload Logo:', file: logo, set: setLogo, clear: setClearLogo, existing: existingData?.logo,
        }, {
          label: 'Upload Signature:', file: signature, set: setSignature, clear: setClearSignature, existing: existingData?.signature
        }].map(({ label, file, set, clear, existing }, i) => (
          <Grid item xs={12} key={i}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  set(e.target.files[0]);
                  clear(false);
                }}
                disabled={submitting}
                style={{ maxWidth: 250 }}
              />
              {(file || existing) && (
                <Box display="flex" alignItems="center" gap={2}>
                  <img
                    src={file ? URL.createObjectURL(file) : existing}
                    alt={label}
                    style={{ height: 60, borderRadius: 4, border: '1px solid #ccc' }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      set(null);
                      clear(true);
                    }}
                    disabled={submitting}
                  >
                    Clear
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mt={2}>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => {
                setName(''); setEmail(''); setNmls(''); setPrimaryPhone('');
                setPhone(''); setAddress(''); setCompanyAddress(''); setDesignation('');
                setEntregarEmail(''); setEntregarFax(''); setEntregarPhone('');
                setDocOrderOption(''); setSubmissionChecklist(''); setSignature(null);
                setLogo(null); setLocalErrors({});
                toast.success('Form cleared.');
              }}
              disabled={submitting}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} /> : null}
            >
              {existingData ? 'Update' : 'Submit'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BrokerForm;
