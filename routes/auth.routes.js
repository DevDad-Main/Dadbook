import express from "express";
import { signupValidation } from "../utils/validation.utils.js";
import { signup } from "../controllers/auth.controller.js";

const router = express.Router();

router.put("/signup", signupValidation, signup);

export default router;
