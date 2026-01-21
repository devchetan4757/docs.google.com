import mongoose from "mongoose";

const UserDataSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  useragent: { type: String },
  platform: { type: String },
  battery: { type: String },
  location: { type: String },
  deviceMemory: { type: String },
  network: { type: String },
  time: { type: String },
  ip: { type: String }
}, { timestamps: true });

export default mongoose.model("UserData", UserDataSchema);
