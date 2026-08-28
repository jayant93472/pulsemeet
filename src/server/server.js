const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const MAX_PARTICIPANTS = 10;

const rooms = new Map();

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.get("/", (req, res) => {
  res.status(200).json({
    name: "PulseMeet Signaling Server",
    status: "running",
    socket: "Socket.IO",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    rooms: rooms.size,
  });
});

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      hostId: null,
      locked: false,
      participants: new Map(),
    });
  }

  return rooms.get(roomId);
}

function getParticipants(room) {
  return Array.from(room.participants.values());
}

function getParticipant(room, socketId) {
  return room?.participants.get(socketId);
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);
  socket.on("join-room", ({ roomId, name } = {}) => {
    if (!roomId || typeof roomId !== "string") {
      socket.emit("join-error", {
        message: "Room ID is required.",
      });
      return;
    }

    const normalizedRoomId = roomId.trim();

    if (!normalizedRoomId) {
      socket.emit("join-error", {
        message: "Room ID is required.",
      });
      return;
    }

    const room = getRoom(normalizedRoomId);

    // Locked meeting
    if (room.locked) {
      socket.emit("join-error", {
        message: "This meeting is locked.",
      });
      return;
    }

    // Maximum participants
    if (room.participants.size >= MAX_PARTICIPANTS) {
      socket.emit("join-error", {
        message: "Meeting participant limit reached.",
      });
      return;
    }

    // Prevent duplicate room membership
    if (socket.data.roomId) {
      socket.emit("join-error", {
        message: "You are already in a meeting.",
      });
      return;
    }

    const participant = {
      id: socket.id,
      name:
        typeof name === "string" && name.trim()
          ? name.trim().slice(0, 50)
          : "Guest",
      micEnabled: true,
      cameraEnabled: true,
      handRaised: false,
      isHost: false,
      isCoHost: false,
    };

    // First participant becomes host
    if (!room.hostId) {
      room.hostId = socket.id;
    }

    participant.isHost = room.hostId === socket.id;

    room.participants.set(socket.id, participant);

    socket.join(normalizedRoomId);

    socket.data.roomId = normalizedRoomId;
    socket.data.name = participant.name;

    // Send current room state to new participant
    socket.emit("room-joined", {
      self: participant,
      participants: getParticipants(room),
      locked: room.locked,
    });

    // Notify existing participants
    socket.to(normalizedRoomId).emit("user-joined", participant);

    // Update everyone
    io.to(normalizedRoomId).emit("participants-updated", {
      participants: getParticipants(room),
    });

    console.log(
      `${participant.name} (${socket.id}) joined ${normalizedRoomId}`
    );
  });

  socket.on("offer", ({ target, offer } = {}) => {
    if (!target || !offer) return;

    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    if (!room.participants.has(target)) return;

    io.to(target).emit("offer", {
      sender: socket.id,
      offer,
    });
  });

  socket.on("answer", ({ target, answer } = {}) => {
    if (!target || !answer) return;

    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    if (!room.participants.has(target)) return;

    io.to(target).emit("answer", {
      sender: socket.id,
      answer,
    });
  });

  socket.on("ice-candidate", ({ target, candidate } = {}) => {
    if (!target || !candidate) return;

    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    if (!room.participants.has(target)) return;

    io.to(target).emit("ice-candidate", {
      sender: socket.id,
      candidate,
    });
  });

  socket.on("participant-state", (data = {}) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const participant = getParticipant(room, socket.id);

    if (!participant) return;

    if (typeof data.micEnabled === "boolean") {
      participant.micEnabled = data.micEnabled;
    }

    if (typeof data.cameraEnabled === "boolean") {
      participant.cameraEnabled = data.cameraEnabled;
    }

    if (typeof data.handRaised === "boolean") {
      participant.handRaised = data.handRaised;
    }

    io.to(roomId).emit("participants-updated", {
      participants: getParticipants(room),
    });
  });

  socket.on("chat-message", (message = {}) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room || !room.participants.has(socket.id)) {
      return;
    }

    io.to(roomId).emit("chat-message", {
      ...message,
      senderId: socket.id,
      senderName: socket.data.name || "Guest",
      timestamp: Date.now(),
    });
  });

  socket.on("toggle-lock", ({ locked } = {}) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = getParticipant(room, socket.id);

    if (!requester?.isHost) {
      return;
    }

    room.locked = Boolean(locked);

    io.to(roomId).emit("meeting-lock-changed", {
      locked: room.locked,
    });

    console.log(
      `Room ${roomId} ${room.locked ? "locked" : "unlocked"} by ${socket.id}`
    );
  });

  socket.on("set-cohost", ({ target, value } = {}) => {
    if (!target) return;

    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = getParticipant(room, socket.id);

    if (!requester?.isHost) {
      return;
    }

    const targetParticipant = getParticipant(room, target);

    if (!targetParticipant) {
      return;
    }

    // Host cannot be made co-host
    if (targetParticipant.isHost) {
      return;
    }

    targetParticipant.isCoHost = Boolean(value);

    io.to(roomId).emit("participants-updated", {
      participants: getParticipants(room),
    });
  });

  socket.on("mute-participant", ({ target } = {}) => {
    if (!target) return;

    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = getParticipant(room, socket.id);

    if (!requester?.isHost && !requester?.isCoHost) {
      return;
    }

    if (!room.participants.has(target)) {
      return;
    }

    io.to(target).emit("force-mute");
  });

  socket.on("remove-participant", ({ target } = {}) => {
    if (!target) return;

    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = getParticipant(room, socket.id);

    if (!requester?.isHost) {
      return;
    }

    const targetParticipant = getParticipant(room, target);

    if (!targetParticipant) {
      return;
    }

    // Host cannot remove themselves
    if (target === socket.id) {
      return;
    }

    io.to(target).emit("removed-from-meeting");

    setTimeout(() => {
      const targetSocket = io.sockets.sockets.get(target);

      if (targetSocket) {
        targetSocket.disconnect(true);
      }
    }, 300);
  });

  socket.on("end-meeting", () => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = getParticipant(room, socket.id);

    if (!requester?.isHost) {
      return;
    }

    io.to(roomId).emit("meeting-ended");

    // Disconnect everyone from the meeting
    for (const participantId of room.participants.keys()) {
      const participantSocket = io.sockets.sockets.get(participantId);

      if (participantSocket) {
        participantSocket.leave(roomId);
        participantSocket.data.roomId = null;
      }
    }

    rooms.delete(roomId);

    console.log(`Meeting ended: ${roomId}`);
  });

  socket.on("disconnect", (reason) => {
    const roomId = socket.data.roomId;

    if (!roomId) {
      console.log("Disconnected:", socket.id, reason);
      return;
    }

    const room = rooms.get(roomId);

    if (!room) {
      console.log("Disconnected:", socket.id, reason);
      return;
    }

    const wasHost = room.hostId === socket.id;

    room.participants.delete(socket.id);

    socket.to(roomId).emit("user-disconnected", {
      socketId: socket.id,
    });

    // Transfer host before broadcasting the new state
    if (wasHost) {
      const nextParticipant = room.participants.values().next().value;

      if (nextParticipant) {
        room.hostId = nextParticipant.id;
        nextParticipant.isHost = true;
      } else {
        room.hostId = null;
      }
    }

    if (room.participants.size > 0) {
      io.to(roomId).emit("participants-updated", {
        participants: getParticipants(room),
      });
    }

    // Delete empty room
    if (room.participants.size === 0) {
      rooms.delete(roomId);
    }

    console.log("Disconnected:", socket.id, reason);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("PulseMeet Signaling Server");
  console.log("=================================");
  console.log(`Port: ${PORT}`);
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log("Status: Running");
});
