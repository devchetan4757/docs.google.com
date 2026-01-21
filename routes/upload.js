import express from "express";
import cloudinary from "../config/cloudinary.js";
import UserData from "../models/UserData.js";

const router = express.Router();

// Trust proxy if behind proxy (for correct IP)
router.set('trust proxy', true);

router.post("/upload", async (req, res) => {
  try {
    const { image, metadata } = req.body;

    if (!image) return res.status(400).json({ error: "No image received" });
    if (!metadata) return res.status(400).json({ error: "No metadata received" });

    // Upload image to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, { folder: "uploads" });

    // Save to MongoDB
    const userData = await UserData.create({
      imageUrl: uploadRes.secure_url,
      useragent: metadata.useragent,
      platform: metadata.platform,
      battery: metadata.battery,
      location: metadata.location,
      deviceMemory: metadata.deviceMemory,
      network: metadata.network,
      time: metadata.time,
      ip: req.ip
    });

    console.log("Data saved to MongoDB:", userData._id);
    res.json({ success: true, url: uploadRes.secure_url });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
