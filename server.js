import app from "./src/app.js";

const startServer = () => {
  // connectDB();
  const PORT = 8080;

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();