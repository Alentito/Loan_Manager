import Typography from "@mui/material/Typography";
import TaskKanbanBoard from "./../../layout/TaskKanbanBoard"; // adjust path if needed
import React, { useState, useEffect } from "react";
import {
  useListLoanTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "./../../api/loanApi";

const columns = [
  { key: "To Do",        title: "To Do",        headingColor: "text-neutral-500" },
  { key: "In Progress",  title: "In Progress",  headingColor: "text-blue-500" },
  { key: "In Review",    title: "In Review",    headingColor: "text-purple-500" },
  { key: "Done",         title: "Done",         headingColor: "text-emerald-500" },
];
export default function LoanTask({ loanId }) {
  const loan = loanId; // TODO: dynamically pass this from route, context, or selection
  const { data, isLoading } = useListLoanTasksQuery(loan);
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
const taskList = Array.isArray(data) ? data : data?.results ?? [];
console.log("Tasks data:", taskList); // <--- Add this
  // Map tasks to Kanban cards
  const cards = taskList.map((task) => ({
    // <--- Add this
    id: String(task.id),
    title: task.title,
    column: task.status,
    description: task.description,
    position: task.position,
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
  const handleAddCard = async (column, title,description) => {
    const pos = cards.filter(c => c.column === column).length;
    await createTask({ loan, title,description, status: column,position: pos });
  };

  // Handle delete card
  const handleDeleteCard = async (id) => {
    await deleteTask(id);
  };

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden ">
      <Typography variant="h4" gutterBottom>
        Tasks
      </Typography>

      <TaskKanbanBoard
      columns={columns}
      cards={cards}
      onCardsChange={handleCardsChange}
      onAddCard={handleAddCard}
      onDeleteCard={handleDeleteCard}
      isLoading={isLoading}
      />

      {/* optional placeholder text */}
      {/* <Typography>This is the Tasks page.</Typography> */}
    </div>
  );
}
