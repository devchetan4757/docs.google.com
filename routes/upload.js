import express from "express";
import cloudinary from "../config/cloudinary.js";
import UserData from "../models/UserData.js";

const router = express.Router();

// Camera capture upload route
router.post("/upload", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: "No image received" });
    }

    // Upload image to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: "uploads",
    });

    // Save only image URL in MongoDB
    const userData = await UserData.create({
      imageUrl: uploadRes.secure_url,
    });

    console.log("Image URL saved to MongoDB:", userData._id);
    res.json({ success: true, url: uploadRes.secure_url });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
