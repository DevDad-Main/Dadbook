import { validationResult } from "express-validator";
import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError.utils.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const SALT_ROUNDS = 12;

//#region Signup
export async function signup(req, res, next) {
  const errors = validationResult(req);
  const { email, name, password } = req.body;

  if (!errors.isEmpty()) {
    throw new ApiError(
      422,
      "Validation failed, entered data is incorrect",
      errors.array(),
    );
  }
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({
      email: email,
      password: hashedPassword,
      name: name,
    });
    const result = await user.save();
    res.status(201).json({ message: "User Created", userId: result._id });
  } catch (err) {
    next(err);
  }
}
//#endregion

//#region Login
export async function login(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      // 401 -> Not Authenticated
      throw new ApiError(401, "A user with this email could not be found");
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new ApiError(401, "Wrong password");
    }
    const token = jwt.sign(
      { email: loadedUser.email, userId: loadedUser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );
    res.status(200).json({ token: token, userId: loadedUser._id.toString() });
  } catch (err) {
    next(err);
  }
}
//#endregion

//#region Get Status
export async function getStatus(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res
      .status(200)
      .json({ message: "Status Fetched Successfully", status: user.status });
  } catch (err) {
    console.log(err);
    console.log(err.statusCode);
    next(err);
  }
}
//#endregion

//#region Update Status
export async function updateStatus(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(
      422,
      "Validation failed, entered data is incorrect",
      errors,
    );
  }
  const { status } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.status = status;
    const result = await user.save();
    console.log(result);
    res.status(200).json({ message: "Status Updated" });
  } catch (err) {
    console.log(err);
    console.log(err.statusCode);
    next(err);
  }
}
//#endregion
