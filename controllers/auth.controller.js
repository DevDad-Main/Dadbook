import { validationResult } from "express-validator";
import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError.utils.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const SALT_ROUNDS = 12;

//#region Signup
export function signup(req, res, next) {
  const errors = validationResult(req);
  const { email, name, password } = req.body;

  if (!errors.isEmpty()) {
    throw new ApiError(
      422,
      "Validation failed, entered data is incorrect",
      errors.array(),
    );
  }
  bcrypt
    .hash(password, SALT_ROUNDS)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        name: name,
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({ message: "User Created", userId: result._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}
//#endregion

//#region Login
export function login(req, res, next) {
  const { email, password } = req.body;
  let loadedUser;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        // 401 -> Not Authenticated
        throw new ApiError(401, "A user with this email could not be found");
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((passwordMatch) => {
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
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}
//#endregion
