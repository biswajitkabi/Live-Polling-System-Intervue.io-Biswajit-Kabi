import { useState, useEffect } from "react";
import { Eye, Plus, MessageSquare, X, Send } from "lucide-react";
import { useSocket } from "../lib/SocketProvider";
import { useLocation, useNavigate } from "react-router-dom";

const PollResultsView = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const location = useLocation();

  // Poll passed from TeacherActivePoll
  const initialPoll = location.state?.poll || null;

  const [poll, setPoll] = useState(initialPoll);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatMessages, setChatMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState("");

  // Auto join teacher room
  useEffect(() => {
    if (!socket) return;
    socket.emit("teacher:join");
  }, [socket]);

  // Live socket listeners
  useEffect(() => {
    if (!socket) return;

    // Live vote updates
    socket.on("votes:update", (data) => {
      if (poll && poll.id === data.pollId) {
        setPoll((prev) => ({
          ...prev,
          options: data.options,
        }));
      }
    });

    // New poll has started
    socket.on("poll:started", (newPoll) => {
      navigate("/teacher/active", { state: { poll: newPoll } });
    });

    // Poll completely cleared
    socket.on("poll:cleared", () => {
      navigate("/teacher/create");
    });

    // Live chat
    socket.on("chat:message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Live participants
    socket.on("participants:update", (list) => {
      setParticipants(list);
    });

    return () => {
      socket.off("votes:update");
      socket.off("poll:started");
      socket.off("poll:cleared");
      socket.off("chat:message");
      socket.off("participants:update");
    };
  }, [socket, poll, navigate]);

  const handleViewHistory = () => {
    navigate("/teacher/history");
  };

  const handleAskNewQuestion = () => {
    socket.emit("poll:next");
    navigate("/teacher/create");
  };

  const handleChatOpen = () => setIsPopupOpen(!isPopupOpen);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    socket.emit("chat:message", {
      user: "Teacher",
      message,
      isOwn: true,
    });

    setMessage("");
  };

  if (!poll)
    return <div className="p-10 text-center text-xl">Loading poll…</div>;

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ fontFamily: "Sora" }}
    >
      <div className="w-full max-w-3xl">
        {/* View Poll History */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleViewHistory}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:scale-105 transition-all"
          >
            <Eye className="w-5 h-5" />
            View Poll History
          </button>
        </div>

        {/* Question Label */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Question</h2>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-700 text-white px-6 py-4">
            <h3 className="text-lg font-medium">{poll.question}</h3>
          </div>

          <div className="p-6 space-y-3">
            {poll.options.map((option) => {
              const total = poll.options.reduce(
                (sum, o) => sum + o.votes,
                0
              );
              const percentage =
                total > 0
                  ? Math.round((option.votes / total) * 100)
                  : 0;

              return (
                <div
                  key={option.id}
                  className="relative flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div
                    className="absolute left-0 top-0 h-full bg-indigo-400 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative z-10 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {option.id}
                  </div>

                  <span className="relative z-10 flex-1 text-gray-900 font-medium">
                    {option.text}
                  </span>

                  <span className="relative z-10 text-gray-900 font-bold text-lg">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ask new question */}
        <div className="flex justify-end">
          <button
            onClick={handleAskNewQuestion}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
            Ask a new question
          </button>
        </div>
      </div>

      {/* Chat Button */}
      <button
        onClick={handleChatOpen}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all"
      >
        {isPopupOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MessageSquare className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Chat/Participants Popup */}
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

          {/* Chat Panel */}
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
                    <span className="text-xs font-semibold text-gray-700">
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
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Participants
              </h3>

              {participants.map((p, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 border-b border-gray-100 text-gray-900 font-medium"
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PollResultsView;
