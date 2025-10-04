//import Typography from "@mui/material/Typography";
import TaskKanbanBoard from "./../../layout/TaskKanbanBoard"; // adjust path if needed
import React, { useState, useEffect } from "react";
import { Typography, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // optional for an icon
import AddTaskModal from "./AddTaskModal";
import { useGetEmployeesQuery } from "./../../api/employeeApi"; // adjust path if needed

import {
  useListLoanTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "./../../api/loanApi";

const columns = [
  { key: "To Do",        title: "To Do",        headingColor: "text-neutral-500" },
  { key: "In Progress",  title: "In Progress",  headingColor: "text-blue-500" },
//{ key: "In Review",    title: "In Review",    headingColor: "text-purple-500" },
  { key: "Done",         title: "Done",         headingColor: "text-emerald-500" },
];
export default function LoanTask({ loanId }) {
  const [openModal, setOpenModal] = useState(false);
const { data: employeeData, isLoading: employeesLoading } = useGetEmployeesQuery({ page: 1, page_size: 1000 });
const employees = employeeData?.results || [];
const getUserById = (id) => employees.find(emp => emp.id === id);
  const loan = loanId; // TODO: dynamically pass this from route, context, or selection
  const { data, isLoading } = useListLoanTasksQuery(loan);
  console.log("LoanTask data:", data); // <--- Add this
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
const taskList = Array.isArray(data) ? data : data?.results ?? [];

const [editingTask, setEditingTask] = useState(null);


console.log("Tasks data:", taskList); // <--- Add this
  // Map tasks to Kanban cards
  const cards = taskList.map((task) => ({
    id: String(task.id),
    title: task.title,
    column: task.status,
    description: task.description,
    position: task.position,
    assignee: getUserById(task.assignee) || (task.assignee
      ? { id: task.assignee, name: task.assignee_name || "Assignee" }
      : null),
    assigner: {
      id: task.assigner_id,
      name: task.assigner_name || task.assigner_username || "Assigner",
    },
  }));

  //const [cards, setCards] = useState([]);
  // Handle Kanban changes
const handleCardsChange = async (newCards) => {
    const updates = {};
    columns.forEach(col => {
      newCards
        .filter(c => c.column === col.key)
        .forEach((c, idx) => {
          updates[c.id] = { status: col.key, position: idx };
        });
    });
    await Promise.all(
      Object.entries(updates).map(([id, u]) => {
        const orig = taskList.find(t => String(t.id) === id);
        if (!orig) return null;
        if (orig.status === u.status && orig.position === u.position) return null;
        return updateTask({ id: Number(id), ...u });
      }).filter(Boolean)
    );
  };

  

  // Handle add card
  const handleAddCard = async (column, title, description,assignedTo) => {
  const pos = cards.filter(c => c.column === column).length;
  await createTask({ loan, title, description, status: column, position: pos, assignee: assignedTo?.id || assignedTo || null,  });
};

  const handleEditCard = (card) => {
    setEditingTask({
      id: card.id,
      title: card.title,
      description: card.description,
      status: card.column,
      assignee: card.assignee?.id || null,
    });
    setOpenModal(true);
  };

  const handleModalSubmit = async ({ status, title, description, assignee }) => {
    // compute next position in that column
    const position = cards.filter(c => c.column === status).length;
    if (editingTask) {
      await updateTask({
        id: Number(editingTask.id),
        status,
        title,
        description,
        assignee: assignee?.id || assignee || null,
      });
    } else {
      await createTask({
        loan,                         // IMPORTANT: send loan id
        status,
        title,
        description,
        position,
        assignee: assignee?.id || assignee || null,
      });
    }
    setEditingTask(null);
  };

  // Handle delete card
  const handleDeleteCard = async (id) => {
    await deleteTask(id);
  };

  return (
    <div className="flex h-full w-full flex-col gap-1 overflow-hidden ">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
  <Typography variant="h4" gutterBottom>
    Tasks
  </Typography>
  <Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => { setEditingTask(null); setOpenModal(true); }}
>
  Add Task
</Button>

</Box>


      <TaskKanbanBoard
        columns={columns}
        cards={cards}
        onCardsChange={handleCardsChange}
        onAddCard={(col, title, desc, assignee) =>
          handleModalSubmit({ status: col, title, description: desc, assignee })
        }
        onDeleteCard={handleDeleteCard}
        onEditCard={handleEditCard}   // if supported
        isLoading={isLoading}
        height="55vh"
      />

      {/* optional placeholder text */}
      {/* <Typography>This is the Tasks page.</Typography> */}
      <AddTaskModal
        open={openModal}
        onClose={() => { setOpenModal(false); setEditingTask(null); }}
        onSubmit={handleModalSubmit}   // FIX: now passes object
        onDelete={handleDeleteCard}
        columns={columns}
        initialValues={editingTask}
      />

    </div>
  );
}
