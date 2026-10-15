# Lost & Found

A React/Vite frontend and Express/MongoDB API for posting and finding lost items.

## Run locally

1. Install the backend and frontend dependencies:

   ```powershell
   npm.cmd ci --prefix backend
   npm.cmd ci --prefix frontend
   ```

2. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` and `ADMIN_API_KEY`.
3. Start the API with `npm.cmd start --prefix backend`.
4. In a second terminal, start the site with `npm.cmd run dev --prefix frontend`.

The Vite development site uses `http://localhost:5000/api/items` by default. Set `VITE_API_URL` to override it.

## Deploy on Render

The root `render.yaml` deploys the frontend and API together as one Render web service. It builds `frontend/dist`, serves it from Express, and uses `/api/health` for the health check. The production frontend calls the API on the same origin.

1. Push this repository to GitHub and connect it in the Render Dashboard using **New + > Blueprint**.
2. Render will ask for `MONGO_URI` and `ADMIN_API_KEY`. Use a cloud MongoDB connection string and a long random admin key; keep both values in Render's environment settings, never in GitHub.
3. Create/apply the Blueprint and wait for the health check to pass. The deployed site and API share the resulting `onrender.com` URL.

The local `.env` currently points at `127.0.0.1`, which is only reachable from the local machine. It cannot be used by Render. Create or use a MongoDB Atlas cluster, add the Render service's outbound IP addresses to the Atlas project's IP access list, and use an Atlas database user in the connection string. Atlas accepts connections only from IP addresses on that allowlist: [MongoDB Atlas IP access list docs](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

This Blueprint uses Render's free web-service plan. Render spins free services down after 15 minutes without requests; the next visit can take about a minute to wake up. See [Render free instance limits](https://render.com/docs/free).

## Checks

- Frontend: `npm.cmd run lint --prefix frontend` and `npm.cmd run build --prefix frontend`
- Backend: `npm.cmd test --prefix backend`
