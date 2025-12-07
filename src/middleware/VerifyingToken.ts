import type { Request, Response, NextFunction } from "express";
import pkg from "jsonwebtoken";
import { config } from "dotenv";
import { client } from "../utils/redis";
config();

const { verify, sign } = pkg;

interface AuthRequest extends Request {
  user?: {
    isVerified: boolean;
    isAdmin?: string;
    email?: string;
    full_name?: string;
    role: string;
    _id: string;
    userId: string;
  };
}

export const VerifyingToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  const isProduction = process.env.NODE_ENV === "production";

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access token missing" });
  }

  try {
    //  Verify access token
    const decoded = verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as any;

    // console.log("verify from middleware", decoded);
    req.user = decoded;
    return next();
  } catch (err: any) {
    console.log(" Access token expired. Attempting refresh...");

    if (!refreshToken) {
      return res.status(401).json({ message: "Token expired, login again" });
    }

    try {
      //  Verify refresh token format/signature
      const decodedRefresh = verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as any;

      // CHECK Redis stored token
      const redisToken = await client.get(`refresh:${decodedRefresh._id}`);

      if (!redisToken || redisToken !== refreshToken) {
        return res
          .status(401)
          .json({ message: "Invalid session, login again" });
      }

      //  Generate new access token
      const newAccessToken = sign(
        {
          userId: decodedRefresh.userId,
          email: decodedRefresh.email,
          isVerified: decodedRefresh.isVerified,
          _id: decodedRefresh._id,
          role: decodedRefresh.role,
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "15m" }
      );

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
      });

      req.user = decodedRefresh;
      console.log(" New access token generated");

      return next();
    } catch (refreshErr) {
      console.log(refreshErr);
      return res
        .status(401)
        .json({ message: "Invalid refresh token, login again" });
    }
  }
};
