import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Box,
  Pagination,
  Button,
} from "@mui/material";
import Collapse from "@mui/material/Collapse";

import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import InfoIcon from "@mui/icons-material/Info";
import Checkbox from "@mui/material/Checkbox";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MilestoneChip from "../../layout/MilestoneChip";
import { red } from "@mui/material/colors";
import TableSortLabel from "@mui/material/TableSortLabel";
import {
  ArrowUpDown,
  Settings2,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import {
  setSelectedLoans,
  addSelectedLoan,
  removeSelectedLoan,
} from "./../../api/selectedLoansSlice";
import { useBulkDeleteLoansMutation } from "./../../api/loanApi";
import ColumnChooserDialog from "./ColumnChooserDialog";

const ALL_COLUMNS = [
  { id: "first_name", label: "Borrower Name" },
  { id: "created_at", label: "Initiated Date" },
  { id: "milestone", label: "Milestone" },
  { id: "managed_by", label: "Managed By" },
  { id: "amount", label: "Loan Amount" },
  { id: "details", label: "Details" },
  { id: "actions", label: "Actions" },
];

// ...existing code...
export default function LoanTable({
  loans,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions,
  totalLoans,
  pageCount,
  onEdit,
  onDelete,
  onDetails,
  sortField,
  sortDirection,
  setSortField,
  setSortDirection,
}) {
  const theme = useTheme();
  const [visibleIds, setVisibleIds] = useState(
    ALL_COLUMNS.map((col) => col.id) // default: show all
  );
  //column chooser
  const [chooserOpen, setChooserOpen] = useState(false);

  //const paginatedLoans = loans.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const dispatch = useDispatch();
  const selectedRows = useSelector((state) => state.selectedLoans);

  const [bulkDeleteLoans, { isLoading }] = useBulkDeleteLoansMutation();

  const allSelected =
    loans.length > 0 && loans.every((loan) => selectedRows.includes(loan.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      dispatch(setSelectedLoans(loans.map((loan) => loan.id)));
    } else {
      dispatch(setSelectedLoans([]));
    }
  };
  const handleSelectRow = (id) => (e) => {
    if (e.target.checked) {
      dispatch(addSelectedLoan(id));
    } else {
      dispatch(removeSelectedLoan(id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm("Are you sure you want to delete the selected loans?"))
      return;
    await bulkDeleteLoans(selectedRows);
    dispatch(setSelectedLoans([]));
    //fetchLoans();
    // Optionally, refetch loans list here
  };
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 250px)", // subtract top bar/header height
        }}
      >
        <TableContainer
          sx={{
    width: "100%",
    minHeight: { xs: 300, sm: 400 },
    maxHeight: "100%",
    flexGrow: 1,
    // Custom scrollbar styles:
    "&::-webkit-scrollbar": {
      width: 8,
      backgroundColor: theme.palette.background.paper,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? theme.palette.grey[800]
          : theme.palette.grey[300],
      borderRadius: 8,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? theme.palette.grey[700]
          : theme.palette.grey[400],
    },
    // For Firefox
    scrollbarColor: `${theme.palette.mode === "dark"
      ? theme.palette.grey[800]
      : theme.palette.grey[300]
    } ${theme.palette.background.paper}`,
    scrollbarWidth: "thin",
  }}
        >
          <Table 
            sx={{
              "& .MuiTableCell-root": {
                borderBottom: "none", // 🚫 Removes bottom border for all cells
              },
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <TableHead
              sx={{
    backgroundColor: theme.palette.background.paper,
    borderRadius: "12px",
    zIndex: 2,
    position: "sticky",
    top: 0,
    "& th": {
      color: theme.palette.text.secondary,
      fontWeight: 500,
      backgroundColor: theme.palette.mode === "dark"
        ? theme.palette.grey[900]
        : "#F9F9F9",
      position: "sticky",
      top: 0,
      zIndex: 3,
    },
  }}
            >
              <TableRow sx={{ borderRadius: "12px" }}>
                <TableCell
                  padding="checkbox"
                  sx={{ borderTopLeftRadius: "12px" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Tooltip title="Select">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={selectedRows.length > 0 && !allSelected}
                        onChange={handleSelectAll}
                        icon={
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              display: "inline-block",
                              borderRadius: 8,
                              border: `2px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
                            }}
                          />
                        }
                        checkedIcon={
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              display: "inline-block",
                              borderRadius: 8,
                                      backgroundColor: theme.palette.primary.main,

                              position: "relative",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                              }}
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        }
                      />
                    </Tooltip>
                    <Tooltip title="Delete">
                      <Collapse
                        in={selectedRows.length > 0}
                        orientation="horizontal"
                        timeout={300}
                      >
                        <span>
                          <IconButton
                            color="error"
                            aria-label="Delete selected"
                            onClick={handleBulkDelete}
                            sx={{ ml: 1 }}
                          >
                            <Trash2 size={16} color="#9CA3AF" />
                          </IconButton>
                        </span>
                      </Collapse>
                    </Tooltip>
                  </Box>
                </TableCell>

                {visibleIds.includes("first_name") && (
                  <TableCell
                    sx={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => {
                      if (sortField === "first_name") {
                        setSortDirection(
                          sortDirection === "asc" ? "desc" : "asc"
                        );
                      } else {
                        setSortField("first_name");
                        setSortDirection("asc");
                      }
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      Borrower Name
                      {sortField !== "first_name" ? (
                        <ArrowUpDown size={16} color="#9CA3AF" />
                      ) : sortDirection === "asc" ? (
                        <ArrowUp size={16} color="#2563EB" />
                      ) : (
                        <ArrowDown size={16} color="#2563EB" />
                      )}
                    </Box>
                  </TableCell>
                )}

                {visibleIds.includes("created_at") && (
                  <TableCell
                    sx={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => {
                      if (sortField === "created_at") {
                        setSortDirection(
                          sortDirection === "asc" ? "desc" : "asc"
                        );
                      } else {
                        setSortField("created_at");
                        setSortDirection("asc");
                      }
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      Initiated Date
                      {sortField !== "created_at" ? (
                        <ArrowUpDown size={16} color="#9CA3AF" />
                      ) : sortDirection === "asc" ? (
                        <ArrowUp size={16} color="#2563EB" />
                      ) : (
                        <ArrowDown size={16} color="#2563EB" />
                      )}
                    </Box>
                  </TableCell>
                )}

                {visibleIds.includes("milestone") && (
                  <TableCell
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      if (sortField === "milestone") {
                        setSortDirection(
                          sortDirection === "asc" ? "desc" : "asc"
                        );
                      } else {
                        setSortField("milestone");
                        setSortDirection("asc");
                      }
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      Milestone
                      {sortField !== "milestone" ? (
                        <ArrowUpDown size={16} color="#9CA3AF" />
                      ) : sortDirection === "asc" ? (
                        <ArrowUp size={16} color="#2563EB" />
                      ) : (
                        <ArrowDown size={16} color="#2563EB" />
                      )}
                    </Box>
                  </TableCell>
                )}

                {visibleIds.includes("managed_by") && (
                  <TableCell>Managed By</TableCell>
                )}
                {visibleIds.includes("amount") && (
                  <TableCell>Loan Amount</TableCell>
                )}
                {visibleIds.includes("details") && (
                  <TableCell>Details</TableCell>
                )}

                 {visibleIds.includes("actions") && (
      <TableCell
        sx={{
          position: "sticky",
          top: 0,
          borderTopRightRadius: "12px",
          zIndex: 4,
          backgroundColor: theme.palette.mode === "dark"
            ? theme.palette.grey[900]
            : "#F9F9F9",
        }}
      >
        Actions
        <IconButton
          onClick={() => setChooserOpen(true)}
          size="small"
          sx={{
            position: "absolute",
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
            color: "#6B7280",
          }}
        >
          <Settings2 size={18} />
        </IconButton>
        <ColumnChooserDialog
          open={chooserOpen}
          onClose={() => setChooserOpen(false)}
          visibleIds={visibleIds}
          allColumns={ALL_COLUMNS}
          onApply={(newVisible) => {
            setVisibleIds(newVisible);
            setChooserOpen(false);
          }}
      
                    />
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* {paginatedLoans.map((loan) => ( */}
              {loans.map((loan) => (
                <TableRow
                  key={loan.id}
                  selected={selectedRows.includes(loan.id)}
                  hover // subtle highlight on hover
                  sx={{ cursor: "pointer" }} // visual affordance
                  onClick={() => onDetails(loan)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.includes(loan.id)}
                      onChange={handleSelectRow(loan.id)}
                      onClick={(e) => e.stopPropagation()}
                      icon={
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            display: "inline-block",
                            borderRadius: 8,
                             border: `2px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
                          }}
                        />
                      }
                      checkedIcon={
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            display: "inline-block",
                            borderRadius: 8,
        backgroundColor: theme.palette.primary.main,
                            position: "relative",
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                                    stroke={theme.palette.primary.contrastText}

                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      }
                    />
                  </TableCell>
                  {visibleIds.includes("first_name") && (
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Avatar sx={{ mr: 1, bgcolor: "secondary.main" }}>
                        {loan.first_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </Avatar>
                      {loan.first_name}
                    </TableCell>
                  )}

                  {visibleIds.includes("created_at") && (
                    <TableCell
                      sx={{ color: "rgba(152, 152, 152, 1)", fontWeight: 500 }}
                    >
                      {new Date(loan.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                  )}

                  {visibleIds.includes("milestone") && (
                    <TableCell>
                      <MilestoneChip status={loan.milestone} />
                    </TableCell>
                  )}

                  {visibleIds.includes("managed_by") && (
                    <TableCell>{loan.managed_by || "-"}</TableCell>
                  )}

                  {visibleIds.includes("amount") && (
                    <TableCell
                      sx={{ color: "rgba(152, 152, 152, 1)", fontWeight: 500 }}
                    >
                      {Number(loan.amount).toLocaleString()}
                    </TableCell>
                  )}

                  {visibleIds.includes("details") && (
                    <TableCell>
                      <Button
                        endIcon={<OpenInNewIcon fontSize="small" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDetails(loan);
                        }}
                        sx={{
                          borderRadius: "999px",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "14px",
                           color: theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
                          paddingX: 2,
                          paddingY: 0.5,
                          minHeight: "32px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                          "&:hover": {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.light,
    },
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  )}

                  {visibleIds.includes("actions") && (
                    <TableCell>
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(loan);
                        }}
                        sx={{
                         backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "20px",
                          textTransform: "none",
                          fontWeight: 500,
                          boxShadow: "none",
                          minWidth: { xs: "auto", md: "auto" },
                          width: { xs: "auto", md: "auto" },
                          px: { xs: 1, md: 2 },
                          "&:hover": {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.light,
      boxShadow: "none",
    },
                          mr: { xs: 0, md: 0 },
                        }}
                      >
                        <Box
                          component="span"
                          sx={{ display: { xs: "none", md: "inline" } }}
                        >
                          Edit
                        </Box>
                      </Button>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(loan.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <TablePagination
            component="div"
            count={totalLoans}
            page={page - 1} // convert 1-based → 0-based
            rowsPerPage={rowsPerPage}
            onPageChange={onPageChange} // { (e, newPage) => … } already handled above
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={rowsPerPageOptions ?? [5, 10, 25]}
          />
        </Box>
      </Box>
    </>
  );
}
