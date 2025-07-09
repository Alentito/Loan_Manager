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
import { ArrowUpDown, Trash2, ArrowUp, ArrowDown } from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import {
  setSelectedLoans,
  addSelectedLoan,
  removeSelectedLoan,
} from "./../../api/selectedLoansSlice";
import { useBulkDeleteLoansMutation } from "./../../api/loanApi";

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
            minHeight: { xs: 300, sm: 400 }, // responsive min-height
            maxHeight: "100%",
            flexGrow: 1,
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
                backgroundColor: "#F9F9F9",
                borderRadius: "12px",
                "& th": {
                  color: "rgba(152, 152, 152, 1)",
                  fontWeight: 500,
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
                              border: "2px solid #E5E7EB",
                              backgroundColor: "#fff",
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
                              backgroundColor: "#2563EB",
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
                <TableCell>Managed By</TableCell>
                <TableCell>Loan Amount</TableCell>
                <TableCell>Details</TableCell>
                <TableCell sx={{ borderTopRightRadius: "12px" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* {paginatedLoans.map((loan) => ( */}
              {loans.map((loan) => (
                <TableRow
                 key={loan.id}
                 selected={selectedRows.includes(loan.id)}
                 hover                               // subtle highlight on hover
                 sx={{ cursor: "pointer" }}          // visual affordance
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
                            border: "2px solid #E5E7EB",
                            backgroundColor: "#fff",
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
                            backgroundColor: "#2563EB",
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
                  </TableCell>
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
                  <TableCell
                    sx={{ color: "rgba(152, 152, 152, 1)", fontWeight: 500 }}
                  >
                    {new Date(loan.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {" "}
                    <MilestoneChip status={loan.milestone} />
                  </TableCell>
                  <TableCell>{loan.managed_by || "-"}</TableCell>
                  <TableCell
                    sx={{ color: "rgba(152, 152, 152, 1)", fontWeight: 500 }}
                  >
                    {Number(loan.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      endIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={e => {
                      e.stopPropagation();                      // NEW
                      onDetails(loan);
                    }}
                      sx={{
                        borderRadius: "999px", // pill shape
                        textTransform: "none", // preserve casing
                        fontWeight: 600, // bold text
                        fontSize: "14px",
                        color: "#2563EB", // blue text
                        backgroundColor: "#fff", // subtle blueish bg
                        border: "1px solid #D1D5DB", // light gray border
                        paddingX: 2,
                        paddingY: 0.5,
                        minHeight: "32px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",

                        "&:hover": {
                          backgroundColor: "rgb(239, 239, 239)",
                          borderColor: "#A3BFFA",
                        },
                      }}
                    >
                      Details
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation(); // NEW
                        onEdit(loan);
                      }}
                      sx={{
                        backgroundColor: { xs: "transparent", md: "#fff" }, // your purple color
                        color: "#2563EB",
                        border: { xs: "none", md: "1px solid #D1D5DB" }, // light gray border on mobile, none on desktop
                        borderRadius: "20px",
                        textTransform: "none",

                        fontWeight: 500,
                        boxShadow: "none",
                        minWidth: { xs: 0, md: 64 }, // kill the default 64 px on tablet/phone
                        width: { xs: "auto", md: "auto" }, // no fixed width at any size
                        px: { xs: 1, md: 2 },
                        "&:hover": {
                          backgroundColor: "rgb(239, 239, 239)",
                          borderColor: "#A3BFFA",
                          boxShadow: "none",
                        },
                        mr: { xs: 0, md: 1 }, // margin right
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ display: { xs: "none", md: "inline" } }}
                      >
                        Edit
                      </Box>
                    </Button>
                    <IconButton onClick={(e) => {
                        e.stopPropagation(); // NEW
                        onDelete(loan.id);
                      }}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
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
