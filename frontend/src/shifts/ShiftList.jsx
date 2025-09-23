// src/shifts/ShiftList.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Pagination,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Grow,
} from "@mui/material";
import { Delete, Edit, Add as AddIcon } from "@mui/icons-material";
import { useGetShiftsQuery, useDeleteShiftMutation } from "../redux/shiftApi";
import ShiftFormDialog from "./ShiftFormDialog";

/** Utility: format time or date in Chicago timezone */
function formatChicagoTimeFlexible(value, { showDate = false } = {}) {
  if (!value) return "—";

  const timeOnly = String(value).match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?$/);
  if (timeOnly) return `${timeOnly[1].padStart(2, "0")}:${timeOnly[2]}`;

  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";

  return showDate
    ? d.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        hour12: false,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : d
        .toLocaleTimeString("en-GB", {
          timeZone: "America/Chicago",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .slice(0, 5);
}

const pageSize = 10;

const ShiftList = () => {
  const debounceRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  

  const [openForm, setOpenForm] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const { data, isLoading, error, refetch } = useGetShiftsQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    
  });

  const [deleteShift, { isLoading: deleting }] = useDeleteShiftMutation();
  const shifts = data?.results || [];
  const total = data?.count || 0;

  /** Debounce search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);


  
  /** Helpers */
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handleEdit = (shift) => {
    setSelectedShift(shift);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteShift(id).unwrap();
      showSnackbar("Shift deleted successfully");
      refetch();
    } catch {
      showSnackbar("Failed to delete shift", "error");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => deleteShift(id).unwrap()));
      showSnackbar("Selected shifts deleted");
      setSelectedIds([]);
      refetch();
    } catch {
      showSnackbar("Failed to delete selected shifts", "error");
    }
  };

  const handleCheckbox = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  return (
    <Box p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight="bold" color="primary">
          Shift Management
        </Typography>

        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          {/* Sorting */}
          

          {/* Search */}
          <TextField
            size="small"
            label="Search Shift"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outlined" onClick={() => setSearch("")}>
            Clear
          </Button>

          {/* Bulk Delete */}
          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              color="error"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          {/* Add Shift */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedShift(null);
              setOpenForm(true);
            }}
          >
            Add Shift
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>
          Error loading shifts. Please try again.
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.length === shifts.length && shifts.length > 0}
                    indeterminate={
                      selectedIds.length > 0 && selectedIds.length < shifts.length
                    }
                    onChange={(e) =>
                      e.target.checked
                        ? setSelectedIds(shifts.map((s) => s.id))
                        : setSelectedIds([])
                    }
                  />
                </TableCell>
                {[
                  "Name",
                  "Start Time",
                  "End Time",
                  "Total Hours",
                  "Created At",
                  "Updated At",
                  "Actions",
                ].map((header, idx) => (
                  <TableCell key={idx} align={header === "Actions" ? "right" : "left"}>
                    <strong>{header}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.length > 0 ? (
                shifts.map((shift) => (
                  <Grow in key={shift.id} timeout={300}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(shift.id)}
                          onChange={() => handleCheckbox(shift.id)}
                        />
                      </TableCell>
                      <TableCell>{shift.name}</TableCell>
                      <TableCell>
                        {formatChicagoTimeFlexible(shift.start_time)}
                      </TableCell>
                      <TableCell>
                        {formatChicagoTimeFlexible(shift.end_time)}
                      </TableCell>
                      <TableCell>{shift.total_hours}</TableCell>
                      <TableCell>
                        {formatChicagoTimeFlexible(shift.created_at, { showDate: true })}
                      </TableCell>
                      <TableCell>
                        {formatChicagoTimeFlexible(shift.updated_at, { showDate: true })}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(shift)}>
                            <Edit color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDelete(shift.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No shifts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination
          count={Math.ceil(total / pageSize)}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          disabled={isLoading}
        />
      </Box>

      {/* Add/Edit Dialog */}
      <ShiftFormDialog
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setSelectedShift(null);
          refetch();
        }}
        editData={selectedShift}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShiftList;
