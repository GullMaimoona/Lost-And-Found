const assert = require("node:assert/strict");
const { test } = require("node:test");
const cors = require("cors");
const express = require("express");
const { createCorsOptions, getAllowedOrigins, isOriginAllowed } = require("../lib/corsConfig");

test("uses local Vite origins by default", () => {
  assert.deepEqual(getAllowedOrigins(""), [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
});

test("parses configured frontend origins", () => {
  assert.deepEqual(getAllowedOrigins("https://example.com, https://www.example.com "), [
    "https://example.com",
    "https://www.example.com",
  ]);
});

test("allows configured origins and originless requests only", () => {
  const origins = getAllowedOrigins("https://example.com");
  assert.equal(isOriginAllowed("https://example.com", origins), true);
  assert.equal(isOriginAllowed(undefined, origins), true);
  assert.equal(isOriginAllowed("https://unlisted.example", origins), false);
});

test("CORS middleware returns allow-origin only for configured sites", async () => {
  const app = express();
  app.use(cors(createCorsOptions(["https://allowed.example"])));
  app.get("/", (req, res) => res.json({ ok: true }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;

  try {
    const allowed = await fetch(url, { headers: { Origin: "https://allowed.example" } });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "https://allowed.example");

    const denied = await fetch(url, { headers: { Origin: "https://unlisted.example" } });
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
