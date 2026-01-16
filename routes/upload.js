import express from "express";
import cloudinary from "../config/cloudinary.js";
import UserData from "../models/UserData.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const { image, metadata } = req.body;

    // Upload image to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: "uploads"
    });

    // Save to MongoDB
    await UserData.create({
      imageUrl: uploadRes.secure_url,
      useragent: metadata.useragent,
      platform: metadata.platform,
      width: metadata.width,
      height: metadata.height,
      language: metadata.devicelang,
      battery: metadata.batterypercentage,
      location: metadata.gps,
      time: metadata.localtime
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
