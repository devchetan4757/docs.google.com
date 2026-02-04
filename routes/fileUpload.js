import express from "express";
import UploadedFile from "../models/UploadedFile.js";

const router = express.Router();

router.post("/file-upload", async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata) {
      console.log("⚠️ No metadata received");
    }

    // ✅ Save ONLY metadata
    const savedDoc = await UploadedFile.create({
      metadata: metadata || {},
      createdAt: new Date()
    });

    console.log("✅ Metadata saved:", savedDoc._id);

    res.json({
      success: true,
      id: savedDoc._id
    });

  } catch (err) {
    console.error("❌ METADATA SAVE ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
