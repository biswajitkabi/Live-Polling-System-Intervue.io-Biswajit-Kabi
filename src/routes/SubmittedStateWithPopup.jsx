import { useState, useEffect } from "react";
import {
  Clock,
  MessageSquare,
  X,
  Send
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../lib/SocketProvider";

const SubmittedStateWithPopup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  // Poll passed from ActiveQuestion.jsx
  const initialPoll = location.state?.poll;

  const [poll, setPoll] = useState(initialPoll || null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [pollEnded, setPollEnded] = useState(false);

  // Listen to socket real-time events
  useEffect(() => {
    if (!socket) return;

    // Live result updates
    socket.on("votes:update", (data) => {
      if (poll && data.pollId === poll.id) {
        setPoll((prev) => ({
          ...prev,
          options: data.options
        }));
      }
    });

    // Next question has started
    socket.on("poll:started", ({ poll: newPoll }) => {
      navigate("/student/active-question", { state: { poll: newPoll } });
    });

    // Live participants list
    socket.on("participants:update", (list) => {
      setParticipants(list);
    });

    // Live chat messages
    socket.on("chat:message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Kicked out
    socket.on("participant:kicked", () => {
      navigate("/student/kicked-out");
    });

    return () => {
      socket.off("votes:update");
      socket.off("poll:started");
      socket.off("participants:update");
      socket.off("chat:message");
      socket.off("participant:kicked");
    };
  }, [socket, poll, navigate]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    socket.emit("chat:message", {
      text: message,
      name: localStorage.getItem("userName")
    });

    setMessage("");
  };

  if (!poll)
    return (
      <div className="p-10 text-center text-xl">
        Waiting for teacher...
      </div>
    );

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ fontFamily: "Sora" }}
    >
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Question Results</h2>

          <div className="flex items-center gap-2 text-red-600">
            <Clock className="w-5 h-5" />
            <span className="text-xl font-bold">00:00</span>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-700 text-white px-6 py-4">
            <h3 className="text-lg font-medium">{poll.question}</h3>
          </div>

          <div className="p-6 space-y-3">
            {poll.options.map((option) => {
              const totalVotes = poll.options.reduce(
                (sum, o) => sum + o.votes,
                0
              );
              const percent =
                totalVotes > 0
                  ? Math.round((option.votes / totalVotes) * 100)
                  : 0;

              return (
                <div
                  key={option.id}
                  className="relative flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-indigo-600 bg-indigo-50 overflow-hidden"
                >
                  <div
                    className="absolute left-0 top-0 h-full bg-indigo-400 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />

                  <div className="relative z-10 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {option.id}
                  </div>

                  <span className="relative z-10 flex-1 text-gray-900 font-medium">
                    {option.text}
                  </span>

                  <span className="relative z-10 text-gray-800 font-semibold">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Waiting Message */}
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            Wait for the teacher to ask a new question.
          </p>
        </div>
      </div>

      {/* Chat Button */}
      <button
        onClick={() => setIsPopupOpen(!isPopupOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
      >
        {isPopupOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MessageSquare className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Popup */}
      {isPopupOpen && (
        <div className="fixed bottom-28 right-8 w-96 h-[500px] bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 px-6 py-3 font-semibold ${
                activeTab === "chat"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500"
              }`}
            >
              Chat
            </button>

            <button
              onClick={() => setActiveTab("participants")}
              className={`flex-1 px-6 py-3 font-semibold ${
                activeTab === "participants"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500"
              }`}
            >
              Participants
            </button>
          </div>

          {/* Chat */}
          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.user === localStorage.getItem("userName")
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-600">
                      {msg.user}
                    </span>

                    <div
                      className={`px-4 py-2 rounded-2xl text-white ${
                        msg.user === localStorage.getItem("userName")
                          ? "bg-indigo-600 rounded-br-sm"
                          : "bg-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

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
            // Participants
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

export default SubmittedStateWithPopup;
