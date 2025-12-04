import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (!selectedRole) return;

    if (selectedRole === "student") {
      navigate("/student/name-entry");
    } else if (selectedRole === "teacher") {
      navigate("/teacher/create");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        
        {/* Logo Badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">Intervue Poll</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl  text-gray-900 mb-4">
            Welcome to the <span className="font-bold">Live Polling System</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Select your role to continue
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">

          {/* Student Card */}
          <button
            onClick={() => handleRoleSelect("student")}
            className={`relative p-8 rounded-2xl border-2 transition-all text-left hover:shadow-lg ${
              selectedRole === "student"
                ? "border-indigo-600 bg-indigo-50 shadow-lg"
                : "border-gray-200 bg-white hover:border-indigo-300"
            }`}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-3">I'm a Student</h2>
            <p className="text-gray-600">Participate in live polls & submit answers.</p>
          </button>

          {/* Teacher Card */}
          <button
            onClick={() => handleRoleSelect("teacher")}
            className={`relative p-8 rounded-2xl border-2 transition-all text-left hover:shadow-lg ${
              selectedRole === "teacher"
                ? "border-indigo-600 bg-indigo-50 shadow-lg"
                : "border-gray-200 bg-white hover:border-indigo-300"
            }`}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-3">I'm a Teacher</h2>
            <p className="text-gray-600">Create polls and view live results.</p>
          </button>

        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`px-12 py-4 rounded-full text-white font-semibold text-lg transition-all ${
              selectedRole
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

export default RoleSelector;
