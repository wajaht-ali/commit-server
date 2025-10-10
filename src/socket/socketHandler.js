export const initializeSocketIO = (io) => {
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
        }
        break;
      }
    }
  };

  const usersInRooms = {};
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
      socket.to(roomId).emit("get-code-state");
    });

    socket.on("code-change", (data) => {
      socket.to(data.roomId).emit("code-update", data.code);
    });

    socket.on("send-code-state", ({ roomId, code }) => {
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
