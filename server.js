import express from "express";
import dotenv from "dotenv";
import connectMongo from "./config/mongo.js";
import uploadRoute from "./routes/upload.js";
import fileUploadRoute from "./routes/fileUpload.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
connectMongo();

const app = express();
app.set("trust proxy", true);

// -------------------
// JSON parsing
// -------------------
app.use(express.json({ limit: "20mb" }));

// -------------------
// CORS
// -------------------
app.use(cors()); // default allows all origins

// -------------------
// Serve frontend from /public folder
// -------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// -------------------
// Root route → index.html
// -------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------
// API routes
// -------------------
app.use("/api", uploadRoute);
app.use("/api", fileUploadRoute);

// -------------------
// Health check
// -------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend running!" });
});

// -------------------
// Start server
// -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
