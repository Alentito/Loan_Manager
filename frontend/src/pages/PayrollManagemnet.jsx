import React, { useState } from "react";
import { Box, Button, Card, CardContent, Tab, Tabs, Snackbar, Alert, TextField, Tooltip, Stack } from "@mui/material";
import { saveAs } from "file-saver";
import {
  useGetPayrollsQuery,
  useCreatePayrollMutation,
  useUpdatePayrollMutation,
  useDeletePayrollMutation,
  useGetIncentiveRulesQuery,
  useCreateIncentiveRuleMutation,
  useUpdateIncentiveRuleMutation,
  useDeleteIncentiveRuleMutation,
  useGeneratePayrollMutation,
  useLazyGetPayrollsQuery,
  useLazyExportPayrollsQuery,
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

    // Month state: monthInput is the value in the <input type="month">, appliedMonth is what we filter API with
    const [monthInput, setMonthInput] = useState(""); // editing buffer YYYY-MM
    const [appliedMonth, setAppliedMonth] = useState(""); // actually applied filter
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [generatePayroll, { isLoading: generating }] = useGeneratePayrollMutation();
  const [triggerGetPayrolls] = useLazyGetPayrollsQuery();
  const [triggerExport] = useLazyExportPayrollsQuery();

  // Payroll queries/mutations
  const { data: payrolls = { results: [], count: 0 }, refetch, isLoading } = useGetPayrollsQuery(
    appliedMonth ? { month: appliedMonth, page, page_size: pageSize } : { page, page_size: pageSize }
  );
  const rows = payrolls.results || [];
  const total = payrolls.count || rows.length;
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

  // Payroll generation handler
  const handleGeneratePayroll = async () => {
    if (!appliedMonth) return;
    try {
      await generatePayroll({ month: appliedMonth, save: true }).unwrap();
      setPage(1); // reset to first page after generation
      refetch();
      setSnack({ open: true, sev: "success", msg: "Payroll generated." });
    } catch {
      setSnack({ open: true, sev: "error", msg: "Payroll generation failed." });
    }
  };

  // Month helpers
  const addMonths = (ym, delta) => {
    if (!ym) return "";
    const [y, m] = ym.split("-").map((n) => parseInt(n, 10));
    const d = new Date(y, m - 1 + delta, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  };

  // Fetch all rows for export (bypass pagination)
  const fetchAllRows = async () => {
    const params = appliedMonth ? { month: appliedMonth, page: 1, page_size: 10000 } : { page: 1, page_size: 10000 };
    const res = await triggerGetPayrolls(params).unwrap();
    return res?.results || [];
  };

  const formatRows = (data) =>
    data.map((r) => ({
      employee: r?.employee?.name || "",
      login_id: r?.employee?.login_id || "",
      month: r?.month || "",
      gross: Number(r?.gross_salary || 0).toFixed(2),
      pf: Number(r?.pf_employee_contribution || 0).toFixed(2),
      esi: Number(r?.esi_employee_contribution || 0).toFixed(2),
      incentive: Number(r?.incentive_amount || 0).toFixed(2),
      net: Number(r?.net_salary || 0).toFixed(2),
    }));

  const downloadExport = async (format) => {
    try {
      const blob = await triggerExport({ month: appliedMonth, format }).unwrap();
      const ext = format === 'pdf' ? 'pdf' : (format === 'xml' ? 'xml' : 'xlsx');
      saveAs(blob, `payroll_${appliedMonth || 'all'}.${ext}`);
    } catch (e) {
      setSnack({ open: true, sev: 'error', msg: 'Export failed' });
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
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
              <TextField
                label="Month"
                type="month"
                value={monthInput}
                onChange={e => setMonthInput(e.target.value)}
                sx={{ mr: 2, width: 180 }}
                size="small"
                helperText={appliedMonth ? `Filtered: ${appliedMonth}` : 'No filter applied'}
              />
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={() => setMonthInput((m) => addMonths(m, -1))} disabled={!monthInput}>Prev</Button>
                <Button variant="outlined" size="small" onClick={() => setMonthInput((m) => addMonths(m, 1))} disabled={!monthInput}>Next</Button>
                <Button variant="contained" size="small" color="primary" onClick={() => { setAppliedMonth(monthInput); setPage(1); }} disabled={!monthInput}>Apply Filter</Button>
                <Button variant="text" size="small" onClick={() => { setMonthInput(""); setAppliedMonth(""); setPage(1); }}>Clear</Button>
              </Stack>
              <Tooltip title="Generate payroll records for selected month">
                <span>
                  <Button
                    disabled={!appliedMonth || generating}
                    onClick={handleGeneratePayroll}
                  >
                    {generating ? "Generating..." : "Generate"}
                  </Button>
                </span>
              </Tooltip>
              <Button sx={{ ml: 1 }} variant="outlined" disabled={false} onClick={() => downloadExport('pdf')}>PDF</Button>
              <Button sx={{ ml: 1 }} variant="outlined" disabled={false} onClick={() => downloadExport('xlsx')}>Excel</Button>
              <Button sx={{ ml: 1 }} variant="outlined" disabled={false} onClick={() => downloadExport('xml')}>XML</Button>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" onClick={handleAdd}>New Payroll</Button>
            </Box>
            {isLoading ? (
              <div>Loading…</div>
            ) : (
              rows.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>No payroll generated for {appliedMonth || 'this selection'}.</Alert>
                  {appliedMonth && (
                    <Button variant="contained" onClick={handleGeneratePayroll} disabled={generating}>Generate Now</Button>
                  )}
                </Box>
              ) : (
                <PayrollTable
                  rows={rows}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={(p) => { setPage(p); }}
                  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
            )}
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
