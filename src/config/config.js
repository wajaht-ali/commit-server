import dotenv from "dotenv";

dotenv.config();

const _config = {
  PORT: process.env.PORT || 8000,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  MONGO_URI: process.env.MONGO_URI,
};

const config = Object.freeze(_config);
export default config;
