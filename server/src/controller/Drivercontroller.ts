import type { Response, NextFunction } from "express";
import { HandleResponse } from "../utils/Response";
import Driver from "../models/Driver_model";
import { CloudinaryUpload } from "../config/uploadTocloud";
import DriverTruckImg from "../models/drivertruckImage";
import fs from "fs";
import { queue as emailworker } from "../utils/emailworker.ts";
import { verifyDriverApplication } from "../config/GeminiDriverTruckVerifiation";

//DRIVER APPLICATION
export async function Drivercontroller(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      licenseNumber,
      phone,
      truckType,
      country,
      state,
      town,
      price,
      discountPrice,
      experience,
      description,
    } = req.body;

    const authId = req.user?._id;

    if (!authId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }

    // Check if user already has a pending/approved driver request
    const existingDriver = await Driver.findOne({ authId });
    if (existingDriver) {
      if (existingDriver.status === "approved") {
        return HandleResponse(
          res,
          false,
          400,
          "Your request has already been approved. Don't apply again."
        );
      }
      if (existingDriver.status === "pending") {
        return HandleResponse(
          res,
          false,
          400,
          "Your driver request is still pending admin approval."
        );
      }
    }

    // Validate uploaded files
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return HandleResponse(
        res,
        false,
        400,
        "Please upload at least one image of your truck or vehicle."
      );
    }

    const files = req.files as Express.Multer.File[];
    // Convert ONLY the first image to base64 for Gemini
    const firstImage: any = files[0];
    const imagePath: any = firstImage.path;
    if (!fs.existsSync(imagePath)) {
      return HandleResponse(res, false, 400, "Uploaded image not found.");
    }
    const base64Image = fs.readFileSync(imagePath).toString("base64");
    const rawResponse = await verifyDriverApplication(
      {
        licenseNumber,
        phone,
        truckType,
        country,
        state,
        town,
        price,
        discountPrice,
        experience,
        description,
      },
      base64Image
    );
    if (!rawResponse.result.valid) {
      const driverEmail = req.user?.email;
      const userObj = req.user;
      if (driverEmail) {
        await emailworker.add(
          "send-email",
          {
            type: "result",
            user: userObj,
            result: {
              name: userObj.full_name,
              header: rawResponse.result.header,
              issues: `<ul>${rawResponse.result.issues
                .map((issue: any) => `<li>${issue}</li>`)
                .join("")}</ul>`,
            },
          },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 3000 },
            removeOnComplete: true,
            removeOnFail: true,
          }
        );
      }
      return HandleResponse(
        res,
        false,
        400,
        "Driver application failed AI verification",
        { issues: rawResponse.result.issues }
      );
    }
    //upload to cloudinary and delete
    const uploadedImages = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        const result = await CloudinaryUpload.uploadDriverImagetoCloudinary(
          file
        );

        // Delete the local file after successful upload
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return result;
      })
    );
    const driver = await Driver.create({
      authId,
      licenseNumber,
      phone,
      truckType,
      country,
      state,
      town,
      price,
      discountPrice,
      description,
      experience,
      status: "pending",
    });

    const Drivertruck = new DriverTruckImg({
      userId: driver._id,
      images: uploadedImages,
    });

    await Drivertruck.save();
    driver.truckImagesDriver = Drivertruck._id;
    await driver.save();

    HandleResponse(
      res,
      true,
      201,
      "Driver application submitted. Waiting for admin approval.",
      driver
    );
  } catch (error) {
    next(error);
  }
}
