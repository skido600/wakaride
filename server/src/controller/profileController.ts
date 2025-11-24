import type { Response, NextFunction } from "express";
import { HandleResponse } from "../utils/Response";
import Auth from "../models/userSchema";
import argon2 from "argon2";
import fs from "fs";

import { cloudinary } from "../utils/cloudinary";
import { CloudinaryUpload } from "../config/uploadTocloud";

export async function DriverEditprofileNames(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      userName,
      full_name,
    }: {
      userName: string;
      full_name: string;
    } = req.body;
    const authuser = req.user._id;

    if (!authuser) {
      return HandleResponse(res, false, 404, "unauthorized user");
    }

    const user = await Auth.findById(authuser);

    if (!user) {
      return HandleResponse(res, false, 400, "user not found");
    }
    user.userName = userName;
    user.full_name = full_name;
    await user.save();
    return HandleResponse(res, true, 200, "Profile updated successfully", user);
  } catch (error) {
    next(error);
  }
}

//forgetpassword
export async function Editprofilepassword(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authuser = req.user._id;
    const {
      oldpassword,
      password,
    }: {
      oldpassword: string;
      password: string;
    } = req.body;

    if (!authuser) {
      return HandleResponse(res, false, 404, "unauthorized user");
    }
    const user = await Auth.findById(authuser).select("+password");

    if (!user) {
      return HandleResponse(res, false, 400, "user not found");
    }
    const validPassword = await argon2.verify(oldpassword, user.password);
    if (!validPassword) {
      return HandleResponse(res, false, 400, "Incorrect old password");
    }
    const hashnewpassword = await argon2.hash(password);
    user.password = hashnewpassword;
    await user.save();
    return HandleResponse(res, true, 200, "Password updated successfully");
  } catch (error) {
    next(error);
  }
}

//updateuserimage
export const updateProfileImage = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) return HandleResponse(res, false, 401, "Unauthorized");
    const user = await Auth.findById(userId);
    if (!user) return HandleResponse(res, false, 404, "User not found");
    if (!req.file) return HandleResponse(res, false, 404, "image not found");

    if (user.publicId) {
      await cloudinary.uploader.destroy(user.publicId);
    }

    const result = await CloudinaryUpload.uploadProfileImageToCloudinary(
      req.file.path
    );
    fs.unlinkSync(req.file.path);
    user.image = result.url;
    user.publicId = result.publicId;
    await user.save();

    HandleResponse(res, true, 200, "Profile updated successfully", user);
  } catch (err) {
    console.error(err);
    next(err);
  }
};
