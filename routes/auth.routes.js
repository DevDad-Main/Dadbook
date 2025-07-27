import express from "express";
import { signupValidation } from "../utils/validation.utils.js";
import { signup } from "../controllers/auth.controller.js";

const router = express.Router();

//#region Put Routes
router.put("/signup", signupValidation, signup);
//#endregion;

//#region Post Routes
router.post("/login");
//#endregion

export default router;
