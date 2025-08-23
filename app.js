import express from "express";
import bodyParser from "body-parser";
import feedRoutes from "./routes/feed.routes.js";
import authRoutes from "./routes/auth.routes.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// import { Server } from "socket.io";
import { config } from "./socket.js";
import cors from "cors";

//#region CONSTANTS
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//#endregion;

//#region CORS
// This is what we used previously x-www-form-urlencoded when using forms
// app.use(bodyParser.urlencoded({ extended: true }));
// But we are working with json now -> application/json

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE",
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });

const allowedOrigins = process.env.CORS_ORIGIN.split(","); // split comma-separated string

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["PATCH", "POST", "PUT", "GET", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Headers",
      // "Access-Control-Allow-Origin",
    ],
    credentials: true,
    // optionsSuccessStatus: 200,
  }),
);
//#endregion

//#region Middleware
app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("api/v1/feed", feedRoutes);
app.use("api/v1/auth", authRoutes);
//#endregion

//#region MongoDB/Mongoose Connection w/Socket IO
mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    // This will return us our node server
    const server = app.listen(process.env.PORT);
    const io = config.init(server);

    // Socket io uses our http server and adds on top of it
    // It Will use the web sockets with our server
    io.on("connection", (socket) => {
      console.log("Client Connected");
    });
  })
  .catch((err) => console.log(err));
//#endregion
