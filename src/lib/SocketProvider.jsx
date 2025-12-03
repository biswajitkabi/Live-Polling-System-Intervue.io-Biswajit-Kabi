// src/lib/SocketProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, url = "http://localhost:4000" }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(url, { autoConnect: true });
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [url]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
