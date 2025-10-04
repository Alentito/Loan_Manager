import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Tooltip,
  GlobalStyles,
} from "@mui/material";
import { Save, Copy, Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  ListItemNode,
} from "@lexical/list";

const theme = {
  paragraph: "lexical-paragraph",
  text: {
    bold: "lexical-bold",
    italic: "lexical-italic",
  },
  list: {
    nested: {
      listitem: "lexical-nestedListItem",
    },
    ul: "lexical-ul",
    ol: "lexical-ol",
    listitem: "lexical-listItem",
  },
};

function Toolbar() {
const [editor] = useLexicalComposerContext();

  return (
    <Stack direction="row" spacing={0.5} sx={{ px: 1, py: 0.5 }}>
      <Tooltip title="Bold">
        <IconButton size="small" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
          <Bold size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Italic">
        <IconButton size="small" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
          <Italic size={16} />
        </IconButton>
      </Tooltip>
      <Divider flexItem orientation="vertical" />
      <Tooltip title="Bullet list">
        <IconButton size="small" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)}>
          <List size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Numbered list">
        <IconButton size="small" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)}>
          <ListOrdered size={16} />
        </IconButton>
      </Tooltip>
      <Divider flexItem orientation="vertical" />
      <Tooltip title="Undo">
        <IconButton size="small" onClick={() => editor.dispatchCommand(UNDO_COMMAND)}>
          <Undo size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Redo">
        <IconButton size="small" onClick={() => editor.dispatchCommand(REDO_COMMAND)}>
          <Redo size={16} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default function IncomeAssetNotes({ loanId }) {
  const [serialized, setSerialized] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [plainText, setPlainText] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveTime, setSaveTime] = useState(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(`loan-${loanId}-income-asset-notes`);
    const storedTime = localStorage.getItem(`loan-${loanId}-income-asset-notes-time`);
    setSerialized(stored);
    setLastSaved(stored);
    if (storedTime) setSaveTime(new Date(storedTime));
    hydratedRef.current = !!stored;
  }, [loanId]);

  useEffect(() => {
    if (lastSaved === null || serialized === null) {
      setHasChanges(false);
    } else {
      setHasChanges(serialized !== lastSaved);
    }
  }, [serialized, lastSaved]);

  const initialConfig = useMemo(
    () => ({
      namespace: "IncomeAssetNotes",
      theme,
      onError: (error) => console.error(error),
      editorState: serialized || undefined,
      nodes: [ListNode, ListItemNode],
    }),
    [serialized]
  );

  const handleChange = useCallback((editorState) => {
    const json = editorState.toJSON();
    const jsonString = JSON.stringify(json);
    editorState.read(() => {
      setPlainText($getRoot().getTextContent());
    });
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      setSerialized(jsonString);
      setLastSaved((prev) => prev ?? jsonString);
      return;
    }
    setSerialized(jsonString);
  }, []);

  const handleSave = useCallback(() => {
    const payload = serialized ?? "";
    localStorage.setItem(`loan-${loanId}-income-asset-notes`, payload);
    const now = new Date();
    localStorage.setItem(`loan-${loanId}-income-asset-notes-time`, now.toISOString());
    setLastSaved(payload);
    setSaveTime(now);
    setHasChanges(false);
    setSaveSuccess(true);
  }, [loanId, serialized]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(plainText);
  }, [plainText]);

  return (
    <Box sx={{ height: "calc(100vh - 250px)", display: "flex", flexDirection: "column" }}>
      <GlobalStyles
        styles={{
          ".lexical-editor": {
            minHeight: "100%",
            padding: "16px",
            outline: "none",
            fontFamily: "'Inter', 'Roboto', sans-serif",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          },
          ".lexical-placeholder": {
            position: "absolute",
            color: "rgba(148,163,184,0.7)",
            padding: "16px",
            pointerEvents: "none",
          },
          ".lexical-bold": { fontWeight: 600 },
          ".lexical-italic": { fontStyle: "italic" },
          ".lexical-ul": { margin: 0, paddingLeft: "1.4rem", listStyle: "disc" },
          ".lexical-ol": { margin: 0, paddingLeft: "1.4rem", listStyle: "decimal" },
          ".lexical-listItem": { marginBottom: "0.3rem" },
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Income &amp; Assets Notes</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Copy size={18} />}
            onClick={handleCopy}
            disabled={!plainText}
          >
            Copy
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Save size={18} />}
            onClick={handleSave}
            disabled={!hasChanges}
            sx={{
              borderRadius: "8px",
              backgroundColor: hasChanges ? "rgba(0, 60, 247, 1)" : undefined,
              "&:hover": {
                backgroundColor: hasChanges ? "rgba(0, 50, 200, 1)" : undefined,
              },
            }}
          >
            Save
          </Button>
        </Stack>
      </Box>

      <LexicalComposer initialConfig={initialConfig}>
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Toolbar />
          <Divider />
          <Box sx={{ flex: 1, position: "relative" }}>
            <RichTextPlugin
              contentEditable={<ContentEditable className="lexical-editor" />}
              placeholder={<div className="lexical-placeholder">Enter notes about income &amp; assets here…</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <OnChangePlugin onChange={handleChange} />
          </Box>
        </Paper>
      </LexicalComposer>

      <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          Last saved: {saveTime ? saveTime.toLocaleString() : "Never"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {plainText.length} characters
        </Typography>
      </Box>

      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Notes saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}