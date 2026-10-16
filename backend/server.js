const createItemRouter = require("./routes/itemRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { createCorsOptions } = require("./lib/corsConfig");
require("dotenv").config();

const app = express();

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.send("Lost and Found API is running!");
});

let databaseConnection;
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      databaseConnection ||= mongoose.connect(process.env.MONGO_URI).catch((error) => {
        databaseConnection = null;
        throw error;
      });
      await databaseConnection;
    }
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({ message: "Database is temporarily unavailable." });
  }
});

app.use("/api/items", createItemRouter());

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
