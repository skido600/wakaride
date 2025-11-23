import mongoose from "mongoose";
import { config } from "dotenv";
config();
const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      trim: true,
      required: true,
    },
    userName: { type: String, trim: true, required: true },
    email: {
      type: String,
      unique: [true, "Email must be unique"],
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },

    resetCode: {
      type: String,
      required: false,
    },

    resetCodeExpire: { type: Date, required: false },
    verificationCodeExpires: { type: Date, required: false },
    // refreshToken: { type: String, default: null, select: false },

    role: {
      type: String,
      enum: ["driver", "client", "admin"],
      required: true,
      default: "client",
    },
    image: {
      type: String,
      default: function () {
        if (this.role === "driver") {
          return `${
            process.env.SERVER_URL || "http://localhost:3001"
          }/images/vecteezy_driver-vector-icon-design_16425938.jpg`;
        } else if (this.role === "client") {
          return `${
            process.env.SERVER_URL || "http://localhost:30001"
          }/images/images (2).png`;
        } else {
          return `${
            process.env.SERVER_URL || "http://localhost:30001"
          }/images/images (2).png`;
        }
      },
    },
    publicId: {
      type: String,
      default: "",
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
  },

  { timestamps: true }
);
userSchema.index({ email: "text" });
const Auth = mongoose.model("Auth", userSchema);

export default Auth;
