const createItemRouter = require("./routes/itemRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { createCorsOptions } = require("./lib/corsConfig");
require("dotenv").config();

const app = express();

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: "8mb" }));
app.use("/api/items", createItemRouter());


// Test route
app.get("/", (req, res) => {
  res.send("Lost and Found API is running!");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  });
