import { server, io } from "./src/app.js";
import config from "./src/config/config.js";
import connectDB from "./src/config/db.js";
import { initializeSocketIO } from "./src/socket/socketHandler.js";

const startServer = () => {
  connectDB();
  const PORT = config.PORT;

  // initializing sockets here
  initializeSocketIO(io);

  server.listen(PORT, () => {
    console.log(`🔥 Server is running on http://localhost:${PORT}`);
    console.log(`🔥 Socket.IO initialized`);
  });
};

startServer();
