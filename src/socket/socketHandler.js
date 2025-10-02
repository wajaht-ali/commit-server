export const initializeSocketIO = (io) => {
  // Listen for new connections
  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("message", (msg) => {
      console.log("Message received: ", msg);
      io.emit("message", msg);
    });
  });
};
