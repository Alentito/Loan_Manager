// src/components/brokers/BrokerList.js
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  Grow,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { toast } from "react-hot-toast";
import { useGetBrokersQuery, useDeleteBrokerMutation } from "../api/brokerApi";
import BrokerFormDialog from "./BrokerFormDialog";

const pageSizeDefault = 10;

const BrokerList = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderingField, setOrderingField] = useState("created_at");
  const [orderingDirection, setOrderingDirection] = useState("desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);
  const [selectedBrokers, setSelectedBrokers] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingBroker, setViewingBroker] = useState(null);
  const debounceRef = useRef(null);
  //const selectedRows = useSelector((state) => state.selectedLoans);

  const { data, error, isLoading, refetch } = useGetBrokersQuery({
    page,
    page_size: pageSizeDefault,
    search: debouncedSearch,
    ordering:
      orderingDirection === "desc" ? `-${orderingField}` : orderingField,
  });

  const [deleteBroker, { isLoading: deleting }] = useDeleteBrokerMutation();

  const brokers = data?.results || [];
  const total = data?.count || 0;
  const emptyRows = pageSizeDefault - brokers.length;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleSelectAll = (e) => {
    setSelectedBrokers(e.target.checked ? brokers.map((b) => b.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedBrokers((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split("_");
    setOrderingField(field);
    setOrderingDirection(direction);
    setPage(1);
  };

  const handleDeleteConfirm = (id) => {
    setToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteBroker(toDeleteId).unwrap();
      toast.success("Broker deleted successfully");
      setSelectedBrokers((prev) => prev.filter((id) => id !== toDeleteId));
      refetch();
    } catch {
      toast.error("Failed to delete broker");
    } finally {
      setDeleteDialogOpen(false);
      setToDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedBrokers.map((id) => deleteBroker(id).unwrap()));
      toast.success("Selected brokers deleted successfully");
      setSelectedBrokers([]);
      refetch();
    } catch {
      toast.error("Failed to delete some brokers");
    }
    setBulkDeleteDialogOpen(false);
  };

  const handleExport = (format) => {
    const urls = {
      csv: "http://localhost:8000/api/brokers/export-csv/",
      xml: "http://localhost:8000/api/brokers/export-xml/",
    };
    if (urls[format]) window.open(urls[format], "_blank");
  };
  const allSelected =
    brokers.length > 0 &&
    brokers.every((broker) => selectedBrokers.includes(broker.id));

  return (
    <Box p={isMobile ? 1 : 3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" color="primary" fontWeight="bold">
          Broker Management
        </Typography>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={`${orderingField}_${orderingDirection}`}
              label="Sort"
              onChange={handleSortChange}
            >
              <MenuItem value="created_at_desc">Latest Added</MenuItem>
              <MenuItem value="name_asc">Name (A-Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outlined" onClick={() => setSearch("")}>
            Clear
          </Button>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Export</InputLabel>
            <Select
              defaultValue=""
              label="Export"
              onChange={(e) => handleExport(e.target.value)}
            >
              <MenuItem value="" disabled>
                Export
              </MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setDialogOpen(true);
              setEditingBroker(null);
            }}
            sx={{
              backgroundColor: "rgba(0, 60, 247, 1)",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(0, 50, 200, 1)", // optional hover color
              },
            }}
          >
            Add Broker
          </Button>
          {selectedBrokers.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              Delete Selected
            </Button>
          )}
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box color="error.main" textAlign="center" mt={5}>
          Error loading brokers. Please try again.
        </Box>
      ) : (
        <TableContainer  sx={{ minWidth: 1000 }}>
          <Table
            stickyHeader
            size="small"
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
                  <Tooltip title="Select">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selectedBrokers.length > 0 && !allSelected}
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
                </TableCell>
                {[
                  "Logo",
                  "Name",
                  "Email",
                  "NMLS",
                  "Primary Phone",
                  "Created At",
                  "Updated At",
                  "Actions",
                ].map((label, idx) => (
                  <TableCell key={idx}>
                    <strong>{label}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {brokers.length > 0 ? (
                brokers.map((broker) => (
                  <Grow in key={broker.id} timeout={300}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedBrokers.includes(broker.id)}
                          onChange={() => handleSelectOne(broker.id)}
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
                      <TableCell>
                        <Tooltip title="View Logo">
                          <IconButton
                            onClick={() => {
                              setSelectedLogo(broker.logo);
                              setLogoDialogOpen(true);
                            }}
                          >
                            <Avatar
                              src={broker.logo}
                              alt={broker.name}
                              sx={{ width: 32, height: 32 }}
                            />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{broker.name}</TableCell>
                      <TableCell>{broker.email}</TableCell>
                      <TableCell>{broker.NMLS}</TableCell>
                      <TableCell>{broker.primary_phone}</TableCell>

                      <TableCell>
                        {new Date(broker.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(broker.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View">
                          <IconButton
                            onClick={() => {
                              setViewingBroker(broker);
                              setViewDialogOpen(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => {
                              setEditingBroker(broker);
                              setDialogOpen(true);
                            }}
                          >
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDeleteConfirm(broker.id)}
                          >
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No brokers found.
                  </TableCell>
                </TableRow>
              )}
              {emptyRows > 0 &&
                brokers.length > 0 &&
                Array.from(Array(emptyRows)).map((_, idx) => (
                  <TableRow key={`empty-${idx}`} style={{ height: 53 }}>
                    <TableCell colSpan={8} />
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination
          count={Math.ceil(total / pageSizeDefault)}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          disabled={isLoading}
        />
      </Box>

      {/* Dialogs */}
      <BrokerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingBroker={editingBroker}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
          setSelectedBrokers([]);
        }}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Are you sure you want to delete this broker?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Are you sure you want to delete selected brokers?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleBulkDelete} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={logoDialogOpen}
        onClose={() => setLogoDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Logo Preview</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={2}>
            <img
              src={selectedLogo}
              alt="Logo Preview"
              style={{ maxHeight: 200, borderRadius: 8 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle height={60} bgcolor="primary.main" mb={3}>
          Broker Details
        </DialogTitle>
        <DialogContent dividers>
          {viewingBroker && (
            <Box display="flex" flexDirection="column" gap={1}>
              {[
                ["Name", viewingBroker.name],
                ["Email", viewingBroker.email],
                ["NMLS", viewingBroker.NMLS],
                ["Primary Phone", viewingBroker.primary_phone],
                ["Phone", viewingBroker.phone],
                ["Address", viewingBroker.address],
                ["Company Address", viewingBroker.company_address],
                ["Designation", viewingBroker.designation],
                ["Entregar Email", viewingBroker.entregar_email],
                ["Entregar Fax", viewingBroker.entregar_fax],
                ["Entregar Phone", viewingBroker.entregar_phone],
                ["Doc Order Option", viewingBroker.doc_order_option],
                ["Submission Checklist", viewingBroker.submission_checklist],
                [
                  "Created At",
                  new Date(viewingBroker.created_at).toLocaleString(),
                ],
                [
                  "Updated At",
                  new Date(viewingBroker.updated_at).toLocaleString(),
                ],
              ].map(([label, value]) => (
                <Typography key={label}>
                  <strong>{label}:</strong> {value || "-"}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrokerList;
