import React, { useState, useCallback } from "react";
import {
  Box, Table, TableBody, TableCell, TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Skeleton
} from "@mui/material";
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
  const { data: contacts, isLoading } = useGetContactsQuery(loanId);
  console.log("Contacts response:", contacts);

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

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <h2>Contacts</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
              backgroundColor: "rgba(0, 60, 247, 1)",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(0, 50, 200, 1)", // optional hover color
              },
            }}
        >
          Create Contact
        </Button>
      </Box>
      {isLoading ? (
        <Skeleton variant="rectangular" height={200} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Fax</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts?.results?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.document_name}</TableCell>
                <TableCell>{c.company}</TableCell>
                <TableCell>{c.contact}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.fax}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.address}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpenEdit(c)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(c.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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