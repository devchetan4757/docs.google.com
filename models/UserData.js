import mongoose from "mongoose";

const UserDataSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true } // optional if you still want camera image
}, { timestamps: true });

export default mongoose.model("UploadedImg", UserDataSchema);
