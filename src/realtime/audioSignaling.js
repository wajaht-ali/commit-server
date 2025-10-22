const DEFAULT_ROOM_META = () => ({
  callActive: false,
  callStartedBy: null,
  participants: new Set(),
});

export function registerVoiceSignaling(io, { usersInRooms, roomMeta }) {
  const emitRoster = (roomId) => {
    const meta = roomMeta.get(roomId);
    if (!meta) return;
    io.to(roomId).emit("voice:roster", {
      callActive: meta.callActive,
      callStartedBy: meta.callStartedBy,
      participants: Array.from(meta.participants),
    });
  };

  io.on("connection", (socket) => {
    socket.on("voice:start", ({ roomId }) => {
      const meta = roomMeta.get(roomId) || DEFAULT_ROOM_META();
      const roomUsers = usersInRooms[roomId] || [];

      const creatorSocketId = roomUsers[0]?.socketId || null;
      if (!creatorSocketId || creatorSocketId !== socket.id) {
        socket.emit("voice:error", {
          message: "Only the room creator can start the call.",
        });
        return;
      }

      meta.callActive = true;
      meta.callStartedBy = socket.id;
      meta.participants = meta.participants || new Set();
      roomMeta.set(roomId, meta);

      io.to(roomId).emit("voice:started", {
        startedBy: socket.id,
      });
      emitRoster(roomId);
    });

    socket.on("voice:join", ({ roomId }) => {
      const meta = roomMeta.get(roomId);
      if (!meta?.callActive) {
        socket.emit("voice:error", { message: "No active call in this room." });
        return;
      }
      meta.participants.add(socket.id);
      emitRoster(roomId);

      socket.to(roomId).emit("voice:peer-join", { socketId: socket.id });
    });

    socket.on("voice:leave", ({ roomId }) => {
      const meta = roomMeta.get(roomId);
      if (!meta) return;
      meta.participants.delete(socket.id);
      emitRoster(roomId);
      socket.to(roomId).emit("voice:peer-leave", { socketId: socket.id });

      if (meta.callActive && meta.callStartedBy === socket.id) {
        meta.callActive = false;
        meta.callStartedBy = null;
        meta.participants.clear();
        io.to(roomId).emit("voice:ended");
        emitRoster(roomId);
      }
    });

    socket.on("voice:end", ({ roomId }) => {
      const meta = roomMeta.get(roomId);
      if (!meta) return;
      const roomUsers = usersInRooms[roomId] || [];
      const creatorSocketId = roomUsers[0]?.socketId || null;

      if (creatorSocketId !== socket.id) {
        socket.emit("voice:error", {
          message: "Only the room creator can end the call.",
        });
        return;
      }

      meta.callActive = false;
      meta.callStartedBy = null;
      meta.participants.clear();
      io.to(roomId).emit("voice:ended");
      emitRoster(roomId);
    });

    socket.on("voice:offer", ({ roomId, targetId, sdp }) => {
      io.to(targetId).emit("voice:offer", { fromId: socket.id, sdp, roomId });
    });

    socket.on("voice:answer", ({ roomId, targetId, sdp }) => {
      io.to(targetId).emit("voice:answer", { fromId: socket.id, sdp, roomId });
    });

    socket.on("voice:ice-candidate", ({ roomId, targetId, candidate }) => {
      io.to(targetId).emit("voice:ice-candidate", {
        fromId: socket.id,
        candidate,
        roomId,
      });
    });

    socket.on("voice:mute", ({ roomId, muted }) => {
      socket
        .to(roomId)
        .emit("voice:peer-muted", { socketId: socket.id, muted });
    });
  });
}
