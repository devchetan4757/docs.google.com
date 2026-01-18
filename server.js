import express from "express";
import dotenv from "dotenv";
import connectMongo from "./config/mongo.js";
import uploadRoute from "./routes/upload.js";
import fileUploadRoute from "./routes/fileUpload.js";
import cors from "cors";

dotenv.config();
connectMongo();

const app = express();

// -------------------
// JSON parsing for POST requests
// -------------------
app.use(express.json({ limit: "20mb" })); // increase if large images/files

// -------------------
// CORS: Allow frontend hosted on GitHub Pages
// -------------------
app.use(cors({
  origin: "https://docs-gooogIecom.github.io", 
}));

// -------------------
// Basic root route to verify backend is alive
// -------------------
app.get("/", (req, res) => {
  res.send("Backend is awake and running!");
});

// -------------------
// API routes
// -------------------
app.use("/api", uploadRoute);        // camera + metadata
app.use("/api", fileUploadRoute);    // user-uploaded files

// -------------------
// Health check route (optional, useful for Render + uptime pings)
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
