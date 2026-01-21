import mongoose from "mongoose";

const UploadedFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  fileData: { type: String, required: true },  // base64
}, { timestamps: true });

export default mongoose.model("UploadedFile", UploadedFileSchema);
