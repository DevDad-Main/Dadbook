import { Server } from "socket.io";
let io;

export const config = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });
    return io;
  },
  getIO: () => {
    return io != null ? io : null;
  },
};
