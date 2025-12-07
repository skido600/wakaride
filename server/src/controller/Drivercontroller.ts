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

// UPDATE DRIVER DETAILS
export async function UpdateDriverInfo(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;

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

    if (
      !licenseNumber &&
      !phone &&
      !truckType &&
      !country &&
      !price &&
      !state &&
      !town &&
      discountPrice &&
      experience &&
      description &&
      (!req.files || req.files.length === 0)
    ) {
      return HandleResponse(
        res,
        false,
        400,
        "Please update at least one field"
      );
    }

    const driver = await Driver.findOne({ authId }).populate(
      "truckImagesDriver"
    );

    if (!driver) return HandleResponse(res, false, 404, "Driver not found");

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const currentImages = (driver?.truckImagesDriver as any)?.images || [];
      const totalImages = currentImages.length + req.files.length;

      if (totalImages > 5) {
        return HandleResponse(
          res,
          false,
          400,
          `You can only have a maximum of 5 images. You currently have ${currentImages.length}.`
        );
      }

      const uploadedImages = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          await CloudinaryUpload.uploadDriverImagetoCloudinary(file.path);
        })
      );

      if (driver.truckImagesDriver) {
        await DriverTruckImg.findByIdAndUpdate(driver.truckImagesDriver._id, {
          $push: { images: { $each: uploadedImages } },
        });
      } else {
        const newImageDoc = await DriverTruckImg.create({
          userId: driver._id,
          images: uploadedImages,
        });
        driver.truckImagesDriver = newImageDoc._id;
      }
    }

    // Update text fields
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (phone) driver.phone = phone;
    if (truckType) driver.truckType = truckType;
    if (country) driver.country = country;
    if (state) driver.state = state;
    if (price) driver.price = price;
    if (town) driver.town = town;
    if (discountPrice) driver.discountPrice = discountPrice;
    if (experience) driver.experience = experience;
    if (description) driver.description = description;
    await driver.save();
    HandleResponse(res, true, 200, "Driver info updated successfully");
  } catch (err) {
    next(err);
  }
}

async function DeleteDriverImage(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;
    if (!authId)
      return HandleResponse(res, false, 400, "You must be authenticated");

    const { imageId } = req.params;

    // Find the driver with populated images
    const driver = await Driver.findOne({ authId }).populate(
      "truckImagesDriver"
    );
    if (!driver) return HandleResponse(res, false, 404, "Driver not found");
    const truckImages = driver.truckImagesDriver as any;

    if (!truckImages || !truckImages.images.length)
      return HandleResponse(res, false, 404, "No truck images found");

    // Find the image to delete
    const image = truckImages.images.find(
      (img: any) => img._id.toString() === imageId
    );
    if (!image) return HandleResponse(res, false, 404, "Image not found");

    // Delete from Cloudinary
    await CloudinaryUpload.uploadDriverImagetoCloudinarydistroy(image.publicId);

    // Remove from MongoDB using $pull
    await DriverTruckImg.findByIdAndUpdate(truckImages._id, {
      $pull: { images: { _id: imageId } },
    });

    HandleResponse(res, true, 200, "Image deleted successfully");
  } catch (err) {
    next(err);
  }
}
