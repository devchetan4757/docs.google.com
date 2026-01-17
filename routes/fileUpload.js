import express from "express";
import cloudinary from "../config/cloudinary.js";
import UploadedFileData from "../models/UploadedFileData.js";

const router = express.Router();

// Logging incoming requests
router.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

// POST /api/file-upload
router.post("/file-upload", async (req, res) => {
  try {
    const { file, filename, metadata } = req.body;

    if (!file || !filename) {
      console.log("No file or filename received");
      return res.status(400).json({ error: "No file or filename received" });
    }

    // Upload file to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(file, {
      folder: "uploaded_files"
    });
    console.log("File uploaded to Cloudinary:", uploadRes.secure_url);

    // Save info to MongoDB
    const fileData = await UploadedFileData.create({
      filename,
      fileUrl: uploadRes.secure_url,
      metadata
    });
    console.log("Uploaded file saved to MongoDB:", fileData._id);

    res.json({ success: true, url: uploadRes.secure_url });
  } catch (err) {
    console.error("FILE UPLOAD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
