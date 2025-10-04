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
  Checkbox,
  Divider,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Modal,
} from "@mui/material";
import {
  useGetPermissionsQuery,
  useCreateGroupMutation,
  useGetGroupsQuery,
  useDeleteGroupMutation,
  useUpdateGroupMutation,
} from "../api/authApi";

const steps = ["Role Details", "Assign Permissions"];

export default function RoleManagement() {
  const [mode, setMode] = useState("create");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [roleName, setRoleName] = useState("");
  const [roleType, setRoleType] = useState("Custom");
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  const [createRole, { isLoading: savingRole }] = useCreateGroupMutation();
  const [updateRole] = useUpdateGroupMutation();
  const [deleteRole] = useDeleteGroupMutation();

  const {
    data: permissionsData = [],
    isLoading: loadingPerms,
  } = useGetPermissionsQuery();

  const {
    data: groupsRaw = {},
    isLoading: loadingGroups,
    refetch: refetchGroups,
  } = useGetGroupsQuery();

  const groups = Array.isArray(groupsRaw)
    ? groupsRaw
    : groupsRaw.results || [];

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
  };

  const openCreateModal = () => {
    resetFormState();
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setMode("edit");
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleType(role.type || "Custom");
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
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetFormState();
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
    };

    try {
      if (mode === "edit" && editingRoleId) {
        await updateRole({ id: editingRoleId, ...payload }).unwrap();
      } else {
        await createRole(payload).unwrap();
      }
      alert("Role saved ✅");
      handleCloseModal();
      refetchGroups();
    } catch (err) {
      console.error(err);
      alert("Error saving role");
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
      alert("Error deleting role");
    }
  };

  const renderPermissionStep = () => {
    if (loadingPerms) {
      return <Typography>Loading permissions…</Typography>;
    }
    if (!permissionsData.length) {
      return <Typography>No permissions available.</Typography>;
    }

    return (
      <Box
        sx={{
          maxHeight: 350,
          overflowY: "auto",
          pr: 1,
        }}
      >
        {Object.entries(groupedPermissions).map(([group, perms]) => {
          const allSelected = perms.every(
            (perm) => selectedPermissions[group]?.[perm.codename]
          );
          const someSelected = perms.some(
            (perm) => selectedPermissions[group]?.[perm.codename]
          );

          return (
            <Box key={group} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  {group}
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={(e) =>
                        handleSelectAllInGroup(group, perms, e.target.checked)
                      }
                    />
                  }
                  label="Select All"
                />
              </Box>
              <Divider sx={{ mb: 1 }} />
              <FormGroup row>
                {perms.map((perm) => (
                  <FormControlLabel
                    key={perm.id}
                    control={
                      <Checkbox
                        checked={!!selectedPermissions[group]?.[perm.codename]}
                        onChange={() =>
                          handlePermissionChange(group, perm.codename)
                        }
                      />
                    }
                    label={perm.name}
                  />
                ))}
              </FormGroup>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, width: "100%",        // ensure it stretches full available width
        maxWidth: "100%",
        boxSizing: "border-box", }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Roles
      </Typography>

      <Button variant="contained" onClick={openCreateModal} sx={{ mb: 2 }}>
        Create Role
      </Button>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell width={160}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingGroups ? (
              <TableRow>
                <TableCell colSpan={3}>Loading…</TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  No roles found. Create your first role.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>
                    {group.permissions?.length
                      ? group.permissions
                          .map((perm) => perm.name)
                          .join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => openEditModal(group)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(group)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 4,
            width: 520,
            maxWidth: "90vw",
            maxHeight: "90vh",
            p: 3,
            overflow: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {mode === "edit" ? "Edit Role" : "Create Role"}
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 ? (
            <Box>
              <TextField
                label="Role Name"
                fullWidth
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Role Type
              </Typography>
              <Select
                fullWidth
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                sx={{ mb: 3 }}
              >
                <MenuItem value="Custom">Custom</MenuItem>
                <MenuItem value="System">System</MenuItem>
              </Select>
            </Box>
          ) : (
            renderPermissionStep()
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Box>
              <Button onClick={handleCloseModal} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={savingRole || (activeStep === 0 && !roleName.trim())}
              >
                {activeStep === steps.length - 1 ? "Finish" : "Next"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}