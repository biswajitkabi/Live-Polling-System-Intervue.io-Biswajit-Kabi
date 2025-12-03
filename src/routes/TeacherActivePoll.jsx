// src/routes/TeacherActivePoll.jsx
import React, { useEffect, useState } from "react";
import { MessageSquare, X, Send, Plus } from "lucide-react";
import { useSocket } from "../lib/SocketProvider";
import { useNavigate, useLocation } from "react-router-dom";

const TeacherActivePoll = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [poll, setPoll] = useState(location.state?.poll || null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [participants, setParticipants] = useState([]);

  // ✅ ALL HOOKS AT THE TOP
  useEffect(() => {
    if (!socket) {
      console.log("Socket not ready yet");
      return;
    }

    console.log("Socket connected, setting up listeners");

    // Register as teacher
    socket.emit("teacher:join");

    // ✅ Listen to poll:current (sent when teacher joins)
    socket.on("poll:current", (data) => {
      console.log(" Received poll:current", data);
      if (data?.poll) {
        setPoll(data.poll);
      }
    });

    // ✅ Listen to poll:created (when poll is first created)
    socket.on("poll:created", (data) => {
      console.log(" Received poll:created", data);
      if (data?.poll) {
        setPoll(data.poll);
      }
    });

    // ✅ Listen to poll:started (when poll timer begins)
    socket.on("poll:started", (data) => {
      console.log(" Received poll:started", data);
      if (data?.poll) {
        setPoll(data.poll);
      }
    });

    // ✅ Listen to votes:update (live vote updates)
    socket.on("votes:update", (data) => {
      console.log("Received votes:update", data);
      if (data?.options) {
        setPoll((prev) => prev ? { ...prev, options: data.options } : null);
      }
    });

    // ✅ Listen to poll:ended (poll finished)
    socket.on("poll:ended", (data) => {
      console.log(" Received poll:ended", data);
      navigate("/teacher/result-view", { state: { poll: poll } });
    });

    // ✅ Listen to poll:cleared (teacher moved to next question)
    socket.on("poll:cleared", () => {
      console.log(" Poll cleared");
      setPoll(null);
    });

    // Chat messages
    socket.on("chat:message", (msg) => {
      console.log(" Received chat:message", msg);
      setChatMessages((prev) => [...prev, msg]);
    });

    // Participants updates
    socket.on("participants:update", (list) => {
      console.log(" Received participants:update", list);
      setParticipants(list);
    });

    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off("poll:current");
      socket.off("poll:created");
      socket.off("poll:started");
      socket.off("votes:update");
      socket.off("poll:ended");
      socket.off("poll:cleared");
      socket.off("chat:message");
      socket.off("participants:update");
    };
  }, [socket, navigate, poll]);

  const handleSendMessage = () => {
    if (!socket || !message.trim()) return;
    const payload = { name: "Teacher", text: message.trim() };
    socket.emit("chat:message", payload);
    setMessage("");
  };

  const handleKickOut = (socketId) => {
    if (!socket || !socketId) return;
    socket.emit("participant:kick", { socketId });
  };

  const handleEndPoll = () => {
    if (!socket || !poll) return;
    socket.emit("poll:next"); // This ends current poll and moves to next
  };

  const handleAskNew = () => {
    navigate("/teacher/create");
  };

  const totalVotes = poll?.options?.reduce((s, o) => s + (o.votes || 0), 0) || 0;

  // ✅ Conditional rendering AFTER all hooks
  if (!socket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-2">Connecting to server...</div>
          <div className="text-sm text-gray-400">Initializing socket connection</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ fontFamily: "Sora, sans-serif" }}
    >
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Question</h2>
          <div className="flex items-center gap-2">
            {poll && (
              <button
                onClick={handleEndPoll}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                End & Next
              </button>
            )}
          </div>
        </div>

        {!poll ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="mb-4 text-6xl">📊</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Question</h3>
            <p className="text-gray-500 mb-8">Create a new question to start live polling</p>
            <button
              onClick={handleAskNew}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Plus className="inline w-5 h-5 mr-2" />
              Create New Question
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold flex-1">{poll.question}</h3>
                  <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {poll.options?.map((option) => {
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  return (
                    <div
                      key={option.id}
                      className="relative flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-indigo-200 bg-white overflow-hidden hover:border-indigo-400 transition-colors"
                    >
                      {/* Animated vote bar */}
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-100 to-indigo-200 transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                      
                      {/* Option badge */}
                      <div className="relative z-10 flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {option.id}
                      </div>

                      {/* Option text */}
                      <span className="relative z-10 flex-1 text-gray-900 font-medium text-lg">
                        {option.text}
                      </span>

                      {/* Vote count and percentage */}
                      <div className="relative z-10 flex items-center gap-3">
                        <span className="text-gray-600 font-semibold">
                          {option.votes || 0}
                        </span>
                        <span className="text-indigo-600 font-bold text-lg min-w-[3rem] text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {participants.filter(p => p.role !== "teacher").length} participant{participants.filter(p => p.role !== "teacher").length !== 1 ? 's' : ''} connected
              </div>
              <button
                onClick={handleAskNew}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Ask New Question
              </button>
            </div>
          </>
        )}
      </div>

      {/* Chat floating button */}
      <button
        onClick={() => setIsPopupOpen(!isPopupOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transition-all hover:scale-110"
        aria-label="Toggle chat"
      >
        {isPopupOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MessageSquare className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Chat/Participants popup */}
      {isPopupOpen && (
        <div className="fixed bottom-28 right-8 w-[500px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                activeTab === "chat" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
               Chat
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                activeTab === "participants" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
               Participants ({participants.filter(p => p.role !== "teacher").length})
              {activeTab === "participants" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t" />
              )}
            </button>
          </div>

          {/* Chat tab content */}
          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isTeacher = msg.user === "Teacher" || msg.socketId === socket.id;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isTeacher ? "items-end" : "items-start"}`}
                      >
                        <span className={`text-xs font-semibold mb-1 ${isTeacher ? "text-indigo-600" : "text-gray-600"}`}>
                          {msg.user}
                        </span>
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                            isTeacher
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Participants tab content
            <div className="flex-1 overflow-y-auto">
              <div>
                {/* Table Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 font-semibold text-gray-600 text-sm">
                  <span>Name</span>
                  <span>Action</span>
                </div>

                {participants.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <p>No participants yet</p>
                  </div>
                ) : (
                  <div>
                    {participants.filter(p => p.role !== "teacher").map((p, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-bold text-gray-900 text-base">{p.name}</div>
                        {p.role !== "teacher" && (
                          <button
                            onClick={() => handleKickOut(p.socketId)}
                            className="text-blue-600 font-medium hover:underline text-base"
                          >
                            Kick out
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherActivePoll;