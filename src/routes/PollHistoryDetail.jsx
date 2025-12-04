import { useState, useEffect } from "react";
import { MessageSquare, ArrowLeft, X, Send } from "lucide-react";
import { useSocket } from "../lib/SocketProvider";
import { useNavigate } from "react-router-dom";

const PollHistoryDetail = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [pollHistory, setPollHistory] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatMessages, setChatMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState("");

  // -------------------------
  //  AUTO JOIN TEACHER ROOM
  // -------------------------
  useEffect(() => {
    if (!socket) return;
    socket.emit("teacher:join");
  }, [socket]);

  // -------------------------
  //  FETCH POLL HISTORY (from backend)
  // -------------------------
  useEffect(() => {
    if (!socket) return;

    socket.emit("poll:history:get");

    socket.on("poll:history:data", (history) => {
      setPollHistory(history);
    });

    return () => {
      socket.off("poll:history:data");
    };
  }, [socket]);

  // -------------------------
  //  LIVE SOCKET LISTENERS
  // -------------------------
  useEffect(() => {
    if (!socket) return;

    // NEW POLL STARTED
    socket.on("poll:started", (poll) => {
      navigate("/teacher/active", { state: { poll } });
    });

    // POLL SESSION CLEARED
    socket.on("poll:cleared", () => {
      navigate("/teacher/create");
    });

    // LIVE CHAT
    socket.on("chat:message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // LIVE PARTICIPANTS
    socket.on("participants:update", (list) => {
      setParticipants(list);
    });

    return () => {
      socket.off("poll:started");
      socket.off("poll:cleared");
      socket.off("chat:message");
      socket.off("participants:update");
    };
  }, [socket, navigate]);

  // -------------------------
  //  SEND CHAT MESSAGE
  // -------------------------
  const handleSendMessage = () => {
    if (!message.trim()) return;

    socket.emit("chat:message", {
      user: "Teacher",
      message,
      isOwn: true,
    });

    setMessage("");
  };

  // -------------------------
  //  KICK OUT STUDENT
  // -------------------------
  const handleKickOut = (name) => {
    socket.emit("participant:kick", { name });
  };

  return (
    <div
      className="min-h-screen bg-gray-50 p-6"
      style={{ fontFamily: "Sora" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          View Poll History
        </h1>

        {/* Poll History List */}
        <div className="space-y-8">
          {pollHistory.map((poll, pollIndex) => (
            <div key={poll.id}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Question {pollIndex + 1}
              </h2>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Question Header */}
                <div className="bg-gray-700 text-white px-6 py-4">
                  <h3 className="text-lg font-medium">{poll.question}</h3>
                </div>

                {/* Options with Results */}
                <div className="p-6 space-y-3">
                  {poll.options.map((option) => (
                    <div
                      key={option.id}
                      className="relative flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-indigo-400 transition-all"
                        style={{ width: `${option.percentage}%` }}
                      />

                      <div className="relative z-10 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {option.id}
                      </div>

                      <span className="relative z-10 flex-1 text-gray-900 font-medium">
                        {option.text}
                      </span>

                      <span className="relative z-10 text-gray-900 font-bold text-lg">
                        {option.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Button */}
      <button
        onClick={() => setIsPopupOpen(!isPopupOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition"
      >
        {isPopupOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MessageSquare className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Chat + Participants Popup */}
      {isPopupOpen && (
        <div className="fixed bottom-28 right-8 w-[500px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === "chat"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500"
              }`}
            >
              Chat
            </button>

            <button
              onClick={() => setActiveTab("participants")}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === "participants"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500"
              }`}
            >
              Participants
            </button>
          </div>

          {/* Chat Tab */}
          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.user === "Teacher" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-600">
                      {msg.user}
                    </span>

                    <div
                      className={`px-4 py-2 rounded-2xl text-white ${
                        msg.user === "Teacher"
                          ? "bg-indigo-600 rounded-br-sm"
                          : "bg-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                  />

                  <button
                    onClick={handleSendMessage}
                    className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Participants Tab
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-sm font-medium text-gray-500 mb-3">
                Name
              </div>

              {participants.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
                >
                  <span className="text-gray-900 font-medium">
                    {p.name}
                  </span>

                  <button
                    onClick={() => handleKickOut(p.name)}
                    className="text-indigo-600 font-semibold hover:text-indigo-800"
                  >
                    Kick out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PollHistoryDetail;
