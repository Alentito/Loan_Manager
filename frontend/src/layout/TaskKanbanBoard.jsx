import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";

// Theme-aware Task Kanban Board
// - Uses MUI `useTheme()` to switch styles automatically between light/dark
// - Keeps most of your original behaviour intact (drag/drop, context menu, add card)
// - Simplified BurnBarrel drop handler to avoid referencing out-of-scope variables

export default function TaskKanbanBoard({
  columns,
  cards,
  onCardsChange,
  onAddCard,
  onDeleteCard,
  height,
  onEditCard,
  isLoading,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [contextMenu, setContextMenu] = useState(null);
  const [localCards, setLocalCards] = useState(cards || []);

  useEffect(() => setLocalCards(cards || []), [cards]);

  const handleContextMenu = (event, card) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4, card }
        : null
    );
  };

  const handleClose = () => setContextMenu(null);
  const handleEdit = () => {
    if (onEditCard && contextMenu?.card) onEditCard(contextMenu.card);
    handleClose();
  };
  const handleDelete = () => {
    if (onDeleteCard && contextMenu?.card) onDeleteCard(contextMenu.card.id);
    handleClose();
  };

  const handleCardsChange = (newCards) => {
    setLocalCards(newCards);
    onCardsChange && onCardsChange(newCards);
  };

  return (
    <div
      className={`flex flex-col h-full w-full gap-3 overflow-hidden transition-colors ${
        isDark ? "bg-neutral-900 text-neutral-100" : "bg-neutral-50 text-neutral-900"
      }`}
    >
      {/* Kanban zone */}
      <div
        className={`overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-400 scrollbar-track-transparent`}
        style={{ height }}
      >
        <div className="flex gap-3 overflow-x-auto px-1">
          {columns.map((col) => (
            <Column
              key={col.key}
              title={col.title}
              column={col.key}
              headingColor={col.headingColor}
              cards={localCards}
              setCards={handleCardsChange}
              onAddCard={onAddCard}
              onCardContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </div>

      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

      <BurnBarrel onDeleteCard={onDeleteCard} />
    </div>
  );
}

// ---------------- Column -----------------
const Column = ({ title, headingColor, cards, column, setCards, onAddCard, onCardContextMenu }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [active, setActive] = useState(false);

  const handleDragStart = (e, card) => e.dataTransfer.setData("cardId", card.id);

 const handleDragEnd = (e) => {
  const cardId = String(e.dataTransfer.getData("cardId")); // normalize to string

  setActive(false);
  clearHighlights();

  const indicators = getIndicators();
  const { element } = getNearestIndicator(e, indicators);

  const before = element?.dataset?.before ?? "-1";

  if (before !== cardId) {
    let copy = [...cards];

    // find the card by string id
    let cardToTransfer = copy.find((c) => String(c.id) === cardId);
    if (!cardToTransfer) return;
    cardToTransfer = { ...cardToTransfer, column };

    // remove the old one
    copy = copy.filter((c) => String(c.id) !== cardId);

    if (before === "-1") {
      copy.push(cardToTransfer);
    } else {
      const insertAtIndex = copy.findIndex((el) => String(el.id) === String(before));
      if (insertAtIndex === -1) {
        copy.push(cardToTransfer);
      } else {
        copy.splice(insertAtIndex, 0, cardToTransfer);
      }
    }

    setCards(copy);
  }
};


  const handleDragOver = (e) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => (i.style.opacity = "0"));
  };

  const highlightIndicator = (e) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  // replace your getNearestIndicator with this:
const getNearestIndicator = (e, indicators) => {
  if (!indicators || indicators.length === 0) return { element: null, index: -1 };

  for (let i = 0; i < indicators.length; i++) {
    const rect = indicators[i].getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (e.clientY < midpoint) {
      return { element: indicators[i], index: i };
    }
  }

  // pointer is after all indicators
  return { element: indicators[indicators.length - 1], index: indicators.length - 1 };
};


  const getIndicators = () => Array.from(document.querySelectorAll(`[data-column="${column}"]`));

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = (cards || []).filter((c) => c.column === column);

  return (
    <div
      className={`w-[32.4%] min-h-[50vh] shrink-0 flex flex-col p-3 rounded-lg transition-colors ${
        isDark ? "bg-neutral-800" : "bg-neutral-100"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400">{filteredCards.length}</span>
      </div>

      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 overflow-y-auto transition-colors ${
          active ? "bg-blue-200/30" : "bg-transparent"
        } p-1`}
      >
        {filteredCards.map((c) => (
          <Card key={c.id} {...c} handleDragStart={handleDragStart} onContextMenu={(e) => onAddCard && onCardContextMenu && onCardContextMenu(e, c)} />
        ))}

        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} onAddCard={onAddCard} />
      </div>
    </div>
  );
};

