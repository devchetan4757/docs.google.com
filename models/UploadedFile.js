import mongoose from "mongoose";

const UploadedFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  fileData: { type: String, required: true }, // base64 or URL
  metadata: {
    useragent: { type: String },
    platform: { type: String },
    battery: { type: String },
    location: { type: String },
    deviceMemory: { type: String },
    network: { type: String },
    time: { type: String },
    ip: { type: String }
  }
}, { timestamps: true });

export default mongoose.model("UploadedFile", UploadedFileSchema);
