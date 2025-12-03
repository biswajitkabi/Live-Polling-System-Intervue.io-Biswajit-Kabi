import React, { useState } from "react";
import { MessageSquare, X, Send, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TeacherPollResult = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const question = "Which planet is known as the Red Planet?";
  const options = [
    { id: 1, text: "Mars", votes: 75 },
    { id: 2, text: "Venus", votes: 15 },
    { id: 3, text: "Jupiter", votes: 5 },
    { id: 4, text: "Saturn", votes: 5 }
  ];

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  const chatMessages = [
    { id: 1, user: "User 1", message: "Hey There, how can I help?", isOwn: false },
    { id: 2, user: "User 2", message: "Nothing bro, just chill!!", isOwn: true }
  ];

  const participants = [
    { name: "Rahul Arora", hasAnswered: true },
    { name: "Pushpender Rautela", hasAnswered: true },
    { name: "Rijul Zalpuri", hasAnswered: false },
    { name: "Nadeem N", hasAnswered: true },
    { name: "Ashwin Sharma", hasAnswered: false }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Send message:", message);
      setMessage("");
    }
  };

  const handleKickOut = (participantName) => {
    console.log("Kick out:", participantName);
    // Emit socket event to remove participant
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "Sora, sans-serif" }}>
      <div className="w-full max-w-3xl">
        {/* Question Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Question</h2>
        </div>

        {/* Question Card with Live Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-700 text-white px-6 py-4">
            <h3 className="text-lg font-medium">{question}</h3>
          </div>

          <div className="p-6 space-y-3">
            {options.map((option) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              return (
                <div key={option.id} className="relative flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-indigo-600 bg-indigo-50 overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-indigo-400 transition-all duration-500" style={{ width: `${percentage}%` }} />
                  <div className="relative z-10 flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">{option.id}</div>
                  <span className="relative z-10 flex-1 text-gray-900 font-medium">{option.text}</span>
                  <span className="relative z-10 text-gray-700 font-semibold">{option.votes} votes</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ask a New Question Button */}
        <div className="flex justify-end">
          <button onClick={() => navigate("/teacher/create")} className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:from-indigo-700 hover:to-purple-700">
            <Plus className="w-5 h-5" />
            Ask a new question
          </button>
        </div>
      </div>

      {/* Chat Button - Fixed Bottom Right */}
      <button onClick={() => setIsPopupOpen(!isPopupOpen)} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110" aria-label="Toggle chat">
        {isPopupOpen ? <X className="w-7 h-7 text-white" /> : <MessageSquare className="w-7 h-7 text-white" />}
      </button>

      {/* Chat/Participants Popup */}
      {isPopupOpen && (
        <div className="fixed bottom-28 right-8 w-[500px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button onClick={() => setActiveTab("chat")} className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${activeTab === "chat" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>
              Chat
              {activeTab === "chat" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
            </button>
            <button onClick={() => setActiveTab("participants")} className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${activeTab === "participants" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>
              Participants
              {activeTab === "participants" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
            </button>
          </div>

          {activeTab === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
                    <span className={`text-xs font-semibold mb-1 ${msg.isOwn ? "text-indigo-600" : "text-gray-700"}`}>{msg.user}</span>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.isOwn ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-800 text-white rounded-bl-sm"}`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} placeholder="Type a message..." className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={handleSendMessage} className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors">
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-500">Name</div>
                  <div className="text-sm font-medium text-gray-500">Action</div>
                </div>

                <div>
                  {participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <span className="text-gray-900 font-medium">{participant.name}</span>
                      <button onClick={() => handleKickOut(participant.name)} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">Kick out</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherPollResult;
