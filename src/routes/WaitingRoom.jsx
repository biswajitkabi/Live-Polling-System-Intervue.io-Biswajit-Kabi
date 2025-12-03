import { useEffect } from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../lib/SocketProvider";

const WaitingRoom = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // ✅ Request current poll when component mounts (in case poll already exists)
    console.log("📡 Requesting current poll from waiting room...");
    socket.emit("poll:getCurrent");

    // ✅ Listen for current poll response
    socket.on("poll:current", ({ poll }) => {
      if (poll) {
        console.log("✅ Active poll found, navigating to active question");
        navigate("/student/active", { state: { poll } });
      }
    });

    // ✅ Listen for new poll started
    socket.on("poll:started", ({ poll }) => {
      console.log("✅ New poll started, navigating to active question");
      navigate("/student/active", { state: { poll } });
    });

    // If teacher kicks the student
    socket.on("participant:kicked", () => {
      navigate("/student/kicked-out");
    });

    return () => {
      socket.off("poll:current");
      socket.off("poll:started");
      socket.off("participant:kicked");
    };
  }, [socket, navigate]);

  const handleChatOpen = () => {
    console.log("Open chat");
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ fontFamily: "Sora, sans-serif" }}
    >
      <div className="w-full max-w-2xl text-center">
        {/* Logo Badge */}
        <div className="flex justify-center mb-12">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">Intervue Poll</span>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24">
            <svg className="animate-spin" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="220"
                strokeDashoffset="60"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Waiting Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Wait for the teacher to ask questions..
        </h1>
      </div>

      {/* Chat Button - Fixed Bottom Right */}
      <button
        onClick={handleChatOpen}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
        aria-label="Open chat"
      >
        <MessageSquare className="w-7 h-7 text-white" />
      </button>
    </div>
  );
};

export default WaitingRoom;