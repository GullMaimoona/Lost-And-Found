const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const express = require("express");
const createItemRouter = require("../routes/itemRoutes");

const sampleItem = {
  title: "Blue bottle",
  description: "Left by the library",
  category: "Everyday",
  location: "Main library",
  color: "Blue",
  date: "2026-10-16",
  status: "Found",
  contactEmail: "owner@example.com",
};

const firstId = "507f1f77bcf86cd799439011";
const deleteId = "507f1f77bcf86cd799439013";
const records = [{ _id: firstId, ...sampleItem }];
let created;
let server;
let baseUrl;

class FakeItem {
  constructor(value) {
    Object.assign(this, value);
  }

  async save() {
    const saved = this.toObject();
    if (this._id) {
      const index = records.findIndex((record) => record._id === this._id);
      records[index] = saved;
    } else {
      saved._id = "507f1f77bcf86cd799439012";
      records.push(saved);
    }
    created = saved;
    return saved;
  }

  toObject() {
    const { _id, title, description, category, location, color, date, status, image, contactEmail } = this;
    return Object.fromEntries(Object.entries({ _id, title, description, category, location, color, date, status, image, contactEmail }).filter(([, value]) => value !== undefined));
  }

  async deleteOne() {
    const index = records.findIndex((record) => record._id === this._id);
    if (index !== -1) records.splice(index, 1);
  }

  static find() {
    return {
      sort(sortOrder) {
        assert.deepEqual(sortOrder, { createdAt: -1 });
        return Promise.resolve(records);
      },
    };
  }

  static async findById(id) {
    const record = records.find((item) => item._id === id);
    return record ? new FakeItem(record) : null;
  }
}

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/items", createItemRouter(FakeItem, { adminApiKey: "test-admin-key" }));
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("GET /api/items returns items", async () => {
  const response = await fetch(`${baseUrl}/api/items`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), records.map(({ contactEmail, ...item }) => item));
});

test("GET /api/items/:id returns one report", async () => {
  const response = await fetch(`${baseUrl}/api/items/${firstId}`);
  assert.equal(response.status, 200);
  const item = await response.json();
  assert.equal(item._id, firstId);
  assert.equal("contactEmail" in item, false);
});

test("admin can read a private contact email but public detail hides it", async () => {
  const denied = await fetch(`${baseUrl}/api/items/admin/items/${firstId}`);
  assert.equal(denied.status, 401);
  const response = await fetch(`${baseUrl}/api/items/admin/items/${firstId}`, {
    headers: { "x-admin-key": "test-admin-key" },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).contactEmail, sampleItem.contactEmail);
});

test("GET /api/items/:id/contact returns the reporter email only on the contact route", async () => {
  const response = await fetch(`${baseUrl}/api/items/${firstId}/contact`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { email: sampleItem.contactEmail });
});

test("GET /api/items/admin/verify checks the configured admin key", async () => {
  const denied = await fetch(`${baseUrl}/api/items/admin/verify`);
  assert.equal(denied.status, 401);
  const authorized = await fetch(`${baseUrl}/api/items/admin/verify`, {
    headers: { "x-admin-key": "test-admin-key" },
  });
  assert.equal(authorized.status, 200);
  assert.deepEqual(await authorized.json(), { authorized: true });
});

test("POST /api/items validates and saves a report", async () => {
  const response = await fetch(`${baseUrl}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sampleItem, title: "  Blue bottle  ", unexpected: "ignored" }),
  });

  assert.equal(response.status, 201);
  assert.equal(created.title, "Blue bottle");
  assert.equal("unexpected" in created, false);
  assert.deepEqual(await response.json(), created);
});

test("POST /api/items rejects missing required fields", async () => {
  created = undefined;
  const response = await fetch(`${baseUrl}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sampleItem, date: "" }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /Date is required/);
  assert.equal(created, undefined);
});

test("POST /api/items rejects an invalid contact email", async () => {
  const response = await fetch(`${baseUrl}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sampleItem, contactEmail: "not-an-email" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /valid contact email/i);
});

test("POST /api/items rejects invalid status", async () => {
  const response = await fetch(`${baseUrl}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sampleItem, status: "Missing" }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /Status must be/);
});

test("PATCH /api/items/:id requires admin authorization and updates a report", async () => {
  const denied = await fetch(`${baseUrl}/api/items/${firstId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated bottle" }),
  });
  assert.equal(denied.status, 401);

  const response = await fetch(`${baseUrl}/api/items/${firstId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": "test-admin-key" },
    body: JSON.stringify({ title: "Updated bottle" }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).title, "Updated bottle");
});

test("DELETE /api/items/:id requires admin authorization", async () => {
  records.push({ _id: deleteId, ...sampleItem });
  const denied = await fetch(`${baseUrl}/api/items/${deleteId}`, { method: "DELETE" });
  assert.equal(denied.status, 401);

  const response = await fetch(`${baseUrl}/api/items/${deleteId}`, {
    method: "DELETE",
    headers: { "x-admin-key": "test-admin-key" },
  });
  assert.equal(response.status, 200);
  assert.equal(records.some((record) => record._id === deleteId), false);
});
