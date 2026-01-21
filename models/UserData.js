import mongoose from "mongoose";

const UserDataSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },  // captured camera image URL/base64
  useragent: { type: String },
  platform: { type: String },
  battery: { type: String },
  location: { type: String },
  time: { type: String },
  deviceMemory: { type: String },
  ip: { type: String }
}, { timestamps: true });

export default mongoose.model("UserData", UserDataSchema);
