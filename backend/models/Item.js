
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    color: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    date: {
      type: Date,
      required: true,
    },
    image: {
      type: String,
      maxlength: 7100000,
      match: /^data:image\/(jpeg|png|webp);base64,/,
    },
    status: {
      type: String,
      enum: ["Lost", "Found"],
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
