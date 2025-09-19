// src/hooks/useLoanSocket.js
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loanApi } from "./../../api/loanApi";

/**
 * Lightweight WS hook that invalidates RTK Query Loan cache on events.
 * Mount this at top-level of your Loans page.
 */
const useLoanSocket = ({ wsPath = "/ws/loans/" } = {}) => {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth?.token); // adjust if token stored elsewhere
  const socketRef = useRef(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host; // same origin; change if backend on other host
    const url = token
      ? `${wsProtocol}://${host}${wsPath}?token=${encodeURIComponent(token)}`
      : `${wsProtocol}://${host}${wsPath}`;

    console.log("Opening WS:", url);
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => console.log("WebSocket connected ✅");
    socket.onclose = (ev) => console.log("WebSocket disconnected ❌", ev);
    socket.onerror = (err) => console.error("WebSocket error", err);

    socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.warn("WS: failed to parse message", event.data);
        return;
      }
      console.debug("WS message:", data);

      // defensive: allow multiple event shapes
      const type = data.type || data.event || data.event_type;
      const loanId = data.loan?.id ?? data.loan_id ?? null;

      // Always invalidate list so active getLoans queries refetch
      dispatch(loanApi.util.invalidateTags([{ type: "Loan", id: "LIST" }]));
      // Invalidate specific item if we have an id
      if (loanId) dispatch(loanApi.util.invalidateTags([{ type: "Loan", id: loanId }]));
    };

    return () => {
      try {
        socket.close();
      } catch (e) {}
    };
  }, [dispatch, token, wsPath]);
};

export default useLoanSocket;
