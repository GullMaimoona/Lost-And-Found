# Lost and Found API

## Run locally

Install dependencies with `npm install`. If `.env` does not exist, copy `.env.example` to `.env`; otherwise preserve its current values and add any missing variables. Set `MONGO_URI` to your MongoDB connection string. Start the API with `npm start` or use `npm run dev` while developing. The API listens on port 5000 by default.

Set `FRONTEND_ORIGIN` to the frontend origin or comma-separated origins allowed to call the API from a browser. The default allowlist is the two common Vite development origins (`localhost:5173` and `127.0.0.1:5173`). Keep the production site origin in this variable when deploying. Set `ADMIN_API_KEY` to a long random secret before using item edit or delete routes.

## Endpoints

- `GET /api/items` returns public report fields, newest first. Reporter email addresses are omitted.
- `GET /api/items/:id` returns public fields for one report.
- `GET /api/items/:id/contact` returns the reporter email for the Signal contact action.
- `POST /api/items` creates a report. Item name, description, category, location, color, date, contact email, and `Lost`/`Found` status are required. An optional JPG, PNG, or WebP data URL is accepted for the image.
- `GET /api/items/admin/items/:id` returns the full report, including its private contact email. Requires the `x-admin-key` header.
- `PATCH /api/items/:id` updates supplied report fields. Requires the `x-admin-key` header.
- `DELETE /api/items/:id` deletes a report. Requires the `x-admin-key` header.
- `GET /` is a basic health response.

Run the automated API and configuration tests with `npm test`.
