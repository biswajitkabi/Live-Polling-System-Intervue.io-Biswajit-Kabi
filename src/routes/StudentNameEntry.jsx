import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../lib/SocketProvider";

const StudentNameEntry = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Handle if student gets kicked before waiting room
  useEffect(() => {
    if (!socket) return;

    socket.on("participant:kicked", () => {
      navigate("/student/kicked-out");
    });

    return () => {
      socket.off("participant:kicked");
    };
  }, [socket]);

  const handleContinue = () => {
    if (!name.trim()) return;

    // Save name & role locally
    localStorage.setItem("userName", name.trim());
    localStorage.setItem("userRole", "student");

    // Emit JOIN event to backend
    socket.emit("participant:join", {
      name: name.trim(),
      role: "student",
    });

    // Go to waiting room
    navigate("/student/waiting");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && name.trim()) {
      handleContinue();
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ fontFamily: "Sora" }}
    >
      <div className="w-full max-w-lg">
        {/* Logo Badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">Intervue Poll</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl text-gray-900 mb-6">
            <span className="font-normal">Let's</span>{" "}
            <span className="font-bold">Get Started</span>
          </h1>

          <p className="text-gray-600 text-lg leading-relaxed">
            You'll be able to{" "}
            <span className="font-semibold text-gray-900">
              submit your answers
            </span>
            , participate in live polls, and compare results instantly.
          </p>
        </div>

        {/* Name Input Section */}
        <div className="mb-8">
          <label
            htmlFor="studentName"
            className="block text-gray-900 font-medium text-base mb-3"
          >
            Enter your Name
          </label>

          <input
            id="studentName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Rahul Bajaj"
            className="w-full px-6 py-4 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-base"
          />
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!name.trim()}
            className={`px-12 py-4 rounded-full text-white font-semibold text-lg transition-all ${
              name.trim()
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentNameEntry;
