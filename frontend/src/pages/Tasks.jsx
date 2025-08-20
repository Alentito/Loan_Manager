import Typography from "@mui/material/Typography";
import TaskKanbanBoard from "../layout/TaskKanbanBoard"; // adjust path if needed
import React, { useState, useEffect } from "react";
import ListTaskView from "../layout/ListTaskView"; // adjust path if needed

import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import ViewListIcon from "@mui/icons-material/ViewList";
import AddIcon from "@mui/icons-material/Add";
import { IconButton, Button, Box } from "@mui/material";
import AddTaskModal from "../components/loandetail/AddTaskModal"; // adjust path if needed
import { useGetEmployeesQuery } from "../api/employeeApi"; // adjust path if needed

import {
  useListLoanTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useListAllTasksQuery
} from "../api/loanApi";

const columns = [
  { key: "To Do",        title: "To Do",        headingColor: "text-neutral-500" },
  { key: "In Progress",  title: "In Progress",  headingColor: "text-blue-500" },
  { key: "Done",         title: "Done",         headingColor: "text-emerald-500" },
];
export default function Tasks({ loanId }) {

  const [openModal, setOpenModal] = useState(false);

  const { data: employeeData, isLoading: employeesLoading } = useGetEmployeesQuery({ page: 1, page_size: 1000 });
const employees = employeeData?.results || [];
const getUserById = (id) => employees.find(emp => emp.id === id);
  const loan = 23; // TODO: dynamically pass this from route, context, or selection
  const { data, isLoading } = useListAllTasksQuery();
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
const taskList = Array.isArray(data) ? data : data?.results ?? [];
console.log("Tasks data:", taskList); // <--- Add this
  // Map tasks to Kanban cards

const [viewType, setViewType] = useState("kanban"); // or "list" as default
  
  const cards = taskList.map((task) => ({
    // <--- Add this
    id: String(task.id),
    title: task.title,
    column: task.status,
    description: task.description,
    position: task.position,
    assignee: getUserById(task.assignee), // <-- map ID to user object
    assigner: getUserById(task.assigner), // <-- map ID to user object
}));

  //const [cards, setCards] = useState([]);
  // Handle Kanban changes
  const handleCardsChange = async (newCards) => {
  // 1. Build a map: cardId -> {status, position}
  const updates = {};
  columns.forEach(col => {
    newCards
      .filter(c => c.column === col.key)
      .forEach((c, idx) => {
        updates[c.id] = { status: col.key, position: idx };
      });
  });

  // 2. Send PATCH only for rows whose status/pos really changed
  const promises = Object.entries(updates).map(([id, u]) => {
    const orig = taskList.find(t => String(t.id) === id);
    if (!orig) return null;                       // brand‑new card already handled
    if (orig.status === u.status && orig.position === u.position) return null;
    return updateTask({ id: Number(id), ...u });  // RTK Query mutation
  });

  await Promise.all(promises.filter(Boolean));
};

  // Handle add card
  const handleAddCard = async (column, title, description, assignedTo) => {
    const pos = cards.filter(c => c.column === column).length;
    await createTask({ title, description, status: column,position: pos,assignee: assignedTo?.id || assignedTo || null, });
  };

  // Handle delete card
  const handleDeleteCard = async (id) => {
    await deleteTask(id);
  };

  return (
    <div className="flex h-full w-full p-4 flex-col gap-3 overflow-hidden ">
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
  <IconButton
    color={viewType === "kanban" ? "primary" : "default"}
    onClick={() => setViewType("kanban")}
    sx={{ mr: 1 }}
  >
    <ViewKanbanIcon />
  </IconButton>
  <IconButton
    color={viewType === "list" ? "primary" : "default"}
    onClick={() => setViewType("list")}
    sx={{ mr: 2 }}
  >
    <ViewListIcon />
  </IconButton>
  <Button
    variant="contained"
    startIcon={<AddIcon />}
    onClick={() => setOpenModal(true)}
    sx={{ borderRadius: "8px" }}
  >
    Add New Task
  </Button>
</Box>

     {viewType === "kanban" ? (
  <TaskKanbanBoard
    columns={columns}
    cards={cards}
    onCardsChange={handleCardsChange}
    onAddCard={handleAddCard}
    onDeleteCard={handleDeleteCard}
    isLoading={isLoading}
    height="80vh"
   
  />
) : (
  <ListTaskView
    columns={columns}
    cards={cards}
    onAddCard={handleAddCard}
    onDeleteCard={handleDeleteCard}
    // ...other props
  />
)}

<AddTaskModal
  open={openModal}
  onClose={() => setOpenModal(false)}
  onSubmit={handleAddCard}
  columns={columns}
/>
      {/* optional placeholder text */}
      {/* <Typography>This is the Tasks page.</Typography> */}
    </div>
  );
}
