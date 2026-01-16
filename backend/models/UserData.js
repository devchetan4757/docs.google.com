import mongoose from "mongoose";

const UserDataSchema = new mongoose.Schema({
  imageUrl: String,
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
