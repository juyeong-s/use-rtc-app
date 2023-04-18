import dotenv from "dotenv";

dotenv.config();

const env = {
  CLIENT_PATH: process.env.CLIENT_PATH,
  PORT: process.env.PORT,
  WEBSOCKET_PATH: process.env.WEBSOCKET_PATH,
  NODE_ENV: process.env.NODE_ENV,
};

export default env;
