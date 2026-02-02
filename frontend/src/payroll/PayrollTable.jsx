import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TableFooter,
  TablePagination,
  Box,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function PayrollTable({ rows = [], page = 1, pageSize = 25, total = 0, onPageChange = () => {}, onPageSizeChange = () => {}, onEdit, onDelete }) {
  return (
    <Table size="small" sx={{ tableLayout: 'fixed' }}>
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
          <TableRow key={r.id} hover>
            <TableCell>
              <Box>
                <Typography variant="body2" fontWeight={500} noWrap>{r.employee?.name || r.employee_id}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{r.employee?.login_id}</Typography>
              </Box>
            </TableCell>
            <TableCell>{r.month}</TableCell>

            <TableCell align="right">
              {Number(r.gross_salary).toFixed(2)}
            </TableCell>
            <TableCell align="right">
              {Number(r.pf_employee_contribution).toFixed(2)}
            </TableCell>
            <TableCell align="right">
              {Number(r.esi_employee_contribution).toFixed(2)}
            </TableCell>
            <TableCell align="right">
              {Number(r.incentive_amount).toFixed(2)}
            </TableCell>
            <TableCell align="right">
              {Number(r.net_salary).toFixed(2)}
            </TableCell>

            <TableCell align="center">
              <IconButton size="small" onClick={() => onEdit(r)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(r)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={8} sx={{ p: 0 }}>
            <TablePagination
              component="div"
              count={total}
              page={Math.max(0, (page || 1) - 1)}
              onPageChange={(_e, p) => onPageChange(p + 1)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Rows"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
            />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
