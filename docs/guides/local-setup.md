# DAWin — Local Development Setup

First-time setup guide. Estimated time: 10–15 minutes.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org or `nvm install 20` |
| npm | 10+ | bundled with Node 20 |
| Docker Desktop | any recent | https://www.docker.com/products/docker-desktop |

---

## Step 1 — Clone and install

```bash
git clone <repo-url> dawin
cd dawin

# Frontend dependencies
npm install

# Server dependencies
cd server && npm install && cd ..
```

---

## Step 2 — Start PostgreSQL

The project ships a `docker-compose.yml` with a pre-configured PostgreSQL 16 service.

```bash
docker compose up -d postgres
```

Verify it is running:

```bash
docker compose ps
```

You should see `postgres` with status `running`.

Connection string for local dev (already in `.env.example`):
```
postgresql://dawin:dawin_dev@localhost:5432/dawin
```

---

## Step 3 — Configure environment variables

```bash
cd server
cp .env.example .env
```

Open `server/.env` and confirm `DATABASE_URL` is set. The default value works with the docker-compose postgres service — no change needed for local dev.

Fill in the R2 variables if you need audio upload/streaming locally (see the R2 setup section below). The server starts without them; the audio routes will return 500 errors if R2 credentials are missing.

---

## Step 4 — Run the database migration

From the `server/` directory:

```bash
npx prisma migrate dev
```

On first run this generates `server/prisma/migrations/` and applies the baseline schema to your local PostgreSQL instance. Subsequent runs apply any pending migrations.

Verify the migration is clean:

```bash
npx prisma migrate status
```

Expected output: `All migrations have been applied.`

---

## Step 5 — Start the server

```bash
# From server/
npm start
```

The server starts on `http://localhost:3001` by default (configurable via `PORT`).

Health check:

```bash
curl http://localhost:3001/health
# {"status":"ok","ts":...}
```

---

## Step 6 — Start the frontend

In a second terminal, from the repo root:

```bash
npm run dev
```

The frontend starts on `http://localhost:5173` by default.

---

## R2 setup (audio upload and streaming)

Cloudflare R2 is used for audio file storage. You need four values:

| Variable | Where to find it |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare dashboard → top-right account menu, or the URL `dash.cloudflare.com/<account-id>` |
| `R2_ACCESS_KEY_ID` | Cloudflare dashboard → R2 → Manage R2 API Tokens → Create API Token → Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Same screen as above — Secret Access Key (shown once at creation) |
| `R2_BUCKET_NAME` | Cloudflare dashboard → R2 → create a bucket, copy the name |

Steps:
1. Log in to https://dash.cloudflare.com
2. Navigate to R2 in the left sidebar.
3. Create a bucket (e.g. `dawin-audio-dev`).
4. Under "Manage R2 API Tokens", create a token with **Object Read & Write** permissions scoped to your bucket.
5. Copy the Access Key ID and Secret Access Key into `server/.env`.
6. Copy your Cloudflare Account ID into `R2_ACCOUNT_ID`.
7. Set `R2_BUCKET_NAME` to the bucket name you created.

Restart the server after updating `.env`.

---

## Common issues

**`DATABASE_URL` is set but DB is unreachable**
The server exits on startup with an error logged. Make sure `docker compose up -d postgres` completed successfully and the container is healthy.

**Prisma client is out of date**
If you pull schema changes, run `cd server && npx prisma generate` to regenerate the client.

**Port 5432 is already in use**
Another PostgreSQL instance is running locally. Either stop it or change the `ports` mapping in `docker-compose.yml` and update `DATABASE_URL` accordingly.
