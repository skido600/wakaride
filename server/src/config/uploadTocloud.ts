import { cloudinary } from "../utils/cloudinary";

export class CloudinaryUpload {
  public static async uploadProfileImageToCloudinary(filePath: string) {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "user_dp",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
  public static async uploadDriverImagetoCloudinary(filePath: any) {
    const result = await cloudinary.uploader.upload(filePath.path, {
      folder: "driver_trucks",
      resource_type: "image",
    });
    return {
      originalName: filePath.originalname,
      publicId: result.public_id,
      url: result.secure_url,
    };
  }
}
