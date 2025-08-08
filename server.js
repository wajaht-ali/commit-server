import app from "./src/app.js";
import config from "./src/config/config.js";

const startServer = () => {
  // connectDB();
  const PORT = config.PORT;
  
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
