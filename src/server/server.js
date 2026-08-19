const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

const rooms = new Map();

const MAX_PARTICIPANTS = 10;

app.get("/", (req, res) => {
  res.json({
    name: "PulseMeet Signaling Server",
    status: "running"
  });
});

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      hostId: null,
      locked: false,
      participants: new Map()
    });
  }

  return rooms.get(roomId);
}

function getParticipants(room) {
  return Array.from(room.participants.values());
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", ({ roomId, name }) => {
    if (!roomId) {
      socket.emit("join-error", {
        message: "Room ID is required."
      });
      return;
    }

    const room = getRoom(roomId);

    if (room.locked) {
      socket.emit("join-error", {
        message: "This meeting is locked."
      });
      return;
    }

    if (room.participants.size >= MAX_PARTICIPANTS) {
      socket.emit("join-error", {
        message: "Meeting participant limit reached."
      });
      return;
    }

    const participant = {
      id: socket.id,
      name: name || "Guest",
      micEnabled: true,
      cameraEnabled: true,
      handRaised: false,
      isHost: room.participants.size === 0,
      isCoHost: false
    };

    if (!room.hostId) {
      room.hostId = socket.id;
    }

    participant.isHost = room.hostId === socket.id;

    room.participants.set(socket.id, participant);

    socket.join(roomId);

    socket.data.roomId = roomId;
    socket.data.name = participant.name;

    socket.emit("room-joined", {
      self: participant,
      participants: getParticipants(room),
      locked: room.locked
    });

    socket.to(roomId).emit("user-joined", participant);

    io.to(roomId).emit("participants-updated", {
      participants: getParticipants(room)
    });

    console.log(`${participant.name} joined ${roomId}`);
  });

  socket.on("offer", ({ target, offer }) => {
    io.to(target).emit("offer", {
      sender: socket.id,
      offer
    });
  });

  socket.on("answer", ({ target, answer }) => {
    io.to(target).emit("answer", {
      sender: socket.id,
      answer
    });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", {
      sender: socket.id,
      candidate
    });
  });

  socket.on("participant-state", (data) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const participant = room.participants.get(socket.id);

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
      participants: getParticipants(room)
    });
  });

  socket.on("chat-message", (message) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    io.to(roomId).emit("chat-message", {
      ...message,
      senderId: socket.id,
      senderName: socket.data.name || "Guest"
    });
  });

  socket.on("toggle-lock", ({ locked }) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const participant = room.participants.get(socket.id);

    if (!participant?.isHost) return;

    room.locked = Boolean(locked);

    io.to(roomId).emit("meeting-lock-changed", {
      locked: room.locked
    });
  });

  socket.on("set-cohost", ({ target, value }) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = room.participants.get(socket.id);

    if (!requester?.isHost) return;

    const targetParticipant = room.participants.get(target);

    if (!targetParticipant) return;

    targetParticipant.isCoHost = Boolean(value);

    io.to(roomId).emit("participants-updated", {
      participants: getParticipants(room)
    });
  });

  socket.on("mute-participant", ({ target }) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = room.participants.get(socket.id);

    if (!requester?.isHost && !requester?.isCoHost) return;

    io.to(target).emit("force-mute");
  });

  socket.on("remove-participant", ({ target }) => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = room.participants.get(socket.id);

    if (!requester?.isHost) return;

    io.to(target).emit("removed-from-meeting");

    setTimeout(() => {
      io.sockets.sockets.get(target)?.disconnect(true);
    }, 300);
  });

  socket.on("end-meeting", () => {
    const roomId = socket.data.roomId;

    if (!roomId) return;

    const room = rooms.get(roomId);

    if (!room) return;

    const requester = room.participants.get(socket.id);

    if (!requester?.isHost) return;

    io.to(roomId).emit("meeting-ended");

    rooms.delete(roomId);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;

    if (!roomId) {
      console.log("Disconnected:", socket.id);
      return;
    }

    const room = rooms.get(roomId);

    if (!room) return;

    room.participants.delete(socket.id);

    socket.to(roomId).emit("user-disconnected", {
      socketId: socket.id
    });

    io.to(roomId).emit("participants-updated", {
      participants: getParticipants(room)
    });

    if (room.hostId === socket.id) {
      const nextParticipant = room.participants.values().next().value;

      if (nextParticipant) {
        room.hostId = nextParticipant.id;

        nextParticipant.isHost = true;

        io.to(roomId).emit("participants-updated", {
          participants: getParticipants(room)
        });
      }
    }

    if (room.participants.size === 0) {
      rooms.delete(roomId);
    }

    console.log("Disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`PulseMeet Socket.IO server running on http://localhost:${PORT}`);
});