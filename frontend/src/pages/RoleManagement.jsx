import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormGroup,
  FormControlLabel,
  TablePagination,
  Checkbox,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  Grid
} from "@mui/material";
import { Plus, Edit2, Trash2, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useGetPermissionsQuery,
  useCreateGroupMutation,
  useGetGroupsQuery,
  useDeleteGroupMutation,
  useUpdateGroupMutation,
} from "../api/authApi";

const steps = ["Role Details", "Assign Permissions"];

export default function RoleManagement() {
  const [assignableOnLoan, setAssignableOnLoan] = useState(false);

  const [mode, setMode] = useState("create");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [roleName, setRoleName] = useState("");
  const [roleType, setRoleType] = useState("Custom");
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [createRole, { isLoading: savingRole }] = useCreateGroupMutation();
  const [updateRole] = useUpdateGroupMutation();
  const [deleteRole] = useDeleteGroupMutation();

  const { data: permissionsData = [], isLoading: loadingPerms } =
    useGetPermissionsQuery();

  const {
    data: groupsRaw = {},
    isLoading: loadingGroups,
    refetch: refetchGroups,
  } = useGetGroupsQuery({ page: page + 1, page_size: rowsPerPage });

  const groups = Array.isArray(groupsRaw) ? groupsRaw : groupsRaw.results || [];

  const totalCount = groupsRaw?.count ?? groups.length;

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const aOrder = a.sort_order ?? 0;
      const bOrder = b.sort_order ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });
  }, [groups]);

  const groupedPermissions = useMemo(() => {
    const map = {};
    permissionsData.forEach((perm) => {
      const key = `${perm.app_label}/${perm.model}`;
      if (!map[key]) map[key] = [];
      map[key].push(perm);
    });
    return map;
  }, [permissionsData]);

  const getPermissionIdByCodename = (codename) => {
    const perm = permissionsData.find((p) => p.codename === codename);
    return perm ? perm.id : null;
  };

  const handlePermissionChange = (group, codename) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [codename]: !prev[group]?.[codename],
      },
    }));
  };

  const handleSelectAllInGroup = (group, perms, checked) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [group]: perms.reduce((acc, perm) => {
        acc[perm.codename] = checked;
        return acc;
      }, {}),
    }));
  };

  const resetFormState = () => {
    setMode("create");
    setEditingRoleId(null);
    setRoleName("");
    setRoleType("Custom");
    setSelectedPermissions({});
    setActiveStep(0);
    setSortOrder(0);
    setAssignableOnLoan(false);
  };

  const openCreateDialog = () => {
    resetFormState();
    setDialogOpen(true);
  };

  const openEditDialog = (role) => {
    setMode("edit");
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleType(role.type || "Custom");
    setSortOrder(role.sort_order ?? 0);
    setAssignableOnLoan(!!role.assignable_on_loan);
    setSelectedPermissions(() => {
      const next = {};
      (role.permissions || []).forEach((perm) => {
        const groupKey = `${perm.app_label}/${perm.model}`;
        if (!next[groupKey]) next[groupKey] = {};
        next[groupKey][perm.codename] = true;
      });
      return next;
    });
    setActiveStep(0);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetFormState();
  };

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNext = async () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
      return;
    }

    const selectedIds = [];
    Object.entries(selectedPermissions).forEach(([group, perms]) => {
      Object.entries(perms).forEach(([codename, checked]) => {
        if (checked) {
          const id = getPermissionIdByCodename(codename);
          if (id) selectedIds.push(id);
        }
      });
    });

    const payload = {
      name: roleName,
      type: roleType,
      permission_ids: selectedIds,
      sort_order: Number(sortOrder) || 0,
      assignable_on_loan: assignableOnLoan,
    };

    try {
      if (mode === "edit" && editingRoleId) {
        await updateRole({ id: editingRoleId, ...payload }).unwrap();
      } else {
        await createRole(payload).unwrap();
      }
      handleCloseDialog();
      refetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleDelete = async (role) => {
    const confirmed = window.confirm(
      `Delete role "${role.name}" and all assigned permissions?`
    );
    if (!confirmed) return;
    try {
      await deleteRole(role.id).unwrap();
      refetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const renderPermissionStep = () => {
    if (loadingPerms) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Loading permissions…</Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mt: 2, maxHeight: 400, overflowY: "auto", pr: 1 }}>
        {Object.entries(groupedPermissions).map(([group, perms]) => {
          const allSelected = perms.every(
            (perm) => selectedPermissions[group]?.[perm.codename]
          );
          const someSelected = perms.some(
            (perm) => selectedPermissions[group]?.[perm.codename]
          );

          return (
            <Box key={group} sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, px: 1 }}>
                <Typography variant="overline" sx={{ flex: 1, fontWeight: 700, color: 'primary.main' }}>
                  {group.replace('/', ' • ')}
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={(e) =>
                        handleSelectAllInGroup(group, perms, e.target.checked)
                      }
                    />
                  }
                  label={<Typography variant="caption">Select All</Typography>}
                />
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={1} sx={{ px: 1 }}>
                {perms.map((perm) => (
                  <Grid item xs={12} sm={6} md={4} key={perm.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!selectedPermissions[group]?.[perm.codename]}
                          onChange={() =>
                            handlePermissionChange(group, perm.codename)
                          }
                        />
                      }
                      label={<Typography variant="body2">{perm.name}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderPermissionsChips = (permissions) => {
    if (!permissions || permissions.length === 0) {
      return <Typography variant="body2" color="text.disabled">—</Typography>;
    }
    
    const visible = permissions.slice(0, 2);
    const remaining = permissions.length - visible.length;

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {visible.map((p) => (
          <Chip 
            key={p.id} 
            label={p.name} 
            size="small" 
            variant="outlined" 
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        ))}
        {remaining > 0 && (
          <Tooltip title={permissions.slice(2).map(p => p.name).join(", ")}>
            <Chip 
              label={`+${remaining} more`} 
              size="small" 
              sx={{ fontSize: '0.7rem', height: 20, bgcolor: 'action.hover' }} 
            />
          </Tooltip>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, width: "100%", boxSizing: "border-box" }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />} 
          onClick={openCreateDialog}
          disableElevation
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          New Role
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, minHeight: 400 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, py: 2.5 }}>Role Name</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 2.5 }}>Permissions</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, py: 2.5 }}>Sort</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, py: 2.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingGroups ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary">Loading roles…</Typography>
                </TableCell>
              </TableRow>
            ) : sortedGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary">No roles found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedGroups.map((group) => (
                <TableRow key={group.id} hover>
                  <TableCell sx={{ fontWeight: 500, py: 2 }}>{group.name}</TableCell>
                  <TableCell sx={{ py: 2 }}>{renderPermissionsChips(group.permissions)}</TableCell>
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Typography variant="body2" color="text.secondary">{group.sort_order ?? 0}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEditDialog(group)}>
                          <Edit2 size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(group)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ borderTop: 'none' }}
      />

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield size={20} style={{ color: '#3b82f6' }} />
          <Typography variant="h6" fontWeight={700}>
            {mode === "edit" ? "Edit Role" : "Create Role"}
          </Typography>
        </DialogTitle>
        <Divider />
        
        <DialogContent sx={{ py: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 500, mx: 'auto', py: 2 }}>
              <TextField
                label="Role Name"
                fullWidth
                size="small"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                autoFocus
              />
              <TextField
                label="Sort Order"
                type="number"
                fullWidth
                size="small"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                helperText="Determines the display order in menus"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>Assignable on Loan</Typography>
                  <Typography variant="caption" color="text.secondary">Users with this role can be assigned to loans</Typography>
                </Box>
                <Switch
                  checked={assignableOnLoan}
                  onChange={(e) => setAssignableOnLoan(e.target.checked)}
                />
              </Box>
            </Box>
          ) : (
            renderPermissionStep()
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={handleBack} 
            disabled={activeStep === 0}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={savingRole || (activeStep === 0 && !roleName.trim())}
            disableElevation
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            {activeStep === steps.length - 1 ? (mode === 'edit' ? "Update Role" : "Create Role") : "Next"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
