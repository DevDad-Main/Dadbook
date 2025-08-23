import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
} from "../controllers/feed.controllers.js";
import {
  createPostValidation,
  createPutValidation,
} from "../utils/validation.utils.js";
import { isAuthenticated } from "../middleware/Authentication.middleware.js";

const router = express.Router();

//#region Get Routes
router.get("/posts", isAuthenticated, getPosts);
router.get("/post/:postId", isAuthenticated, getPost);
//#endregion

//#region Post Routes
router.post("/post", isAuthenticated, createPostValidation, createPost);
//#endregion

//#region Put Routes
router.put("/post/:postId", isAuthenticated, createPutValidation, updatePost);
//#endregion

//#region Delete Routes
router.delete("/post/:postId", isAuthenticated, deletePost);
//#endregion

export default router;
