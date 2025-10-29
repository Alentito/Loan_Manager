import React, { useState } from "react";
import { Box, Button, Card, CardContent, Tab, Tabs, Snackbar, Alert } from "@mui/material";
import {
  useGetPayrollsQuery,
  useCreatePayrollMutation,
  useUpdatePayrollMutation,
  useDeletePayrollMutation,
  useGetIncentiveRulesQuery,
  useCreateIncentiveRuleMutation,
  useUpdateIncentiveRuleMutation,
  useDeleteIncentiveRuleMutation,
} from "../api/payrollApi";
import PayrollTable from "../payroll/PayrollTable";
import PayrollFormDialog from "../payroll/PayrollFormDialog";
import IncentiveRulesTable from "../payroll/IncentiveRulesTable";
import IncentiveRuleFormDialog from "../payroll/IncentiveRuleFormDialog";
import PayrollSettingsForm from "../payroll/PayrollSettingsForm";

export default function PayrollManagement() {
  const [tab, setTab] = useState(0);

  // Payroll dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Incentive Rule dialog state
  const [openRule, setOpenRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });

  // Payroll queries/mutations
  const { data: payrolls = { results: [] }, refetch } = useGetPayrollsQuery({ page: 1, page_size: 25 });
  const rows = payrolls.results || [];
  const [createPayroll] = useCreatePayrollMutation();
  const [updatePayroll] = useUpdatePayrollMutation();
  const [deletePayroll] = useDeletePayrollMutation();

  // Incentive rules queries/mutations
  const { data: rules = { results: [] }, refetch: refetchRules } = useGetIncentiveRulesQuery({ page: 1, page_size: 100 });
  const [createRule] = useCreateIncentiveRuleMutation();
  const [updateRule] = useUpdateIncentiveRuleMutation();
  const [deleteRule] = useDeleteIncentiveRuleMutation();

  // Payroll handlers
  const handleAdd = () => { setEditing(null); setOpen(true); };
  const handleEdit = (r) => { setEditing(r); setOpen(true); };
  const handleSave = async (payload) => {
    try {
      if (editing?.id) {
        await updatePayroll({ id: editing.id, data: payload }).unwrap();
      } else {
        await createPayroll(payload).unwrap();
      }
      setOpen(false);
      setEditing(null);
      refetch();
      setSnack({ open: true, sev: "success", msg: "Saved." });
    } catch (e) {
      setSnack({ open: true, sev: "error", msg: "Failed to save." });
    }
  };
  const handleDelete = async (r) => {
    if (!window.confirm("Delete this payroll?")) return;
    try {
      await deletePayroll(r.id).unwrap();
      refetch();
      setSnack({ open: true, sev: "success", msg: "Deleted." });
    } catch {
      setSnack({ open: true, sev: "error", msg: "Delete failed." });
    }
  };

  // Incentive Rule handlers
  const openAddRule = () => { setEditingRule(null); setOpenRule(true); };
  const openEditRule = (r) => { setEditingRule(r); setOpenRule(true); };
  const closeRule = () => { setOpenRule(false); setEditingRule(null); };
  const saveRule = async (payload) => {
    try {
      if (editingRule?.id) {
        await updateRule({ id: editingRule.id, data: payload }).unwrap();
      } else {
        await createRule(payload).unwrap();
      }
      closeRule();
      refetchRules();
      setSnack({ open: true, sev: "success", msg: "Rule saved." });
    } catch {
      setSnack({ open: true, sev: "error", msg: "Failed to save rule." });
    }
  };
  const removeRule = async (r) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await deleteRule(r.id).unwrap();
      refetchRules();
      setSnack({ open: true, sev: "success", msg: "Rule deleted." });
    } catch {
      setSnack({ open: true, sev: "error", msg: "Delete failed." });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Payrolls" />
        <Tab label="Incentive Rules" />
        <Tab label="Settings" />
      </Tabs>

      {tab === 0 && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Button variant="contained" onClick={handleAdd}>New Payroll</Button>
            </Box>
            <PayrollTable rows={rows} onEdit={handleEdit} onDelete={handleDelete} />
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card variant="outlined">
          <CardContent>
            <IncentiveRulesTable
              rows={rules.results || []}
              onAdd={openAddRule}
              onEdit={openEditRule}
              onDelete={removeRule}
            />
          </CardContent>
        </Card>
      )}

      {tab === 2 && <PayrollSettingsForm />}

      {/* Payroll dialog */}
      <PayrollFormDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />

      {/* Incentive Rule dialog */}
      <IncentiveRuleFormDialog
        open={openRule}
        onClose={closeRule}
        onSave={saveRule}
        initial={editingRule}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}