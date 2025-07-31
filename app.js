import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { createHandler } from "graphql-http/lib/use/express";
import { schema } from "./graphql/schema.graphql.js";
import resolver from "./graphql/resolvers.graphql.js";
import { altairExpress } from "altair-express-middleware";

//#region Constants
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//#endregion

//#region Multer Local File Storage
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});
//#endregion

//#region Multer Iamge Type Filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
//#endregion

// This is what we used previously x-www-form-urlencoded when using forms
// app.use(bodyParser.urlencoded({ extended: true }));
// But we are working with json now -> application/json
app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"),
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/graphql", createHandler({ schema: schema, rootValue: resolver }));
app.use(
  "/altair",
  altairExpress({
    endpointURL: "/graphql",
  }),
);
mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    // This will return us our node server
    app.listen(process.env.PORT);
  })
  .catch((err) => console.log(err));
