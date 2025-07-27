import { validationResult } from "express-validator";
import { Post } from "../models/post.models.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { removeImage } from "../utils/deleteImage.utils.js";
import { User } from "../models/user.models.js";

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
  let creator;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId, // Mongoose will convert this to the id
  });
  post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Post created successfully!",
        post: post,
        creator: { _id: creator._id, name: creator.name },
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

//#region Update Post
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

      if (post.creator.toString() !== req.userId.toString()) {
        //INFO: 403 good for unauthorized issues
        throw new ApiError(403, "Not authorized");
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

      if (post.creator.toString() !== req.userId.toString()) {
        //INFO: 403 good for unauthorized issues
        throw new ApiError(403, "Not authorized");
      }

      //TODO: Check logged in user created said post
      removeImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Post Deleted" });
    })
    .catch((err) => {
      //WARN: Technically dont need this as we are setting the status code and error above
      // if (!err.statusCode) {
      //   err.statusCode = 500;
      // }
      console.log(err.statusCode);
      console.log(err);
      next(err);
    });
}
//#endregion
