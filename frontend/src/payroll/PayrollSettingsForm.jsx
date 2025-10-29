import React, { useEffect, useState } from "react";
import { Card, CardContent, Grid, TextField, Button } from "@mui/material";
import { useGetPayrollSettingsQuery, useUpdatePayrollSettingsMutation } from "../api/payrollApi";

export default function PayrollSettingsForm() {
  const { data, isFetching } = useGetPayrollSettingsQuery();
  const [updateSettings, { isLoading }] = useUpdatePayrollSettingsMutation();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSave = async () => {
    await updateSettings(form);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          {["pf_employee_percent","pf_employer_percent","eps_percent","esi_employee_percent","esi_employer_percent"].map((k) => (
            <Grid item xs={12} md={6} key={k}>
              <TextField
                label={k}
                fullWidth
                value={form?.[k] ?? ""}
                onChange={handleChange(k)}
                type="number"
                inputProps={{ step: "0.01" }}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSave} disabled={isLoading || isFetching}>Save Settings</Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}