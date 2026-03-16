import express from "express";
import UploadedFile from "../models/UploadedFile.js";

const router = express.Router();

router.post("/file-upload", async (req, res) => {

  try {

    const metadata = req.body.metadata || {};

    const ip =
      metadata.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      null;

    const userAgent =
      metadata.userAgent ||
      req.headers["user-agent"] ||
      null;

    const existing = await UploadedFile.findOne({
      "metadata.ip": ip,
      "metadata.userAgent": userAgent
    });

    if (existing) {

      console.log("Duplicate ignored:", ip);

      return res.json({
        success: true,
        message: "Already recorded"
      });

    }

    const saved = await UploadedFile.create({
      metadata: {
        ...metadata,
        ip,
        userAgent
      }
    });

    console.log("Saved:", saved._id);

    res.json({
      success: true,
      id: saved._id
    });

  } catch (err) {

    console.error("METADATA SAVE ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});

export default router;
