import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "./cors";
import env from "./env";
import SignalingSocketServer from "./signaling";

const app = express();
// app.use(env.NODE_ENV === "production" ? morgan("combined") : morgan("dev"));
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server({
  cors: {
    origin: env.CLIENT_PATH,
  },
  path: env.WEBSOCKET_PATH,
});

SignalingSocketServer(io);

io.attach(server);

server.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
