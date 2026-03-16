import express from "express";
import UploadedFile from "../models/UploadedFile.js";

const router = express.Router();

router.post("/file-upload", async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata) {
      console.log("⚠️ No metadata received");
      return res.json({ success: false });
    }

    // Ensure userAgent exists
    const userAgent = metadata.userAgent || req.headers["user-agent"] || "Unknown";

    // Reliable IP detection
    const ip =
      metadata.ip && metadata.ip !== "N/A"
        ? metadata.ip
        : (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown");

    // Check duplicate by IP + userAgent
    const existing = await UploadedFile.findOne({
      "metadata.ip": ip,
      "metadata.userAgent": userAgent
    });

    if (existing) {
      console.log("⚠️ Duplicate metadata ignored for IP:", ip);
      return res.json({ success: true, message: "Already recorded" });
    }

    // Save full metadata
    const savedDoc = await UploadedFile.create({
      metadata: { ...metadata, ip, userAgent },
    });

    console.log("✅ Metadata saved:", savedDoc._id);

    res.json({ success: true, id: savedDoc._id });
  } catch (err) {
    console.error("❌ METADATA SAVE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
