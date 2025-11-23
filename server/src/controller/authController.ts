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
import type { signupType, LoginType, resetOtp } from "../types/types.ts";

//signup
export async function Signup(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      full_name,
      email,
      userName,
      password,
      confirmPassword,
      role,
    }: signupType = req.body;

    const user = await registerUser(
      full_name,
      email,
      userName,
      password,
      confirmPassword,
      role
    );

    HandleResponse(
      res,
      true,
      201,
      "User registered successfully. Check your email for verification.",
      {
        username: userName,
        email: user.email,
        isVerified: user.isVerified,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User already exists") {
        return HandleResponse(res, false, 409, error.message);
      } else if (error.message === "Passwords do not match") {
        return HandleResponse(res, false, 404, error.message);
      } else {
        next(error);
      }
    }
  }
}

//verificationemail
export async function VerifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.query.token as string;
    const message = await verifyEmailService(token);

    HandleResponse(res, true, 200, message);
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === "Verification token is required") {
        return HandleResponse(res, false, 400, error.message);
      } else if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (
        error.message ===
        "Verification link has expired. Please request a new one. when you want to login"
      ) {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "user already verified") {
        return HandleResponse(res, false, 409, error.message);
      } else {
        next(error);
      }
    }
  }
}

//login
export async function Login(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { Email_Username, password }: LoginType = req.body;
    const response = await LoginService(Email_Username, password);
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", response.refreshtoken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", response.accesstoken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });
    const user = {
      email: response.user.email,
      role: response.user.role,
      id: response.user._id,
    };
    HandleResponse(res, true, 200, "Login successful  ", user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "Incorrect password") {
        return HandleResponse(res, false, 400, error.message);
      } else if (
        error.message ===
        "Verification link expired. A new link has been sent to your email."
      ) {
        return HandleResponse(res, false, 401, error.message);
      } else if (
        error.message === "Email not verified. Please check your inbox."
      ) {
        return HandleResponse(res, false, 409, error.message);
      } else {
        next(error);
      }
    }
  }
}

//forget password
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const forgetpasswordres = await forgotPasswordService(email);

    return HandleResponse(
      res,
      true,
      200,
      forgetpasswordres.message,
      forgetpasswordres.email
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found invalid email or username") {
        return HandleResponse(res, false, 400, error.message);
      } else {
        next(error);
      }
    }
  }
};

//  verifyCode
export const verifyCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code } = req.body;
    const { tokenassign } = await verifyCodeService(email, code);
    console.log("token from", tokenassign);
    return HandleResponse(
      res,
      true,
      200,
      "Code verified sucessfully",
      tokenassign
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "Invalid or expired code") {
        return HandleResponse(res, false, 400, error.message);
      } else if (error.message === "OTP expired or not found") {
        return HandleResponse(res, false, 410, error.message);
      } else if (error.message === "Invalid OTP") {
        return HandleResponse(res, false, 400, error.message);
      } else {
        next(error);
      }
    }
  }
};

//resetpassword
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resetToken, newPassword, confirmNewpassword }: resetOtp = req.body;

    await resetPasswordService(resetToken, newPassword, confirmNewpassword);

    return HandleResponse(res, true, 200, "Password reset successful");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Passwords do not match") {
        return HandleResponse(res, false, 400, error.message);
      } else if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "OTP expired or not found") {
        return HandleResponse(res, false, 400, error.message);
      } else {
        next(error);
      }
    }
  }
};

//logout
export async function logout(req: any, res: Response, next: NextFunction) {
  try {
    if (!res.clearCookie) {
      throw new Error("res is not an Express Response object");
    }
    const userId = req.user?._id;

    if (userId) {
      await client.del(`refresh:${userId}`);
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    HandleResponse(res, true, 200, "User logged out successfully");
  } catch (err) {
    next(err);
  }
}
