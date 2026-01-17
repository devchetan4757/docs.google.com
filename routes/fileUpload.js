import express from "express";
import cloudinary from "../config/cloudinary.js";
import UploadedFile from "../models/UploadedFile.js";

const router = express.Router();

// Log incoming requests
router.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

router.post("/file-upload", async (req, res) => {
  try {
    const { file, filename } = req.body;

    if (!file) {
      console.log("No file received");
      return res.status(400).json({ error: "No file received" });
    }
    if (!filename) {
      console.log("No filename provided");
      return res.status(400).json({ error: "No filename provided" });
    }

    // Upload user file to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(file, { folder: "user_files" });
    console.log("User file uploaded:", uploadRes.secure_url);

    // Save file info to MongoDB
    const uploadedFile = await UploadedFile.create({
      fileUrl: uploadRes.secure_url,
      filename
    });

    console.log("File saved to MongoDB:", uploadedFile._id);
    res.json({ success: true, url: uploadRes.secure_url });

  } catch (err) {
    console.error("FILE UPLOAD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