// ---------------- Card -----------------
const Card = ({ title, description, assignee, assigner, id, column, handleDragStart, onContextMenu }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // compute chip colors based on theme palette with sensible fallbacks
  const assignerBg = isDark ? (theme.palette.secondary?.main || "#7C3AED") + "22" : "#F3E8FF";
  const assigneeBg = isDark ? (theme.palette.primary?.main || "#1E3A8A") + "22" : "#EEF2FF";

  return (
    <>
      <DropIndicator beforeId={id} column={column} />

      <div onContextMenu={onContextMenu}>
        <motion.div
          layout
          layoutId={id}
          draggable="true"
          onDragStart={(e) => {
            e.dataTransfer.setData("cardId", String(id));
            handleDragStart(e, { title, id, column });
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (onContextMenu) onContextMenu(e);
          }}
          className={`cursor-grab rounded-xl p-4 shadow-md border transition-all duration-200 active:cursor-grabbing ${
            isDark
              ? "bg-neutral-900 border-neutral-700 hover:shadow-lg hover:border-neutral-500 text-neutral-100"
              : "bg-white border-neutral-200 hover:shadow-lg hover:border-neutral-300 text-neutral-900"
          }`}
        >
          {/* Title */}
          <p className={`text-base font-semibold leading-snug ${isDark ? "text-neutral-50" : "text-neutral-900"}`}>{title}</p>

          {/* Description */}
          {description && (
            <p className={`text-sm mt-2 leading-snug ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{description}</p>
          )}

          {/* Assignee / Assigner Section */}
          {(assignee || assigner) && (
            <div className="mt-4 flex items-center justify-between gap-3">
              {/* Assigner */}
              {assigner && (
                <Chip
                  label={assigner.name}
                  size="small"
                  avatar={
                    assigner.avatar ? (
                      <img src={assigner.avatar} alt={assigner.name} style={{ width: 24, height: 24, borderRadius: "50%" }} />
                    ) : undefined
                  }
                  sx={{
                    fontSize: "12px",
                    maxWidth: 110,
                    backgroundColor: isDark ? (theme.palette.secondary?.main || "#7C3AED") : "#F3E8FF",
                    color: isDark ? theme.palette.getContrastText(theme.palette.secondary?.main || "#7C3AED") : "#7C3AED",
                    "& .MuiChip-avatar": { width: 24, height: 24 },
                  }}
                />
              )}

              {/* Assignee */}
              {assignee && (
                <Chip
                  label={assignee.name}
                  size="small"
                  avatar={
                    assignee.avatar ? (
                      <img src={assignee.avatar} alt={assignee.name} style={{ width: 24, height: 24, borderRadius: "50%" }} />
                    ) : undefined
                  }
                  sx={{
                    fontSize: "12px",
                    maxWidth: 110,
                    backgroundColor: isDark ? (theme.palette.primary?.main || "#1E3A8A") : "#EEF2FF",
                    color: isDark ? theme.palette.getContrastText(theme.palette.primary?.main || "#1E3A8A") : "#1E3A8A",
                    "& .MuiChip-avatar": { width: 24, height: 24 },
                  }}
                />
              )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

// ---------------- DropIndicator -----------------
const DropIndicator = ({ beforeId, column }) => (
  <div data-before={beforeId || "-1"} data-column={column} className="my-0.5 h-0.5 w-full bg-blue-400 opacity-0" />
);

// ---------------- BurnBarrel -----------------
const BurnBarrel = ({ onDeleteCard }) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setActive(true);
  };
  const handleDragLeave = () => setActive(false);

  const handleDrop = (e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("cardId");
    if (onDeleteCard) onDeleteCard(cardId);
    setActive(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`grid h-10 w-full shrink-0 place-content-center rounded border text-3xl ${
        active ? " bg-[#FFE5E5] text-red-500" : "border-none bg-[#F5F5F5] text-[#757575]"
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

// ---------------- AddCard -----------------
const AddCard = ({ column, onAddCard }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim().length) return;
    if (onAddCard) await onAddCard(column, title.trim(), description.trim());
    setTitle("");
    setDescription("");
    setAdding(false);
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit} className="space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Title"
            className={`w-full mb-1 rounded border p-2 text-sm placeholder-violet-300 focus:outline-0 ${
              isDark ? "border-neutral-700 bg-neutral-800 text-neutral-100" : "border-violet-400 bg-violet-400/20 text-neutral-900"
            }`}
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className={`w-full rounded border p-2 text-sm focus:outline-0 ${
              isDark ? "border-neutral-700 bg-neutral-800 text-neutral-100" : "border-violet-400 bg-violet-400/20 text-neutral-900"
            }`}
          />

          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50">
              Close
            </button>
            <button type="submit" className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300">
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-900"
        >
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};
