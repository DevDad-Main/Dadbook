import { check, body } from "express-validator";
import { User } from "../models/user.models.js";

export const createPostValidation = [
  body("title").trim().isLength({ min: 5 }),
  body("content").trim().isLength({ min: 5 }),
];

export const createPutValidation = [
  body("title").trim().isLength({ min: 5 }),
  body("content").trim().isLength({ min: 5 }),
];

export const signupValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject("Email address already exists");
        }
      });
    })
    .normalizeEmail(),

  body("password").trim().isLength({ min: 5 }),
  body("name").trim().not().isEmpty(),
];
