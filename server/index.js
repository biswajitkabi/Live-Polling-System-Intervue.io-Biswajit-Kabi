require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const SERVE_FRONTEND = process.env.SERVE_FRONTEND === "true";

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN },
});

// -----------------------------
// In-memory stores
// -----------------------------
let currentPoll = null;
const pollHistory = [];
const participants = new Map();

// -----------------------------
// Helper Broadcasting
// -----------------------------
function broadcastParticipants() {
  const list = Array.from(participants.values()).map((p) => ({
    socketId: p.socketId,
    name: p.name,
    role: p.role,
    kicked: !!p.kicked,
  }));
  io.emit("participants:update", list);
}

function broadcastVotes() {
  if (!currentPoll) return;
  const total = currentPoll.options.reduce((s, o) => s + (o.votes || 0), 0);
  io.emit("votes:update", {
    pollId: currentPoll.id,
    options: currentPoll.options,
    total,
  });
}

// -----------------------------
// REST Endpoints
// -----------------------------
app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/polls/history", (req, res) => res.json({ history: pollHistory }));
app.get("/polls/current", (req, res) => {
  if (!currentPoll) return res.status(404).json({ message: "No active poll" });
  res.json({ poll: currentPoll });
});

// -----------------------------
// Serve frontend if configured
// -----------------------------
if (SERVE_FRONTEND) {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// -----------------------------
// SOCKET.IO EVENTS
// -----------------------------
io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  // Temporary default participant
  participants.set(socket.id, {
    socketId: socket.id,
    name: `User-${socket.id.slice(0, 4)}`,
    role: "student",
    kicked: false,
  });
  broadcastParticipants();

  // -----------------------------
  // Participant Join
  // -----------------------------
  socket.on("participant:join", (data = {}) => {
    participants.set(socket.id, {
      socketId: socket.id,
      name: data.name || `User-${socket.id.slice(0, 4)}`,
      role: data.role || "student",
      kicked: false,
    });

    socket.emit("connected", { socketId: socket.id });
    broadcastParticipants();

    // Send active poll instantly if it exists
    if (currentPoll) {
      socket.emit("poll:current", {
        poll: currentPoll,
        state: currentPoll.startedAt ? "active" : "created",
      });
    }
  });

  // Teacher join
  socket.on("teacher:join", () => {
    const p = participants.get(socket.id) || {};
    participants.set(socket.id, {
      ...p,
      socketId: socket.id,
      role: "teacher",
    });

    broadcastParticipants();

    if (currentPoll) {
      socket.emit("poll:current", {
        poll: currentPoll,
        state: currentPoll.startedAt ? "active" : "created",
      });
    }
  });

  // -----------------------------
  // FIX: Student requests current poll
  // -----------------------------
  socket.on("poll:getCurrent", () => {
    if (currentPoll) {
      socket.emit("poll:current", {
        poll: currentPoll,
        state: currentPoll.startedAt ? "active" : "created",
      });
    } else {
      socket.emit("poll:current", { poll: null });
    }
  });

  // -----------------------------
  // Create Poll
  // -----------------------------
  socket.on("poll:create", (data) => {
    if (!data || !data.question || !Array.isArray(data.options)) {
      socket.emit("error", { message: "Invalid poll payload" });
      return;
    }

    const poll = {
      id: data.id || uuidv4(),
      question: data.question,
      duration: data.duration || 60,
      options: data.options.map((o, idx) => ({
        id: o.id ?? idx + 1,
        text: o.text,
        votes: 0,
      })),
      createdAt: Date.now(),
      startedAt: null,
      timerId: null,
    };

    currentPoll = poll;
    io.emit("poll:created", { poll: currentPoll });
    broadcastVotes();
  });

  // -----------------------------
  // Start Poll
  // -----------------------------
  socket.on("poll:start", (data) => {
    if (!currentPoll || currentPoll.id !== data?.pollId) {
      socket.emit("error", { message: "No poll to start" });
      return;
    }

    currentPoll.startedAt = Date.now();

    if (currentPoll.timerId) clearTimeout(currentPoll.timerId);

    currentPoll.timerId = setTimeout(() => {
      io.emit("poll:ended", {
        pollId: currentPoll.id,
        options: currentPoll.options,
      });

      pollHistory.unshift({
        id: currentPoll.id,
        question: currentPoll.question,
        options: currentPoll.options.map((o) => ({
          id: o.id,
          text: o.text,
          votes: o.votes,
        })),
        createdAt: currentPoll.createdAt,
        startedAt: currentPoll.startedAt,
        endedAt: Date.now(),
      });

      const totalVotes =
        currentPoll.options.reduce((s, o) => s + o.votes, 0) || 0;

      pollHistory[0].options = pollHistory[0].options.map((o) => ({
        ...o,
        percentage: totalVotes
          ? Math.round((o.votes / totalVotes) * 100)
          : 0,
      }));

      broadcastVotes();
      currentPoll = null;
    }, currentPoll.duration * 1000);

    io.emit("poll:started", { poll: currentPoll });
    broadcastVotes();
  });

  // -----------------------------
  // Submit Answer
  // -----------------------------
  socket.on("answer:submit", (data) => {
    if (!currentPoll || currentPoll.id !== data?.pollId) {
      socket.emit("error", { message: "Invalid poll" });
      return;
    }

    const opt = currentPoll.options.find((o) => o.id === data.optionId);
    if (!opt) {
      socket.emit("error", { message: "Invalid option" });
      return;
    }

    opt.votes = (opt.votes || 0) + 1;
    socket.emit("answer:accepted", {
      pollId: currentPoll.id,
      optionId: opt.id,
    });
    broadcastVotes();
  });

  // -----------------------------
  // Chat
  // -----------------------------
  socket.on("chat:message", (data) => {
    const sender = participants.get(socket.id) || {};
    const payload = {
      user: data?.name || sender.name || "Anonymous",
      message: data?.text || data?.message || "",
      socketId: socket.id,
      timestamp: Date.now(),
    };
    io.emit("chat:message", payload);
  });

  // -----------------------------
  // Kick participant
  // -----------------------------
  socket.on("participant:kick", (data) => {
    let targetSocketId = data?.socketId;

    if (!targetSocketId && data?.name) {
      for (const [sid, p] of participants.entries()) {
        if (p.name === data.name) {
          targetSocketId = sid;
          break;
        }
      }
    }

    if (!targetSocketId || !participants.has(targetSocketId)) {
      socket.emit("error", { message: "Invalid participant" });
      return;
    }

    const p = participants.get(targetSocketId);
    p.kicked = true;
    participants.set(targetSocketId, p);

    io.to(targetSocketId).emit("participant:kicked", {
      reason: data.reason || "Removed by teacher",
    });

    broadcastParticipants();
  });

  // -----------------------------
  // Poll History Request
  // -----------------------------
  socket.on("poll:history:get", () => {
    socket.emit("poll:history:data", pollHistory.slice(0, 50));
  });

  // -----------------------------
  // Disconnect
  // -----------------------------
  socket.on("disconnect", () => {
    participants.delete(socket.id);
    broadcastParticipants();
    console.log("socket disconnected", socket.id);
  });
});

// -----------------------------
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
