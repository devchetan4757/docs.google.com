import mongoose from "mongoose";

const MetadataSchema = new mongoose.Schema({
  userAgent: { type: String, default: null },
  platform: { type: String, default: null },
  language: { type: String, default: null },
  languages: { type: [String], default: [] },
  cookiesEnabled: { type: Boolean, default: null },

  screen: {
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    pixelRatio: { type: Number, default: null }
  },

  viewport: {
    width: { type: Number, default: null },
    height: { type: Number, default: null }
  },

  hardware: {
    deviceMemory: { type: Number, default: null },
    cpuCores: { type: Number, default: null }
  },

  battery: {
    level: { type: Number, default: null },
    charging: { type: Boolean, default: null }
  },

  location: {
    lat: { type: Number, default: null },
    lon: { type: Number, default: null }
  },

  network: {
    type: { type: String, default: null },
    downlink: { type: Number, default: null },
    rtt: { type: Number, default: null }
  },

  timezone: { type: String, default: null },
  time: { type: String, default: null },
  ip: { type: String, default: null }

}, { _id: false });

const UploadedFileSchema = new mongoose.Schema({
  filename: { type: String, default: null },
  fileData: { type: String, default: null },
  metadata: { type: MetadataSchema, default: {} }
}, { timestamps: true });

export default mongoose.model("UploadedFile", UploadedFileSchema);
