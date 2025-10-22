import { registerVoiceSignaling } from "../realtime/audioSignaling.js";

export const initializeSocketIO = (io, roomStates) => {
  const usersInRooms = {};
  const roomMeta = new Map();

  const handleUserDisconnect = (socketId) => {
    let disconnectedUser = null;
    for (const roomId in usersInRooms) {
      const idx = usersInRooms[roomId].findIndex(
        (u) => u.socketId === socketId
      );
      if (idx !== -1) {
        disconnectedUser = usersInRooms[roomId][idx];
        usersInRooms[roomId].splice(idx, 1);

        io.to(roomId).emit("user-left", {
          username: disconnectedUser.username,
          socketId: disconnectedUser.socketId,
        });
        io.to(roomId).emit("update-user-list", usersInRooms[roomId]);

        // Also remove from voice participants if present
        const meta = roomMeta.get(roomId);
        if (meta) {
          meta.participants?.delete(socketId);
          // If creator left and call was active, end the call
          if (meta.callActive && meta.callStartedBy === socketId) {
            meta.callActive = false;
            meta.callStartedBy = null;
            meta.participants.clear();
            io.to(roomId).emit("voice:ended");
          }
        }

        if (usersInRooms[roomId].length === 0) {
          delete usersInRooms[roomId];
          roomStates.delete(roomId);
          roomMeta.delete(roomId);
          console.log(`Cleaned up state for empty room: ${roomId}`);
        }
        break;
      }
    }
  };

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join-room", ({ roomId, username, isCreating }) => {
      if (!roomId) return;
      const roomExists = !!usersInRooms[roomId];
      if (!isCreating && !roomExists) {
        socket.emit("room-not-found", {
          message: `Room with ID "${roomId}" was not found.`,
        });
        return;
      }

      // users limit
      if (roomExists && usersInRooms[roomId].length >= 5) {
        socket.emit("room-full", {
          message: "Room is full. You can't join.",
        });
        return;
      }
      socket.join(roomId);

      if (!roomStates.has(roomId)) {
        roomStates.set(roomId, {
          language: "javascript",
          code: `// Welcome to Commit! Code in this room will sync in real-time.`,
        });
      }

      if (!usersInRooms[roomId]) {
        usersInRooms[roomId] = [];
      }

      const isUserAlreadyInRoom = usersInRooms[roomId].some(
        (user) => user.socketId === socket.id
      );

      if (!isUserAlreadyInRoom) {
        const newUser = { socketId: socket.id, username };
        usersInRooms[roomId].push(newUser);
        socket.to(roomId).emit("user-joined", {
          username: newUser.username,
          socketId: newUser.socketId,
        });
      }
      // Ensure we have meta for this room
      if (!roomMeta.has(roomId)) {
        roomMeta.set(roomId, {
          callActive: false,
          callStartedBy: null,
          participants: new Set(),
        });
      }

      io.to(roomId).emit("update-user-list", usersInRooms[roomId]);

      socket.emit("room-state-sync", roomStates.get(roomId));
    });

    socket.on("language-change", ({ roomId, language }) => {
      if (roomStates.has(roomId)) {
        roomStates.get(roomId).language = language;
      }
      socket.to(roomId).emit("language-update", language);
    });

    socket.on("code-change", (data) => {
      if (roomStates.has(data.roomId)) {
        roomStates.get(data.roomId).code = data.code;
      }
      socket.to(data.roomId).emit("code-update", data.code);
    });

    socket.on("send-code-state", ({ roomId, code }) => {
      if (roomStates.has(roomId)) {
        roomStates.get(roomId).code = code;
      }
      socket.to(roomId).emit("code-update", code);
    });

    // socket.on("leave-room", () => {
    //   handleUserDisconnect(socket.id);
    // });

    socket.on("disconnect", () => {
      handleUserDisconnect(socket.id);
      console.log(`User Disconnected: ${socket.id}`);
    });
  });

  registerVoiceSignaling(io, { usersInRooms, roomMeta });
};
