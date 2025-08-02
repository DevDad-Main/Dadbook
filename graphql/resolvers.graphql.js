import { User } from "../models/user.models.js";
import { Post } from "../models/post.models.js";
import { ApiError } from "../utils/ApiError.utils.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 12;

//#region Helper Functions
function checkIsEmptyAndMinLength(itemTocheck, length) {
  if (
    validator.isEmpty(itemTocheck) ||
    !validator.isLength(itemTocheck, { min: length })
  ) {
    return true;
  }
  return false;
}
//#endregion

export default {
  /*
   *  context -> Shared data like auth info, DB access, user ID, etc.
   *  info -> Metadata about the query (field name, AST, schema, etc.)
   */
  //#region Create User
  createUser: async function ({ userInput }, _context, _info) {
    const errors = [];

    //#region Validation
    if (!validator.isEmail(userInput.email)) {
      throw new ApiError(422, "Invalid email address", errors);
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      throw new ApiError(422, "Please enter a valid name and password", errors);
    }

    if (errors.length > 0) {
      throw new ApiError(422, "Invalid input");
    }
    //#endregion

    const exisitingUser = await User.findOne({ email: userInput.email });
    if (exisitingUser) {
      throw new ApiError(401, "User exists already");
    }
    const hashedPassword = await bcrypt.hash(userInput.password, SALT_ROUNDS);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    });
    const createdUser = await user.save();
    console.log(createdUser._doc);
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  //#endregion
  //#region Login
  login: async function ({ email, password }, req) {
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new ApiError(401, "User not found");
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      console.log(`Passsword: ${password} | User Password: ${user.password}`);
      throw new ApiError(401, "Wrong password");
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    return { token: token, userId: user._id.toString() };
  },
  //#endregion
  //#region Create Post
  createPost: async function ({ postInput }, { req }) {
    //WARN: If we are not authenticated then we dont process the below code
    if (!req.isAuth) {
      throw new ApiError(401, "Not Authenticated");
    }
    const errors = [];
    const titleValidation = checkIsEmptyAndMinLength(postInput.title, 5);
    const contentValidation = checkIsEmptyAndMinLength(postInput.content, 5);

    if (titleValidation) {
      errors.push({ message: "Invalid title" });
    }
    if (contentValidation) {
      errors.push({ message: "Content is invalid" });
    }

    if (errors.length > 0) {
      throw new ApiError(422, "Invalid input", errors);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(401, "Invalid User");
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();

    // Add post to users posts array
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  //#endregion
  //#region Get Posts
  posts: async function (args, { req }) {
    //WARN: If we are not authenticated then we dont process the below code
    if (!req.isAuth) {
      throw new ApiError(401, "Not Authenticated");
    }
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find().sort({ createdAt: -1 }).populate("creator");

    return {
      posts: posts.map((post) => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },
  //#endregion
};
