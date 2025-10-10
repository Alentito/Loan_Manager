// src/hooks/useLoanSocket.js
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loanApi } from "./../../api/loanApi";

/**
 * Lightweight WS hook that invalidates RTK Query Loan cache on events.
 * Mount this at top-level of your Loans page.
 *
 * Behavior:
 * - Uses window.location.host when running locally (dev).
 * - Uses BACKEND_WS_HOST in production (set to your Daphne host).
 * - Optionally sends token as ?token= if token exists in Redux.
 * - Has simple reconnect/backoff to avoid spamming the server.
 */
const useLoanSocket = ({ wsPath = "/ws/loans/" } = {}) => {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth?.token); // adjust if token stored elsewhere
  const socketRef = useRef(null);
  const reconnectRef = useRef({ timer: null, backoff: 1000, shouldReconnect: true });

  useEffect(() => {
    const BACKEND_WS_HOST = "backend-l3f9.onrender.com"; // ← set your backend host here
    const isLocal =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const host = isLocal ? window.location.host : BACKEND_WS_HOST;
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";

    let closedManually = false;

    const buildUrl = () =>
      token
        ? `${wsProtocol}://${host}${wsPath}?token=${encodeURIComponent(token)}`
        : `${wsProtocol}://${host}${wsPath}`;

    const connect = () => {
      const url = buildUrl();
      console.log("Opening WS:", url);
      try {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log("WebSocket connected ✅", url);
          // reset backoff on successful connect
          reconnectRef.current.backoff = 1000;
        };

        socket.onclose = (ev) => {
          console.warn("WebSocket disconnected ❌", ev);
          socketRef.current = null;
          if (!closedManually && reconnectRef.current.shouldReconnect) {
            const delay = reconnectRef.current.backoff;
            reconnectRef.current.backoff = Math.min(30000, delay * 1.5); // exponential-ish
            reconnectRef.current.timer = setTimeout(connect, delay);
          }
        };

        socket.onerror = (err) => {
          console.error("WebSocket error", err);
          // let onclose handle reconnection after error
          try {
            socket.close();
          } catch (e) {}
        };

        socket.onmessage = (event) => {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch (err) {
            console.warn("WS: failed to parse message", event.data);
            return;
          }
          // debug
          console.debug("WS message:", data);

          // defensive: allow multiple event shapes
          const type = data.type || data.event || data.event_type;
          const loanId = data.loan?.id ?? data.loan_id ?? null;

          // Always invalidate list so active getLoans queries refetch
          dispatch(loanApi.util.invalidateTags([{ type: "Loan", id: "LIST" }]));
          // Invalidate specific item if we have an id
          if (loanId) dispatch(loanApi.util.invalidateTags([{ type: "Loan", id: loanId }]));
        };
      } catch (e) {
        console.error("Failed to open WebSocket", e);
        // schedule reconnect
        const delay = reconnectRef.current.backoff;
        reconnectRef.current.backoff = Math.min(30000, delay * 1.5);
        reconnectRef.current.timer = setTimeout(connect, delay);
      }
    };

    // start connection
    reconnectRef.current.shouldReconnect = true;
    closedManually = false;
    connect();

    // cleanup
    return () => {
      closedManually = true;
      reconnectRef.current.shouldReconnect = false;
      if (reconnectRef.current.timer) {
        clearTimeout(reconnectRef.current.timer);
        reconnectRef.current.timer = null;
      }
      try {
        if (socketRef.current) socketRef.current.close();
      } catch (e) {}
      socketRef.current = null;
    };
    // re-run whenever token or wsPath changes (will reconnect)
  }, [dispatch, token, wsPath]);
};

export default useLoanSocket;
