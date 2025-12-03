import React from "react";
import { Routes, Route } from "react-router-dom";

/* Student Components */
import RoleSelector from "./routes/RoleSelector";
import StudentNameEntry from "./routes/StudentNameEntry";
import WaitingRoom from "./routes/WaitingRoom";
import ActiveQuestion from "./routes/ActiveQuestion";
import SubmittedStateWithPopup from "./routes/SubmittedStateWithPopup";
import KickedOutScreen from "./routes/KickedOutScreen";

/* Teacher Components */
import CreatePollForm from "./routes/CreatePollForm";
import TeacherActivePoll from "./routes/TeacherActivePoll";
import TeacherPollResult from "./routes/TeacherPollResult";
import PollResultsView from "./routes/PollResultsView";
import PollHistoryDetail from "./routes/PollHistoryDetail";

export default function App() {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/" element={<RoleSelector />} />

      {/* Student Flow */}
      <Route path="/student/name-entry" element={<StudentNameEntry />} />
      <Route path="/student/waiting" element={<WaitingRoom />} />
      <Route path="/student/active" element={<ActiveQuestion />} />
      <Route path="/student/submitted" element={<SubmittedStateWithPopup />} />
      <Route path="/student/kicked-out" element={<KickedOutScreen />} />

      {/* Teacher Flow */}
      <Route path="/teacher/create" element={<CreatePollForm />} />
      <Route path="/teacher/active" element={<TeacherActivePoll />} />
      <Route path="/teacher/result" element={<TeacherPollResult />} />
      <Route path="/teacher/result-view" element={<PollResultsView />} />
      <Route path="/teacher/history" element={<PollHistoryDetail />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex justify-center items-center text-3xl font-semibold text-gray-700">
      Page not found
    </div>
  );
}
