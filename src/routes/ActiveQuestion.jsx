import { useEffect, useState, useCallback } from "react";
import { Clock, MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../lib/SocketProvider";

const ActiveQuestion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  const [poll, setPoll] = useState(location.state?.poll || null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(!poll);

  const startTimer = useCallback((duration, startedAt) => {
    if (!duration || !startedAt) return;

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = duration - elapsed;
    setTimeRemaining(remaining > 0 ? remaining : 0);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = duration - elapsed;
      setTimeRemaining(remaining > 0 ? remaining : 0);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    // Don't return, just let interval run
  }, []);

  useEffect(() => {
    if (!socket) return;

    // ⭐ FIX #1 — Always request the current poll when mounting
    socket.emit("participant:join", {
      name: localStorage.getItem("studentName") || "Student",
      role: "student",
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // ⭐ FIX #2 — Receive current poll immediately
    socket.on("poll:current", ({ poll: currentPoll }) => {
      if (currentPoll) {
        setPoll(currentPoll);
        setIsLoading(false);
        // Only start timer if poll has actually started
        if (currentPoll.startedAt) {
          startTimer(currentPoll.duration, currentPoll.startedAt);
        } else {
          // Poll created but not started yet
          setTimeRemaining(currentPoll.duration);
        }

        // ⭐ FIX #3 — If student came from waiting screen → go to active question
        if (location.pathname.includes("waiting")) {
          navigate("/student/active", { state: { poll: currentPoll } });
        }
      } else {
        setIsLoading(true);
      }
    });

    // Teacher started a new poll → go to question immediately
    socket.on("poll:started", ({ poll: newPoll }) => {
      setPoll(newPoll);
      setIsLoading(false);
      startTimer(newPoll.duration, newPoll.startedAt);
      navigate("/student/active", { state: { poll: newPoll } });
    });

    socket.on("poll:ended", ({ pollId }) => {
      navigate("/student/submitted", { state: { poll } });
    });

    socket.on("participant:kicked", () => {
      navigate("/student/kicked-out");
    });

    return () => {
      socket.off("poll:current");
      socket.off("poll:started");
      socket.off("poll:ended");
      socket.off("participant:kicked");
      setTimeRemaining(0);
    };
  }, [socket, poll, navigate, location.pathname, startTimer]);

  const handleSubmit = () => {
    if (!selectedOption || !poll || hasSubmitted) return;

    setHasSubmitted(true);
    socket.emit("answer:submit", {
      pollId: poll.id,
      optionId: selectedOption,
    });

    navigate("/student/submitted", { state: { poll } });
  };

  if (!socket) return <div className="p-10 text-xl">Connecting...</div>;
  if (isLoading) return <div className="p-10 text-xl">Waiting for poll…</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Question 1</h2>
          <div className="flex items-center gap-2 text-red-600">
            <Clock className="w-5 h-5" />
            <span className="text-xl font-bold">
              00:{String(timeRemaining).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-700 text-white px-6 py-4"></div>
          <h3 className="text-lg font-medium">{poll.question}</h3>
        </div>
        <div className="p-6 space-y-3">
          {poll.options.map((opt, index) => (
            <button
              key={opt.id}
              onClick={() => setSelectedOption(opt.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all ${
                selectedOption === opt.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                  selectedOption === opt.id ? "bg-indigo-600" : "bg-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <span className="text-gray-900 font-medium">{opt.text}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`px-12 py-4 rounded-full font-semibold text-lg shadow-lg transition-all ${
              selectedOption
                ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveQuestion;
