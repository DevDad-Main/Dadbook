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

const router = express.Router();

//#region Get Routes
router.get("/posts", getPosts);
router.get("/post/:postId", getPost);
//#endregion

//#region Post Routes
router.post("/post", createPostValidation, createPost);
//#endregion

//#region Put Routes
router.put("/post/:postId", createPutValidation, updatePost);
//#endregion

//#region Delete Routes
router.delete("/post/:postId", deletePost);
//#endregion
export default router;
