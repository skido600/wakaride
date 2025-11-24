import mongoose from "mongoose";
export type signupType = {
  full_name: string;
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
  role: "client" | "driver" | "admin";
};

export type LoginType = {
  Email_Username: string;
  password: string;
};

export type resetOtp = {
  resetToken: string;
  newPassword: string;
  confirmNewpassword: string;
};
export interface Driver extends mongoose.Document {
  authId: mongoose.Types.ObjectId;
  driverId: string;
  discountPrice: number;
  currentLocation: any;
  licenseNumber: string;
  isDriver: boolean;
  phone: string;
  truckType: string;
  country: string;
  state: string;
  town: string;
  location: any;
  price: number;
  isDriverRequest: boolean;
  verified: boolean;
  rating: number;
  images: any;
  description: string;
  status: "pending" | "approved" | "rejected" | "none";
  experience: number;
  truckImagesDriver?: mongoose.Types.ObjectId | null;
}
