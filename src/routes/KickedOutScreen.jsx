import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../lib/SocketProvider";

const KickedOutScreen = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  // keep the student disconnected from poll room
  useEffect(() => {
    if (!socket) return;

    // If teacher allows rejoin / restarts poll for all
    socket.on("poll:available", () => {
      // Student can now rejoin the system
      navigate("/student/waiting-room");
    });

    return () => {
      socket.off("poll:available");
    };
  }, [socket, navigate]);

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ fontFamily: "Sora, sans-serif" }}
    >
      <div className="w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">Intervue Poll</span>
          </div>
        </div>

        {/* Main Message */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            You've been kicked out!
          </h1>

          <p className="text-gray-600 text-lg leading-relaxed">
            The teacher removed you from the live poll system.  
            If this was a mistake, you can rejoin once the teacher restarts the session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KickedOutScreen;
