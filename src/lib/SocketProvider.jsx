// src/lib/SocketProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;  // MUST come from env file

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log(" Initializing socket with URL:", BACKEND_URL);

    if (!BACKEND_URL) {
      console.error("ERROR: VITE_BACKEND_URL is missing!");
      return;
    }

    const newSocket = io(BACKEND_URL, {
      transports: ["websocket"],   // required for Render
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log(" Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error(" Socket connection error:", err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log(" Socket disconnected");
    };
  }, [BACKEND_URL]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
