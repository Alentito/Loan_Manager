import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { ChromePicker } from 'react-color';

const MILESTONE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export default function MilestoneFormDialog({
  open,
  onClose,
  milestone = null,
  onSubmit,
  loading = false,
}) {
  const theme = useTheme();
  const isEditing = Boolean(milestone);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2563EB',
    background_color: '#EEF2FF',
    status: 'active',
    sort_order: 0,
  });

  const [errors, setErrors] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name || '',
        description: milestone.description || '',
        color: milestone.color || '#2563EB',
        background_color: milestone.background_color || '#EEF2FF',
        status: milestone.status || 'active',
        sort_order: milestone.sort_order || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#2563EB',
        background_color: '#EEF2FF',
        status: 'active',
        sort_order: 0,
      });
    }
    setErrors({});
  }, [milestone, open]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleColorChange = (field) => (color) => {
    setFormData(prev => ({ ...prev, [field]: color.hex }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
    }

    if (formData.sort_order < 0) {
      newErrors.sort_order = 'Sort order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleClose = () => {
    setShowColorPicker(false);
    setShowBgColorPicker(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {isEditing ? 'Edit Milestone' : 'Create New Milestone'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEditing ? 'Update milestone information' : 'Add a new milestone to the system'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Name *"
              fullWidth
              value={formData.name}
              onChange={handleChange('name')}
              error={Boolean(errors.name)}
              helperText={errors.name || 'Enter milestone name (e.g., Application, Underwriting)'}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Status"
              >
                {MILESTONE_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange('description')}
              error={Boolean(errors.description)}
              helperText={errors.description || 'Optional description for this milestone'}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Sort Order"
              type="number"
              fullWidth
              value={formData.sort_order}
              onChange={handleChange('sort_order')}
              error={Boolean(errors.sort_order)}
              helperText={errors.sort_order || 'Order in which milestones appear'}
              variant="outlined"
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Appearance */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
              Appearance
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Text Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: formData.color,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <TextField
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  size="small"
                  sx={{ width: 100 }}
                />
              </Box>
              {showColorPicker && (
                <Box sx={{ position: 'absolute', zIndex: 1000, mt: 1 }}>
                  <Box
                    sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => setShowColorPicker(false)}
                  />
                  <ChromePicker
                    color={formData.color}
                    onChange={handleColorChange('color')}
                  />
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Background Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: formData.background_color,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                />
                <TextField
                  value={formData.background_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                  size="small"
                  sx={{ width: 100 }}
                />
              </Box>
              {showBgColorPicker && (
                <Box sx={{ position: 'absolute', zIndex: 1000, mt: 1 }}>
                  <Box
                    sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => setShowBgColorPicker(false)}
                  />
                  <ChromePicker
                    color={formData.background_color}
                    onChange={handleColorChange('background_color')}
                  />
                </Box>
              )}
            </Box>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Preview
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                px: 2,
                py: 1,
                borderRadius: '8px',
                backgroundColor: formData.background_color,
                color: formData.color,
                fontWeight: 500,
                fontSize: '13px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {formData.name || 'Milestone Name'}
            </Box>
          </Grid>
        </Grid>

        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Please fix the errors above before submitting.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}