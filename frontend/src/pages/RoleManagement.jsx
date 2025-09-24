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
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Modal
} from "@mui/material";
import { useGetPermissionsQuery, useCreateGroupMutation, useGetGroupsQuery } from "../api/authApi";

const steps = ["Role Details", "Assign Permissions"];

export default function RoleManagement() {
  // Role creation state
  const [activeStep, setActiveStep] = useState(0);
  const [roleName, setRoleName] = useState("");
  const [roleType, setRoleType] = useState("Custom");
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [createRole, { isLoading }] = useCreateGroupMutation();
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch permissions and roles
  const { data: permissionsData = [], isLoading: loadingPerms } = useGetPermissionsQuery();
  const { data: groupsRaw = {}, isLoading: loadingGroups, refetch: refetchGroups } = useGetGroupsQuery();
const groups = Array.isArray(groupsRaw) ? groupsRaw : (groupsRaw.results || []);
  // Group permissions for UI
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissionsData.forEach((perm) => {
      const groupKey = `${perm.app_label}/${perm.model}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(perm);
    });
    return groups;
  }, [permissionsData]);

  // Helper: get permission ID by codename
  const getPermissionIdByCodename = (codename) => {
    const permObj = permissionsData.find((p) => p.codename === codename);
    return permObj ? permObj.id : null;
  };

  // Checkbox handler
  const handlePermissionChange = (group, codename) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [codename]: !prev[group]?.[codename],
      },
    }));
  };

  // Role creation logic
  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Flatten selected permissions to IDs
      const selectedPermissionIds = [];
      Object.entries(selectedPermissions).forEach(([group, perms]) => {
        Object.entries(perms).forEach(([codename, checked]) => {
          if (checked) {
            const id = getPermissionIdByCodename(codename);
            if (id) selectedPermissionIds.push(id);
          }
        });
      });

      const payload = {
        name: roleName,
        type: roleType,
        permission_ids: selectedPermissionIds,
      };

      try {
        await createRole(payload).unwrap();
        alert("Role created successfully ✅");
        setRoleName("");
        setRoleType("Custom");
        setSelectedPermissions({});
        setActiveStep(0);
        setModalOpen(false);
        refetchGroups();
      } catch (err) {
        console.error(err);
        alert("Error creating role");
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Modal content for creating role
  const CreateRoleModal = (
  <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
    <Box sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      bgcolor: "background.paper",
      borderRadius: 3,
      boxShadow: 4,
      width: 500,           // Fixed width
      maxWidth: "90vw",
      maxHeight: "90vh",    // Prevents modal from overflowing viewport
      p: 3,
      overflow: "auto"
    }}>
      <Typography variant="h6" gutterBottom>
        Create Role
      </Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === 0 && (
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
      )}
      {activeStep === 1 && (
  <Box sx={{
    maxHeight: 350,
    overflowY: "auto",
    pr: 1
  }}>
    {Object.entries(groupedPermissions).map(([group, perms]) => {
      // Check if all permissions in this group are selected
      const allSelected = perms.every(
        (perm) => selectedPermissions[group]?.[perm.codename]
      );
      // Check if at least one is selected
      const someSelected = perms.some(
        (perm) => selectedPermissions[group]?.[perm.codename]
      );

      // Handler for "Select All" checkbox
      const handleSelectAll = (checked) => {
        setSelectedPermissions((prev) => ({
          ...prev,
          [group]: perms.reduce((acc, perm) => {
            acc[perm.codename] = checked;
            return acc;
          }, {}),
        }));
      };

      return (
        <Box key={group} sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ flex: 1 }}>{group}</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
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
                    onChange={() => handlePermissionChange(group, perm.codename)}
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
)}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isLoading || (activeStep === 0 && !roleName)}
        >
          {activeStep === steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </Box>
    </Box>
  </Modal>
);

  // Main page: roles table + create button + modal
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Roles</Typography>
      <Button variant="contained" onClick={() => setModalOpen(true)} sx={{ mb: 2 }}>
        Create Role
      </Button>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>Permissions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingGroups ? (
              <TableRow>
                <TableCell colSpan={2}>Loading...</TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>
                    {group.permissions && group.permissions.length > 0
                      ? group.permissions.map((perm) => perm.name).join(", ")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {CreateRoleModal}
    </Box>
  );
}