import { cloudinary } from "../utils/cloudinary";

const uploadProfileImageToCloudinary = async (filePath: string) => {
  console.log(cloudinary.config());
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "user_dp",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};
export default uploadProfileImageToCloudinary;
