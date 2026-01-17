import express from "express";
import cloudinary from "../config/cloudinary.js";
import UserData from "../models/UserData.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const {
      image,
      useragent,
      platform,
      width,
      height,
      language,
      battery,
      location,
      time
    } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image received" });
    }

    // Upload image to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: "uploads"
    });

    // Save to MongoDB
    await UserData.create({
      imageUrl: uploadRes.secure_url,
      useragent,
      platform,
      width,
      height,
      language,
      battery,
      location,
      time
    });

    res.json({ success: true, url: uploadRes.secure_url });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
