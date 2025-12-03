// src/lib/SocketProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // <-- IMPORTANT

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!BACKEND_URL) {
      console.error(" VITE_BACKEND_URL is missing!");
      return;
    }

    const newSocket = io(BACKEND_URL, {
      transports: ["websocket"],   
      autoConnect: true,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [BACKEND_URL]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
