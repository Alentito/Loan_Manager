import React, { useEffect, useState } from "react";
import StatusSelect from "../../layout/StatusChip";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Button,
  Paper,
  CircularProgress,
  Divider,
  Skeleton,
} from "@mui/material";
import {
  useGetLoanDocStatusQuery,
  useUpdateLoanDocStatusMutation,
  useCreateLoanDocStatusMutation,
} from "../../api/loanApi";

const DOC_FIELDS = [
  "title",
  "appraisal",
  "voe",
  "hoi",
  "survey",
  "credit_card",
  "fha_case",
  "flood_cert",
  "condo_docs",
  "pay_off",
  "final_inspection",
  "subordination",
];

const STATUS_OPTIONS = ["n/a", "pending", "ordered", "received"];

export default function DocStatus({ loanId }) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, error } = useGetLoanDocStatusQuery(loanId);
  const [updateDocStatus] = useUpdateLoanDocStatusMutation();
  const [createDocStatus] = useCreateLoanDocStatusMutation();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else if (isError && error?.status === 404) {
      // No entry exists yet: show empty/default fields
      const defaultState = DOC_FIELDS.reduce((acc, field) => {
        acc[field] = "n/a";
        return acc;
      }, {});
      setFormData(defaultState);
    }
  }, [data, isError, error]);

  if (isLoading) return <Skeleton height={300} />;
  if (isError && error?.status !== 404)
    return <Typography color="error">Error loading doc status.</Typography>;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (data && data.id) {
        await updateDocStatus({ loanId, data: { ...formData } });
        alert("Status updated!");
      } else {
        await createDocStatus({ loan: loanId, ...formData });
        alert("Status created!");
      }
      setDirty(false);
      //refetch();
    } catch (err) {
      console.error("DocStatus save error:", err);
      alert("Error saving status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 0, height: "100vh", borderRadius: 0 }}>
      <Typography variant="h6" sx={{fontSize:14}} mb={2}>
        Document Status Panel
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {DOC_FIELDS.map((field) => (
        <Box
          key={field}
          display="flex"
          sx={{ width: "250px" }}
          justifyContent="space-between"
          alignItems="center"
          mb={1.2}
        >
          <Typography sx={{ textTransform: "capitalize", width:"100px", fontSize: "12pt" }}>
            {field.replace(/_/g, " ")}
          </Typography>
          <StatusSelect
            value={formData[field] || "n/a"}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Box display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{
              backgroundColor: "rgba(0, 60, 247, 1)",
               width: "100%",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(0, 50, 200, 1)", // optional hover color
              },
            }}>
          {saving
            ? "Saving..."
            : !dirty
            ? "Saved"
            : data && data.id
            ? "Update Status"
            : "Create Status"}{" "}
        </Button>
      </Box>
    </Paper>
  );
}
