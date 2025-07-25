import { validationResult } from "express-validator";
import { Post } from "../models/post.models.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { removeImage } from "../utils/deleteImage.utils.js";

//#region Get Posts
export function getPosts(req, res, next) {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;

      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((posts) => {
      res.status(200).json({
        message: "Posts Fetched Successfully",
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
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
  }

  if (!req.file) {
    throw new ApiError(422, "No image provided");
  }

  // Create a post in the db
  const { title, content } = req.body;
  const imageUrl = req.file.path;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    // imageUrl: `/${imageUrl}`, // '/' needed to seperate url and /images folder
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

//#region Get Post
export function getPost(req, res, next) {
  const { postId } = req.params;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        //NOTE: If we throw our error here inside of our then block it will get passed down to the catch which then the error gets handled
        throw new ApiError(404, "Post not found");
      }

      res.status(200).json({ message: "Post Fetched", post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}
//#endregion

//#region Put Update Post
export function updatePost(req, res, next) {
  const postId = req.params.postId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(
      422,
      "Validation failed, entered data is incorrect",
      errors,
    );
  }

  // We know we have valid data if we reach this point
  const { title, content } = req.body;
  let imageUrl = req.body.image ? req.body.image : req.file.path;

  if (!imageUrl) {
    throw new ApiError(422, "No file picked.");
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        throw new ApiError(404, "Post not found");
      }

      if (imageUrl !== post.imageUrl) {
        removeImage(post.imageUrl);
      }

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save(); // saving the users updated post
    })
    .then((result) => {
      res.status(200).json({ message: "Post Updated", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      // Async promise chain so we have to pass on the error like so
      next(err);
    });
}
//#endregion

//#region Delete Post
export function deletePost(req, res, next) {
  const postId = req.params.postId;

  //NOTE: First we find it by id and then do our checks then we can remove it by id later once we have verified users etc
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        throw new ApiError(404, "Post not found");
      }
      //TODO: Check logged in user created said post
      removeImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ message: "Post Deleted" });
    })
    .catch((err) => console.log(err));
}
//#endregion
