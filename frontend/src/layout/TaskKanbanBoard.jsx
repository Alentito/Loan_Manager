import React, { useState } from "react";
import { FiPlus, FiTrash } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";

// columns: [{ key: "backlog", title: "Backlog", headingColor: "text-neutral-500" }, ...]
// cards: [{ id, title, column }, ...]
export default function TaskKanbanBoard({ columns,
  cards,
  onCardsChange,
  onAddCard,
  onDeleteCard,
  isLoading, }) {

  const [localCards, setLocalCards] = useState(cards);

  // Keep local state in sync with parent
  React.useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  // Notify parent on change
  const handleCardsChange = (newCards) => {
    setLocalCards(newCards);
    onCardsChange && onCardsChange(newCards);
  };

  return (
    <div className="flex flex-col h-full w-full gap-3 overflow-hidden">
  {/* Kanban zone */}
  <div className="h-[55vh] overflow-y-auto ">         {/* <— single vertical scrollbar */}
    <div className="flex gap-3 overflow-x-auto">    {/* <— horizontal scroll stays */}
      {columns.map(col => (
        <Column
          key={col.key}
          title={col.title}
          column={col.key}
          headingColor={col.headingColor}
          cards={localCards}
          setCards={handleCardsChange}
          onAddCard={onAddCard}
        />
      ))}
    </div>
  </div>

  {/* Footer stays fixed */}
  <BurnBarrel onDeleteCard={onDeleteCard} />
</div>
  );
}

//column
const Column = ({ title, headingColor, cards, column, setCards, onAddCard }) => {
  const [active, setActive] = useState(false);

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDragEnd = (e) => {
    const cardId = e.dataTransfer.getData("cardId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";
    if (before !== cardId) {
      let copy = [...cards];

      let cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;
      cardToTransfer = { ...cardToTransfer, column };

      copy = copy.filter((c) => c.id !== cardId);

      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(cardToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === undefined) return;

        copy.splice(insertAtIndex, 0, cardToTransfer);
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

    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e) => {
    const indicators = getIndicators();

    clearHighlights(indicators);

    const el = getNearestIndicator(e, indicators);

    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e, indicators) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();

        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  return (
     <div className="w-[24%] min-h-[50vh] shrink-0 flex flex-col p-3 rounded-lg bg-neutral-100">
    <div className="mb-3 flex items-center justify-between">
      <h3 className={`font-medium ${headingColor}`}>{title}</h3>
      <span className="rounded text-sm text-neutral-400">
        {filteredCards.length}
      </span>
    </div>
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex-1 overflow-y-auto h-96 transition-colors ${
        active ? "bg-blue-200/50" : "bg-blue-200/0"
      }`}
    >
      {filteredCards.map((c) => (
        <Card key={c.id} {...c} handleDragStart={handleDragStart} />
      ))}
      <DropIndicator beforeId={null} column={column} />
      <AddCard column={column} onAddCard={onAddCard} />
    </div>
  </div>
  );
};

//card

const Card = ({ title,description, id, column, handleDragStart }) => {
  return (
    <>
      <DropIndicator beforeId={id} column={column} />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        onDragStart={(e) =>{+  e.dataTransfer.setData("cardId", String(id)); handleDragStart(e, { title, id, column })}}
        className="cursor-grab rounded  bg-white p-3 active:cursor-grabbing"
      >
        <p className="text-sm text-neutral-500 font-semibold">{title}</p>
        {description && (
          <p className="text-xs text-neutral-500 mt-1">{description}</p>
        )}
      </motion.div>
    </>
  );
};

const DropIndicator = ({ beforeId, column }) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-0.5 h-0.5 w-full bg-blue-400 opacity-0"
    />
  );
};

const BurnBarrel = ({ onDeleteCard }) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = (e) => {
    const cardId = e.dataTransfer.getData("cardId");    if (onDeleteCard) onDeleteCard(cardId);
    setActive(false);
    clearHighlights();
    const indicators = getIndicators();
  const { element } = getNearestIndicator(e, indicators);

  const before = element.dataset.before || "-1";
  if (before !== cardId) {
    let copy = [...cards];
    
    let cardToTransfer = copy.find((c) => String(c.id) === cardId);
    if (!cardToTransfer) return;

    // Only update column if dropped into a new column
    cardToTransfer = { ...cardToTransfer, column };

    // Remove from old position
    copy = copy.filter((c) => String(c.id) !== cardId);

    const moveToBack = before === "-1";
    if (moveToBack) {
      copy.push(cardToTransfer);
    } else {
      const insertAtIndex = copy.findIndex((el) => String(el.id) === before);
      if (insertAtIndex === undefined) return;
      copy.splice(insertAtIndex, 0, cardToTransfer);
    }

    setCards(copy);
  }
};
  

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={` grid h-10 w-full shrink-0 place-content-center rounded border text-3xl ${
        active
          ? " bg-[#FFE5E5] text-red-500"
          : "border-none bg-[#F5F5F5] text-[#757575]"
      }`}
    >
      {active ? <FaFire  className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

const AddCard = ({ column, onAddCard }) =>{
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  //const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim().length) return;
    if (onAddCard) await onAddCard(column, title.trim(),description.trim());
    setTitle("");
    setDescription("");
    setAdding(false);
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
                    <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Title"
            className="w-full mb-1 rounded border border-violet-400 bg-violet-400/20 p-2 text-sm text-neutral-500 placeholder-violet-300 focus:outline-0"
          />
           <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-2 text-sm text-neutral-500 placeholder-violet-300 focus:outline-0"
          />
          
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
            >
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