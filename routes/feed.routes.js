import express from "express";
import {
  createPost,
  getPost,
  getPosts,
} from "../controllers/feed.controllers.js";
import { createPostValidation } from "../utils/validation.utils.js";

const router = express.Router();

//#region Get Routes
router.get("/posts", getPosts);
router.get("/post/:postId", getPost);
//#endregion

//#region Post Routes
router.post("/post", createPostValidation, createPost);
//#endregion

export default router;
