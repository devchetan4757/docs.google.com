import express from "express";
import dotenv from "dotenv";
import connectMongo from "./config/mongo.js";
import uploadRoute from "./routes/upload.js";

dotenv.config();
connectMongo();

const app = express();

// JSON parsing for POST requests
app.use(express.json({ limit: "10mb" }));

// -------------------
// CORS: Allow frontend hosted on GitHub Pages
// -------------------
import cors from "cors";
app.use(cors({
  origin: "https://devchetan4757.github.io", // your GitHub Pages URL
}));

// API routes
app.use("/api", uploadRoute);

// -------------------
// Health check route (optional, useful for Render + uptime pings)
// -------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend running!" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
