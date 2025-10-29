import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function PayrollTable({ rows = [], onEdit, onDelete }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Employee</TableCell>
          <TableCell>Month</TableCell>
          <TableCell align="right">Gross</TableCell>
          <TableCell align="right">PF (Emp)</TableCell>
          <TableCell align="right">ESI (Emp)</TableCell>
          <TableCell align="right">Incentive</TableCell>
          <TableCell align="right">Net</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.employee?.name || r.employee_id}</TableCell>
            <TableCell>{r.month}</TableCell>
            <TableCell align="right">{r.gross_salary}</TableCell>
            <TableCell align="right">{r.pf_employee_contribution}</TableCell>
            <TableCell align="right">{r.esi_employee_contribution}</TableCell>
            <TableCell align="right">{r.incentive_amount}</TableCell>
            <TableCell align="right">{r.net_salary}</TableCell>
            <TableCell align="center">
              <IconButton size="small" onClick={() => onEdit(r)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => onDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}