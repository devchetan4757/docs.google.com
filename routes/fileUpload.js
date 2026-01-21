import express from "express";
import cloudinary from "../config/cloudinary.js";
import UploadedFile from "../models/UploadedFile.js";

const router = express.Router();

router.post("/file-upload", async (req, res) => {
  try {
    const { file, filename } = req.body; // ⚠️ make sure frontend sends { file, filename }

    if (!file || !filename) {
      console.error("Missing file or filename");
      return res.status(400).json({ success: false, error: "Missing file or filename" });
    }

    // Upload file to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(file, { folder: "user_files" });
    console.log("User file uploaded:", uploadRes.secure_url);

    // Save to MongoDB (use field names that match your schema)
    const savedFile = await UploadedFile.create({
      fileData: uploadRes.secure_url, // must match schema's required field
      filename
    });

    res.json({ success: true, url: uploadRes.secure_url, id: savedFile._id });

  } catch (err) {
    console.error("FILE UPLOAD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
