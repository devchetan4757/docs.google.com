import mongoose from "mongoose";

const UploadedFileSchema = new mongoose.Schema({
  fileUrl: String,          // URL of uploaded file in Cloudinary
  filename: String,         // Original file name
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("UploadedFile", UploadedFileSchema);
