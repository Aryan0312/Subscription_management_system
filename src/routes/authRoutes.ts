import express from "express";
import { handleUserLogin } from "../controller/auth/handleUserLogin.js";
import { getUserDetails } from "../controller/auth/me.js";
import { allowedRole } from "../middleware/auth/authMiddleware.js";
import { handleUserLogout } from "../controller/auth/handleUserLogout.js";
import { handleUserSignup } from "../controller/auth/handleUserSignUp.js";
import { createUser } from "../controller/auth/createUser.js";
import { resetPassword } from "../controller/auth/resetPassword.js";

export const authRouter = express.Router();

authRouter.post("/login", handleUserLogin);
authRouter.post("/signup",handleUserSignup);
authRouter.post("/createUser",allowedRole(["super_admin",]),createUser);
authRouter.post("/forgot",resetPassword);

authRouter.get(
  "/me",
  allowedRole(["super_admin", "admin", "user"]),
  getUserDetails
);

authRouter.get(
  "/logout",
  handleUserLogout
);
