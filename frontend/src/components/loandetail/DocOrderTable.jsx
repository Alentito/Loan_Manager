import React, { useState, useCallback } from "react";

import {
  useGetDocumentOrdersQuery,
  useCreateDocumentOrderMutation,
  useUpdateDocumentOrderMutation,
  useDeleteDocumentOrderMutation,
} from "../../api/loanApi";
import {
  Box, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, TextField, Button, Skeleton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";

const FIELD_TEMPLATES = [
  "Appraisal Reimbursed", "CTC Date", "Escrow Contact Name", "Escrow Phone",
  "Lender Credit", "Loan Officer", "Property Address", "Rate Lock expiration",
  "Subordination?", "Investor", "Borrower File Number", "Citi Login and Password",
  "Escrow Email", "Impounds", "Lender Fees", "Loan Amount", "Loan Program",
  "Purchase or Refinance", "Rate", "MELP/M or BPM?", "2nd Lender?", "Doc Request Date?",
  "Property Type", "CD Signed Date"
];

export default function DocOrderTable({ loanId }) {
  const { data, isLoading } = useGetDocumentOrdersQuery(loanId);
  const [create] = useCreateDocumentOrderMutation();
  const [update] = useUpdateDocumentOrderMutation();
  const [remove] = useDeleteDocumentOrderMutation();

  const existing = data?.results?.reduce((acc, item) => ({ ...acc, [item.field_name]: item }), {}) || {};
  const [form, setForm] = useState({ ...existing });

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: { ...prev[name], field_value: value } }));
  };

  const handleSave = async (name) => {
    const item = form[name];
    if (item?.id) {
      await update({ id: item.id, field_value: item.field_value });
    } else {
      await create({ loan: loanId, field_name: name, field_value: item.field_value });
    }
  };

  const handleDelete = async (name) => {
    if (form[name]?.id) {
      await remove(form[name].id);
    }
    setForm((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  if (isLoading) return <Skeleton height={300} />;

  return (
    <Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Field</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {FIELD_TEMPLATES.map((name) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
              <TableCell>
                <TextField
                  value={form[name]?.field_value || ""}
                  onChange={(e) => handleChange(name, e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <IconButton onClick={() => handleSave(name)}><SaveIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(name)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
