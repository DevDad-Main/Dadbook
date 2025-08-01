import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.utils.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 12;

export default {
  createUser: async function ({ userInput }, req) {
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
};
