import { useState, useEffect,memo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Radio,
} from "@mui/material";
import Skeleton from '@mui/material/Skeleton';

import {
  useGetChecklistQuestionsQuery,
  useGetLoanChecklistAnswersQuery,
  useUpdateLoanChecklistMutation,
} from "../../api/loanApi";

const SubmissionChecklist = memo(function SubmissionChecklist({ loan }) {
   console.log("SubmissionChecklist rendered")
  const { data: questions, isLoading: loadingQuestions } =
    useGetChecklistQuestionsQuery();
  const {
    data: answers,
    isLoading: loadingAnswers,
    refetch,
  } = useGetLoanChecklistAnswersQuery(loan.id);
  const [updateLoanChecklist, { isLoading: saving }] =
    useUpdateLoanChecklistMutation();
  const [localAnswers, setLocalAnswers] = useState({});

  // Always set localAnswers from DB answers when they change
  useEffect(() => {
    if (answers && questions) {
      const initial = {};
      questions.forEach((q) => {
        // Accept true/false or "yes"/"no" from DB, default to false
        const val = answers[q.id];
        initial[q.id] = val === true || val === "yes" ? true : false;
      });
      setLocalAnswers(initial);
    }
  }, [answers, questions]);

  const handleChange = (id, value) => {
    setLocalAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    await updateLoanChecklist({ id: loan.id, answers: localAnswers });
    refetch(); // Refetch answers from DB after save
  };

  if (loadingQuestions || loadingAnswers) {
  return <Skeleton variant="circular" width={40} height={40} />
 // or a spinner
}
  return (
    <Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>No</TableCell>
            <TableCell>Question</TableCell>
            <TableCell align="center">Yes</TableCell>
            <TableCell align="center">No</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {questions.map((q) => (
            <TableRow key={q.id}>
              <TableCell>{q.order}</TableCell>
              <TableCell>{q.text}</TableCell>
              <TableCell align="center">
                <Radio
                  checked={
                    localAnswers[q.id] === true || localAnswers[q.id] === "yes"
                  }
                  onChange={() => handleChange(q.id, "yes")}
                  value="yes"
                  name={`question-${q.id}`}
                  color="primary"
                />
              </TableCell>
              <TableCell align="center">
                <Radio
                  checked={
                    localAnswers[q.id] === false || localAnswers[q.id] === "no"
                  }
                  onChange={() => handleChange(q.id, "no")}
                  value="no"
                  name={`question-${q.id}`}
                  color="primary"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Checklist"}
      </Button>
    </Box>
  );
}
);
export default SubmissionChecklist;