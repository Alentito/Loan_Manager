import { useEffect } from "react";

export function useNotificationSocket(onMessage) {
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    // Use window.location.host so it matches the frontend dev server (5173)
    const url = `${proto}://${window.location.host}/ws/notifications/`;

    const socket = new WebSocket(url);

    socket.onopen = () => console.log("✅ Notification WebSocket connected");
    socket.onclose = (ev) =>
      console.warn("❌ Notification WebSocket disconnected", ev);
    socket.onmessage = (event) => {
  console.log("WS message received:", event.data);
  onMessage(JSON.parse(event.data));
};

    return () => {
      try {
        socket.close();
      } catch (e) {}
    };
  }, [onMessage]);
}