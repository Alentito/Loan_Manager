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
  Chip,
  Switch,
  FormControlLabel,
  Skeleton,
} from "@mui/material";
import { Save, Copy, Bold, Italic, List, ListOrdered, Undo, Redo, RotateCcw, RefreshCw } from "lucide-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from "lexical";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListNode, ListItemNode } from "@lexical/list";
import { useGetIncomeAssetNoteQuery, useUpsertIncomeAssetNoteMutation } from "../../api/loanApi";

const theme = {
  paragraph: "lexical-paragraph",
  text: { bold: "lexical-bold", italic: "lexical-italic" },
  list: {
    nested: { listitem: "lexical-nestedListItem" },
    ul: "lexical-ul",
    ol: "lexical-ol",
    listitem: "lexical-listItem",
  },
};

// Hydrate editor once (or after you explicitly reset hydratedRef)
function LoadSerializedPlugin({ serialized, hydratedRef }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!serialized || hydratedRef.current) return;
    try {
      const state = editor.parseEditorState(serialized);
      editor.setEditorState(state);
      hydratedRef.current = true;
    } catch (e) {
      console.error("Failed to parse server editor_state", e);
    }
  }, [serialized, editor, hydratedRef]);
  return null;
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  return (
    <Stack direction="row" spacing={0.5} sx={{ px: 1, py: 0.5, flexWrap: "wrap" }}>
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
  // editor data
  const [serialized, setSerialized] = useState(null); // JSON string
  const [lastSaved, setLastSaved] = useState(null);   // JSON string baseline
  const [plainText, setPlainText] = useState("");
  const [saveTime, setSaveTime] = useState(null);
  const hydratedRef = useRef(false);

  // ui state
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [autoSave, setAutoSave] = useState(true);

  // data
  const { data, isFetching, isError, refetch } = useGetIncomeAssetNoteQuery(loanId, { skip: !loanId });
  const [upsertNote, { isLoading: saving }] = useUpsertIncomeAssetNoteMutation();

  // Load from API or fallback cache (without stealing focus)
  useEffect(() => {
    if (!loanId) return;
    if (data) {
      const fromApi = data.serialized ?? null;
      if (!hydratedRef.current) {
        setSerialized(fromApi);
        setLastSaved(fromApi);
        setPlainText(data.plain_text || "");
        setSaveTime(data.updated_at ? new Date(data.updated_at) : null);
      }
      return;
    }
    if (isError || !isFetching) {
      const stored = localStorage.getItem(`loan-${loanId}-income-asset-notes`);
      const storedTime = localStorage.getItem(`loan-${loanId}-income-asset-notes-time`);
      if (!hydratedRef.current) {
        setSerialized(stored);
        setLastSaved(stored);
        setPlainText("");
        if (storedTime) setSaveTime(new Date(storedTime));
      }
    }
  }, [loanId, data, isError, isFetching]);

  // Dirty tracking
  useEffect(() => {
    if (serialized == null || lastSaved == null) setHasChanges(false);
    else setHasChanges(serialized !== lastSaved);
  }, [serialized, lastSaved]);

  // Debounced autosave (no refetch/remount)
  useEffect(() => {
    if (!autoSave || !hasChanges || saving) return;
    const t = setTimeout(() => {
      handleSave(true);
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, plainText, autoSave, hasChanges, saving]);

  // Stable config and key (do not remount on each save)
  const initialConfig = useMemo(
    () => ({
      namespace: "IncomeAssetNotes",
      theme,
      onError: (error) => console.error(error),
      nodes: [ListNode, ListItemNode],
    }),
    []
  );
  const composerKey = useMemo(() => `loan-${loanId}`, [loanId]);

  const handleChange = useCallback((editorState) => {
    const json = editorState.toJSON();
    const jsonString = JSON.stringify(json);
    editorState.read(() => setPlainText($getRoot().getTextContent()));
    setSerialized(jsonString);
  }, []);

  const handleSave = useCallback(
    async (isAuto = false) => {
      const payload = serialized ?? "";
      const editorJson = payload ? JSON.parse(payload) : {};
      try {
        await upsertNote({ loanId, editor_state: editorJson, plain_text: plainText || "" }).unwrap();
        setLastSaved(payload);
        const now = new Date();
        setSaveTime(now);
        setHasChanges(false);
        if (!isAuto) setSaveSuccess(true);
        setSaveError("");
        localStorage.removeItem(`loan-${loanId}-income-asset-notes`);
        localStorage.removeItem(`loan-${loanId}-income-asset-notes-time`);
      } catch (e) {
        // offline/local fallback
        localStorage.setItem(`loan-${loanId}-income-asset-notes`, payload);
        const now = new Date();
        localStorage.setItem(`loan-${loanId}-income-asset-notes-time`, now.toISOString());
        setLastSaved(payload);
        setSaveTime(now);
        setHasChanges(false);
        if (!isAuto) setSaveSuccess(true);
        setSaveError("Saved locally (offline). Will sync when online.");
      }
    },
    [loanId, serialized, plainText, upsertNote]
  );

  const handleCopy = useCallback(() => {
    if (!plainText) return;
    navigator.clipboard.writeText(plainText);
  }, [plainText]);

  const handleRefreshFromServer = useCallback(() => {
    hydratedRef.current = false; // allow next hydration
    refetch();
  }, [refetch]);

  const handleRevertToServer = useCallback(() => {
    if (!lastSaved) return;
    hydratedRef.current = false;
    setSerialized(lastSaved);
  }, [lastSaved]);

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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

      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Typography variant="h6">Income &amp; Assets Notes</Typography>
          <Chip size="small" label={`Loan #${loanId}`} />
          {saving ? (
            <Chip size="small" color="warning" label="Saving…" />
          ) : hasChanges ? (
            <Chip size="small" color="info" label="Unsaved changes" />
          ) : (
            <Chip size="small" color={isOnline ? "success" : "default"} label={isOnline ? "All changes saved" : "Offline"} />
          )}
          <Typography variant="caption" color="text.secondary">
            {saveTime ? `Last saved: ${saveTime.toLocaleString()}` : isFetching ? "Loading…" : "Never saved"}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControlLabel
            control={<Switch size="small" checked={autoSave} onChange={(_, v) => setAutoSave(v)} />}
            label={<Typography variant="caption">Autosave</Typography>}
          />
          <Tooltip title="Refresh from server">
            <span>
              <IconButton onClick={handleRefreshFromServer} disabled={isFetching}>
                <RefreshCw size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Revert to last saved">
            <span>
              <IconButton onClick={handleRevertToServer} disabled={!lastSaved || saving}>
                <RotateCcw size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Button size="small" variant="outlined" startIcon={<Copy size={18} />} onClick={handleCopy} disabled={!plainText}>
            Copy
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Save size={18} />}
            onClick={() => handleSave(false)}
            disabled={!hasChanges || saving}
            sx={{ borderRadius: "8px" }}
          >
            Save
          </Button>
        </Stack>
      </Box>

      {!data && isFetching ? (
        <Paper variant="outlined" sx={{ flex: 1, borderRadius: 1, p: 2 }}>
          <Skeleton variant="rectangular" height={36} sx={{ mb: 1 }} />
          <Divider sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height="70%" />
        </Paper>
      ) : (
        <LexicalComposer initialConfig={initialConfig} key={composerKey}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 1, overflow: "hidden" }}
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
              <LoadSerializedPlugin serialized={serialized} hydratedRef={hydratedRef} />
            </Box>
          </Paper>
        </LexicalComposer>
      )}

      {isError && !isFetching && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Failed to load notes. Check your permissions or network and click Refresh.
        </Alert>
      )}

      <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">{plainText.length} characters</Typography>
        <Typography variant="caption" color="text.secondary">
          {isOnline ? "Online" : "Offline (changes stored locally)"}
        </Typography>
      </Box>

      <Snackbar open={!!saveError} autoHideDuration={4000} onClose={() => setSaveError("")}>
        <Alert severity="warning" sx={{ width: "100%" }}>{saveError}</Alert>
      </Snackbar>
      <Snackbar open={saveSuccess} autoHideDuration={2500} onClose={() => setSaveSuccess(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>Notes saved successfully</Alert>
      </Snackbar>
    </Box>
  );
}
