import express from "express";
import type { Router } from "express";

import {
  Signup,
  VerifyEmail,
  Login,
  logout,
  forgotPassword,
  verifyCode,
  resetPassword,
} from "../controller/authController";
import { VerifyingToken } from "../middleware/VerifyingToken";
import validateRequest from "../middleware/validateRequest";
import {
  CreateUserSchema,
  Loginuser,
  Firstemailvalidate,
  Verifycode,
  ResetPassword,
} from "../utils/Validate";

const authroute: Router = express.Router();

//signup
authroute.post("/signup", validateRequest(CreateUserSchema), Signup);
//verify otp
authroute.get("/verify", VerifyEmail);
//login
authroute.post("/login", validateRequest(Loginuser), Login);

//resetpassword
authroute.post(
  "/forgetpassword",
  validateRequest(Firstemailvalidate),
  forgotPassword
);
//verifycode
authroute.post("/verifycode", validateRequest(Verifycode), verifyCode);
//resetpassword
authroute.put("/resetpassword", validateRequest(ResetPassword), resetPassword);
//logout
authroute.get("/logout", VerifyingToken, logout);
export default authroute;
