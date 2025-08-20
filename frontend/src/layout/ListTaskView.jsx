import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";

export default function ListTaskView({ columns, cards }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(() => columns.map((col) => col.key)); // all expanded by default

  const handleToggle = (colKey) => {
    setExpanded((prev) =>
      prev.includes(colKey)
        ? prev.filter((key) => key !== colKey)
        : [...prev, colKey]
    );
  };

  return (
    <Box
      sx={{
        height: "70vh", // Set desired height
        overflowY: "auto", // Enable vertical scrolling
        pr: 1, // Optional: add right padding for scrollbar
      }}
    >
      {columns.map((col) => {
        const colCards = cards.filter((c) => c.column === col.key);
        const isExpanded = expanded.includes(col.key);

        return (
          <Accordion
            key={col.key}
            expanded={isExpanded}
            onChange={() => handleToggle(col.key)}
            sx={{
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.primary,
              mb: 0.5,
              boxShadow: "none",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                 backgroundColor: theme.palette.background.default,
                minHeight: 50,
                height: 50,
                px: 1.5,
                py: 0.5,
                position: "sticky", // <-- Make sticky
                top: 0, // <-- Stick to top of scroll container
                zIndex: 2,
                 borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography fontWeight="bold" fontSize={14}>
                {col.title} ({colCards.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {colCards.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.6, fontSize: 13 }}>
                  No tasks.
                </Typography>
              ) : (
                colCards.map((card) => (
                  <Box
                    key={card.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      px: 1.5,
                      py: 0.8,
                      minHeight: "50px",
                      fontSize: 14,
                       borderBottom: `1px solid ${theme.palette.divider}`,
                      transition: "background 0.2s",
                      "&:hover": {
                        backgroundColor: theme.palette.action.selected,
                      },
                    }}
                  >
                    <Typography>{card.title}</Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontSize: 12, color: theme.palette.text.secondary }}
                    >
                      ID: {card.id}
                    </Typography>
                  </Box>
                ))
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
