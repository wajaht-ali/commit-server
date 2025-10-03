export const initializeSocketIO = (io) => {
  const usersInRooms = {};
  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // user joins a room
    socket.on("join-room", ({ roomId, username }) => {
      if (!roomId) return;

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

      // This still goes to EVERYONE (including the new user) so their own sidebar updates.
      io.to(roomId).emit("update-user-list", usersInRooms[roomId]);

      socket.to(roomId).emit("get-code-state");
    });

    // handles code changes
    socket.on("code-change", (data) => {
      socket.to(data.roomId).emit("code-update", data.code);
    });

    // handles sending code state to new users
    socket.on("send-code-state", ({ roomId, code }) => {
      socket.to(roomId).emit("code-update", code);
    });

    // handles a user disconnecting
    socket.on("disconnect", () => {

      let disconnectedUser = null;
      for (const roomId in usersInRooms) {
        const userIndex = usersInRooms[roomId].findIndex(
          (user) => user.socketId === socket.id
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
    });
  });
};
