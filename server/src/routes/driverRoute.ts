import express from "express";
import type { Router } from "express";
import { VerifyingToken } from "../middleware/VerifyingToken";
import { allowRoles } from "../middleware/rolemiddleware";
import { Drivercontroller } from "../controller/Drivercontroller";
import validateRequest from "../middleware/validateRequest";
import { Driverdetails } from "../utils/Validate";
import upload from "../utils/multer";

const driverRoute: Router = express.Router();
driverRoute.post(
  "/request-driver",
  validateRequest(Driverdetails),
  VerifyingToken,
  allowRoles("driver"),
  upload.array("truckImagesDriver", 4),
  Drivercontroller
);
export default driverRoute;
