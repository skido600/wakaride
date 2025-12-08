import mongoose from "mongoose";

const UserSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    ip_address: { type: String },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const UserSession = mongoose.model("UserSession", UserSessionSchema);

export default UserSession;
