import { check, body } from "express-validator";

export const createPostValidation = [
  body("title").trim().isLength({ min: 5 }),
  body("content").trim().isLength({ min: 5 }),
];

export const createPutValidation = [
  body("title").trim().isLength({ min: 5 }),
  body("content").trim().isLength({ min: 5 }),
];
