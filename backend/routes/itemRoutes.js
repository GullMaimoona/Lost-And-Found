
const express = require("express");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const { validateItemPayload } = require("../lib/itemValidation");
const Item = require("../models/Item");

function createItemRouter(ItemModel = Item, { adminApiKey = process.env.ADMIN_API_KEY } = {}) {
  const router = express.Router();
  const publicItem = (item) => {
    const value = typeof item.toObject === "function" ? item.toObject() : { ...item };
    delete value.contactEmail;
    return value;
  };

  function requireAdmin(req, res, next) {
    const suppliedKey = req.get("x-admin-key");
    if (!adminApiKey) {
      return res.status(503).json({ message: "Admin actions are not configured." });
    }
    if (!suppliedKey) {
      return res.status(401).json({ message: "Admin authorization is required." });
    }

    const expected = Buffer.from(adminApiKey);
    const supplied = Buffer.from(suppliedKey);
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      return res.status(401).json({ message: "Admin authorization is invalid." });
    }
    return next();
  }

  router.get("/", async (req, res) => {
    try {
      const items = await ItemModel.find().sort({ createdAt: -1 });
      res.status(200).json(items.map(publicItem));
    } catch (error) {
      res.status(500).json({ message: "Could not load items." });
    }
  });

  router.get("/admin/verify", requireAdmin, (req, res) => {
    res.status(200).json({ authorized: true });
  });

  router.get("/admin/items/:id", requireAdmin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Item ID is invalid." });
    try {
      const query = ItemModel.findById(req.params.id);
      if (query && typeof query.select === "function") query.select("+contactEmail");
      const item = await query;
      if (!item) return res.status(404).json({ message: "Item not found." });
      return res.status(200).json(typeof item.toObject === "function" ? item.toObject() : item);
    } catch {
      return res.status(500).json({ message: "Could not load this item." });
    }
  });

  router.get("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Item ID is invalid." });
    }
    try {
      const item = await ItemModel.findById(req.params.id);
      if (!item) return res.status(404).json({ message: "Item not found." });
      return res.status(200).json(publicItem(item));
    } catch {
      return res.status(500).json({ message: "Could not load this item." });
    }
  });

  router.get("/:id/contact", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Item ID is invalid." });
    try {
      const query = ItemModel.findById(req.params.id);
      if (query && typeof query.select === "function") query.select("+contactEmail");
      const item = await query;
      if (!item) return res.status(404).json({ message: "Item not found." });
      const value = typeof item.toObject === "function" ? item.toObject() : item;
      if (!value.contactEmail) return res.status(404).json({ message: "The reporter has not added a contact email yet." });
      return res.status(200).json({ email: value.contactEmail });
    } catch {
      return res.status(500).json({ message: "Could not open the contact option." });
    }
  });

  router.post("/", async (req, res) => {
    const { value, errors } = validateItemPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors.join(" "), errors });
    }

    try {
      const newItem = new ItemModel(value);
      const savedItem = await newItem.save();
      return res.status(201).json(savedItem);
    } catch (error) {
      if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: "Could not save the report." });
    }
  });

  router.patch("/:id", requireAdmin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Item ID is invalid." });
    }
    const editableFields = ["title", "description", "category", "location", "color", "date", "status", "image", "contactEmail"];
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) || !editableFields.some((field) => Object.hasOwn(req.body, field))) {
      return res.status(400).json({ message: "Provide at least one item field to update." });
    }
    try {
      const query = ItemModel.findById(req.params.id);
      if (query && typeof query.select === "function") query.select("+contactEmail");
      const item = await query;
      if (!item) return res.status(404).json({ message: "Item not found." });

      const existing = typeof item.toObject === "function" ? item.toObject() : item;
      const current = {
        ...existing,
        date: existing.date instanceof Date ? existing.date.toISOString() : existing.date,
      };
      const { value, errors } = validateItemPayload({ ...current, ...req.body });
      if (errors.length) {
        return res.status(400).json({ message: errors.join(" "), errors });
      }

      Object.assign(item, value);
      if (Object.hasOwn(req.body, "image") && (req.body.image === null || req.body.image === "")) {
        item.image = undefined;
      }
      const savedItem = await item.save();
      return res.status(200).json(savedItem);
    } catch (error) {
      if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Could not update this item." });
    }
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Item ID is invalid." });
    }
    try {
      const item = await ItemModel.findById(req.params.id);
      if (!item) return res.status(404).json({ message: "Item not found." });
      await item.deleteOne();
      return res.status(200).json({ message: "Item deleted." });
    } catch {
      return res.status(500).json({ message: "Could not delete this item." });
    }
  });

  return router;
}

module.exports = createItemRouter;
