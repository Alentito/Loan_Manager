// src/hooks/useNotificationSocket.js
import { useEffect } from "react";

export function useNotificationSocket(onMessage) {
  useEffect(() => {
    // PRODUCTION: use your backend hostname (where Daphne is running)
    // dev will use window.location.host so local dev still works.
    const PROD_WS_HOST = "backend-l3f9.onrender.com"; // <- change to your backend host
    const isProd = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
    const host = isProd ? PROD_WS_HOST : window.location.host;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${host}/ws/notifications/`;

    const socket = new WebSocket(url);

    socket.onopen = () => console.log("✅ Notification WebSocket connected", url);
    socket.onclose = (ev) => console.warn("❌ Notification WebSocket disconnected", ev);
    socket.onmessage = (event) => {
      try {
        console.log("WS message received:", event.data);
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
