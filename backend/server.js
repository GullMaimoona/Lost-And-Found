const createItemRouter = require("./routes/itemRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("node:path");
const { createCorsOptions } = require("./lib/corsConfig");
require("dotenv").config();

const app = express();

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: "8mb" }));
app.use("/api/items", createItemRouter());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(__dirname, "../frontend/dist");
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/")) return next();
    return res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Lost and Found API is running!");
  });
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  });
