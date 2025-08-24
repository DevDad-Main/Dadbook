import { Server } from "socket.io";
let io;

export const config = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST", "PUT", "DELETE"],

        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "Access-Control-Allow-Headers",
          // "Access-Control-Allow-Origin",
        ],
        credentials: true,
      },
    });
    return io;
  },
  getIO: () => {
    return io != null ? io : null;
  },
};
