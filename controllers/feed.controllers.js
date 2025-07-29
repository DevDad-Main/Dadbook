import { validationResult } from "express-validator";
import { Post } from "../models/post.models.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { removeImage } from "../utils/deleteImage.utils.js";
import { User } from "../models/user.models.js";
import { config } from "../socket.js";

//#region Get Posts
export async function getPosts(req, res, next) {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Posts Fetched Successfully",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}
//#endregion

//#region Create Post
export async function createPost(req, res, next) {
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
    creator: req.userId, // Mongoose will convert this to the id
  });

  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();

    // INFO: Emit sends to all users connected
    // INFO: Broadcast sends to all users connected except the one that made the post
    config.getIO().emit("posts", { action: "create", post: post });

    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    // Async promise chain so we have to pass on the error like so
    console.log(err);
    console.log(err.statusCode);
    next(err);
  }

  // 200 is just success, 201 is success but with new data
}
//#endregion

//#region Get Post
export async function getPost(req, res, next) {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      //NOTE: If we throw our error here inside of our then block it will get passed down to the catch which then the error gets handled
      throw new ApiError(404, "Post not found");
    }

    res.status(200).json({ message: "Post Fetched", post: post });
  } catch (err) {
    console.log(err);
    console.log(err.statusCode);
    next(err);
  }
}
//#endregion

//#region Update Post
export async function updatePost(req, res, next) {
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

  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    console.log(post);
    if (post.creator._id.toString() !== req.userId) {
      //INFO: 403 good for unauthorized issues
      throw new ApiError(403, "Not authorized");
    }
    if (imageUrl !== post.imageUrl) {
      removeImage(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const result = await post.save(); // saving the users updated post

    config.getIO().emit("posts", { action: "update", post: result });

    res.status(200).json({ message: "Post Updated", post: result });
  } catch (err) {
    console.log(err);
    console.log(err.statusCode);
    next(err);
  }
}
//#endregion

//#region Delete Post
export async function deletePost(req, res, next) {
  const postId = req.params.postId;

  //NOTE: First we find it by id and then do our checks then we can remove it by id later once we have verified users etc
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    if (post.creator.toString() !== req.userId) {
      //INFO: 403 good for unauthorized issues
      throw new ApiError(403, "Not authorized");
    }

    //TODO: Check logged in user created said post
    removeImage(post.imageUrl);
    const deletedPost = await Post.findByIdAndDelete(postId);

    const user = await User.findById(req.userId);
    user.posts.pull(postId);

    await user.save();

    config.getIO().emit("posts", { action: "delete", post: postId });

    res.status(200).json({ message: "Post Deleted" });
  } catch (err) {
    console.log(err.statusCode);
    console.log(err);
    next(err);
  }
}
//#endregion
