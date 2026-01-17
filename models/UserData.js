import mongoose from "mongoose";

const UserDataSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },       // captured camera image URL
  useragent: String,
  platform: String,
  width: Number,
  height: Number,
  language: String,
  battery: String,
  location: String,
  time: String
}, { timestamps: true });

export default mongoose.model("UserData", UserDataSchema);
