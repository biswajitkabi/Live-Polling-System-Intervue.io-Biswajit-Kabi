import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, Plus, X } from "lucide-react";
import { useSocket } from "../lib/SocketProvider";
import { useNavigate } from "react-router-dom";

const CreatePollForm = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState(60);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);

  const [options, setOptions] = useState([
    { id: 1, text: "", isCorrect: true },
    { id: 2, text: "", isCorrect: false }
  ]);

  const durationOptions = [30, 45, 60, 90, 120];

  //  Teacher auto-joins teacher room
  useEffect(() => {
    if (!socket) return;
    socket.emit("teacher:join");
  }, [socket]);

  //  Listen for poll creation confirmations
  useEffect(() => {
    if (!socket) return;

    socket.on("poll:created", (poll) => {
      // Navigate teacher to active poll monitor
      navigate("/teacher/active", { state: { poll } });
    });

    socket.on("poll:current", (poll) => {
      // If a poll already exists, show active poll directly
      navigate("/teacher/active", { state: { poll } });
    });

    return () => {
      socket.off("poll:created");
      socket.off("poll:current");
    };
  }, [socket, navigate]);

  // Add option
  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([
        ...options,
        { id: options.length + 1, text: "", isCorrect: false }
      ]);
    }
  };

  // Remove option
  const handleRemoveOption = (id) => {
    if (options.length > 2) {
      const updated = options.filter((opt) => opt.id !== id).map((opt, index) => ({
        ...opt,
        id: index + 1
      }));
      setOptions(updated);
    }
  };

  // Input change
  const handleOptionChange = (id, text) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  // Toggle correct
  const handleCorrectChange = (id, isCorrect) => {
    setOptions(
      options.map((opt) =>
        opt.id === id ? { ...opt, isCorrect } : { ...opt, isCorrect: false }
      )
    );
  };

  //  Submit poll (LIVE)
  const handleSubmit = () => {
    if (!question.trim() || !options.every((o) => o.text.trim())) return;

    const pollData = {
      question,
      duration,
      options
    };

    socket.emit("poll:create", pollData);
  };

  const characterCount = question.length;
  const maxCharacters = 100;

  return (
    <div
      className="min-h-screen bg-gray-50 p-6"
      style={{ fontFamily: "Sora" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-lg mb-6">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">Intervue Poll</span>
          </div>

          <h1 className="text-4xl md:text-5xl text-gray-900 mb-6">
            <span className="font-normal">Let's</span>{" "}
            <span className="font-bold">Get Started</span>
          </h1>
          <p className="text-gray-600 text-base">
            You'll have the ability to create and manage polls, ask questions, and
            monitor your students' responses in real-time.
          </p>
        </div>

        {/* Question Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-gray-900 font-semibold text-lg">Enter your question</label>

            {/* Duration Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium text-gray-900">{duration} seconds</span>
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              </button>

              {showDurationDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {durationOptions.map((dur) => (
                    <button
                      key={dur}
                      onClick={() => {
                        setDuration(dur);
                        setShowDurationDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                        duration === dur ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      {dur} seconds
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question"
              maxLength={maxCharacters}
              className="w-full px-6 py-4 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
            />
            <div className="absolute bottom-4 right-4 text-sm text-gray-500">
              {characterCount}/{maxCharacters}
            </div>
          </div>
        </div>

        {/* Options Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-gray-900 font-semibold text-lg">Edit Options</h2>
            <h2 className="text-gray-900 font-semibold text-lg">Is it Correct?</h2>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-4">
                {/* Number */}
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>

                {/* Input */}
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                  placeholder="Option text"
                  className="flex-1 px-6 py-3 bg-gray-100 rounded-xl text-gray-900"
                />

                {/* Yes/No */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`correct-${option.id}`}
                      checked={option.isCorrect}
                      onChange={() => handleCorrectChange(option.id, true)}
                    />
                    <span className="text-gray-700 font-medium">Yes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`correct-${option.id}`}
                      checked={!option.isCorrect}
                      onChange={() => handleCorrectChange(option.id, false)}
                    />
                    <span className="text-gray-700 font-medium">No</span>
                  </label>
                </div>

                {/* Remove */}
                {options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(option.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Option */}
          {options.length < 6 && (
            <button
              onClick={handleAddOption}
              className="mt-4 flex items-center gap-2 px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50"
            >
              <Plus className="w-5 h-5" />
              Add More Option
            </button>
          )}
        </div>
      </div>

      {/* ASK QUESTION BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={!question.trim() || !options.every((o) => o.text.trim())}
        className={`fixed bottom-8 right-8 px-10 py-4 rounded-full text-white font-semibold text-lg shadow-lg ${
          question.trim() && options.every((o) => o.text.trim())
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105"
            : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        Ask Question
      </button>
    </div>
  );
};



export default CreatePollForm;
