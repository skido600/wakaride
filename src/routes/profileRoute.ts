import express from "express";
import type { Router } from "express";
import {
  DriverEditprofileNames,
  Editprofilepassword,
  updateProfileImage,
  getLastSeen,
} from "../controller/profileController";
import { VerifyingToken } from "../middleware/VerifyingToken";
import { allowRoles } from "../middleware/rolemiddleware";
import validateRequest from "../middleware/validateRequest";
import { changepassword, DriverEdit } from "../utils/Validate";
import upload from "../utils/multer";

const ProfileRoute: Router = express.Router();

ProfileRoute.put(
  "/driver_edit",
  validateRequest(DriverEdit),
  VerifyingToken,
  allowRoles("driver", "client"),
  DriverEditprofileNames
);
ProfileRoute.put(
  "/change_pass",
  validateRequest(changepassword),
  VerifyingToken,
  allowRoles("driver", "client"),
  Editprofilepassword
);
ProfileRoute.put(
  "/update-dp",
  VerifyingToken,
  upload.single("profileImage"),
  updateProfileImage
);

ProfileRoute.get("/last-seen", VerifyingToken, getLastSeen);

export default ProfileRoute;
