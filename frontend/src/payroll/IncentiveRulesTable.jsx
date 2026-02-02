import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, TextField } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function IncentiveRulesTable({ rows = [], onAdd, onEdit, onDelete }) {
  return (
    <>
      <Button variant="contained" onClick={onAdd} sx={{ mb: 1 }}>Add Rule</Button>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Role</TableCell>
            <TableCell>Milestone</TableCell>
            <TableCell>Min Files</TableCell>
            <TableCell>Max Files</TableCell>
            <TableCell>Amount/File</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                {Array.isArray(r.role_detail) && r.role_detail.length > 0
                  ? r.role_detail.map((x) => x.name ?? x.id).join(", ")
                  : (r.role || "-")}
              </TableCell>
              <TableCell>{r?.milestone_detail?.name ?? r.milestone ?? "-"}</TableCell>
              <TableCell>{r.min_files}</TableCell>
              <TableCell>{r.max_files ?? "∞"}</TableCell>
              <TableCell>{r.amount_per_file}</TableCell>
              <TableCell align="center">
                <IconButton size="small" onClick={() => onEdit(r)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => onDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}