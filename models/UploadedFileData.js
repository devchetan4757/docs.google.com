import mongoose from "mongoose";

const UploadedFileDataSchema = new mongoose.Schema({
  filename: { type: String, required: true },   // Original uploaded file name
  fileUrl: { type: String, required: true },    // URL after uploading to Cloudinary
  metadata: {
    useragent: String,
    platform: String,
    width: Number,
    height: Number,
    language: String,
    battery: String,
    location: String,
    time: String,
  },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("UploadedFileData", UploadedFileDataSchema);
