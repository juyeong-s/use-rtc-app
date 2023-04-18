import { Server } from "socket.io";

function SignalingSocketServer(io: Server) {
  io.on("connection", (socket) => {
    socket.on("send-hello", () => {
      const senderId = socket.id;
      socket.broadcast.emit("receive-hello", senderId); // broadcast
    });

    socket.on("send-offer", (offer, receiverId) => {
      const senderId = socket.id;
      socket.to(receiverId).emit("receive-offer", offer, senderId);
    });

    socket.on("send-answer", (answer, receiverId) => {
      const senderId = socket.id;
      socket.to(receiverId).emit("receive-answer", answer, senderId);
    });

    socket.on("send-ice", (ice, receiverId) => {
      const senderId = socket.id;
      socket.to(receiverId).emit("receive-ice", ice, senderId);
    });

    socket.on("send-bye", () => {
      const senderId = socket.id;
      socket.broadcast.emit("receive-bye", senderId);
    });
  });
}

export default SignalingSocketServer;
