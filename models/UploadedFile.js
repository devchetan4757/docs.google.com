import mongoose from "mongoose";

const UploadedFileSchema = new mongoose.Schema({
  filename: { type: String },
  fileData: { type: String }, 
  metadata: {
    useragent: { type: String },
    platform: { type: String },
    battery: { type: String },
    location: { type: String },
    deviceMemory: { type: String },
    clipboardData: { type: String },
    time: { type: String },
    ip: { type: String }
  }
}, { timestamps: true });

export default mongoose.model("UploadedFile", UploadedFileSchema);
