import express from "express";
import {
  signupValidation,
  userStatusValidation,
} from "../utils/validation.utils.js";
import {
  signup,
  login,
  getStatus,
  updateStatus,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middleware/Authentication.middleware.js";

const router = express.Router();

//#region Get Routes
router.get("/status", isAuthenticated, getStatus);
//#endregion

//#region Put Routes
router.put("/signup", signupValidation, signup);
router.put("/status", isAuthenticated, userStatusValidation, updateStatus);
//#endregion;

//#region Post Routes
router.post("/login", login);
//#endregion

export default router;
