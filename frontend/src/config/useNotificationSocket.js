// src/hooks/useNotificationSocket.js
import { useEffect } from "react";

export function useNotificationSocket(onMessage) {
  useEffect(() => {
    const BACKEND_WS_HOST = "backend-l3f9.onrender.com";
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const host = isLocal ? window.location.host : BACKEND_WS_HOST;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${host}/ws/notifications/`;

    console.log("Opening Notification WS:", url);
    const socket = new WebSocket(url);

    socket.onopen = () => console.log("✅ Notification WebSocket connected", url);
    socket.onclose = (ev) => console.warn("❌ Notification WebSocket disconnected", ev);
    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch (e) {
        console.warn("Failed to parse WS message", e);
      }
    };

    return () => {
      try { socket.close(); } catch (e) {}
    };
  }, [onMessage]);
}
