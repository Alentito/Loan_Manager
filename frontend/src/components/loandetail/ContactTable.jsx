import React, { useState, useCallback } from "react";
import {
  Box, Table, TableBody, TableCell, TableHead, TableRow, Button, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Skeleton, TableContainer, Tooltip
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  useGetContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from "../../api/loanApi";

const emptyContact = {
  document_name: "",
  company: "",
  contact: "",
  phone: "",
  fax: "",
  email: "",
  address: "",
};

const ContactTable = React.memo(function ContactTable({loanId}) {
  const theme = useTheme();
  const { data: contacts, isLoading } = useGetContactsQuery(loanId);

  const [createContact] = useCreateContactMutation();
  const [updateContact] = useUpdateContactMutation();
  const [deleteContact] = useDeleteContactMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyContact);
  const [editId, setEditId] = useState(null);

  const handleOpenCreate = useCallback(() => {
    setForm(emptyContact);
    setEditing(false);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((contact) => {
    setForm(contact);
    setEditId(contact.id);
    setEditing(true);
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setForm(emptyContact);
    setEditId(null);
    setEditing(false);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateContact({ id: editId, data: form });
    } else {
      await createContact({ ...form, loan: loanId });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this contact?")) {
      await deleteContact(id);
    }
  };

  // Use percentage-based columns for better responsiveness
  const columnWidths = {
    document_name: "15%",
    company: "12%",
    contact: "12%",
    phone: "10%",
    fax: "10%",
    email: "15%",
    address: "18%",
    actions: "8%"
  };

  // Common cell style for all data cells
  const cellStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  };

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%", // Adjust to fit parent container
      width: "100%", // Ensure it takes full width
      maxWidth: "100%", // Prevent overflow
      overflow: "hidden" // Prevent this Box from overflowing
    }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, width: "100%" }}>
        <h2 style={{ margin: 0 }}>Contacts</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            backgroundColor: "rgba(0, 60, 247, 1)",
            borderRadius: "12px",
            "&:hover": {
              backgroundColor: "rgba(0, 50, 200, 1)",
            },
          }}
        >
          Create Contact
        </Button>
      </Box>

      <TableContainer
        sx={{
          width: "100%",
          height: "calc(100% - 50px)", // Adjust for header height
          overflow: "auto", // Enable both scrollbars
          "&::-webkit-scrollbar": {
            width: 8,
            height: 8, // Important for horizontal scrollbar
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
          scrollbarColor: `${
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[300]
          } ${theme.palette.background.paper}`,
          scrollbarWidth: "thin",
        }}
      >
        {isLoading ? (
          <Skeleton variant="rectangular" height="100%" sx={{ minHeight: 200, borderRadius: 2 }} />
        ) : (
          <Table
            sx={{
              width: "100%",
              tableLayout: "fixed", // Ensure fixed layout
              "& .MuiTableCell-root": { borderBottom: "none" },
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <TableHead
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "12px",
                zIndex: 99,
                position: "sticky",
                top: 0,
                "& th": {
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[900]
                      : "#F9F9F9",
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                },
              }}
            >
              <TableRow>
                <TableCell sx={{ width: columnWidths.document_name, borderTopLeftRadius: "12px" }}>Document Name</TableCell>
                <TableCell sx={{ width: columnWidths.company }}>Company</TableCell>
                <TableCell sx={{ width: columnWidths.contact }}>Contact</TableCell>
                <TableCell sx={{ width: columnWidths.phone }}>Phone</TableCell>
                <TableCell sx={{ width: columnWidths.fax }}>Fax</TableCell>
                <TableCell sx={{ width: columnWidths.email }}>Email</TableCell>
                <TableCell sx={{ width: columnWidths.address }}>Address</TableCell>
                <TableCell align="center" sx={{ width: columnWidths.actions, borderTopRightRadius: "12px" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {contacts?.results?.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={cellStyle}>{c.document_name || "-"}</TableCell>
                  <TableCell sx={cellStyle}>{c.company || "-"}</TableCell>
                  <TableCell sx={cellStyle}>{c.contact || "-"}</TableCell>
                  <TableCell sx={cellStyle}>{c.phone || "-"}</TableCell>
                  <TableCell sx={cellStyle}>{c.fax || "-"}</TableCell>
                  <TableCell sx={cellStyle}>{c.email || "-"}</TableCell>
                  <TableCell sx={cellStyle}>{c.address || "-"}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Edit Contact">
                      <IconButton onClick={() => handleOpenEdit(c)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Contact">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDelete(c.id)} 
                        size="small"
                        sx={{ ml: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {/* Show empty state if no contacts */}
              {contacts?.results?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    No contacts found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Contact" : "Create Contact"}</DialogTitle>
        <DialogContent>
          {Object.keys(emptyContact).map((field) => (
            <TextField
              key={field}
              margin="dense"
              label={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              name={field}
              value={form[field]}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default ContactTable;