import mongoose from "mongoose";

const MetadataSchema = new mongoose.Schema({
  userAgent: { type: String, required: true },
  platform: { type: String },
  language: { type: String },
  languages: [{ type: String }],
  cookiesEnabled: { type: Boolean },

  screen: {
    width: Number,
    height: Number,
    pixelRatio: Number
  },

  viewport: {
    width: Number,
    height: Number
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

  timezone: { type: String },
  time: { type: String },
  ip: { type: String, required: true }
}, { _id: false });

const UploadedFileSchema = new mongoose.Schema({
  filename: { type: String, default: null },
  fileData: { type: String, default: null },
  metadata: { type: MetadataSchema, required: true }
}, { timestamps: true });

export default mongoose.model("UploadedFile", UploadedFileSchema);
