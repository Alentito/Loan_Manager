
import React, { useState, useEffect, useTransition } from "react";
import {
  Box,
  TableRow,
  TableCell,
  Button,
  Radio,
  Skeleton,
} from "@mui/material";
import { FixedSizeList as List } from "react-window";
import {
  useGetChecklistQuestionsQuery,
  useGetLoanChecklistAnswersQuery,
  useUpdateLoanChecklistMutation,
} from "../../api/loanApi";

export default function SubmissionChecklist({ loan }) {
  const { data: questions, isLoading: loadingQ } = useGetChecklistQuestionsQuery();
  const { data: answers, isLoading: loadingA, refetch } =
    useGetLoanChecklistAnswersQuery(loan.id);
  const [updateLoanChecklist, { isLoading: saving }] =
    useUpdateLoanChecklistMutation();

  const [localAnswers, setLocalAnswers] = useState({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (questions && answers) {
      const initial = {};
      questions.forEach((q) => {
        initial[q.id] = answers[q.id] === true || answers[q.id] === "yes";
      });
      setLocalAnswers(initial);
    }
  }, [questions, answers]);

  const handleChange = (id, val) => {
    startTransition(() => {
      setLocalAnswers(prev => ({ ...prev, [id]: val }));
    });
  };

  const handleSave = async () => {
    await updateLoanChecklist({ id: loan.id, answers: localAnswers });
    refetch();
  };

  if (loadingQ || loadingA) {
    return <Skeleton variant="circular" width={40} height={40} />;
  }

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const q = questions[index];
    const checked = localAnswers[q.id];
    return (
      <TableRow component="div" style={{ ...style, display: "flex" }}>
        <TableCell component="div" sx={{ flex: 1 }}>{q.order}</TableCell>
        <TableCell component="div" sx={{ flex: 5 }}>{q.text}</TableCell>
        <TableCell component="div" align="center" sx={{ flex: 1 }}>
          <Radio
            checked={checked === true}
            onChange={() => handleChange(q.id, true)}
          />
        </TableCell>
        <TableCell component="div" align="center" sx={{ flex: 1 }}>
          <Radio
            checked={checked === false}
            onChange={() => handleChange(q.id, false)}
          />
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Table header */}
      <TableRow component="div" sx={{ display: "flex", fontWeight: "bold" }}>
        <TableCell component="div" sx={{ flex: 1 }}>No</TableCell>
        <TableCell component="div" sx={{ flex: 5 }}>Question</TableCell>
        <TableCell component="div" align="center" sx={{ flex: 1 }}>Yes</TableCell>
        <TableCell component="div" align="center" sx={{ flex: 1 }}>No</TableCell>
      </TableRow>

      {/* Virtualized body */}
      <List
        height={350}            // height of list viewport
        itemCount={questions.length}
        itemSize={50}           // row height
        width="100%"
      >
        {Row}
      </List>

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleSave}
        disabled={saving || isPending}
      >
        {saving ? "Saving…" : isPending ? "Updating…" : "Save Checklist"}
      </Button>
    </Box>
  );
}
