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
import cors from "cors";
import { isAuthenticated } from "./middleware/Authentication.middleware.js";
import { removeImage } from "./utils/deleteImage.utils.js";

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

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // or your frontend URL
    methods: ["POST", "PUT", "GET", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      // "Access-Control-Allow-Headers",
    ],
    credentials: true, // only if we are using cookies or auth headers
  }),
);

//#region Old CORS Setup
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE",
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//
//   if (req.method === "OPTIONS") {
//     return res.status(200);
//   }
//   next();
// });
//#endregion

//NOTE: Runs on every request but it doesn't deny said requests.
// Sets the property isAuth to false and then in our resolvers
// We determine whether to continue or not
app.use(isAuthenticated);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!req.file) {
    return res.status(200).json({ message: "No file Provided" });
  }

  if (req.body.oldPath) {
    removeImage(req.body.oldPath);
  }

  return res
    .status(201)
    .json({ message: "File Stored", filePath: req.file.path });
});

//#region GraphQL Middleware
app.all("/graphql", (req, res) =>
  createHandler({
    schema: schema,
    rootValue: resolver,
    context: { req, res },
    // formatError(err) {
    //   if (!err.originalError) {
    //     return err;
    //   }
    //   const data = err.originalError.data;
    //   const message = err.message || "An error occurred.";
    //   const code = err.originalError.code || 500;
    //   return {
    //     message: message,
    //     status: code,
    //     data: data,
    //   };
    // },
  })(req, res),
);
//#endregion

//#region Better version of graphiql -> playground for testing graphql queries etc
app.use(
  "/altair",
  altairExpress({
    endpointURL: "/graphql",
  }),
);
//#endregion

//#region Mongoose DB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    // This will return us our node server
    app.listen(process.env.PORT);
  })
  .catch((err) => console.log(err));
//#endregion
