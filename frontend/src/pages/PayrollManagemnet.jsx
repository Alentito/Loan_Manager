import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Tab,
  Tabs,
  Snackbar,
  Alert,
  TextField,
  Tooltip,
  Stack,
} from "@mui/material";
import { saveAs } from "file-saver";
import {
  useGetPayrollsQuery,
  useDeletePayrollMutation,
  useGetIncentiveRulesQuery,
  useCreateIncentiveRuleMutation,
  useUpdateIncentiveRuleMutation,
  useDeleteIncentiveRuleMutation,
  useGeneratePayrollMutation,
  useLazyDownloadPayslipQuery,
  useLazyExportPayrollExcelQuery,
} from "../api/payrollApi";
import PayrollTable from "../payroll/PayrollTable";
import IncentiveRulesTable from "../payroll/IncentiveRulesTable";
import IncentiveRuleFormDialog from "../payroll/IncentiveRuleFormDialog";
import PayrollSettingsForm from "../payroll/PayrollSettingsForm";

/* ----------------- HELPERS ----------------- */
const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const addMonths = (ym, delta) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function PayrollManagement() {
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(getCurrentMonth());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });
  const [downloadingPayslipId, setDownloadingPayslipId] = useState(null);

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  /* ----------------- API ----------------- */
  const { data = { results: [], count: 0 }, isLoading, refetch } =
    useGetPayrollsQuery({ month, page, page_size: pageSize });

  const rows = data.results;
  const total = data.count;

  const [generatePayroll, { isLoading: generating }] =
    useGeneratePayrollMutation();
  const [deletePayroll] = useDeletePayrollMutation();
  const [triggerPayslip] = useLazyDownloadPayslipQuery();
  const [exportExcel] = useLazyExportPayrollExcelQuery();

  const { data: rules = { results: [] }, isLoading: rulesLoading, refetch: refetchRules } =
    useGetIncentiveRulesQuery({ page: 1, page_size: 100 });

  const [createRule] = useCreateIncentiveRuleMutation();
  const [updateRule] = useUpdateIncentiveRuleMutation();
  const [deleteRule] = useDeleteIncentiveRuleMutation();

  /* ----------------- ACTIONS ----------------- */
  const handleGenerate = async () => {
    try {
      await generatePayroll({ month, save: true }).unwrap();
      setPage(1);
      refetch();
      setSnack({ open: true, sev: "success", msg: "Payroll generated." });
    } catch {
      setSnack({ open: true, sev: "error", msg: "Generation failed." });
    }
  };

  const handleExcelExport = async () => {
    try {
      const blob = await exportExcel({ month }).unwrap();
      saveAs(blob, `Payroll_${month}.xlsx`);
    } catch {
      setSnack({ open: true, sev: "error", msg: "Export failed." });
    }
  };

  const downloadPayslip = async (row) => {
    try {
      setDownloadingPayslipId(row.id);
      const blob = await triggerPayslip({ id: row.id }).unwrap();
      saveAs(blob, `Payslip_${row.employee.login_id}_${month}.pdf`);
    } finally {
      setDownloadingPayslipId(null);
    }
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setRuleDialogOpen(true);
  };

  const handleEditRule = (r) => {
    setEditingRule(r);
    setRuleDialogOpen(true);
  };

  const handleDeleteRule = async (r) => {
    try {
      await deleteRule(r.id).unwrap();
      setSnack({ open: true, sev: "success", msg: "Rule deleted." });
      refetchRules();
    } catch (e) {
      const msg = e?.data?.detail || e?.data?.message || "Delete failed.";
      setSnack({ open: true, sev: "error", msg });
    }
  };

  const handleSaveRule = async (payload) => {
    try {
      if (editingRule?.id) {
        await updateRule({ id: editingRule.id, data: payload }).unwrap();
        setSnack({ open: true, sev: "success", msg: "Rule updated." });
      } else {
        await createRule(payload).unwrap();
        setSnack({ open: true, sev: "success", msg: "Rule created." });
      }
      setRuleDialogOpen(false);
      setEditingRule(null);
      refetchRules();
    } catch (e) {
      const msg = e?.data?.detail || e?.data?.message || "Saving rule failed.";
      setSnack({ open: true, sev: "error", msg });
    }
  };

  /* ----------------- UI ----------------- */
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
            {/* Toolbar */}
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              <TextField
                type="month"
                size="small"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setPage(1);
                }}
              />

              <Stack direction="row" spacing={1}>
                <Button onClick={() => setMonth(m => addMonths(m, -1))}>Prev</Button>
                <Button onClick={() => setMonth(m => addMonths(m, 1))}>Next</Button>
              </Stack>

              <Tooltip title="Generate payroll">
                <span>
                  <Button
                    variant="contained"
                    disabled={generating || rows.length > 0}
                    onClick={handleGenerate}
                  >
                    Generate
                  </Button>
                </span>
              </Tooltip>

              <Button variant="outlined" onClick={handleExcelExport}>
                Excel
              </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
              Showing payroll for <strong>{month}</strong>
            </Box>

            {isLoading ? (
              "Loading…"
            ) : rows.length === 0 ? (
              <Alert severity="info">No payroll for {month}</Alert>
            ) : (
              <PayrollTable
                rows={rows}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
                onDelete={(r) => deletePayroll(r.id)}
                onDownloadPayslip={downloadPayslip}
                downloadingId={downloadingPayslipId}
              />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card variant="outlined">
          <CardContent>
            {rulesLoading ? (
              "Loading…"
            ) : (
              <IncentiveRulesTable
                rows={rules.results}
                onAdd={handleAddRule}
                onEdit={handleEditRule}
                onDelete={handleDeleteRule}
              />
            )}

            <IncentiveRuleFormDialog
              open={ruleDialogOpen}
              onClose={() => {
                setRuleDialogOpen(false);
                setEditingRule(null);
              }}
              onSave={handleSaveRule}
              initial={editingRule}
            />
          </CardContent>
        </Card>
      )}

      {tab === 2 && <PayrollSettingsForm />}

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.sev}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
