import { useEffect } from 'react';

const useLoanSocket = (onMessage) => {
  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/loans/'); // use backend service name if Docker

    socket.onopen = () => console.log('WebSocket connected ✅');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);  // Pass to your React component
    };

    socket.onclose = () => console.log('WebSocket disconnected ❌');

    return () => {
      socket.close();
    };
  }, [onMessage]);
};

export default useLoanSocket;
