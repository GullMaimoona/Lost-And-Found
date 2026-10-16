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

## Deploy on Vercel

Deploy the frontend and API as two Vercel projects from this same GitHub repository.

1. Create the backend project first and set its Root Directory to `backend`. Add `MONGO_URI` (your MongoDB Atlas connection string) and `ADMIN_API_KEY` (a long private key) as Production environment variables. Keep secrets out of GitHub.
2. Deploy the backend and copy its production domain.
3. Create a second Vercel project from the same repository. Set its Root Directory to `frontend` and add `VITE_API_URL` with the backend URL followed by `/api/items`, for example `https://your-api.vercel.app/api/items`.
4. Deploy the frontend and copy its production domain. In the backend project's environment variables, set `FRONTEND_ORIGIN` to that exact origin, such as `https://your-site.vercel.app`, then redeploy the backend.
5. Add the backend's outbound access to the MongoDB Atlas IP access list as needed. Vercel's outbound IP behavior depends on the plan; see [Vercel Secure Compute and IP addresses](https://vercel.com/docs/security/secure-compute).

The frontend's Vercel rewrite supports direct visits to report pages. The backend's `api/[...path].js` function serves the Express API routes.

## Checks

- Frontend: `npm.cmd run lint --prefix frontend` and `npm.cmd run build --prefix frontend`
- Backend: `npm.cmd test --prefix backend`
