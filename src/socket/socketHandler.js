export const initializeSocketIO = (io, roomStates) => {
  const usersInRooms = {};

  const handleUserDisconnect = (socketId) => {
    let disconnectedUser = null;
    for (const roomId in usersInRooms) {
      const userIndex = usersInRooms[roomId].findIndex(
        (user) => user.socketId === socketId
      );

      if (userIndex !== -1) {
        disconnectedUser = usersInRooms[roomId][userIndex];
        usersInRooms[roomId].splice(userIndex, 1);

        io.to(roomId).emit("user-left", {
          username: disconnectedUser.username,
          socketId: disconnectedUser.socketId,
        });
        io.to(roomId).emit("update-user-list", usersInRooms[roomId]);

        if (usersInRooms[roomId].length === 0) {
          delete usersInRooms[roomId];
          roomStates.delete(roomId);
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

    socket.on("leave-room", () => {
      handleUserDisconnect(socket.id);
    });

    socket.on("disconnect", () => {
      handleUserDisconnect(socket.id);
    });
  });
};
