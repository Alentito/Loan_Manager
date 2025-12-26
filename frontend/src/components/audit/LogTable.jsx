import React, { useState, useEffect, useRef } from "react";
import {
  Box, Paper, TextField, Select, MenuItem, InputLabel, FormControl,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Tooltip, Chip, TablePagination
} from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import { useSearchParams } from "react-router-dom";
import { flexRender } from "@tanstack/react-table";

import { useGetAllAuditLogsQuery } from "../../api/auditApi";
import { useLogTable } from "./useLogTable";
import { exportToCsv, exportToXlsx } from "./exporters";
import { styles, stickyLeftStyle } from "./styles";

export default function LogTable() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromURL = parseInt(searchParams.get("page") || "1", 10);
  const sizeFromURL = parseInt(searchParams.get("rowsPerPage") || "10", 10);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [ordering, setOrdering] = useState(searchParams.get("ordering") || "-changed_at");
  const [rowsPerPage, setRowsPerPage] = useState(sizeFromURL);
  const [page, setPage] = useState(pageFromURL);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    const newParams = {
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search && { search }),
      ...(ordering && { ordering }),
    };

    const current = Object.fromEntries(searchParams.entries());
    const isSame = Object.entries(newParams).every(([k, v]) => current[k] === v);

    if (!isSame || isFirstLoad.current) {
      isFirstLoad.current = false;
      setSearchParams(newParams);
    }
  }, [page, rowsPerPage, search, ordering]);

  const { data, isLoading } = useGetAllAuditLogsQuery({
    search,
    ordering,
    page,
    page_size: rowsPerPage,
  });

  const rows = Array.isArray(data?.results) ? data.results : [];
  const table = useLogTable(rows);

  const renderDiff = (cell) => {
    const diff = cell.getValue() || {};
    const lines = Object.entries(diff).filter(([, val]) => val?.old !== val?.new).slice(0, 5);

    return lines.length ? (
      lines.map(([k, v]) => (
        <Chip key={k} size="small" sx={{ mr: 0.5 }} label={`${k}: ${v.old ?? '-'} → ${v.new ?? '-'}`} />
      ))
    ) : '—';
  };

  const onPageChange = (_, newPage) => setPage(newPage + 1);
  const onRowsPerPageChange = e => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  return (
    <Box sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', p: 1, gap: 1 }}>
        <TextField size="small" label="Search" value={search} onChange={e => setSearch(e.target.value)} />
        <FormControl size="small">
          <InputLabel>Sort</InputLabel>
          <Select value={ordering} onChange={e => setOrdering(e.target.value)} label="Sort">
            <MenuItem value="-changed_at">Newest</MenuItem>
            <MenuItem value="changed_at">Oldest</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Export XLSX">
          <IconButton onClick={() => exportToXlsx(table)}><SaveIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Export CSV">
          <IconButton onClick={() => exportToCsv(table)} size="small">CSV</IconButton>
        </Tooltip>
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small" sx={{
              "& .MuiTableCell-root": {
                borderBottom: "none", // 🚫 Removes bottom border for all cells
              },
              borderCollapse: "separate",
              borderSpacing: 0,
            }}>
          <TableHead>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableCell
                    key={header.id}
                    sx={styles.headerCell}
                    style={header.column.getIsPinned?.() === 'left' ? stickyLeftStyle(0) : undefined}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    sx={styles.bodyCell}
                    style={cell.column.getIsPinned?.() === 'left' ? stickyLeftStyle(0) : undefined}
                  >
                    {cell.column.id === 'diff' ? renderDiff(cell) : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={data?.count ?? 0}
        page={page - 1}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
}
