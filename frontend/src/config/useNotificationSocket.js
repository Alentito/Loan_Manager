import { useEffect } from "react";

export function useNotificationSocket(onMessage) {
  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/notifications/");

    socket.onopen = () => console.log("✅ Notification WebSocket connected");
    socket.onclose = () => console.warn("❌ Notification WebSocket disconnected");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);  // callback with the message
    };

    return () => socket.close();
  }, [onMessage]);
}
