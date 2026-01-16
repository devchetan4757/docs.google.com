import express from "express";
import dotenv from "dotenv";
import connectMongo from "./config/mongo.js";
import uploadRoute from "./routes/upload.js";
import path from "path";

dotenv.config();
connectMongo();

const app = express();

// JSON parsing for POST requests
app.use(express.json({ limit: "10mb" }));

// Serve frontend folder as static files
app.use(express.static(path.join("../frontend")));

// API routes
app.use("/api", uploadRoute);

// Fallback route to serve index.html for any unknown route
app.get("*", (req, res) => {
  res.sendFile(path.resolve("../frontend/index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
