import { validationResult } from "express-validator";
import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError.utils.js";

//TODO: Add to dotenv
const SALT_ROUNDS = 12;

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
