import { validationResult } from "express-validator";
import { Post } from "../models/post.models.js";
import { ApiError } from "../utils/ApiError.utils.js";

//#region Get Posts
export function getPosts(req, res, next) {
  res.status(200).json({
    posts: [
      {
        _id: 1,
        title: "First Post",
        content: "Hello World!.",
        imageUrl: "images/duck.png",
        creator: {
          name: "Oliver",
        },
        createdAt: new Date(),
      },
    ],
  });
}
//#endregion

//#region Create Post
export function createPost(req, res, next) {
  const errors = validationResult(req);

  // Due to us not being in an async function this will exit the method execution right away and move onto thenext error handling middleware
  if (!errors.isEmpty()) {
    throw new ApiError(
      422,
      "Validation failed, entered data is incorrect",
      errors,
    );
    // const error = new Error("Validation failed, entered data is incorrect");
    // error.statusCode = 422;
    // throw error;
  }
  // Create a post in the db
  const { title, content } = req.body;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: "/images/duck.png",
    creator: {
      name: "Oliver",
    },
  });
  post
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      // Async promise chain so we have to pass on the error like so
      next(err);
    });
  // const title = req.body.title;
  // const content = req.body.content;

  // 200 is just success, 201 is success but with new data
}
//#endregion

export function getPost(req, res, next) {
  const { postId } = req.params;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        //NOTE: If we throw our error here inside of our then block it will get passed down to the catch which then the error gets handled
        throw new ApiError(404, "Post not found");
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}
