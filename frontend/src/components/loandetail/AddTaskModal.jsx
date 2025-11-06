import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Autocomplete
} from "@mui/material";
import { useGetEmployeesQuery } from "../../api/employeeApi"; // adjust path if needed

export default function AddTaskModal({
  open,
  onClose,
  onSubmit,
  onDelete, // <-- Add this prop
  columns,
  initialValues = {},
}) {
  const { data, isLoading } = useGetEmployeesQuery({ page: 1, page_size: 1000 });
  const employees = data?.results || [];

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState(columns[0]?.key || "To Do");
  const [assignedTo, setAssignedTo] = React.useState(
    initialValues && initialValues.assignee
      ? employees.find(e => e.id === initialValues.assignee) || initialValues.assignee
      : ""
  );

  React.useEffect(() => {
    setTitle(initialValues?.title || "");
    setDescription(initialValues?.description || "");
    setStatus(initialValues?.status || columns[0]?.key || "To Do");
    setAssignedTo(
      initialValues && initialValues.assignee
        ? employees.find(e => e.id === initialValues.assignee) || initialValues.assignee
        : ""
    );
  }, [initialValues, employees, columns]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit({
      status,
      title,
      description,
      assignee: assignedTo?.id || assignedTo || null,
    });
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setStatus(columns[0]?.key || "To Do");
    onClose();
  };

  const handleDelete = async () => {
    if (onDelete && initialValues?.id) {
      await onDelete(initialValues.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialValues?.id ? "Edit Task" : "Add New Task"}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Task Title"
          type="text"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          margin="dense"
          select
          label="Status"
          fullWidth
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {columns.map((col) => (
            <MenuItem key={col.key} value={col.key}>
              {col.title}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          options={employees}
          getOptionLabel={(option) =>
            option.name ||
            [option.first_name, option.last_name].filter(Boolean).join(" ") ||
            option.email ||
            ""
          }
          value={assignedTo}
          onChange={(event, newValue) => setAssignedTo(newValue)}
          loading={isLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Assign To Employee"
              margin="dense"
              fullWidth
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />
      </DialogContent>
      <DialogActions>
        {initialValues?.id && (
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {initialValues?.id ? "Save" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}