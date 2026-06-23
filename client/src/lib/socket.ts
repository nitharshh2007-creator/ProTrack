import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string | null) => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL
    ?? (import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, "") : "http://localhost:5000");

  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket"],
      auth: token ? { token } : undefined,
    });
  }

  if (token) {
    socket.auth = { token };
  }

  return socket;
};

export const closeSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};
