import {
  type Request,
  type Response,
  type NextFunction,
  response,
} from "express";
import {
  LoginService,
  registerUser,
  verifyEmailService,
  verifyCodeService,
  resetPasswordService,
  forgotPasswordService,
} from "../services/authservice.ts";
import { HandleResponse } from "../utils/Response.ts";
import { client } from "../utils/redis";
