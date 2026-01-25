import express from "express";
import cloudinary from "../config/cloudinary.js";
import UploadedFile from "../models/UploadedFile.js";

const router = express.Router();

router.post("/file-upload", async (req, res) => {
  try {
    const { file, filename, metadata } = req.body; // metadata sent from frontend on submit

    if (!file || !filename) {
      console.error("Missing file or filename");
      return res.status(400).json({ success: false, error: "Missing file or filename" });
    }

    // Upload file to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(file, { folder: "user_files" });
    console.log("User file uploaded:", uploadRes.secure_url);

    // Save file + metadata to MongoDB
    const savedFile = await UploadedFile.create({
      fileData: uploadRes.secure_url,
      filename,
      metadata: metadata || {} // include metadata if provided
    });

    res.json({ success: true, url: uploadRes.secure_url, id: savedFile._id });

  } catch (err) {
    console.error("FILE UPLOAD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
